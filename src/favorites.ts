import * as vscode from 'vscode';
import { PageSummary } from './notionClient';

const favoritesKey = 'notion-sidebar.favorites';

export class FavoritesStore {
	constructor(private readonly context: vscode.ExtensionContext) {}

	list(): PageSummary[] {
		return this.context.globalState.get<PageSummary[]>(favoritesKey, []);
	}

	async toggle(page: PageSummary): Promise<PageSummary[]> {
		const favorites = this.list();
		const index = favorites.findIndex(favorite => favorite.id === page.id);
		if (index >= 0) {
			favorites.splice(index, 1);
		} else {
			favorites.unshift(page);
		}
		await this.context.globalState.update(favoritesKey, favorites);
		return favorites;
	}

	isFavorite(pageId: string): boolean {
		return this.list().some(favorite => favorite.id === pageId);
	}
}
