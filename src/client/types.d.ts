declare global {

    interface HighlightOptions {
        language: string;
        ignoreIllegals?: boolean;
        tabReplace?: string;
        useBR?: boolean;
        classPrefix?: string;
    }

    interface HighlightResult {
        code?: string
        relevance : number
        value : string
        language? : string
        illegal : boolean
        errorRaised? : Error
    }

    interface HighlightJS {

        highlight(
            element: HTMLElement,
            language: string,
            options?: HighlightOptions
        ): HighlightResult;

        highlightBlock: (element: HTMLElement) => void
        highlightElement: (element: HTMLElement) => void
        highlightAll: () => void
    }

    const hljs: HighlightJS;
}

export {};