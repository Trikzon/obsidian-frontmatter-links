import { EditorView, WidgetType } from "@codemirror/view";
import { TFile } from "obsidian";
import { isUri } from "valid-url";
import { LinkSlice } from "./link_slice";

export class FrontmatterLinkWidget extends WidgetType {
    private linkSlice: LinkSlice;

    constructor(linkSlice: LinkSlice) {
        super()
        this.linkSlice = linkSlice;
    }

    toDOM(view: EditorView): HTMLElement {
        const aElement = document.createElement("a");
        aElement.href = this.linkSlice.href;
        aElement.innerText = this.linkSlice.alias || this.linkSlice.href;

        if (isUri(this.linkSlice.href)) {
            aElement.addClass(this.linkSlice.markdownLink ? "external-link" : "cm-url");
        } else {
            aElement.addClass("internal-link");

            if (!(app.metadataCache.getFirstLinkpathDest(this.linkSlice.href, "") instanceof TFile) && !this.linkSlice.markdownLink) {
                aElement.addClass("is-unresolved");
            }
        }

        return aElement;
    }
}
