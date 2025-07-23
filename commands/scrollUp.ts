import PreviewKeybinds from '../main'

export class ScrollUpCommand {
	constructor(plugin: PreviewKeybinds) {
		plugin.addCommand({
			id: 'eh-pk-scrollup',
			name: 'Scroll Up',
			callback: () => { plugin.scrollUp() }
		})
	}
}
