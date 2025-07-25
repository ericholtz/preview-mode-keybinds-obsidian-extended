import {
	App,
	MarkdownPreviewView,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian'

// Remember to rename these classes and interfaces!

interface PreviewKeybindsPluginSettings {
	linesToScroll: number
	up: string
	down: string
	enterEditMode: string
	searchDoc: string
	scrollBottom: string
	scrollTop: string
	bottomOffset: number // workaround for scroll to bottom not working see #10
}

const DEFAULT_SETTINGS: PreviewKeybindsPluginSettings = {
	linesToScroll: 3,
	moreLinesToScroll: 10,
	up: 'k',
	down: 'j',
	moreUp: 'u',
	moreDown: 'd',
	enterEditMode: 'i',
	searchDoc: '/',
	scrollBottom: '$',
	scrollTop: '0',
	bottomOffset: 1,
}

export default class PreviewKeybinds extends Plugin {
	public settings: PreviewKeybindsPluginSettings

	async onload() {
		await this.loadSettings()

		this.addSettingTab(new PreviewKeybindsSettingTab(this.app, this))

		this.registerEvent(
			this.app.workspace.on('layout-change', this.onLayoutChange)
		)
	}

	private readonly onLayoutChange = (): void => {
		const previews: HTMLElement[] = Array.from(
			document.querySelectorAll('.markdown-preview-view')
		)
		previews.forEach((preview) => {
			/* Using parent element to potentially fix preview not being focused after closing search bar, revert if doesn't work? */
			this.registerDomEvent(
				preview.parentElement,
				'keydown',
				this.onKeyDown
			)
		})
	}

	private readonly onKeyDown = (e: KeyboardEvent) => {
		const view: MarkdownView =
			this.app.workspace.getActiveViewOfType(MarkdownView)
		if (!view) return

		const preview: MarkdownPreviewView = view.previewMode

		if (
			preview.containerEl.querySelector(
				'div.markdown-reading-view > div.document-search-container'
			) ||
			!preview
		) {
			console.debug('skipping keyboard event ', e.key)
			return
		}

		switch (e.key) {
			case this.settings.up:
				preview.applyScroll(
					preview.getScroll() - this.settings.linesToScroll
				)
				break
			case this.settings.down:
				preview.applyScroll(
					preview.getScroll() + this.settings.linesToScroll
				)
				break
			case this.settings.moreUp:
				preview.applyScroll(
					preview.getScroll() - this.settings.moreLinesToScroll
				)
				break
			case this.settings.moreDown:
				preview.applyScroll(
					preview.getScroll() + this.settings.moreLinesToScroll
				)
				break
			case this.settings.enterEditMode:
				;(this.app as any).commands.executeCommandById(
					'markdown:toggle-preview'
				)
				break
			case this.settings.searchDoc:
				view.showSearch(false)
				break
			case this.settings.scrollTop:
				preview.applyScroll(0)
				break
			case this.settings.scrollBottom:
				preview.applyScroll(
					view.editor.lastLine() - this.settings.bottomOffset
				)
				break
			default:
				return
		}
		e.preventDefault()
	}

	async onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

class PreviewKeybindsSettingTab extends PluginSettingTab {
	plugin: PreviewKeybinds

	constructor(app: App, plugin: PreviewKeybinds) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl)
			.setName('Number of Lines to Scroll')
			.setDesc("Affects 'Scroll up' and 'Scroll down' keybinds")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.linesToScroll.toString())
					.onChange(async (value) => {
						let newVal = Number(value)
						/* compare to NaN instead? */
						if (newVal === null) return
						if (newVal <= 0) newVal = 1
						this.plugin.settings.linesToScroll = Math.round(newVal)
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Number of More Lines to Scroll')
			.setDesc("Affects 'Scroll More Up' and 'Scroll More Down' keybinds")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.moreLinesToScroll.toString())
					.onChange(async (value) => {
						let newVal = Number(value)
						/* compare to NaN instead? */
						if (newVal === null) return
						if (newVal <= 0) newVal = 1
						this.plugin.settings.moreLinesToScroll = Math.round(newVal)
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('Bottom offset (Workaround)')
			.setDesc('if "scroll to bottom" doesn\'t work, raise this number')
			.addText((text) =>
				text
					.setValue(this.plugin.settings.bottomOffset.toString())
					.onChange(async (value) => {
						let newVal = Number(value)
						if (newVal === null) return
						if (newVal <= 1) newVal = 1
						this.plugin.settings.bottomOffset = Math.round(newVal)
						await this.plugin.saveSettings()
					})
			)

		containerEl.createEl('h3', { text: 'Custom Keybindings' })
		containerEl.createEl('p', {
			text: 'Only non-space character keys (letters, symbols and digits) can be used for keybindings. Arrow keys, enter, space, tab etc. are not supproted. Modifier keys (shift, alt etc.) are not supported.',
		})

		new Setting(containerEl).setName('Scroll Up').addText((text) =>
			text.setValue(this.plugin.settings.up).onChange(async (value) => {
				let newKey: string = this.verifyNewKeyBinding(value)
				if (newKey === '') return
				this.plugin.settings.up = newKey
				await this.plugin.saveSettings()
			})
		)

		new Setting(containerEl).setName('Scroll Down').addText((text) =>
			text.setValue(this.plugin.settings.down).onChange(async (value) => {
				let newKey: string = this.verifyNewKeyBinding(value)
				if (newKey === '') return
				this.plugin.settings.down = newKey
				await this.plugin.saveSettings()
			})
		)
		new Setting(containerEl).setName('Scroll More Up').addText((text) =>
			text.setValue(this.plugin.settings.moreUp).onChange(async (value) => {
				let newKey: string = this.verifyNewKeyBinding(value)
				if (newKey === '') return
				this.plugin.settings.moreUp = newKey
				await this.plugin.saveSettings()
			})
		)

		new Setting(containerEl).setName('Scroll More Down').addText((text) =>
			text.setValue(this.plugin.settings.moreDown).onChange(async (value) => {
				let newKey: string = this.verifyNewKeyBinding(value)
				if (newKey === '') return
				this.plugin.settings.moreDown = newKey
				await this.plugin.saveSettings()
			})
		)

		new Setting(containerEl).setName('Enter Edit Mode').addText((text) =>
			text
				.setValue(this.plugin.settings.enterEditMode)
				.onChange(async (value) => {
					let newKey: string = this.verifyNewKeyBinding(value)
					if (newKey === '') return
					this.plugin.settings.enterEditMode = newKey
					await this.plugin.saveSettings()
				})
		)

		new Setting(containerEl).setName('Search').addText((text) =>
			text
				.setValue(this.plugin.settings.searchDoc)
				.onChange(async (value) => {
					let newKey: string = this.verifyNewKeyBinding(value)
					if (newKey === '') return
					this.plugin.settings.searchDoc = newKey
					await this.plugin.saveSettings()
				})
		)

		new Setting(containerEl).setName('Scroll to Bottom').addText((text) =>
			text
				.setValue(this.plugin.settings.scrollBottom)
				.onChange(async (value) => {
					let newKey: string = this.verifyNewKeyBinding(value)
					if (newKey === '') return
					this.plugin.settings.scrollBottom = newKey
					await this.plugin.saveSettings()
				})
		)

		new Setting(containerEl).setName('Scroll to Top').addText((text) =>
			text
				.setValue(this.plugin.settings.scrollTop)
				.onChange(async (value) => {
					let newKey: string = this.verifyNewKeyBinding(value)
					if (newKey === '') return
					this.plugin.settings.scrollTop = newKey
					await this.plugin.saveSettings()
				})
		)
	}

	private readonly verifyNewKeyBinding = (newKey: string): string => {
		if (newKey.length >= 0) newKey = newKey.trim().charAt(0)
		return newKey.toLowerCase()
	}
}
