import * as vscode from 'vscode';
import { NotionAuth } from './auth';
import { FavoritesStore } from './favorites';
import { NotionClient, PageSummary } from './notionClient';
import { RecentsStore } from './recents';
import { getFullPageHtml } from './pageRenderer';
import { getSidebarHtml, SidebarState } from './webview';

export class NotionViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'notion-sidebar.view';
	private view?: vscode.WebviewView;
	private notionClient?: NotionClient;
	private readonly settingsKey = 'notion-sidebar.settings';

	constructor(
		private readonly context: vscode.ExtensionContext,
		private readonly auth: NotionAuth,
		private readonly favorites: FavoritesStore,
		private readonly recents: RecentsStore
	) {}

	async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
		this.view = webviewView;
		webviewView.webview.options = { enableScripts: true };
		webviewView.webview.onDidReceiveMessage(message => this.handleMessage(message), undefined, this.context.subscriptions);
		await this.refresh();
	}

	async refresh(): Promise<void> {
		const credentials = await this.auth.getCredentials();
		this.notionClient = credentials ? new NotionClient(credentials.accessToken) : undefined;
		this.postState({
			authenticated: Boolean(credentials),
			workspaceName: credentials?.workspaceName,
			favorites: this.favorites.list(),
			recents: this.recents.list(),
			settings: this.context.globalState.get('notion-sidebar.settings', { openInSidebar: true, openInFullView: false, openExternalInBrowser: true }),
		});
	}

	private async handleMessage(message: { command?: string; query?: string; id?: string; url?: string; settings?: Record<string, boolean>; page?: { id: string; title: string; blocks: import('./notionClient').PageContentBlock[] }; blockType?: import('./notionClient').PageContentBlock['type']; text?: string }): Promise<void> {
		try {
			switch (message.command) {
				case 'signIn':
					await this.auth.signIn();
					break;
				case 'signOut':
					await this.signOut();
					break;
				case 'refresh':
					await this.refresh();
					break;
				case 'search':
					await this.search(message.query ?? '');
					break;
				case 'toggleFavorite':
					await this.toggleFavorite(message.id ?? '');
					break;
				case 'openPage':
					await this.openPage(message.id);
					break;
				case 'openInNotion':
					await this.openNotionPage(message.id, message.url);
					break;
				case 'fullView':
					await this.openFullView(message.id);
					break;
				case 'savePage':
					if (message.page) {
						await this.savePage(message.page);
					}
					break;
				case 'addBlock':
					if (message.id && message.blockType) {
						await this.addBlock(message.id, message.blockType, message.text ?? '');
					}
					break;
				case 'back':
					this.view?.webview.postMessage({ type: 'back' });
					break;
				case 'clearRecents':
					await this.recents.clear();
					await this.refresh();
					break;
				case 'updateSettings':
					await this.context.globalState.update(this.settingsKey, message.settings);
					await this.refresh();
					break;
				case 'calendar':
					await vscode.env.openExternal(vscode.Uri.parse('https://calendar.notion.so'));
					break;
			}
		} catch (error) {
			this.postError(error instanceof Error ? error.message : 'The requested Notion action failed.');
		}
	}

	private async search(query: string): Promise<void> {
		if (!this.notionClient) {
			throw new Error('Sign in with Notion before searching.');
		}
		const results = await this.withTokenRefresh(() => this.notionClient!.search(query));
		this.view?.webview.postMessage({
			type: 'results',
			results,
			favorites: this.favorites.list().map(favorite => favorite.id),
		});
	}

	private async toggleFavorite(pageId: string): Promise<void> {
		if (!this.notionClient || !pageId) {
			return;
		}
		const page = await this.withTokenRefresh(() => this.notionClient!.getPage(pageId));
		const summary: PageSummary = {
			id: page.id,
			title: this.getTitle(page),
			url: this.getPageUrl(page.id, page.url),
			kind: 'page',
		};
		await this.favorites.toggle(summary);
		await this.refresh();
	}

	private async openNotionPage(pageId?: string, url?: string): Promise<void> {
		const pageUrl = this.getPageUrl(pageId, url);
		if (!pageUrl) {
			throw new Error('This Notion page is missing a usable page ID and URL.');
		}
		await vscode.env.openExternal(vscode.Uri.parse(pageUrl));
	}

	private async openPage(pageId?: string): Promise<void> {
		if (!this.notionClient || !pageId) {
			throw new Error('This Notion page does not have a usable page ID.');
		}
		this.view?.webview.postMessage({ type: 'pageLoading' });
		const page = await this.withTokenRefresh(() => this.notionClient!.getPage(pageId));
		const blocks = await this.withTokenRefresh(() => this.notionClient!.getPageContent(pageId));
		const summary: PageSummary = {
			id: page.id,
			title: this.getTitle(page),
			url: this.getPageUrl(page.id, page.url),
			kind: 'page',
		};
		await this.recents.add(summary);
		this.view?.webview.postMessage({
			type: 'page',
			page: {
				id: page.id,
				title: this.getTitle(page),
				url: this.getPageUrl(page.id, page.url),
				blocks,
			},
		});
	}

	private async openFullView(pageId?: string): Promise<void> {
		if (!this.notionClient || !pageId) {
			throw new Error('This Notion page does not have a usable page ID.');
		}
		const panel = vscode.window.createWebviewPanel('notion-sidebar.page', 'Notion Page', vscode.ViewColumn.Active, { enableScripts: true });
		const renderPanel = async (): Promise<void> => {
			const page = await this.withTokenRefresh(() => this.notionClient!.getPage(pageId));
			const blocks = await this.withTokenRefresh(() => this.notionClient!.getPageContent(pageId));
			panel.title = this.getTitle(page);
			panel.webview.html = getFullPageHtml({ id: page.id, title: this.getTitle(page), url: this.getPageUrl(page.id, page.url), blocks });
		};
		panel.webview.onDidReceiveMessage(async message => {
			try {
				if (message.command === 'open' && typeof message.url === 'string') {
					await this.openNotionPage(pageId, message.url);
				} else if (message.command === 'savePage' && message.page) {
					await this.savePage(message.page, false);
					await renderPanel();
				} else if (message.command === 'addBlock' && message.blockType) {
					await this.addBlock(pageId, message.blockType, message.text ?? '', false);
					await renderPanel();
				}
			} catch (error) {
				panel.webview.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Could not save this page.' });
			}
		}, undefined, this.context.subscriptions);
		await renderPanel();
	}

	private async savePage(draft: { id: string; title: string; blocks: import('./notionClient').PageContentBlock[] }, notifySidebar = true): Promise<void> {
		if (!this.notionClient) {
			throw new Error('Sign in with Notion before editing.');
		}
		const page = await this.withTokenRefresh(() => this.notionClient!.getPage(draft.id));
		if (draft.title.trim() !== this.getTitle(page)) {
			await this.withTokenRefresh(() => this.notionClient!.updatePageTitle(page, draft.title.trim()));
		}
		for (const block of draft.blocks) {
			if (['paragraph', 'heading_1', 'heading_2', 'bulleted_list_item', 'to_do'].includes(block.type)) {
				await this.withTokenRefresh(() => this.notionClient!.updateBlock(block));
			}
		}
		if (notifySidebar) {
			await this.openPage(draft.id);
		}
	}

	private async addBlock(pageId: string, blockType: import('./notionClient').PageContentBlock['type'], text: string, notifySidebar = true): Promise<void> {
		if (!this.notionClient || !['paragraph', 'heading_1', 'heading_2', 'bulleted_list_item', 'to_do'].includes(blockType)) {
			throw new Error('This block type cannot be added.');
		}
		await this.withTokenRefresh(() => this.notionClient!.appendBlock(pageId, { type: blockType, text }));
		if (notifySidebar) {
			await this.openPage(pageId);
		}
	}

	async signOut(): Promise<void> {
		const confirmation = await vscode.window.showWarningMessage('Sign out of Notion?', { modal: true }, 'Sign Out');
		if (confirmation !== 'Sign Out') {
			return;
		}
		await this.auth.signOut();
		this.notionClient = undefined;
		await this.refresh();
	}

	private getPageUrl(pageId?: string, url?: string): string | undefined {
		if (url && this.isNotionUrl(url)) {
			return url;
		}
		if (!pageId || !/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(pageId)) {
			return undefined;
		}
		return `https://www.notion.so/${pageId.replaceAll('-', '')}`;
	}

	private async withTokenRefresh<T>(operation: () => Promise<T>): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			if (!this.isUnauthorized(error)) {
				throw error;
			}
			const credentials = await this.auth.refresh();
			if (!credentials) {
				throw new Error('Your Notion session has expired. Please sign in again.');
			}
			this.notionClient = new NotionClient(credentials.accessToken);
			return await operation();
		}
	}

	private isUnauthorized(error: unknown): boolean {
		return typeof error === 'object' && error !== null && 'status' in error && error.status === 401;
	}

	private postState(state: SidebarState): void {
		if (this.view) {
			this.view.webview.html = getSidebarHtml(this.view.webview, state);
		}
	}

	private postError(message: string): void {
		this.view?.webview.postMessage({ type: 'error', message });
		void vscode.window.showErrorMessage(message);
	}

	private isNotionUrl(value: string): boolean {
		try {
			const url = new URL(value);
			return url.protocol === 'https:' && (url.hostname === 'notion.so' || url.hostname.endsWith('.notion.so') || url.hostname === 'notion.site' || url.hostname.endsWith('.notion.site'));
		} catch {
			return false;
		}
	}

	private getTitle(page: { properties?: Record<string, { type?: string; title?: Array<{ plain_text?: string }> }> }): string {
		const title = Object.values(page.properties ?? {}).find(property => property.type === 'title');
		return title?.title?.map(item => item.plain_text ?? '').join('') || 'Untitled';
	}
}

export function activate(context: vscode.ExtensionContext): void {
	const auth = new NotionAuth(context);
	const favorites = new FavoritesStore(context);
	const recents = new RecentsStore(context);
	const provider = new NotionViewProvider(context, auth, favorites, recents);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(NotionViewProvider.viewType, provider),
		vscode.window.registerUriHandler({
			handleUri: async uri => {
				try {
					if (uri.path !== '/auth/callback') {
						throw new Error('Unknown Notion authorization callback.');
					}
					await auth.handleCallback(uri);
					await provider.refresh();
					void vscode.window.showInformationMessage('Connected to Notion.');
				} catch (error) {
					const message = error instanceof Error ? error.message : 'Notion authorization failed.';
					void vscode.window.showErrorMessage(message);
				}
			},
		}),
		vscode.commands.registerCommand('notion-sidebar.signIn', () => auth.signIn()),
		vscode.commands.registerCommand('notion-sidebar.signOut', async () => {
			await provider.signOut();
		}),
		vscode.commands.registerCommand('notion-sidebar.openNotion', () => vscode.env.openExternal(vscode.Uri.parse('https://www.notion.so'))),
		vscode.commands.registerCommand('notion-sidebar.refresh', () => provider.refresh())
	);
}

export function deactivate(): void {}
