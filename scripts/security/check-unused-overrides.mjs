#!/usr/bin/env node
/**
 * Gebeta Restaurant OS - Unused Overrides Checker
 *
 * This script checks for unused pnpm overrides in package.json.
 * Overrides that no longer apply to any dependency should be removed.
 *
 * Usage: node scripts/security/check-unused-overrides.mjs
 *
 * Exit codes:
 * 0 - All overrides are in use
 * 1 - Unused overrides found
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT_DIR = process.cwd();

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function getPackageJson() {
    const packageJsonPath = join(ROOT_DIR, 'package.json');
    if (!existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
    }
    return JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
}

function _getInstalledVersions(packageName) {
    try {
        const output = execSync(`pnpm list ${packageName} --depth=Infinity --json 2>/dev/null`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        const packages = JSON.parse(output);
        const versions = new Set();

        function extractVersions(deps, depth = 0) {
            if (!deps) return;
            for (const [name, info] of Object.entries(deps)) {
                if (name === packageName || name.startsWith(packageName + '@')) {
                    versions.add(info.version);
                }
                if (info.dependencies) {
                    extractVersions(info.dependencies, depth + 1);
                }
            }
        }

        if (Array.isArray(packages)) {
            for (const pkg of packages) {
                extractVersions(pkg.dependencies);
            }
        } else {
            extractVersions(packages.dependencies);
        }

        return Array.from(versions);
    } catch (_error) {
        return [];
    }
}

function parseOverrideKey(key) {
    // Handle patterns like "minimatch@<3.1.3" or "minimatch@>=5.0.0 <5.1.7"
    const match = key.match(/^(@?[^@]+)@?(.*)$/);
    if (match) {
        return {
            packageName: match[1],
            versionRange: match[2] || '*',
        };
    }
    return { packageName: key, versionRange: '*' };
}

function checkOverrideInUse(overrideKey, _overrideValue) {
    const { packageName, versionRange: _versionRange } = parseOverrideKey(overrideKey);

    // Check if the package exists in the dependency tree
    try {
        const output = execSync(`pnpm why ${packageName} --json 2>/dev/null`, {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        if (output.includes(packageName)) {
            return { inUse: true, reason: 'Package found in dependency tree' };
        }
    } catch (_error) {
        // pnpm why failed - package might not be installed
    }

    // Check if it's a direct dependency
    const packageJson = getPackageJson();
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    if (allDeps[packageName]) {
        return { inUse: true, reason: 'Direct dependency' };
    }

    return { inUse: false, reason: 'Package not found in dependency tree' };
}

function main() {
    log('\n📦 Gebeta Restaurant OS - Unused Overrides Checker\n', 'cyan');

    const packageJson = getPackageJson();
    const overrides = packageJson.pnpm?.overrides || {};

    if (Object.keys(overrides).length === 0) {
        log('✅ No overrides defined in package.json\n', 'green');
        process.exit(0);
    }

    log(`Checking ${Object.keys(overrides).length} override(s)...\n`, 'cyan');

    const unusedOverrides = [];
    const usedOverrides = [];

    for (const [key, value] of Object.entries(overrides)) {
        const result = checkOverrideInUse(key, value);

        if (result.inUse) {
            usedOverrides.push({ key, value, reason: result.reason });
            log(`  ✅ ${key} -> ${value}`, 'green');
            log(`     ${result.reason}`, 'dim');
        } else {
            unusedOverrides.push({ key, value, reason: result.reason });
            log(`  ⚠️  ${key} -> ${value}`, 'yellow');
            log(`     ${result.reason}`, 'dim');
        }
    }

    // Summary
    log('\n' + '━'.repeat(50), 'dim');

    if (unusedOverrides.length === 0) {
        log(`\n✅ All ${usedOverrides.length} override(s) are in use!`, 'green');
        process.exit(0);
    } else {
        log(`\n⚠️  Found ${unusedOverrides.length} unused override(s):`, 'yellow');
        for (const { key, value } of unusedOverrides) {
            log(`  • ${key}: "${value}"`, 'yellow');
        }

        log('\nRecommended action:', 'cyan');
        log('Remove unused overrides from package.json:', 'dim');
        log('"pnpm": { "overrides": { ... } }', 'dim');
        log('\nNote: Some overrides may be intentionally kept for:', 'dim');
        log('  - Security patches for future versions', 'dim');
        log('  - Known vulnerable version ranges', 'dim');
        log('  - Compatibility fixes\n', 'dim');

        process.exit(1);
    }
}

main();
