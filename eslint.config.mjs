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
            // DISABLED: Requires explicit return types on ALL functions - too strict for this codebase
            // Would require adding return types to 900+ functions across hundreds of files
            '@typescript-eslint/explicit-function-return-type': 'off',
        },
    },
]);

export default eslintConfig;
