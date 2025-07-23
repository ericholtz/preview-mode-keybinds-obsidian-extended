import {
	App,
	MarkdownPreviewView,
	MarkdownView,
	Plugin,
	PluginSettingTab,
	Setting,
} from 'obsidian'
import { ScrollUpCommand } from 'commands/scrollUp'
import { ScrollDownCommand } from 'commands/scrollDown'
import { ScrollHalfUpCommand } from 'commands/scrollHalfUp'
import { ScrollHalfDownCommand } from 'commands/scrollHalfDown'

// Remember to rename these classes and interfaces!

interface PreviewKeybindsPluginSettings {
	linesToScroll: number
	halfPageDistance: number
	fullPageDistance: number
	enterEditMode: string
	searchDoc: string
	scrollBottom: string
	scrollTop: string
	bottomOffset: number // workaround for scroll to bottom not working see #10
}

const DEFAULT_SETTINGS: PreviewKeybindsPluginSettings = {
	linesToScroll: 3,
	halfPageDistance: 10,
	fullPageDistance: 20,
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

		new ScrollUpCommand(this);
		new ScrollDownCommand(this);
		new ScrollHalfUpCommand(this);
		new ScrollHalfDownCommand(this);
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

	private getPreview() {
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
			console.debug('not in preview mode')
			return
		}
		return { view, preview }
	}

	scrollHalfUp() {
		const { preview } = this.getPreview()
		if (!preview) {
			document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { "key": "ArrowDown", "code": "ArrowDown" }))
		}
		preview.applyScroll(
			preview.getScroll() - this.settings.halfPageDistance
		)
	}

	scrollHalfDown() {
		const { preview } = this.getPreview()
		preview.applyScroll(
			preview.getScroll() + this.settings.halfPageDistance
		)
	}

	scrollUp() {
		const { preview } = this.getPreview()
		preview.applyScroll(
			preview.getScroll() - this.settings.linesToScroll
		)
	}

	scrollDown() {
		const { preview } = this.getPreview()
		preview.applyScroll(
			preview.getScroll() + this.settings.linesToScroll
		)
	}

	private readonly onKeyDown = (e: KeyboardEvent) => {
		const { view, preview } = this.getPreview()

		switch (e.key) {
			case this.settings.enterEditMode:
				; (this.app as any).commands.executeCommandById(
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

	async onunload() { }

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
			.setDesc("Affects 'Scroll Half Up' and 'Scroll Half Down' keybinds")
			.addText((text) =>
				text
					.setValue(this.plugin.settings.halfPageDistance.toString())
					.onChange(async (value) => {
						let newVal = Number(value)
						/* compare to NaN instead? */
						if (newVal === null) return
						if (newVal <= 0) newVal = 1
						this.plugin.settings.halfPageDistance = Math.round(newVal)
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
