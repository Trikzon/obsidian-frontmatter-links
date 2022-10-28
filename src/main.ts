import { Plugin } from 'obsidian';
import { FRONTMATTER_LINKS_EDITOR_PLUGIN } from './editor_plugin';

export default class FrontmatterLinksPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(FRONTMATTER_LINKS_EDITOR_PLUGIN);
	}

	onunload() {
	}
}
