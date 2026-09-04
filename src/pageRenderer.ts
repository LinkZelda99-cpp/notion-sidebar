import { PageContentBlock } from './notionClient';

export interface RenderablePage {
	id: string;
	title: string;
	url?: string;
	blocks: PageContentBlock[];
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

export function renderPageBlocks(blocks: PageContentBlock[]): string {
	return blocks.map(block => {
		const text = escapeHtml(block.text ?? '');
		switch (block.type) {
			case 'divider': return '<hr>';
			case 'child_page': return `<p><button class="child-page" disabled>▱ ${text}</button></p>`;
			case 'code': return `<pre><code>${text}</code></pre>`;
			case 'quote': return `<blockquote>${text}</blockquote>`;
			case 'to_do': return `<p><input type="checkbox" disabled ${block.checked ? 'checked' : ''}> ${text}</p>`;
			case 'bulleted_list_item': return `<p>• ${text}</p>`;
			case 'numbered_list_item': return `<p>1. ${text}</p>`;
			case 'heading_1': return `<h2>${text}</h2>`;
			case 'heading_2': return `<h3>${text}</h3>`;
			case 'heading_3': return `<h4>${text}</h4>`;
			default: return `<p>${text}</p>`;
		}
	}).join('');
}

export function getFullPageHtml(page: RenderablePage): string {
	const nonce = Math.random().toString(36).slice(2);
	const title = escapeHtml(page.title);
	const url = escapeHtml(page.url ?? '');
	return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>
body { max-width: 900px; margin: 0 auto; padding: 40px 56px; color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); line-height: 1.6; }
h1 { font-size: 30px; margin: 0 0 20px; } .toolbar { display: flex; gap: 8px; margin-bottom: 30px; } button { border: 0; border-radius: 3px; padding: 7px 11px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; } button:hover { background: var(--vscode-button-hoverBackground); } .page-content p { margin: 10px 0; } blockquote { border-left: 3px solid var(--vscode-textBlockQuote-border); padding-left: 14px; color: var(--vscode-textBlockQuote-foreground); } pre { padding: 14px; overflow: auto; background: var(--vscode-textCodeBlock-background); } hr { border: 0; border-top: 1px solid var(--vscode-panel-border); margin: 22px 0; } .child-page { color: var(--vscode-textLink-foreground); }
</style></head><body><div class="toolbar"><button id="open">Open in Notion</button></div><h1>${title}</h1><main class="page-content">${renderPageBlocks(page.blocks) || '<p>No readable content.</p>'}</main><script nonce="${nonce}">const vscode = acquireVsCodeApi(); document.getElementById('open').addEventListener('click', () => vscode.postMessage({ command: 'open', url: '${url}' }));</script></body></html>`;
}
