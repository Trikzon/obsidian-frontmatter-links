import FrontmatterLinksPlugin from "./main";

export {}

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: {
                "frontmatter-links": FrontmatterLinksPlugin
            }
        }
    }

    interface MetadataCache {
        initialize(): any,
    }

    interface VaultSettings {
        'alwaysUpdateLinks': boolean;
    }

    interface Vault {
        config: {};
        getConfig<T extends keyof VaultSettings>(setting: T): VaultSettings[T];
    }
}
