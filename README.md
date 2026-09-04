# Notion Sidebar

Browse a connected Notion workspace from a VS Code sidebar. The extension uses Notion OAuth for per-user access, keeps credentials in VS Code SecretStorage, searches through the Notion API, and stores favorites in VS Code global state.

This is the README for your extension "notion-sidebar". After writing up a brief description, we recommend including the following sections.

## Features

- Sign in and sign out with Notion OAuth 2.0.
- Search shared pages through the official Notion API SDK.
- Persist and open local favorites.
- Open pages in the browser and open Notion Calendar externally.

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow.

## Setup

Create a public connection in the Notion developer portal and configure its redirect URI as:

`https://linkzelda99-cpp.notion-sidebar/auth/callback`

The extension uses the deployed OAuth backend automatically. For development overrides, optionally set this environment variable before launching VS Code:

- `NOTION_AUTH_SERVICE_URL`

Never commit the client secret or paste it into source control or chat. The extension communicates with the callback service and stores redeemed credentials in VS Code SecretStorage; the client secret remains in the Worker secret manager.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Notion Calendar is opened at its official web application because the Notion API does not expose a generic Notion Calendar event API. Desktop deep links are intentionally not assumed across operating systems.

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
