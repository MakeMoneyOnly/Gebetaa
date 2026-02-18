# Fix Plan: "signal is aborted without reason" and "Failed to fetch" Console Errors

## Problem Analysis

### Error 1: `AbortError: signal is aborted without reason`
This error occurs when fetch requests are cancelled without proper handling. In Next.js 16 with Turbopack and React 19, this commonly happens due to:

1. **Component unmounting during fetch** - When a component unmounts while a fetch is in progress, the request gets aborted
2. **React StrictMode double-rendering** - Development mode renders components twice, potentially aborting the first request
3. **Missing AbortController cleanup** - No proper cancellation mechanism in useEffect hooks

### Error 2: `TypeError: Failed to fetch`
This is a network-level error that can occur when:

1. **Service Worker interference** - PWA service worker may intercept and fail requests
2. **Network timeout** - Requests timing out without proper error handling
3. **CORS or connectivity issues** - Development server connection problems

## Root Causes Identified in Codebase

### 1. Missing AbortController in useEffect Hooks
Multiple components have fetch calls without AbortController:

- [`src/app/(dashboard)/merchant/orders/page.tsx`](src/app/(dashboard)/merchant/orders/page.tsx) - Lines 245-280, 282-310, 312-325
- [`src/app/(guest)/demo-table/page.tsx`](src/app/(guest)/demo-table/page.tsx) - Lines 65-200
- [`src/app/(dashboard)/merchant/tables/page.tsx`](src/app/(dashboard)/merchant/tables/page.tsx) - Multiple fetch calls
- [`src/app/(dashboard)/merchant/staff/page.tsx`](src/app/(dashboard)/merchant/staff/page.tsx) - Multiple fetch calls
- And many other components

### 2. Realtime Subscription Cleanup Issue
In [`src/app/(dashboard)/merchant/orders/page.tsx`](src/app/(dashboard)/merchant/orders/page.tsx:409-433), the realtime subscription triggers re-fetching on every change, but the fetch functions don't have abort signals.

### 3. PWA Service Worker in Development
The [`next.config.ts`](next.config.ts:7) disables PWA in development, but there may be cached service workers causing issues.

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Safe Fetch Pattern                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Component Mount                                             │
│       │                                                      │
│       ▼                                                      │
│  ┌─────────────────┐                                        │
│  │ Create Abort    │                                        │
│  │ Controller      │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐    Abort Signal    ┌──────────────┐   │
│  │ Fetch with      │───────────────────▶│ API Request  │   │
│  │ Abort Signal    │                    └──────────────┘   │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │ Handle Response │                                        │
│  │ or Abort Error  │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ▼                                                  │
│  Component Unmount ──────▶ Abort Controller                  │
│                           (cleanup)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Step 1: Create a `useSafeFetch` Hook
Create a reusable hook that handles abort signals automatically.

**File:** `src/hooks/useSafeFetch.ts`

```typescript
import { useCallback, useEffect, useRef } from 'react';

interface SafeFetchOptions extends RequestInit {
  timeout?: number;
}

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
    const { timeout = 30000, ...fetchOptions } = options;

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
        console.debug('Request aborted:', url);
        throw new DOMException('Request aborted', 'AbortError');
      }
      throw error;
    }
  }, []);

  return { safeFetch };
}
```

### Step 2: Create a `useAbortableEffect` Hook
For effects that need abort capability.

**File:** `src/hooks/useAbortableEffect.ts`

```typescript
import { useEffect, useRef } from 'react';

export function useAbortableEffect(
  effect: (signal: AbortSignal) => Promise<void> | void,
  deps: React.DependencyList
) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const effectResult = effect(abortControllerRef.current.signal);
    
    return () => {
      abortControllerRef.current?.abort();
      if (effectResult instanceof Promise) {
        effectResult.catch(() => {
          // Silently catch errors from aborted requests
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
```

### Step 3: Update Components with Fetch Calls

#### Example Fix for `src/app/(dashboard)/merchant/orders/page.tsx`

