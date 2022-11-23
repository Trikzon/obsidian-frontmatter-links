import { EditorView, WidgetType } from "@codemirror/view";
import { TFile, Vault } from "obsidian";
import { isUri } from "valid-url";
import { LinkSlice } from "./link_slice";

export class FrontmatterLinkWidget extends WidgetType {
    private link: LinkSlice;

    constructor(link: LinkSlice) {
        super()
        this.link = link;
    }

    toDOM(view: EditorView): HTMLElement {
        const aElement = document.createElement("a");
        aElement.href = this.link.href;
        aElement.innerText = this.link.alias || this.link.href;

        if (isUri(this.link.href)) {
            aElement.addClass("external-link");
        } else {
            aElement.addClass("internal-link");

            if (!(app.vault.getAbstractFileByPath(this.link.href) instanceof TFile)) {
                aElement.addClass("is-unresolved");
            }
        }

        return aElement;
    }
}
