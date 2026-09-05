# Notion Sidebar

A powerful Notion workspace inside Visual Studio Code.

Notion Sidebar brings your Notion workspace directly into VS Code, so you can search, read, edit, and organize your Notion content without constantly switching between your editor and your browser.

## Features

### Notion Authentication

Sign in securely with your Notion account using Notion OAuth.

Your credentials and tokens are stored securely using VS Code's SecretStorage, while the OAuth client secret remains on the server-side authentication service.

### Search

Search your Notion workspace directly from the VS Code Activity Bar.

Find pages quickly without leaving your development environment.

### Page Viewer

Open Notion pages directly inside VS Code.

Pages are rendered using the Notion API, allowing you to read your workspace without opening a separate browser window.

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

Changes are saved directly back to your Notion workspace.

### Full View

Open a Notion page in a dedicated VS Code editor tab.

This gives you a larger workspace for reading and editing pages while keeping Notion available alongside your code.

### Favorites

Save important Notion pages for quick access.

Favorites are stored locally in VS Code and remain available between sessions.

### Recents

Automatically keep track of recently opened pages.

Recent pages are persisted locally and can be reopened directly from the sidebar.

### Settings

Manage your Notion connection and extension preferences from within VS Code.

Settings include:

- Connection status
- Workspace information
- Sign out
- Sidebar and full-view preferences
- External browser preferences
- Extension information

## Getting Started

1. Install **Notion Sidebar**.
2. Open the Notion icon in the VS Code Activity Bar.
3. Select **Sign in with Notion**.
4. Sign in to your Notion account if necessary.
5. Authorize Notion Sidebar to access your workspace.
6. Return to VS Code and start using your workspace.

You do not need to manually create a Notion integration or enter an API key.

## Privacy & Security

Notion Sidebar uses Notion's official API and OAuth authentication.

The extension does not require users to enter or store a Notion API token manually.

OAuth authentication is handled through a server-side callback service so that the Notion OAuth client secret is never included in the extension.

Authentication tokens are stored using VS Code's secure SecretStorage.

Notion Sidebar only requests the permissions necessary for the functionality provided by the extension.

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

The extension can be packaged as a VSIX using:

```bash
npx vsce package
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

- [ ] Tasks and task-focused views
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

## Disclaimer

Notion Sidebar is an independent third-party project and is not affiliated with, endorsed by, or sponsored by Notion Labs, Inc.

Notion and the Notion logo are trademarks of Notion Labs, Inc.

## License

See the repository's license for details.
