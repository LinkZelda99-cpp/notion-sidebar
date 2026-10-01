import { Client } from '@notionhq/client';
import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints/blocks';

export interface PageSummary {
	id: string;
	title: string;
	url?: string;
	icon?: string;
	kind: 'page' | 'data_source';
	location?: string;
	lastEdited?: string;
}

export interface PageContentBlock {
	id: string;
	type: string;
	text?: string;
	checked?: boolean;
	language?: string;
	pageId?: string;
	url?: string;
}

export function normalizeChildPageBlock(block: { id: string; child_page: { title: string } }): PageContentBlock {
	return {
		id: block.id,
		type: 'child_page',
		text: block.child_page.title || 'Untitled page',
		pageId: block.id,
	};
}

interface NotionPage {
	object: 'page';
	id: string;
	url?: string;
	last_edited_time?: string;
	icon?: { type?: string; emoji?: string; external?: { url?: string }; file?: { url?: string } } | null;
	parent?: { type?: string; page_id?: string; database_id?: string; data_source_id?: string };
	properties?: Record<string, { type?: string; title?: Array<{ plain_text?: string }> }>;
}

interface NotionDataSource {
	object: 'data_source';
	id: string;
	url?: string;
	last_edited_time?: string;
	title?: Array<{ plain_text?: string }>;
}

export class NotionClient {
	private readonly client: Client;

	constructor(accessToken: string) {
		this.client = new Client({ auth: accessToken });
	}

	async search(query: string): Promise<PageSummary[]> {
		const response = await this.client.search({
			query,
			filter: { property: 'object', value: 'page' },
			sort: { direction: 'descending', timestamp: 'last_edited_time' },
			page_size: 50,
		});
		return response.results
			.map(result => this.toSummary(result as unknown as NotionPage | NotionDataSource))
			.filter((result): result is PageSummary => result !== undefined);
	}

	async getPage(pageId: string): Promise<NotionPage> {
		return await this.client.pages.retrieve({ page_id: pageId }) as unknown as NotionPage;
	}

	async getPageContent(pageId: string): Promise<PageContentBlock[]> {
		const response = await this.client.blocks.children.list({ block_id: pageId, page_size: 100 });
		return response.results.flatMap(block => this.toContentBlock(block as BlockObjectResponse));
	}

	async updatePageTitle(page: NotionPage, title: string): Promise<void> {
		const titleProperty = Object.entries(page.properties ?? {}).find(([, property]) => property.type === 'title');
		if (!titleProperty) {
			throw new Error('This page does not expose an editable title.');
		}
		await this.client.pages.update({
			page_id: page.id,
			properties: { [titleProperty[0]]: { title: [{ type: 'text', text: { content: title } }] } },
		} as Parameters<typeof this.client.pages.update>[0]);
	}

	async updateBlock(block: PageContentBlock): Promise<void> {
		const richText = [{ type: 'text', text: { content: block.text ?? '' } }];
		const body = block.type === 'to_do'
			? { to_do: { rich_text: richText, checked: block.checked ?? false } }
			: { [block.type]: { rich_text: richText } };
		await this.client.blocks.update({ block_id: block.id, ...body } as Parameters<typeof this.client.blocks.update>[0]);
	}

	async appendBlock(pageId: string, block: Pick<PageContentBlock, 'type' | 'text'>): Promise<void> {
		const richText = [{ type: 'text', text: { content: block.text ?? '' } }];
		const body = block.type === 'to_do'
			? { object: 'block', type: 'to_do', to_do: { rich_text: richText, checked: false } }
			: { object: 'block', type: block.type, [block.type]: { rich_text: richText } };
		await this.client.blocks.children.append({ block_id: pageId, children: [body] } as Parameters<typeof this.client.blocks.children.append>[0]);
	}

	async getDataSource(dataSourceId: string): Promise<unknown> {
		return await this.client.dataSources.retrieve({ data_source_id: dataSourceId });
	}

	private toSummary(result: NotionPage | NotionDataSource): PageSummary | undefined {
		if (!result.id) {
			return undefined;
		}
		if (result.object === 'data_source') {
			return {
				id: result.id,
				title: result.title?.map(item => item.plain_text ?? '').join('') || 'Untitled data source',
				url: result.url ?? `https://www.notion.so/${result.id.replaceAll('-', '')}`,
				kind: 'data_source',
				lastEdited: result.last_edited_time,
			};
		}

		return {
			id: result.id,
			title: this.getPageTitle(result) || 'Untitled',
			url: this.isNotionUrl(result.url) ? result.url : undefined,
			icon: this.getIcon(result.icon),
			kind: 'page',
			location: result.parent?.type,
			lastEdited: result.last_edited_time,
		};
	}

	private getPageTitle(page: NotionPage): string {
		const titleProperty = Object.values(page.properties ?? {}).find(property => property.type === 'title');
		return titleProperty?.title?.map(item => item.plain_text ?? '').join('') ?? '';
	}

	private toContentBlock(block: BlockObjectResponse): PageContentBlock[] {
		const type = block.type;
		if (block.type === 'divider') {
			return [{ id: block.id, type: 'divider' }];
		}
		if (block.type === 'child_page') {
			return [normalizeChildPageBlock(block)];
		}
		const content = block[block.type as keyof BlockObjectResponse] as Record<string, unknown> | undefined;
		if (!content) {
			return [{ id: block.id, type, text: this.getBlockLabel(type) }];
		}
		return [{
			id: block.id,
			type,
			text: this.getBlockText(content) || this.getBlockLabel(type),
			checked: typeof content.checked === 'boolean' ? content.checked : undefined,
			language: typeof content.language === 'string' ? content.language : undefined,
			url: this.getBlockUrl(content),
		}];
	}

	private getBlockText(content: Record<string, unknown>): string {
		for (const key of ['rich_text', 'title', 'caption']) {
			const value = content[key];
			if (Array.isArray(value)) {
				const text = value.map(item => typeof item === 'object' && item !== null && 'plain_text' in item && typeof item.plain_text === 'string' ? item.plain_text : '').join('');
				if (text) {
					return text;
				}
			}
			if (typeof value === 'string' && value) {
				return value;
			}
		}
		return '';
	}

	private getBlockUrl(content: Record<string, unknown>): string | undefined {
		if (typeof content.url === 'string') {
			return content.url;
		}
		for (const key of ['external', 'file']) {
			const value = content[key];
			if (typeof value === 'object' && value !== null && 'url' in value && typeof value.url === 'string') {
				return value.url;
			}
		}
		return undefined;
	}

	private getBlockLabel(type: string): string {
		return type.replaceAll('_', ' ');
	}

	private isNotionUrl(value: string | undefined): value is string {
		if (!value) {
			return false;
		}
		try {
			const url = new URL(value);
			return url.protocol === 'https:' && (url.hostname === 'notion.so' || url.hostname.endsWith('.notion.so') || url.hostname === 'notion.site' || url.hostname.endsWith('.notion.site'));
		} catch {
			return false;
		}
	}

	private getIcon(icon: NotionPage['icon']): string | undefined {
		if (!icon) {
			return undefined;
		}
		if (icon.type === 'emoji') {
			return icon.emoji;
		}
		if (icon.type === 'external') {
			return icon.external?.url;
		}
		return icon.file?.url;
	}
}
