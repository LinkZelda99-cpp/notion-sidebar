# Notion Sidebar

**A Notion workspace inside Visual Studio Code.**

Notion Sidebar brings your Notion workspace into VS Code, giving you a focused way to **search, read, navigate, and edit supported Notion pages** without constantly switching to your browser.

## Features

### Notion OAuth

Sign in to your Notion workspace through Notion's OAuth authorization flow.

- No manual Notion API token is required.
- Authentication credentials are stored using VS Code's SecretStorage.
- The Notion OAuth client secret stays on the server-side authentication service and is never bundled with the extension.

### Workspace Search

Search your connected Notion workspace directly from the Notion sidebar.

### Page Viewer

Read supported Notion pages directly inside VS Code.

Pages are fetched through the Notion API and rendered inside the extension. Nested pages can be opened and navigated without leaving VS Code.

### Page Editing

Edit supported Notion content directly from VS Code.

Currently editable content includes:

- Page titles
- Paragraphs
- Headings
- Bulleted lists
- Numbered lists
- To-do blocks
- Adding new supported blocks

Unsupported block types remain read-only rather than being silently modified.

Changes are saved directly to your Notion workspace.

### Full View

Open a page in a dedicated VS Code editor tab for a larger reading and editing experience.

The full-view editor uses the same page rendering and editing support as the sidebar.

### Favorites

Save pages for quick access.

Favorites are stored locally in VS Code and persist between sessions.

### Recents

Quickly return to pages you have recently opened.

The extension stores up to **20 recent pages** locally, with the most recently opened pages at the top.

### Settings

Manage your connection and extension preferences from inside VS Code.

Settings provide access to:

- Notion connection status
- Workspace information
- Sign out
- Sidebar and full-view preferences
- External browser preferences
- Extension information

### Browser Integration

Open a page in your external browser when you want the full Notion experience.

---

## Getting Started

1. Install **Notion Sidebar** from the Visual Studio Code Marketplace.
2. Open the **Notion** icon in the VS Code Activity Bar.
3. Select **Sign In**.
4. Sign in to your Notion account if necessary.
5. Authorize Notion Sidebar to access your workspace.
6. Return to VS Code and start using your workspace.

You do **not** need to create a Notion integration manually or enter an API key.

---

## Privacy & Security

Notion Sidebar uses Notion's official API and OAuth authorization.

The extension does not ask you to manually enter or store a Notion API token. OAuth credentials are stored using VS Code's secure SecretStorage.

The OAuth client secret is handled by a separate server-side authentication service and is not included in the extension package.

Notion Sidebar is an independent third-party project and is **not affiliated with, endorsed by, or sponsored by Notion Labs, Inc.**

---

## Commands

| Command | Description |
| --- | --- |
| `Notion: Sign In` | Start the Notion OAuth sign-in flow |
| `Notion: Sign Out` | Sign out and clear stored authentication credentials |
| `Notion: Open in Browser` | Open Notion in your external browser |
| `Notion: Refresh` | Refresh the Notion sidebar |

---

## Development

### Requirements

- Visual Studio Code
- Node.js
- npm

### Tech Stack

- **TypeScript** — extension source
- **VS Code Extension API** — extension UI and integration
- **Notion API / JavaScript SDK** — workspace access
- **Cloudflare Workers** — OAuth callback service
- **Cloudflare Durable Objects** — short-lived OAuth transaction state
- **esbuild** — extension bundling

### Install

```bash
npm install
```

### Run in Extension Development Host

Open the repository in VS Code and press **F5** to launch an Extension Development Host.

### Run checks

```bash
npm run check-types
npm run lint
npm run compile
npm test
```

### Package a VSIX

```bash
npx @vscode/vsce@4.0.0 package
```

---

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

---

## Roadmap

Notion Sidebar is actively being developed.

Planned work includes:

- [ ] More complete Notion block editing
- [ ] Create new pages
- [ ] Create and edit database entries
- [ ] Database property editing
- [ ] Command Palette actions
- [ ] Additional Notion block types
- [ ] Improved page navigation
- [ ] More customization options
- [ ] Expanded automated test coverage and error handling

---

## Contributing

Bug reports, feature ideas, and contributions are welcome.

If you find a problem or have an idea for improving Notion Sidebar, open an issue or submit a pull request in the GitHub repository.

Because the project uses a restrictive source-available license, **contributing code does not grant permission to redistribute or publish the Software or derivative works independently**. See the license for the full terms.

---

## Disclaimer

Notion Sidebar is an independent third-party project and is not affiliated with, endorsed by, or sponsored by Notion Labs, Inc.

Notion and the Notion logo are trademarks of Notion Labs, Inc.

---

## License

Notion Sidebar is licensed under the **Notion Sidebar Source-Available License**. See [LICENSE.md](LICENSE.md) for the full license text.

This is a **source-available license, not an OSI-approved open-source license**. The source is publicly available for inspection, learning, personal use, and contribution, while redistribution and public release require permission from the copyright holder.
