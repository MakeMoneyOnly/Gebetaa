/**
 * CSP Nonce Generation Utility
 *
 * HIGH-022: Replace unsafe-inline with nonce-based CSP
 * Generates cryptographically secure nonces for Content-Security-Policy
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * Uses Web Crypto API for Edge Runtime compatibility
 *
 * @param length - Number of bytes to generate (default 16 = 128 bits)
 * @returns Base64-encoded nonce string
 */
export function generateNonce(length: number = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    // Convert Uint8Array to string without spread operator for compatibility
    let binary = '';
    for (let i = 0; i < array.length; i++) {
        binary += String.fromCharCode(array[i]);
    }
    return btoa(binary);
}

/**
 * CSP Directive Builder with nonce support
 *
 * Builds CSP directives with nonce values for script-src and style-src
 * to replace unsafe-inline while maintaining functionality
 */
export class CSPBuilder {
    private nonce: string;
    private isProduction: boolean;

    constructor(nonce: string, isProduction: boolean = process.env.NODE_ENV === 'production') {
        this.nonce = nonce;
        this.isProduction = isProduction;
    }

    /**
     * Build the complete CSP header value
     */
    build(): string {
        const directives = [
            this.defaultSrc(),
            this.scriptSrc(),
            this.styleSrc(),
            this.imgSrc(),
            this.connectSrc(),
            this.fontSrc(),
            this.frameAncestors(),
            this.baseUri(),
            this.formAction(),
            this.workerSrc(),
            this.objectSrc(),
        ];

        return directives.join('; ');
    }

    /**
     * Get the nonce value for use in script/style tags
     */
    getNonce(): string {
        return this.nonce;
    }

    /**
     * Get script tag attributes for CSP
     */
    getScriptAttrs(): { nonce: string } {
        return { nonce: this.nonce };
    }

    /**
     * Get style tag attributes for CSP
     */
    getStyleAttrs(): { nonce: string } {
        return { nonce: this.nonce };
    }

    private defaultSrc(): string {
        return "default-src 'self'";
    }

    private scriptSrc(): string {
        // Use nonce instead of unsafe-inline
        // 'strict-dynamic' allows scripts to load other scripts
        const sources = ["'self'", `'nonce-${this.nonce}'`, "'strict-dynamic'"];

        // In development, we need eval for HMR
        if (!this.isProduction) {
            sources.push("'unsafe-eval'");
            sources.push('https://vercel.live');
        }

        return `script-src ${sources.join(' ')}`;
    }

    private styleSrc(): string {
        // Use nonce instead of unsafe-inline for styles
        const sources = ["'self'", `'nonce-${this.nonce}'`, 'https://fonts.googleapis.com'];

        return `style-src ${sources.join(' ')}`;
    }

    private imgSrc(): string {
        return "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://*.supabase.co https://grainy-gradients.vercel.app https://i.pravatar.cc https://api.dicebear.com";
    }

    private connectSrc(): string {
        return "connect-src 'self' https://*.supabase.co wss://*.supabase.co";
    }

    private fontSrc(): string {
        return "font-src 'self' data: https://fonts.gstatic.com";
    }

    private frameAncestors(): string {
        return "frame-ancestors 'none'";
    }

    private baseUri(): string {
        return "base-uri 'self'";
    }

    private formAction(): string {
        return "form-action 'self'";
    }

    private workerSrc(): string {
        return "worker-src 'self' blob:";
    }

    private objectSrc(): string {
        return "object-src 'none'";
    }
}

/**
 * Create a CSP builder with a fresh nonce
 */
export function createCSPBuilder(): CSPBuilder {
    const nonce = generateNonce();
    return new CSPBuilder(nonce);
}
