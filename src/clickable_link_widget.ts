import { EditorView, WidgetType } from "@codemirror/view";

export class ClickableLinkWidget extends WidgetType {
    private href: string;
    private innerText: string;
    private internal: boolean;

    constructor(href: string, innerText: string, internal: boolean) {
        super()
        this.href = href;
        this.innerText = innerText;
        this.internal = internal;
    }

    toDOM(view: EditorView): HTMLElement {
        const aElement = document.createElement("a");
        aElement.href = this.href;
        aElement.innerText = this.innerText;
        aElement.className = this.internal ? "internal-link" : "external-link";
        return aElement;
    }
}
