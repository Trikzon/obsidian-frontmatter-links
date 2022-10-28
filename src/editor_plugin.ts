import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { ClickableLinkWidget } from "./clickable_link_widget";
import { isUri } from "valid-url";

export class FrontmatterLinksEditorPlugin implements PluginValue {
    decorations: DecorationSet;

    constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate): void {
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
                        let linkText = view.state.sliceDoc(node.from + 1, node.to - 1);
                        let selectedLine = view.lineBlockAt(view.state.selection.main.head);

                        // If cursor is on the same line as the link.
                        if (selectedLine.from <= node.from && selectedLine.to >= node.to) {
                        } else {
                            // If text is Obsidian wiki link
                            if (linkText.substring(0, 2) === "[[" && linkText.substring(linkText.length - 2) === "]]") {
                                let href = linkText.substring(2, linkText.length - 2);
                                let innerText = href;
                                builder.add(
                                    node.from,
                                    node.to,
                                    Decoration.replace({
                                        widget: new ClickableLinkWidget(href, innerText, true)
                                    })
                                );
                            } else if (isUri(linkText)) {
                                builder.add(
                                    node.from,
                                    node.to,
                                    Decoration.replace({
                                        widget: new ClickableLinkWidget(linkText, linkText, false)
                                    })
                                )
                            }
                        }
                    }
                }
            });
        }

        return builder.finish();
    }
}

export const EDITOR_PLUGIN = ViewPlugin.fromClass(FrontmatterLinksEditorPlugin, {
    decorations: (value: FrontmatterLinksEditorPlugin) => value.decorations
});
