import * as vscode from 'vscode';
import { PageSummary } from './notionClient';

const recentsKey = 'notion-sidebar.recents';
const maxRecents = 20;

export interface RecentPage extends PageSummary {
	lastOpened: number;
}

export class RecentsStore {
	constructor(private readonly context: vscode.ExtensionContext) {}

	list(): RecentPage[] {
		return this.context.globalState.get<RecentPage[]>(recentsKey, []);
	}

	async add(page: PageSummary): Promise<RecentPage[]> {
		const recents = this.list().filter(recent => recent.id !== page.id);
		recents.unshift({ ...page, lastOpened: Date.now() });
		const trimmed = recents.slice(0, maxRecents);
		await this.context.globalState.update(recentsKey, trimmed);
		return trimmed;
	}

	async clear(): Promise<void> {
		await this.context.globalState.update(recentsKey, []);
	}
}
