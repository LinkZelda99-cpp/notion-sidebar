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
			case 'child_page': return `<p><button class="child-page" data-open-id="${escapeHtml(block.pageId ?? block.id)}" onclick="vscode.postMessage({command: 'openPage', id: '${escapeHtml(block.pageId ?? block.id)}'})">▱ ${text}</button></p>`;
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
	const pageData = JSON.stringify(page).replaceAll('<', '\\u003c');
	return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"><style>
body { max-width: 900px; margin: 0 auto; padding: 40px 56px; color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); line-height: 1.6; }
h1 { font-size: 30px; margin: 0 0 20px; } .toolbar { display: flex; gap: 8px; margin-bottom: 30px; } button { border: 0; border-radius: 3px; padding: 7px 11px; color: var(--vscode-button-foreground); background: var(--vscode-button-background); cursor: pointer; } button:hover { background: var(--vscode-button-hoverBackground); } .page-content p { margin: 10px 0; } blockquote { border-left: 3px solid var(--vscode-textBlockQuote-border); padding-left: 14px; color: var(--vscode-textBlockQuote-foreground); } pre { padding: 14px; overflow: auto; background: var(--vscode-textCodeBlock-background); } hr { border: 0; border-top: 1px solid var(--vscode-panel-border); margin: 22px 0; } .child-page { color: var(--vscode-textLink-foreground); } textarea { width: 100%; min-height: 52px; color: var(--vscode-input-foreground); background: var(--vscode-input-background); border: 1px solid var(--vscode-input-border); padding: 8px; font: inherit; } .title-input { font-size: 28px; margin-bottom: 16px; }
</style></head><body><div class="toolbar"><button id="edit">Edit</button><button id="open">Open in Notion</button></div><h1 id="title">${title}</h1><main id="content" class="page-content">${renderPageBlocks(page.blocks) || '<p>No readable content.</p>'}</main><script nonce="${nonce}">const vscode = acquireVsCodeApi(); const page = ${pageData}; let editing = false; let dirty = false; function esc(value) { return String(value || '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); } function editPage() { editing = true; document.getElementById('edit').textContent = 'Save'; document.getElementById('open').textContent = 'Cancel'; document.getElementById('title').outerHTML = '<input class="title-input" id="title" value="' + esc(page.title) + '">'; document.getElementById('content').innerHTML = page.blocks.map(block => ['paragraph','heading_1','heading_2','bulleted_list_item','to_do'].includes(block.type) ? '<textarea data-id="' + block.id + '">' + esc(block.text) + '</textarea>' + (block.type === 'to_do' ? '<label><input type="checkbox" data-check="' + block.id + '" ' + (block.checked ? 'checked' : '') + '> Done</label>' : '') : '<div>' + esc(block.text || '[Read-only block]') + '</div>').join(''); } function savePage() { const blocks = page.blocks.map(block => { const input = document.querySelector('[data-id="' + block.id + '"]'); const check = document.querySelector('[data-check="' + block.id + '"]'); return input ? {...block, text: input.value, checked: check ? check.checked : block.checked} : block; }); vscode.postMessage({ command: 'savePage', page: { id: page.id, title: document.getElementById('title').value, blocks } }); } document.getElementById('edit').addEventListener('click', () => editing ? savePage() : editPage()); document.getElementById('open').addEventListener('click', () => editing ? (editing = false, location.reload()) : vscode.postMessage({ command: 'open', url: '${url}' })); document.addEventListener('input', () => { dirty = true; });</script></body></html>`;
}
