import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { Plugin } from 'obsidian';

const URL_REGEX = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i;


class FrontmatterLinkWidget extends WidgetType {
	private url: string;
	private internal: boolean;

	constructor(url: string, internal: boolean) {
		super()
		this.url = url;
		this.internal = internal;
	}

	toDOM(view: EditorView): HTMLElement {
		const div = document.createElement("a");
		div.href = this.url;
		div.innerText = this.url;
		div.className = this.internal ? "intenral-link" : "external-link";
		div.contentEditable = "true";
		return div;
	}
}

class FrontmatterLinksPluginValue implements PluginValue {
	decorations: DecorationSet;

	constructor(view: EditorView) {
		this.decorations = this.buildDecorations(view);
	}

	update(update: ViewUpdate) {
		if (update.docChanged || update.viewportChanged || update.selectionSet) {
			this.decorations = this.buildDecorations(update.view);
		}
	}

	destroy() { }

	buildDecorations(view: EditorView): DecorationSet {
		const builder = new RangeSetBuilder<Decoration>();

		for (let { from, to } of view.visibleRanges) {
			syntaxTree(view.state).iterate({
				from,
				to,
				enter(node) {
					if (node.name === "hmd-frontmatter_string") {
						// Get rid of quotation marks.
						let from = node.from + 1;
						let to = node.to - 1;

						let originalText = view.state.sliceDoc(from, to);

						let selectedLine = view.lineBlockAt(view.state.selection.main.head);

						if (!(selectedLine.from <= from && selectedLine.to >= to)) {
							if (originalText.substring(0, 2) === "[[" && originalText.substring(originalText.length - 2) === "]]") {
								builder.add(
									from,
									to,
									Decoration.replace({
										widget: new FrontmatterLinkWidget(originalText.substring(2, originalText.length - 2), true)
									})
								);
							} else if (URL_REGEX.test(originalText)) {
								builder.add(
									from,
									to,
									Decoration.replace({
										widget: new FrontmatterLinkWidget(originalText, false)
									})
								);
							}
						}
					}
				}
			});
		}

		return builder.finish();
	}
}

const pluginSpec: PluginSpec<FrontmatterLinksPluginValue> = {
	decorations: (value: FrontmatterLinksPluginValue) => value.decorations,
};

const plugin = ViewPlugin.fromClass(FrontmatterLinksPluginValue, pluginSpec);

export default class FrontmatterLinksPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(plugin);
	}

	onunload() {
	}
}
