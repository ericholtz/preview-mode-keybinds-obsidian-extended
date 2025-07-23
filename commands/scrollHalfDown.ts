import PreviewKeybinds from '../main'

export class ScrollHalfDownCommand {
	constructor(plugin: PreviewKeybinds) {
		plugin.addCommand({
			id: 'eh-pk-scrollHalfDown',
			name: 'Scroll Half Down',
			callback: () => { plugin.scrollHalfDown() }
		})
	}
}
