import { EditorView, WidgetType } from "@codemirror/view";

export class ClickableLinkWidget extends WidgetType {
    private href: string;
    private alias: string;
    private internal: boolean;

    constructor(href: string, alias: string, internal: boolean) {
        super()
        this.href = href;
        this.alias = alias;
        this.internal = internal;
    }

    toDOM(view: EditorView): HTMLElement {
        const aElement = document.createElement("a");
        aElement.href = this.href;
        aElement.innerText = this.alias;
        aElement.className = this.internal ? "internal-link" : "external-link";
        return aElement;
    }
}
