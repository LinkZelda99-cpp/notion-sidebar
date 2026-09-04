import * as vscode from 'vscode';

class NotionViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'notion-sidebar.view';

	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		webviewView.webview.options = {
			enableScripts: true,
		};

		webviewView.webview.html = this.getHtml(webviewView.webview);
		webviewView.webview.onDidReceiveMessage(message => {
		if (message.command === 'openNotion') {
			vscode.env.openExternal(
				vscode.Uri.parse('https://www.notion.so')
			);
	}
});
	}

	private getHtml(webview: vscode.Webview): string {
	return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">

			<style>
				* {
					box-sizing: border-box;
				}

				body {
					margin: 0;
					padding: 20px;
					font-family: var(--vscode-font-family);
					color: var(--vscode-foreground);
					background: var(--vscode-sideBar-background);
				}

				h1 {
					font-size: 22px;
					margin: 0 0 8px;
				}

				p {
					color: var(--vscode-descriptionForeground);
					margin-top: 0;
				}

				button {
					width: 100%;
					padding: 8px 12px;
					margin-top: 12px;
					border: none;
					border-radius: 4px;
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					cursor: pointer;
					font-family: inherit;
				}

				button:hover {
					background: var(--vscode-button-hoverBackground);
				}
			</style>
		</head>

		<body>
			<h1>Notion</h1>
			<p>Your Notion workspace will live here.</p>

			<button id="openNotion">
				Open Notion
			</button>

			<script>
				const vscode = acquireVsCodeApi();

				document.getElementById('openNotion').addEventListener('click', () => {
					vscode.postMessage({
						command: 'openNotion'
					});
				});
			</script>
		</body>
		</html>
	`;
}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('VS Code URI scheme:', vscode.env.uriScheme);
	console.log('Extension ID:', context.extension.id);
	const provider = new NotionViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			NotionViewProvider.viewType,
			provider
		)
	);
}

export function deactivate() {}