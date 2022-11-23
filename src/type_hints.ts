export {}

declare module "obsidian" {
    interface App {
        plugins: {
            plugins: any
        }
    }

    interface MetadataCache {
        initialize(): any,
    }
}
