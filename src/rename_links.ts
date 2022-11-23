import { getFrontmatterOfTFile, setFrontmatterOfTFile } from "@opd-libs/opd-metadata-lib/lib/API";
import { TFile } from "obsidian";
import FrontmatterLinksPlugin from "./main";

export function onVaultFileRename(file: TFile, oldPath: string, plugin: FrontmatterLinksPlugin) {
    for (let fileName of Object.keys(app.metadataCache.resolvedLinks)) {
        const links = app.metadataCache.resolvedLinks[fileName];

		let oldName = oldPath;
		let match: RegExpMatchArray | null = oldPath.match(/.+\/(.+\.md)/m);
		if (match) {
			oldName = match[1];
		}

        if (links[oldPath]) {
            const f = app.metadataCache.getFirstLinkpathDest(fileName, "");
            if (f instanceof TFile) {
                const frontmatter = getFrontmatterOfTFile(f, plugin);
                renameFrontmatterLinks(
                    frontmatter,
                    oldName.substring(0, oldName.length - 3),
                    file.name.substring(0, file.name.length - 3)
                );
                setFrontmatterOfTFile(frontmatter, f, plugin);
                app.metadataCache.initialize();
            }
        }
    }
}

function renameFrontmatterLinks(frontmatter: any, oldName: string, newName: string) {
	for (let key of Object.keys(frontmatter)) {
		const value = frontmatter[key];
		if (typeof(value) === "string") {
			let match: RegExpMatchArray | null;
			if (match = value.match(/\[\[(.+)\|(.+)\]\]/m)) {
				if (match[1] === oldName) {
					frontmatter[key] = "[[" + newName + "|" + match[2] + "]]";
				}
			} else if (match = value.match(/\[\[(.+)\]\]/m)) {
				if (match[1] === oldName) {
					frontmatter[key] = "[[" + newName + "]]";
				}
			} else if (match = value.match(/\[(.+)\]\((.+)\)/m)) {
				if (match[2] === oldName) {
					frontmatter[key] = "[" + match[1] + "](" + newName + ")";
				}
			}
		} else if (typeof(value) === "object") {
			renameFrontmatterLinks(value, oldName, newName);
		}
	}
}
