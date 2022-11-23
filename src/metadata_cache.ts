import { TFile } from "obsidian";
import { isUri } from "valid-url";

export function onMetadataCacheResolve(file: TFile) {
    const cache = app.metadataCache.getFileCache(file);
    if (!cache) { return; }

    const frontmatter = cache.frontmatter;
    if (!frontmatter) { return; }

    addFrontmatterLinksToCache(file, frontmatter);
}

function addFrontmatterLinksToCache(file: TFile, object: { [keys: string] : string | Object }) {
    for (let key of Object.keys(object)) {
        const value = object[key];
        if (typeof(value) === "string") {
            const match: RegExpMatchArray | null = value.match(/\[\[(.+)\|.+\]\]/m) || value.match(/\[\[(.+)\]\]/m) || value.match(/\[.+\]\((.+)\)/m);
            
            if (!match) { continue; }
            let href = match[1];

            if (!href.match(/.+\.md/m)) {
                href += ".md";
            }

            if (isUri(href)) { continue; }

            const unresolved = !(app.vault.getAbstractFileByPath(href) instanceof TFile);
            const links = unresolved ? app.metadataCache.unresolvedLinks : app.metadataCache.resolvedLinks;

            if (links[file.name][href]) {
                links[file.name][href] += 1;
            } else {
                links[file.name][href] = 1;
            }
        } else if (typeof(value) === "object") {
            // @ts-ignore
            addFrontmatterLinksToCache(file, value);
        }
    }
}
