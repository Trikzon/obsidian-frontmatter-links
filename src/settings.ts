import { App, PluginSettingTab, Setting, ToggleComponent } from "obsidian";
import FrontmatterLinksPlugin from "./main";

export interface FrontmatterLinksSettings {
    hideQuotes: boolean;
}

export const DEFAULT_SETTINGS: Partial<FrontmatterLinksSettings> = {
    hideQuotes: false,
};

export class FrontmatterLinksSettingTab extends PluginSettingTab {
    private plugin: FrontmatterLinksPlugin;

    constructor(app: App, plugin: FrontmatterLinksPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        new Setting(this.containerEl)
            .setName("Hide Quotation Marks")
            .setDesc("Don't render quotation marks surrounding frontmatter links.")
            .addToggle((component: ToggleComponent) => {
                component.setValue(this.plugin.settings.hideQuotes);
                component.onChange((value: boolean) => {
                    this.plugin.settings.hideQuotes = value;
                    this.plugin.saveSettings();
                });
            });
    }

    hide() {
        this.containerEl.empty();
    }
}
