## Obsidian Preview Mode Keybinds

This plugin enables customizable navigation keybindings in markdown preview mode. Basic Navigation and Search keybinds are currently implemented, uses vim-like keybindings by default

### Keybindings

Keybindings can be customized from the settings tab. Only non-space character keys (letters, symbols and digits) can be used for keybindings. Arrow keys, enter, space, tab etc. are not supported.

Currently no modifier keys are supported (Ctrl, Alt, Shift and so on).



#### Defaults

Here is a list of default keybindings:

- `k` - Scroll up
- `j` - Scroll down
- `g` - Scroll to the bottom
- `0` - Scroll to the top
- `/` - Search
- `i` - Enter edit mode

### Installation

Download the latest release (`main.js` and `manifest.json`) from the [releases page](https://github.com/horriblename/preview-mode-keybinds-obsidian/releases), and move the files into a new folder `.obsidian/plugins/preview-mode-keybinds-obsidian` under the root of your vault folder.

Then, disable 'Safe mode' under 'Settings > Community plugins' and enable 'Preview Mode Keybinds'.

### Development

Use `npm run dev` for building during development.

Use `npm run build` to build for release.


