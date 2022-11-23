import { Plugin } from 'obsidian';
import { FRONTMATTER_LINKS_EDITOR_PLUGIN } from './editor_plugin';
import { DEFAULT_SETTINGS, FrontmatterLinksSettings, FrontmatterLinksSettingTab } from './settings';

export default class FrontmatterLinksPlugin extends Plugin {
	settings: FrontmatterLinksSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FrontmatterLinksSettingTab(this.app, this));
		this.registerEditorExtension(FRONTMATTER_LINKS_EDITOR_PLUGIN);
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		this.saveData(this.settings);
	}
}
