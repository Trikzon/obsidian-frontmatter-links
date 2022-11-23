import { EditorView, WidgetType } from "@codemirror/view";
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
        aElement.className = isUri(this.link.href) ? "external-link" : "internal-link";
        return aElement;
    }
}
