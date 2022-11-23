import { TFile } from "obsidian";
import { isUri } from "valid-url";

export function onMetadataCacheResolve(file: TFile) {
    const cache = app.metadataCache.getFileCache(file);
    if (!cache) { return; }

    const frontmatter = cache.frontmatter;
    if (!frontmatter) { return; }

    addFrontmatterLinksToCache(file, frontmatter);
}

function addFrontmatterLinksToCache(file: TFile, frontmatter: any) {
    for (let key of Object.keys(frontmatter)) {
        const value = frontmatter[key];
        if (typeof(value) === "string") {
            const match: RegExpMatchArray | null = value.match(/\[\[(.+)\|.+\]\]/m) || value.match(/\[\[(.+)\]\]/m) || value.match(/\[.+\]\((.+)\)/m);
            
            if (!match) { continue; }
            let href = match[1];

            if (isUri(href)) { continue; }

            let f = app.metadataCache.getFirstLinkpathDest(href, "");
            let links: Record<string, Record<string, number>>;
            if (f instanceof TFile) {
                href = f.path;
                links = app.metadataCache.resolvedLinks;
            } else {
                links = app.metadataCache.unresolvedLinks;
            }

            if (links[file.path][href]) {
                links[file.path][href] += 1;
            } else {
                links[file.path][href] = 1;
            }
        } else if (typeof(value) === "object") {
            addFrontmatterLinksToCache(file, value);
        }
    }
}
