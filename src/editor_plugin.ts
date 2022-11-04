import { syntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, PluginValue, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { FrontmatterLinkWidget } from "./link_widget";
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

    processLink(view: EditorView, builder: RangeSetBuilder<Decoration>, from: number, to: number, includesQuotes: boolean) {
        const linkFrom = includesQuotes ? from + 1 : from;
        const linkTo = includesQuotes ? to - 1 : to;
        const text = view.state.sliceDoc(linkFrom, linkTo);

        let href = null;
        let alias = null;
        if (text.substring(0, 2) === "[[" && text.substring(text.length - 2) === "]]") {
            href = text.substring(2, text.length - 2);
            const aliasIndex = href.indexOf("|");
            if (aliasIndex !== -1) {
                alias = href.substring(aliasIndex + 1);
                href = href.substring(0, aliasIndex);
            }
        } else if (text[0] === "[" && text[text.length - 1] === ")") {
            const aliasClose = text.indexOf("]");
            const hrefOpen = text.indexOf("(");
            if (aliasClose !== -1 && hrefOpen !== -1) {
                alias = text.substring(1, aliasClose);
                href = text.substring(hrefOpen + 1, text.length - 1);
            }
        } else if (isUri(text)) {
            href = text;
        }

        if (href) {
            alias = !alias ? href : alias;
            const cursorHead = view.state.selection.main.head;
            if (from - 1 <= cursorHead && cursorHead <= to + 1) {
                // TODO: When the cursor is next to or on the link, style it like Obsidian does.
                builder.add(
                    linkFrom,
                    linkTo,
                    Decoration.mark({
                        class: "cm-url"
                    })
                )
            } else {
                builder.add(
                    from,
                    to,
                    Decoration.replace({
                        widget: new FrontmatterLinkWidget(href, alias, isUri(href) === undefined)
                    })
                )
            }
        }
    }

    buildDecorations(view: EditorView): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const plugin = this;

        let linkFrom: number | null;
        let linkTo: number;

        for (let { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node) {
                    if (linkFrom) {
                        if (node.name === "hmd-frontmatter") {
                            const text = view.state.sliceDoc(node.from, node.to);
                            const spaceIndex = text.indexOf(" ");
                            if (spaceIndex !== -1) {
                                linkTo = node.from + spaceIndex;
                                plugin.processLink(view, builder, linkFrom, linkTo, false);
                                linkFrom = null;
                            } else {
                                linkTo = node.to;
                            }
                        } else if (node.name == "hmd-frontmatter_meta") {
                            linkTo = node.to;
                        } else {
                            plugin.processLink(view, builder, linkFrom, linkTo, false);
                            linkFrom = null;
                        }
                    }

                    if (!linkFrom) {
                        if (node.name === "hmd-frontmatter_string") {
                            plugin.processLink(view, builder, node.from, node.to, true);
                        }
                        
                        if (node.name == "hmd-frontmatter") {
                            const text = view.state.sliceDoc(node.from, node.to);

                            for (const urlPrefix of ["http", "https", "file"]) {
                                if (text == urlPrefix) {
                                    linkFrom = node.from;
                                    linkTo = node.to;
                                    break;
                                } else if (text.endsWith(" " + urlPrefix)) {
                                    linkFrom = node.to - urlPrefix.length;
                                    linkTo = node.to;
                                    break;
                                }
                            }
                        }
                    }
                }
            });
        }

        return builder.finish();
    }
}

export const FRONTMATTER_LINKS_EDITOR_PLUGIN = ViewPlugin.fromClass(FrontmatterLinksEditorPlugin, {
    decorations: (value: FrontmatterLinksEditorPlugin) => value.decorations
});
