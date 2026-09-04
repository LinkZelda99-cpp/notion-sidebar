import * as vscode from 'vscode';
import { PageSummary } from './notionClient';
import { RecentPage } from './recents';

export type SidebarState = {
	authenticated: boolean;
	workspaceName?: string;
	favorites: PageSummary[];
	recents: RecentPage[];
	message?: string;
	settings?: { openInSidebar: boolean; openInFullView: boolean; openExternalInBrowser: boolean };
};

export function getSidebarHtml(webview: vscode.Webview, state: SidebarState): string {
	const nonce = Math.random().toString(36).slice(2);
	const serializedState = JSON.stringify(state).replaceAll('<', '\\u003c');
	return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
<style>
* { box-sizing: border-box; }
body { margin: 0; padding: 14px 12px; color: var(--vscode-foreground); background: var(--vscode-sideBar-background); font-family: var(--vscode-font-family); font-size: 13px; }
header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
h1 { font-size: 13px; letter-spacing: .08em; margin: 0; }
button, input { font: inherit; }
button { border: 0; color: inherit; background: transparent; cursor: pointer; border-radius: 3px; padding: 6px 8px; text-align: left; }
button:hover { background: var(--vscode-toolbar-hoverBackground); }
.primary { width: 100%; background: var(--vscode-button-background); color: var(--vscode-button-foreground); text-align: center; margin: 8px 0 16px; }
.primary:hover { background: var(--vscode-button-hoverBackground); }
.search { display: flex; align-items: center; gap: 6px; border: 1px solid var(--vscode-input-border, transparent); background: var(--vscode-input-background); padding: 0 8px; border-radius: 4px; }
.search input { min-width: 0; width: 100%; border: 0; outline: 0; padding: 8px 0; color: var(--vscode-input-foreground); background: transparent; }
section { margin: 18px 0; } .section-title { color: var(--vscode-descriptionForeground); font-size: 11px; text-transform: uppercase; margin: 0 0 6px 4px; }
.item { display: flex; align-items: center; width: 100%; gap: 8px; } .item .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; } .item .star { opacity: .7; }
.meta { color: var(--vscode-descriptionForeground); font-size: 11px; margin-left: 26px; }
.actions { display: flex; gap: 4px; margin-top: 14px; border-top: 1px solid var(--vscode-panel-border); padding-top: 10px; } .actions button { flex: 1; }
.status { color: var(--vscode-descriptionForeground); padding: 8px 4px; } .error { color: var(--vscode-errorForeground); }
.nav { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-bottom: 12px; } .nav button { color: var(--vscode-descriptionForeground); } .nav button:hover { color: var(--vscode-foreground); }
.page-toolbar { display: flex; gap: 6px; margin-bottom: 14px; } .page-toolbar button { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); } .page-toolbar button:hover { background: var(--vscode-button-secondaryHoverBackground); }
.page-title { font-size: 20px; margin: 8px 0 18px; } .page-content { line-height: 1.5; } .page-content p { margin: 8px 0; } .page-content h2, .page-content h3, .page-content h4 { margin: 18px 0 6px; } .page-content blockquote { border-left: 3px solid var(--vscode-textBlockQuote-border); margin: 12px 0; padding: 4px 12px; color: var(--vscode-textBlockQuote-foreground); } .page-content pre { background: var(--vscode-textCodeBlock-background); padding: 10px; overflow: auto; } .page-content hr { border: 0; border-top: 1px solid var(--vscode-panel-border); margin: 16px 0; } .child-page { color: var(--vscode-textLink-foreground); }
</style></head><body>
<header><h1>NOTION</h1><button id="refresh" title="Refresh">↻</button></header>
<div id="app"></div>
<script nonce="${nonce}">
const vscode = acquireVsCodeApi();
const initialState = ${serializedState};
const app = document.getElementById('app');
let state = initialState;
let lastResults = [];
let viewingPage = false;
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function render() {
	if (viewingPage || !state.authenticated) { if (!state.authenticated && !viewingPage) app.innerHTML = '<p>Connect your Notion workspace to browse pages.</p><button class="primary" id="signIn">Sign in with Notion</button>'; return; }
	const favorites = state.favorites.length ? state.favorites.map(page => item(page, true)).join('') : '<div class="status">No favorites yet.</div>';
	const recents = (state.recents || []).length ? state.recents.map(page => item(page, false)).join('') : '<div class="status">No recently opened pages.</div>';
	app.innerHTML = '<nav class="nav"><button data-section="search">⌕ Search</button><button data-section="favorites">★ Favorites</button><button data-section="recents">◷ Recents</button><button data-section="settings">⚙ Settings</button></nav><div id="section-search"><div class="search"><span>⌕</span><input id="query" placeholder="Search workspace" aria-label="Search workspace"></div><div id="results" class="status">Search your workspace.</div></div><div id="section-favorites" hidden><div class="section-title">Favorites</div>' + favorites + '</div><div id="section-recents" hidden><div class="section-title">Recents <button id="clearRecents">Clear</button></div>' + recents + '</div><div id="section-settings" hidden><div class="section-title">Account</div><p>' + (state.workspaceName ? esc(state.workspaceName) : 'Connected to Notion') + '</p><button id="signOut">Sign out</button><div class="section-title">General</div><label><input type="checkbox" data-setting="openInSidebar" ' + (state.settings?.openInSidebar !== false ? 'checked' : '') + '> Open pages in sidebar</label><label><input type="checkbox" data-setting="openInFullView" ' + (state.settings?.openInFullView ? 'checked' : '') + '> Open pages in full view</label><label><input type="checkbox" data-setting="openExternalInBrowser" ' + (state.settings?.openExternalInBrowser !== false ? 'checked' : '') + '> Open external links in browser</label><div class="section-title">About</div><p>Notion Sidebar<br>Version 0.0.1</p></div>';
	document.getElementById('query').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.value.trim()) { setStatus('Searching...'); vscode.postMessage({ command: 'search', query: event.target.value.trim() }); } });
}
function item(page, favorite) { return '<div class="item"><button class="item" data-open-id="' + esc(page.id) + '" data-open-url="' + esc(page.url || '') + '"><span>' + esc(page.icon || '▱') + '</span><span class="label">' + esc(page.title) + '</span></button><button class="star" data-favorite="' + esc(page.id) + '" title="' + (favorite ? 'Remove from favorites' : 'Add to favorites') + '">' + (favorite ? '★' : '☆') + '</button></div><div class="meta">' + esc(page.kind) + (page.location ? ' · ' + esc(page.location) : '') + '</div>'; }
function renderResults() { const results = document.getElementById('results'); if (results) results.innerHTML = lastResults.length ? lastResults.map(page => item(page, state.favorites.some(favorite => favorite.id === page.id))).join('') : '<div class="status">No pages found.</div>'; }
function renderBlock(block) { const text = esc(block.text || ''); if (block.type === 'divider') return '<hr>'; if (block.type === 'child_page') return '<button class="child-page" data-open-id="' + esc(block.pageId) + '">▱ ' + text + '</button>'; if (block.type === 'code') return '<pre><code>' + text + '</code></pre>'; if (block.type === 'quote') return '<blockquote>' + text + '</blockquote>'; if (block.type === 'to_do') return '<p><input type="checkbox" disabled ' + (block.checked ? 'checked' : '') + '> ' + text + '</p>'; if (block.type === 'bulleted_list_item') return '<p>• ' + text + '</p>'; if (block.type === 'numbered_list_item') return '<p>1. ' + text + '</p>'; if (block.type.startsWith('heading_')) return '<' + block.type.replace('heading_', 'h') + '>' + text + '</' + block.type.replace('heading_', 'h') + '>'; return '<p>' + text + '</p>'; }
function renderPage(page) { viewingPage = true; app.innerHTML = '<div class="page-toolbar"><button id="back">← Back</button><button id="openInNotion" data-open-id="' + esc(page.id) + '" data-open-url="' + esc(page.url || '') + '">Open in Notion</button></div><h2 class="page-title">' + esc(page.title) + '</h2><div class="page-content">' + (page.blocks.length ? page.blocks.map(renderBlock).join('') : '<div class="status">This page has no readable content.</div>') + '</div>'; }
function setStatus(text, error) { const results = document.getElementById('results'); if (results) results.className = 'status' + (error ? ' error' : ''), results.textContent = text; }
document.addEventListener('click', event => { const open = event.target.closest('[data-open-id]'); const favorite = event.target.closest('[data-favorite]'); const section = event.target.closest('[data-section]'); if (section) { ['search','favorites','recents','settings'].forEach(name => { const element = document.getElementById('section-' + name); if (element) element.hidden = name !== section.dataset.section; }); } if (event.target.id === 'back') { viewingPage = false; render(); renderResults(); } else if (event.target.id === 'openInNotion') vscode.postMessage({ command: 'openInNotion', id: event.target.dataset.openId, url: event.target.dataset.openUrl || undefined }); else if (open) vscode.postMessage({ command: 'openPage', id: open.dataset.openId }); else if (favorite) vscode.postMessage({ command: 'toggleFavorite', id: favorite.dataset.favorite }); if (event.target.id === 'signIn') vscode.postMessage({ command: 'signIn' }); if (event.target.id === 'signOut') vscode.postMessage({ command: 'signOut' }); if (event.target.id === 'clearRecents') vscode.postMessage({ command: 'clearRecents' }); });
document.addEventListener('change', event => { const setting = event.target.closest('[data-setting]'); if (setting) vscode.postMessage({ command: 'updateSettings', settings: { ...state.settings, [setting.dataset.setting]: setting.checked } }); });
window.addEventListener('message', event => { const message = event.data; if (message.type === 'state') { state = message.state; if (!viewingPage) render(); } if (message.type === 'results') { lastResults = message.results; if (!viewingPage) renderResults(); } if (message.type === 'pageLoading') { viewingPage = true; app.innerHTML = '<div class="page-toolbar"><button id="back">← Back</button></div><div class="status">Loading page...</div>'; } if (message.type === 'page') renderPage(message.page); if (message.type === 'back') { viewingPage = false; render(); renderResults(); } if (message.type === 'error') { if (viewingPage) app.innerHTML = '<div class="page-toolbar"><button id="back">← Back</button></div><div class="status error">' + esc(message.message) + '</div>'; else setStatus(message.message, true); } });
render();
</script></body></html>`;
}
