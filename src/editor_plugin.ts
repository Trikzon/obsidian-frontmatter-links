import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { SyntaxNodeRef } from "@lezer/common"
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { FrontmatterLinkWidget } from "./link_widget";
import { isUri } from "valid-url";
import { LinkSlice } from "./link_slice";
import { FrontmatterLinksSettings } from "./settings";
import { TFile } from "obsidian";

export class FrontmatterLinksEditorPlugin implements PluginValue {
    decorations: DecorationSet;
    linkSlices: Array<LinkSlice> = new Array();

    constructor(view: EditorView) {
        this.linkSlices = new Array<LinkSlice>();
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
        this.linkSlices = new Array<LinkSlice>();

        this.findLinks(view, this.linkSlices);

        this.processLinks(view, builder);

        return builder.finish();
    }

    findLinks(view: EditorView, linkSlices: Array<LinkSlice>) {
        // TODO: Find a way to access the plugins through the editor plugin's constructor instead.
        const settings: FrontmatterLinksSettings = app.plugins.plugins["frontmatter-links"].settings;

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
                        let markdownLink: boolean | undefined;
                        if (match = text.match(/\[\[(.+)\|(.+)\]\]/m)) {
                            href = match[1];
                            alias = match[2];
                        } else if (match = text.match(/\[\[(.+)\]\]/m)) {
                            href = match[1];
                        } else if (match = text.match(/\[(.+)\]\((.+)\)/m)) {
                            href = match[2];
                            alias = match[1];
                            markdownLink = true;
                        } else if (isUri(text)) {
                            href = text;
                        }
                        if (href) {
                            linkSlices.push({
                                originalText: text,
                                href,
                                alias,
                                from: node.from + (settings.hideQuotes ? 0 : 1),
                                to: node.to - (settings.hideQuotes ? 0 : 1),
                                markdownLink
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
                this.styleLink(view, builder, linkSlice);
            } else {
                builder.add(
                    linkSlice.from,
                    linkSlice.to,
                    Decoration.replace({ widget: new FrontmatterLinkWidget(linkSlice) })
                );
            }
        }
    }

    styleLink(view: EditorView, builder: RangeSetBuilder<Decoration>, linkSlice: LinkSlice) {
        // TODO: Clean up this code. I'm not sure that's possible though.
        const settings: FrontmatterLinksSettings = app.plugins.plugins["frontmatter-links"].settings;
        const unresolved = !(app.vault.getAbstractFileByPath(linkSlice.href) instanceof TFile);
        const text = view.state.sliceDoc(linkSlice.from, linkSlice.to);

        let match: RegExpMatchArray | null;
        if (match = text.match(/\[\[(.+)\|(.+)\]\]/m)) {
            builder.add(
                linkSlice.from + (settings.hideQuotes ? 1 : 0),
                linkSlice.from + 2 + (settings.hideQuotes ? 1 : 0),
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-start" })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[1]),
                linkSlice.from + text.indexOf(match[1]) + match[1].length,
                Decoration.mark({ class: "cm-link" + (unresolved ? " is-unresolved" : "") })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[1]) + match[1].length,
                linkSlice.from + text.indexOf(match[1]) + match[1].length + 1,
                Decoration.mark({ class: "cm-hmd-internal-link" })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[2]),
                linkSlice.from + text.indexOf(match[2]) + match[2].length,
                Decoration.mark({ class: "cm-link" + (unresolved ? " is-unresolved" : "") })
            );
            builder.add(
                linkSlice.to - 2 - (settings.hideQuotes ? 1 : 0),
                linkSlice.to - (settings.hideQuotes ? 1 : 0),
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-end" })
            );
        } else if (match = text.match(/\[\[(.+)\]\]/m)) {
            builder.add(
                linkSlice.from + (settings.hideQuotes ? 1 : 0),
                linkSlice.from + 2 + (settings.hideQuotes ? 1 : 0),
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-start" })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[1]),
                linkSlice.from + text.indexOf(match[1]) + match[1].length,
                Decoration.mark({ class: "cm-link" + (unresolved ? " is-unresolved" : "") })
            );
            builder.add(
                linkSlice.to - 2 - (settings.hideQuotes ? 1 : 0),
                linkSlice.to - (settings.hideQuotes ? 1 : 0),
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-end" })
            );
        } else if (match = text.match(/\[(.+)\](\(.+\))/m)) {
            builder.add(
                linkSlice.from + (settings.hideQuotes ? 1 : 0),
                linkSlice.from + 1 + (settings.hideQuotes ? 1 : 0),
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-start" })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[1]),
                linkSlice.from + text.indexOf(match[1]) + match[1].length,
                Decoration.mark({ class: "cm-link" })
            );
            builder.add(
                linkSlice.from + text.indexOf("]"),
                linkSlice.from + text.indexOf("]") + 1,
                Decoration.mark({ class: "cm-formatting-link cm-formatting-link-end" })
            );
            builder.add(
                linkSlice.from + text.indexOf(match[2]),
                linkSlice.from + text.indexOf(match[2]) + match[2].length,
                Decoration.mark({ class: isUri(linkSlice.href) ? "external-link" : "cm-url" })
            );
        } else if (match = text.match(/\"(.+)\"/m)) {
            builder.add(
                linkSlice.from + text.indexOf(match[1]),
                linkSlice.from + text.indexOf(match[1]) + match[1].length,
                Decoration.mark({ class: "cm-url" })
            );
        } else if (isUri(text)) {
            builder.add(
                linkSlice.from,
                linkSlice.to,
                Decoration.mark({ class: "cm-url" })
            );
        }
    }
}

export const FRONTMATTER_LINKS_EDITOR_PLUGIN = ViewPlugin.fromClass(FrontmatterLinksEditorPlugin, {
    decorations: (value: FrontmatterLinksEditorPlugin) => value.decorations
});
