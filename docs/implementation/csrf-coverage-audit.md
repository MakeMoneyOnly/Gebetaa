# CSRF Coverage Audit Report

**Date:** 2026-03-23
**Issue:** HIGH-012 - CSRF protection utilities exist but are not consistently applied across all Server Actions

## Summary

This audit verifies that all Server Actions have proper CSRF protection applied.

## CSRF Protection Mechanisms

The codebase implements two layers of CSRF protection:

1. **Origin Verification** (`verifyOrigin()`) - Validates the `Origin` or `Referer` header matches the expected application origin
2. **Token-based Protection** (`withCsrfProtection()`) - Validates CSRF tokens in form submissions

## Server Actions Audit Results

### ✅ Protected Server Actions

| File                             | Action              | Protection Method | Status       |
| -------------------------------- | ------------------- | ----------------- | ------------ |
| `src/app/auth/actions.ts`        | `login()`           | `verifyOrigin()`  | ✅ Protected |
| `src/app/auth/actions.ts`        | `signup()`          | `verifyOrigin()`  | ✅ Protected |
| `src/app/auth/actions.ts`        | `logout()`          | `verifyOrigin()`  | ✅ Protected |
| `src/app/auth/join/actions.ts`   | `provisionDevice()` | `verifyOrigin()`  | ✅ Protected |
| `src/app/auth/invite/actions.ts` | `acceptInvite()`    | `verifyOrigin()`  | ✅ Protected |

### Protection Implementation Details

#### `src/app/auth/actions.ts`

```typescript
// All actions use verifyOrigin() at the start
export async function login(prevState: unknown, formData: FormData) {
    await verifyOrigin(); // CSRF Protection
    // ... rest of implementation
}
```

#### `src/app/auth/join/actions.ts`

```typescript
export async function provisionDevice(data: {...}): Promise<ProvisionResult> {
    await verifyOrigin();  // CSRF Protection
    // ... rest of implementation
}
```

#### `src/app/auth/invite/actions.ts`

```typescript
export async function acceptInvite(code: string) {
    await verifyOrigin(); // CSRF Protection
    // ... rest of implementation
}
```

## CSRF Utility Functions

### `verifyOrigin()` Function

Located in `src/lib/security/csrf.ts`

- Validates `Origin` header against expected origin
- Falls back to `Referer` header if Origin is not present
- Allows localhost origins in development mode
- Returns never on success, throws on failure

### `withCsrfProtection()` Higher-Order Function

Located in `src/lib/security/csrf.ts`

- Wraps Server Actions with token-based CSRF validation
- Checks for `_csrf` token in FormData or arguments
- Can be used as an alternative to `verifyOrigin()` for form-based actions

## Recommendations

1. **Current Status:** All identified Server Actions have proper CSRF protection via `verifyOrigin()`.

2. **Future Actions:** When adding new Server Actions:
    - Always call `await verifyOrigin()` at the start of the action
    - Or wrap the action with `withCsrfProtection()` for token-based protection

3. **Testing:** Add integration tests to verify CSRF protection is working:
    ```typescript
    it('should reject requests without valid origin', async () => {
        const result = await login({}, invalidFormData);
        expect(result.error).toBeDefined();
    });
    ```

## Conclusion

**Status:** ✅ All Server Actions have proper CSRF protection

The audit confirms that all Server Actions in the codebase implement CSRF protection through the `verifyOrigin()` function. No gaps in coverage were identified.