**Before:**
```typescript
const fetchOrders = useCallback(async (status: string, search: string) => {
  setLoading(true);
  // ... fetch without abort signal
  const response = await fetch(`/api/orders?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });
  // ...
}, [user]);
```

**After:**
```typescript
const fetchOrders = useCallback(async (status: string, search: string, signal?: AbortSignal) => {
  setLoading(true);
  try {
    const params = new URLSearchParams();
    // ... build params
    
    const response = await fetch(`/api/orders?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      signal, // Add abort signal
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders (${response.status})`);
    }

    const payload = await response.json();
    setOrders(payload?.data?.orders ?? []);
  } catch (error) {
    // Ignore abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error('Error fetching orders from API:', error);
    setOrders([]);
  } finally {
    setLoading(false);
  }
}, [user]);
```

### Step 4: Update useEffect to Use AbortController

**Before:**
```typescript
useEffect(() => {
  if (roleLoading) return;
  if (user) {
    fetchOrders(activeFilter, debouncedSearchTerm);
    // ...
  }
}, [activeFilter, debouncedSearchTerm, fetchOrders, ...]);
```

**After:**
```typescript
useEffect(() => {
  if (roleLoading) return;
  
  const abortController = new AbortController();
  
  if (user) {
    fetchOrders(activeFilter, debouncedSearchTerm, abortController.signal);
    fetchServiceRequests(activeFilter, debouncedSearchTerm, abortController.signal);
    fetchStaff(abortController.signal);
  } else {
    setLoading(false);
  }
  
  return () => {
    abortController.abort();
  };
}, [activeFilter, debouncedSearchTerm, fetchOrders, ...]);
```

### Step 5: Fix Realtime Subscription Re-fetch Issue

The realtime subscription triggers fetch on every change. Need to prevent concurrent fetches:

```typescript
// Add ref to track pending requests
const isFetchingRef = useRef(false);

useEffect(() => {
  const channel = supabase
    .channel('orders-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => {
        // Debounce and prevent concurrent fetches
        if (!isFetchingRef.current) {
          fetchOrders(activeFilter, debouncedSearchTerm);
        }
      }
    )
    // ...
}, [...]);
```

### Step 6: Clear Service Worker Cache (Development)

Add a script to clear service worker in development:

**File:** `public/sw-clear.js` (development only)

Or add to `src/app/layout.tsx`:

```typescript
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    navigator.serviceWorker?.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }
}, []);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useSafeFetch.ts` | **NEW** - Create safe fetch hook |
| `src/hooks/useAbortableEffect.ts` | **NEW** - Create abortable effect hook |
| `src/app/(dashboard)/merchant/orders/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(guest)/demo-table/page.tsx` | Add AbortController to fetch calls |
| `src/app/(dashboard)/merchant/tables/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/staff/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/guests/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/analytics/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/channels/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/help/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(dashboard)/merchant/settings/page.tsx` | Add AbortController to all fetch calls |
| `src/app/(kds)/kds/page.tsx` | Add AbortController to fetch calls |
| `src/app/(guest)/[slug]/page.tsx` | Add AbortController to fetch calls |
| `src/features/menu/components/CartDrawer.tsx` | Add AbortController to fetch calls |
| `src/features/menu/components/ServiceRequestButton.tsx` | Add AbortController to fetch calls |
| `src/app/layout.tsx` | Add service worker cleanup for development |

## Testing Checklist

- [ ] Verify no console errors on page navigation
- [ ] Test rapid page navigation (triggers abort scenarios)
- [ ] Test with slow network (timeout handling)
- [ ] Verify realtime subscriptions still work
- [ ] Test in both development and production builds
- [ ] Verify PWA functionality not affected in production

## Priority Order

1. **High Priority** - Create utility hooks (reusable across all components)
2. **High Priority** - Fix orders page (most complex with realtime)
3. **Medium Priority** - Fix other dashboard pages
4. **Low Priority** - Fix guest pages (simpler fetch patterns)
