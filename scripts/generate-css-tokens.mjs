#!/usr/bin/env node
/**
 * Generate CSS Custom Properties from design/tokens.json
 *
 * This script reads the canonical design tokens from design/tokens.json
 * and generates CSS custom properties for use in globals.css.
 *
 * Usage: node scripts/generate-css-tokens.mjs
 *
 * The output is written to stdout and can be piped into a CSS file or
 * copied manually to globals.css.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read tokens from JSON file
const tokensPath = join(__dirname, '../design/tokens.json');
const tokens = JSON.parse(readFileSync(tokensPath, 'utf-8'));

/**
 * Convert a token path to a CSS custom property name
 * e.g., { "color": { "bg": { "surface": { "0": ... } } } } => --color-bg-surface-0
 */
function pathToCssName(path) {
    return path.join('-').toLowerCase();
}

/**
 * Flatten nested token object into an array of [path, value] pairs
 */
function flattenTokens(obj, path = []) {
    const result = [];

    for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key];

        // Check if this is a leaf node with a $value property (Design Tokens Format)
        if (value && typeof value === 'object') {
            if ('$value' in value) {
                // This is a token value
                result.push([currentPath, value.$value]);
            } else {
                // Recurse into nested object
                result.push(...flattenTokens(value, currentPath));
            }
        }
    }

    return result;
}

/**
 * Generate CSS custom property declaration
 */
function generateCssProperty(path, value) {
    const name = pathToCssName(path);
    return `    --${name}: ${value};`;
}

/**
 * Generate all CSS custom properties from tokens
 */
function generateCss() {
    const flatTokens = flattenTokens(tokens);

    // Group tokens by category for better organization
    const categories = {
        color: [],
        typography: [],
        spacing: [],
        'border-radius': [],
        shadow: [],
        breakpoint: [],
        transition: [],
        'z-index': [],
    };

    const uncategorized = [];

    for (const [path, value] of flatTokens) {
        const category = path[0];
        if (categories[category]) {
            categories[category].push([path, value]);
        } else {
            uncategorized.push([path, value]);
        }
    }

    let output = `/**
 * DESIGN TOKENS - AUTO-GENERATED
 * Source: design/tokens.json
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT DIRECTLY - Update design/tokens.json and re-run:
 * node scripts/generate-css-tokens.mjs
 */

:root {
`;

    // Generate each category
    for (const [categoryName, tokens] of Object.entries(categories)) {
        if (tokens.length === 0) continue;

        output += `\n    /* ═══════════════════════════════════════════════════════════════\n`;
        output += `     * ${categoryName.toUpperCase()}\n`;
        output += `     * ═══════════════════════════════════════════════════════════════ */\n`;

        for (const [path, value] of tokens) {
            output += generateCssProperty(path, value) + '\n';
        }
    }

    // Add uncategorized tokens
    if (uncategorized.length > 0) {
        output += `\n    /* ═══════════════════════════════════════════════════════════════\n`;
        output += `     * OTHER\n`;
        output += `     * ═══════════════════════════════════════════════════════════════ */\n`;

        for (const [path, value] of uncategorized) {
            output += generateCssProperty(path, value) + '\n';
        }
    }

    output += `}\n`;

    return output;
}

// Run the generator
console.log(generateCss());
