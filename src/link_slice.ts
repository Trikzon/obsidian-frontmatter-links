export interface LinkSlice {
    originalText: string;
    href: string;
    alias?: string;
    from: number;
    to: number;
    markdownLink?: boolean;
}
