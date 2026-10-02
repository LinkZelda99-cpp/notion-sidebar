# Notion Sidebar

A Notion workspace inside Visual Studio Code.

Notion Sidebar brings your Notion workspace into VS Code so you can search, read, edit, and manage pages without constantly switching to your browser.

## Features

### Notion Authentication

Sign in with your Notion account using Notion OAuth.

Authentication credentials are stored using VS Code's SecretStorage. The Notion OAuth client secret is kept on the server-side authentication service and is not included in the extension.

### Search

Search your Notion workspace directly from the Notion sidebar.

### Page Viewer

Open and read Notion pages directly inside VS Code.

Pages are rendered from the Notion API, so you can work with your workspace without opening a separate browser window.

### Page Editing

Edit supported Notion content directly from VS Code.

Currently supported content includes:

- Page titles
- Paragraphs
- Headings
- Bulleted lists
- Numbered lists
- To-do blocks
- Adding new blocks

Changes are saved directly to your Notion workspace.

### Full View

Open a page in a dedicated VS Code editor tab for a larger reading and editing experience.

### Favorites

Save important pages for quick access.

Favorites are stored locally in VS Code and persist between sessions.

### Recents

Keep track of recently opened pages.

Recents are stored locally and can be reopened directly from the sidebar. The list keeps up to 20 recent pages.

### Nested Pages

Open nested Notion pages from the page viewer and navigate through your workspace from inside VS Code.

### Settings

Manage your Notion connection and extension preferences from within VS Code.

Settings include:

- Connection status
- Workspace information
- Sign out
- Sidebar and full-view preferences
- External browser preferences
- Extension information

### Browser Integration

Open a Notion page in your external browser when you want the full Notion experience.

## Getting Started

1. Install **Notion Sidebar** from the Visual Studio Code Marketplace.
2. Open the Notion icon in the VS Code Activity Bar.
3. Select **Sign In**.
4. Sign in to your Notion account if necessary.
5. Authorize Notion Sidebar to access your workspace.
6. Return to VS Code and start using your workspace.

You do not need to manually create a Notion integration or enter an API key.

## Privacy & Security

Notion Sidebar uses Notion's official API and OAuth authentication.

The extension does not require users to manually enter or store a Notion API token.

OAuth authentication is handled through a server-side callback service so the Notion OAuth client secret is never included in the extension.

Authentication credentials are stored using VS Code's secure SecretStorage.

Notion Sidebar is an independent third-party extension and is not affiliated with Notion.

## Commands

Notion Sidebar provides the following VS Code commands:

| Command | Description |
| --- | --- |
| `Notion: Sign In` | Sign in to Notion |
| `Notion: Sign Out` | Sign out and clear stored authentication credentials |
| `Notion: Open in Browser` | Open Notion in your external browser |
| `Notion: Refresh` | Refresh the Notion sidebar |

## Development

This project is built using:

- TypeScript
- VS Code Extension API
- Notion API
- Notion JavaScript SDK
- Cloudflare Workers
- Cloudflare Durable Objects

### Install dependencies

```bash
npm install
```

### Run the extension

Open the project in VS Code and press `F5` to launch an Extension Development Host.

### Run checks

```bash
npm run check-types
npm run lint
npm run compile
npm test
```

### Package the extension

The extension can be packaged as a VSIX using the VS Code extension packaging tool:

```bash
npx @vscode/vsce@4.0.0 package
```

## Project Structure

```text
notion-sidebar/
├── src/
│   ├── auth.ts
│   ├── extension.ts
│   ├── favorites.ts
│   ├── notionClient.ts
│   ├── pageRenderer.ts
│   ├── recents.ts
│   ├── webview.ts
│   └── test/
├── callback-service/
│   └── src/
├── media/
├── package.json
└── README.md
```

## Roadmap

Notion Sidebar is actively being developed.

Planned features include:

- [ ] More complete Notion block editing
- [ ] Create new pages
- [ ] Create and edit database entries
- [ ] Database property editing
- [ ] Command Palette actions
- [ ] Additional Notion block types
- [ ] Improved page navigation
- [ ] More customization options
- [ ] Improved testing and error handling

## Contributing

Issues, suggestions, and contributions are welcome.

If you find a bug or have an idea for a feature, please open an issue in the GitHub repository.

Contributions are welcome, but redistribution and public release of the Software remain restricted by the license.

## Disclaimer

Notion Sidebar is an independent third-party project and is not affiliated with, endorsed by, or sponsored by Notion Labs, Inc.

Notion and the Notion logo are trademarks of Notion Labs, Inc.

## License

Notion Sidebar is licensed under the **Notion Sidebar Source-Available License**. See [LICENSE.md](LICENSE.md) for the full license text.

This is a source-available license, not an OSI-approved open-source license. The source is publicly available for inspection, learning, personal use, and contribution, while redistribution and public release require permission from the copyright holder.
