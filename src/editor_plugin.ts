import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { SyntaxNodeRef } from "@lezer/common"
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { FrontmatterLinkWidget } from "./link_widget";
import { isUri } from "valid-url";
import { LinkSlice } from "./link_slice";

export class FrontmatterLinksEditorPlugin implements PluginValue {
    decorations: DecorationSet;
    linkSlices: Array<LinkSlice> = new Array();

    constructor(view: EditorView) {
        this.linkSlices = new Array<LinkSlice>();
        this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate): void {
        if (update.selectionSet) {
            if (this.linkSlices.length === 0) {
                this.decorations = this.buildDecorations(update.view);
            } else {
                for (let linkSlice of this.linkSlices) {
                    const cursorHead = update.view.state.selection.main.head;
                    if (linkSlice.from - 1 <= cursorHead && cursorHead <= linkSlice.to + 1) {
                        this.decorations = this.buildDecorations(update.view);
                        console.log("rebuild");
                        break;
                    }
                }
            }
        } else if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }

    destroy() { }

    buildDecorations(view: EditorView): DecorationSet {
        console.log("build");
        const builder = new RangeSetBuilder<Decoration>();
        this.linkSlices = new Array<LinkSlice>();

        this.findLinks(view, this.linkSlices);

        this.processLinks(view, builder);

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

    processLinks(view: EditorView, builder: RangeSetBuilder<Decoration>) {
        for (let linkSlice of this.linkSlices) {
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
