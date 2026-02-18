import { useCallback, useEffect, useRef } from 'react';

interface SafeFetchOptions extends RequestInit {
    timeout?: number;
}

/**
 * A hook that provides a fetch function with automatic abort signal handling.
 * Requests are automatically aborted when the component unmounts.
 *
 * @example
 * ```tsx
 * const { safeFetch } = useSafeFetch();
 *
 * useEffect(() => {
 *   const fetchData = async () => {
 *     try {
 *       const response = await safeFetch('/api/data');
 *       const data = await response.json();
 *       setData(data);
 *     } catch (error) {
 *       if (error instanceof Error && error.name === 'AbortError') {
 *         return; // Request was cancelled, ignore
 *       }
 *       console.error(error);
 *     }
 *   };
 *   fetchData();
 * }, []);
 * ```
 */
export function useSafeFetch() {
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            // Abort any pending requests on unmount
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const safeFetch = useCallback(async (url: string, options: SafeFetchOptions = {}) => {
        // Abort previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new AbortController
        abortControllerRef.current = new AbortController();
        const { timeout = 30000, signal: externalSignal, ...fetchOptions } = options;

        // If an external signal is provided, we need to listen to it as well
        if (externalSignal) {
            externalSignal.addEventListener('abort', () => {
                abortControllerRef.current?.abort();
            });
        }

        // Set up timeout
        const timeoutId = setTimeout(() => {
            abortControllerRef.current?.abort();
        }, timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: abortControllerRef.current.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                // Silently ignore abort errors - this is expected behavior
                throw new DOMException('Request aborted', 'AbortError');
            }
            throw error;
        }
    }, []);

    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);

    return { safeFetch, abort };
}

/**
 * Helper function to check if an error is an abort error.
 * Use this to silently ignore aborted requests in catch blocks.
 */
export function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}
