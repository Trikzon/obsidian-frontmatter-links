import { App, PluginSettingTab, Setting, ToggleComponent } from "obsidian";
import FrontmatterLinksPlugin from "./main";

export interface FrontmatterLinksSettings {
    hideQuotes: boolean,
    addToGraph: boolean,
    updateLinks: boolean,
}

export const DEFAULT_SETTINGS: Partial<FrontmatterLinksSettings> = {
    hideQuotes: false,
    addToGraph: true,
    updateLinks: true,
};

export class FrontmatterLinksSettingTab extends PluginSettingTab {
    private plugin: FrontmatterLinksPlugin;

    constructor(app: App, plugin: FrontmatterLinksPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        new Setting(this.containerEl)
            .setName("Hide quotation marks")
            .setDesc("Don't render quotation marks surrounding frontmatter links.")
            .addToggle((component: ToggleComponent) => {
                component.setValue(this.plugin.settings.hideQuotes);
                component.onChange((value: boolean) => {
                    this.plugin.settings.hideQuotes = value;
                    this.plugin.saveSettings();
                });
            });
        
        new Setting(this.containerEl)
            .setName("Add to graph")
            .setDesc("Add frontmatter link connections to the graph view.")
            .addToggle((component: ToggleComponent) => {
                component.setValue(this.plugin.settings.addToGraph);
                component.onChange((value: boolean) => {
                    app.metadataCache.initialize();
                    this.plugin.settings.addToGraph = value;
                    this.plugin.saveSettings();
                });
            });
        
        new Setting(this.containerEl)
            .setName("Automatically update internal frontmatter links")
            .setDesc("Turn on to update frontmatter links when a note is renamed.<br>'Automatically update internal links' in 'Files & Links' must also be enabled.")
            .setDesc(
                createFragment(el => {
                    el.appendText(
                        "Turn on to update frontmatter links when a note is renamed." 
                    );
                    el.createEl("br");
                    el.createEl("div", {
                        cls: "mod-warning",
                        text: "'Automatically update internal links' in 'Files & Links' must also be enabled."
                    });
                })
            )
            .addToggle((component: ToggleComponent) => {
                component.setValue(this.plugin.settings.updateLinks);
                component.onChange((value: boolean) => {
                    this.plugin.settings.updateLinks = value;
                    this.plugin.saveSettings();
                });
            });
    }

    hide() {
        this.containerEl.empty();
    }
}
