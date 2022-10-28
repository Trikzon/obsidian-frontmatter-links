import { Plugin } from 'obsidian';
import { EDITOR_PLUGIN } from './editor_plugin';

export default class FrontmatterLinksPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(EDITOR_PLUGIN);
	}

	onunload() {
	}
}
