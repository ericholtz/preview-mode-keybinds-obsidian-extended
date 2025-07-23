import PreviewKeybinds from '../main'

export class ScrollHalfUpCommand {
	constructor(plugin: PreviewKeybinds) {
		plugin.addCommand({
			id: 'eh-pk-scrollhalfup',
			name: 'Scroll Half Up',
			callback: () => { plugin.scrollHalfUp() }
		})
	}
}
