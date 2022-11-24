import { Plugin, TFile } from 'obsidian';
import { FRONTMATTER_LINKS_EDITOR_PLUGIN } from './editor_plugin';
import { onMetadataCacheResolve } from './metadata_cache';
import { onVaultFileRename } from './rename_links';
import { DEFAULT_SETTINGS, FrontmatterLinksSettings, FrontmatterLinksSettingTab } from './settings';

export default class FrontmatterLinksPlugin extends Plugin {
	settings: FrontmatterLinksSettings;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new FrontmatterLinksSettingTab(this.app, this));
		this.registerEditorExtension(FRONTMATTER_LINKS_EDITOR_PLUGIN);

		if (this.settings.addToGraph) {
			app.metadataCache.initialize();
		}

		const plugin = this;
		this.registerEvent(app.metadataCache.on("resolve", (file: TFile) => {
			if (!plugin.settings.addToGraph) { return; }

			onMetadataCacheResolve(file);
		}));

		this.registerEvent(app.vault.on("rename", (file: TFile, oldPath: string) => {
			if (plugin.settings.updateLinks && app.vault.getConfig("alwaysUpdateLinks")) {
				onVaultFileRename(file, oldPath, plugin);
			}
		}));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);

		this.saveSettings();
	}

	async saveSettings() {
		this.saveData(this.settings);
	}
}
