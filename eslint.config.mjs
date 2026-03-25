import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    // Override default ignores of eslint-config-next.
    globalIgnores([
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'coverage/**',
        'next-env.d.ts',
        'SKILLS/**',
        '.ts',
        'lint_output.txt',
    ]),
    {
        rules: {
            // HIGH-007: Re-enabled as 'warn' to gradually reduce `any` usage
            // Existing codebase has broad legacy usage; warn to make lint actionable for CI gating.
            '@typescript-eslint/no-explicit-any': 'warn',
            'react/no-unescaped-entities': 'off',
            'react-hooks/set-state-in-effect': 'off',
            // Allow underscore-prefixed variables (intentionally unused function params)
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            // LOW-008: Detect unused imports to reduce bundle size
            // Warns on imports that are never used in the file
            '@typescript-eslint/no-unused-imports': 'warn',
            // DISABLED: Requires explicit return types on ALL functions - too strict for this codebase
            // Would require adding return types to 900+ functions across hundreds of files
            '@typescript-eslint/explicit-function-return-type': 'off',
            // MED-011: Warn on console statements to encourage structured logging
            // Use src/lib/logger.ts instead of console.* for production code
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
]);

export default eslintConfig;
