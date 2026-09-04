import * as vscode from 'vscode';

const credentialsKey = 'notion.oauth.credentials';
const defaultAuthServiceUrl = 'https://notion-sidebar-auth.notion-sidebar-auth.workers.dev';

export interface NotionCredentials {
	accessToken: string;
	refreshToken: string;
	workspaceName?: string;
	workspaceId?: string;
}

interface TokenResponse {
	access_token?: unknown;
	refresh_token?: unknown;
	workspace_name?: unknown;
	workspace_id?: unknown;
}

interface StartResponse {
	authorizationUrl?: unknown;
	state?: unknown;
}

export class NotionAuth {
	private pendingState?: string;

	constructor(private readonly context: vscode.ExtensionContext) {}

	get authServiceUrl(): string {
		return process.env.NOTION_AUTH_SERVICE_URL ?? defaultAuthServiceUrl;
	}

	get configured(): boolean {
		return Boolean(this.authServiceUrl);
	}

	async getCredentials(): Promise<NotionCredentials | undefined> {
		const value = await this.context.secrets.get(credentialsKey);
		if (!value) {
			return undefined;
		}
		try {
			const credentials = JSON.parse(value) as NotionCredentials;
			return credentials.accessToken && credentials.refreshToken ? credentials : undefined;
		} catch {
			return undefined;
		}
	}

	async signIn(): Promise<void> {
		this.requireConfigured();
		const response = await this.request<StartResponse>('/auth/start', {});
		if (typeof response.authorizationUrl !== 'string' || typeof response.state !== 'string') {
			throw new Error('The Notion OAuth service returned an invalid authorization request.');
		}
		this.pendingState = response.state;
		await vscode.env.openExternal(vscode.Uri.parse(response.authorizationUrl));
	}

	async handleCallback(uri: vscode.Uri): Promise<void> {
		const query = new URLSearchParams(uri.query);
		const state = query.get('state');
		const handoff = query.get('handoff');
		const error = query.get('error');
		if (error) {
			this.pendingState = undefined;
			throw new Error(`Notion authorization failed: ${error}`);
		}
		if (!this.pendingState || state !== this.pendingState || handoff !== this.pendingState) {
			this.pendingState = undefined;
			throw new Error('Notion authorization could not be verified. Please try again.');
		}

		try {
			const response = await this.request<TokenResponse>('/auth/redeem', { handoff });
			await this.storeToken(response);
		} finally {
			this.pendingState = undefined;
		}
	}

	async refresh(): Promise<NotionCredentials | undefined> {
		const current = await this.getCredentials();
		if (!current) {
			return undefined;
		}
		this.requireConfigured();
		const response = await this.request<TokenResponse>('/auth/refresh', { refreshToken: current.refreshToken });
		return this.storeToken(response);
	}

	async signOut(): Promise<void> {
		this.pendingState = undefined;
		await this.context.secrets.delete(credentialsKey);
	}

	private requireConfigured(): void {
		if (!this.configured) {
			throw new Error('Notion OAuth backend is not configured.');
		}
	}

	private async request<T>(path: string, body: Record<string, string>): Promise<T> {
		const response = await fetch(`${this.authServiceUrl}${path}`, {
			method: 'POST',
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		const result = await response.json() as T & { error?: string };
		if (!response.ok) {
			throw new Error(result.error ?? 'The Notion OAuth service request failed.');
		}
		return result;
	}

	private async storeToken(response: TokenResponse): Promise<NotionCredentials> {
		if (typeof response.access_token !== 'string' || typeof response.refresh_token !== 'string') {
			throw new Error('Notion returned an invalid token response.');
		}
		const credentials: NotionCredentials = {
			accessToken: response.access_token,
			refreshToken: response.refresh_token,
			workspaceName: typeof response.workspace_name === 'string' ? response.workspace_name : undefined,
			workspaceId: typeof response.workspace_id === 'string' ? response.workspace_id : undefined,
		};
		await this.context.secrets.store(credentialsKey, JSON.stringify(credentials));
		return credentials;
	}
}
