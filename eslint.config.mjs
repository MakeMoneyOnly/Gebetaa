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
            // Existing codebase has broad legacy usage; keep lint actionable for CI gating.
            '@typescript-eslint/no-explicit-any': 'off',
            'react/no-unescaped-entities': 'off',
            'react-hooks/set-state-in-effect': 'off',
        },
    },
]);

export default eslintConfig;
