# ✪ Effective Prettier - Formatter for Visual Studio Code

[Prettier](https://prettier.io/) is an opinionated code formatter. It enforces a consistent style by parsing your code and re-printing it with its own rules that take the maximum line length into account, wrapping code when necessary.

<p align="center">
  <em>
    JavaScript
    · TypeScript
    · Flow
    · JSX
    · JSON
  </em>
  <br />
  <em>
    CSS
    · SCSS
    · Less
  </em>
  <br />
  <em>
    HTML
    · Vue
    · Angular
  </em>
  <br />
  <em>
    GraphQL
    · Markdown
    · YAML
  </em>
  <br />
  <em>
    <a href="https://prettier.io/docs/en/plugins.html">
      Your favorite language?
    </a>
  </em>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=sebastian-software.effective-prettier-vscode">
    <img alt="VS Code Marketplace Downloads" src="https://img.shields.io/visual-studio-marketplace/d/sebastian-software.effective-prettier-vscode"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=sebastian-software.effective-prettier-vscode">
    <img alt="VS Code Marketplace Installs" src="https://img.shields.io/visual-studio-marketplace/i/sebastian-software.effective-prettier-vscode"></a>
  <a href="#badge">
    <img alt="code style: ✪ prettier" src="https://img.shields.io/badge/code_style-✪_prettier-00596c.svg?style=flat-square"></a>
</p>

## Installation

Install through VS Code extensions. Search for `Effective Prettier`

[Visual Studio Code Market Place: Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=sebastian-software.effective-prettier-vscode)

Can also be installed in VS Code: Launch VS Code Quick Open (Ctrl+P), paste the following command, and press enter.

```
ext install sebastian-software.effective-prettier-vscode
```

### Default Formatter

To ensure that this extension is used over other extensions you may have installed, be sure to set it as the default formatter in your VS Code settings. This setting can be set for all languages or by a specific language.

```json
{
  "editor.defaultFormatter": "sebastian-software.effective-prettier-vscode"
}
```

### Prettier Resolution

This extension will use the tools installed in your project's local dependencies.

To install it in your project run:

```
npm install @effective/prettier -D
```

### Plugins

This extension supports [Prettier plugins](https://prettier.io/docs/en/plugins.html). If you have Prettier and a plugin registered in your `package.json`, this extension will attempt to register the language and provide automatic code formatting for the built-in and plugin languages.

## Configuration

It is recommended that you always include a [Prettier Configuration file](https://prettier.io/docs/en/configuration.html) in your project specifying all settings for your project. This will ensure that no matter how you run prettier - from this extension, from the CLI, or from another IDE with Prettier, the same settings will get applied.

Options are searched recursively down from the file being formatted so if you want to apply prettier settings to your entire project simply set a configuration in the root.

## Usage

### Using Command Palette (CMD/CTRL + Shift + P)

```
1. CMD + Shift + P -> Format Document
OR
1. Select the text you want to Prettify
2. CMD + Shift + P -> Format Selection
```

### Keyboard Shortcuts

Visual Studio Code provides [default keyboard shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-reference) for code formatting. You can learn about these for each platform in the [VS Code documentation](https://code.visualstudio.com/docs/getstarted/keybindings#_keyboard-shortcuts-reference).

If you don't like the defaults, you can rebind `editor.action.formatDocument` and `editor.action.formatSelection` in the keyboard shortcuts menu of vscode.

### Format On Save

Respects `editor.formatOnSave` setting.

You can turn on format-on-save on a per-language basis by scoping the setting:

```json
// Set the default
"editor.formatOnSave": false
```

### Format Selection

Format selection works on several languages depending on what Prettier itself supports. The following languages currently are supported:

```
javascript
javascriptreact
typescript
typescriptreact
json
graphql
```
