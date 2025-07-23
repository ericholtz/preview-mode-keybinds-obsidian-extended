import PreviewKeybinds from '../main'

export class ScrollDownCommand {
	constructor(plugin: PreviewKeybinds) {
		plugin.addCommand({
			id: 'eh-pk-scrolldown',
			name: 'Scroll Down',
			callback: () => { plugin.scrollDown() }
		})
	}
}
