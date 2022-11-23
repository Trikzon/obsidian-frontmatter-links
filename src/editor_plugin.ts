import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { SyntaxNodeRef } from "@lezer/common"
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { FrontmatterLinkWidget } from "./link_widget";
import { isUri } from "valid-url";
import { LinkSlice } from "./link_slice";
import FrontmatterLinksPlugin from "./main";

export class FrontmatterLinksEditorPlugin implements PluginValue {
    decorations: DecorationSet;
    plugin: FrontmatterLinksPlugin;

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
        const linkSlices = new Array<LinkSlice>();

        this.findLinks(view, linkSlices);

        this.processLinks(view, linkSlices, builder);

        return builder.finish();
    }

    findLinks(view: EditorView, linkSlices: Array<LinkSlice>) {
        // TODO: Find a way to access the plugins through the editor plugin's constructor instead.
        const settings = app.plugins.plugins["frontmatter-links"].settings;

        let externalLinkFrom: number | null;
        let externalLinkTo: number;

        for (let { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node: SyntaxNodeRef) {
                    // Find links outside of quotes.
                    if (externalLinkFrom === null) {
                        if (node.name === "hmd-frontmatter") {
                            externalLinkFrom = node.from;
                            externalLinkTo = node.to;
                        }
                    } else {
                        if (node.name === "atom_hmd-frontmatter" || node.name === "def_hmd-frontmatter") {
                            let text = view.state.sliceDoc(externalLinkFrom, externalLinkTo);
                            if (isUri(text)) {
                                linkSlices.push({
                                    originalText: text,
                                    href: text,
                                    from: externalLinkFrom,
                                    to: externalLinkTo
                                });
                            }
                            externalLinkFrom = null;
                        } else {
                            externalLinkTo = node.to;
                        }
                    }

                    // Find links inside of quotes.
                    if (node.name === "hmd-frontmatter_string") {
                        const text = view.state.sliceDoc(node.from + 1, node.to - 1);

                        let match: RegExpMatchArray | null;
                        let href: string | undefined;
                        let alias: string | undefined;
                        if (match = text.match(/\[\[(.+)\|(.+)\]\]/m)) {
                            href = match[1];
                            alias = match[2];
                        } else if (match = text.match(/\[\[(.+)\]\]/m)) {
                            href = match[1];
                        } else if (match = text.match(/\[(.+)\]\((.+)\)/m)) {
                            href = match[2];
                            alias = match[1];
                        } else if (isUri(text)) {
                            href = text;
                        }
                        if (href) {
                            linkSlices.push({
                                originalText: text,
                                href,
                                alias,
                                from: node.from + (settings.hideQuotes ? 0 : 1),
                                to: node.to - (settings.hideQuotes ? 0 : 1)
                            });
                        }
                    }
                }
            });
        }
    }

    processLinks(view: EditorView, linkSlices: Array<LinkSlice>, builder: RangeSetBuilder<Decoration>) {
        for (let linkSlice of linkSlices) {
            const cursorHead = view.state.selection.main.head;
            if (linkSlice.from - 1 <= cursorHead && cursorHead <= linkSlice.to + 1) {
                // TODO: When the cursor is next to or on the link, style it like Obsidian does.
                builder.add(
                    linkSlice.from,
                    linkSlice.to,
                    Decoration.mark({ class: "cm-url" })
                );
            } else {
                builder.add(
                    linkSlice.from,
                    linkSlice.to,
                    Decoration.replace({ widget: new FrontmatterLinkWidget(linkSlice) })
                );
            }
        }
    }
}

export const FRONTMATTER_LINKS_EDITOR_PLUGIN = ViewPlugin.fromClass(FrontmatterLinksEditorPlugin, {
    decorations: (value: FrontmatterLinksEditorPlugin) => value.decorations
});
