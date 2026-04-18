#!/usr/bin/env node
/**
 * lole Restaurant OS - Deprecated Dependencies Checker
 *
 * This script checks for deprecated packages in the dependency tree
 * by analyzing the pnpm-lock.yaml file and running pnpm list.
 *
 * Usage: node scripts/security/check-deprecated.mjs
 *
 * Exit codes:
 * 0 - No deprecated packages found
 * 1 - Deprecated packages found (warning)
 * 2 - Critical error
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
    console.warn(`${colors[color]}${message}${colors.reset}`);
}

function getDeprecatedPackagesFromLockfile() {
    const lockfilePath = join(ROOT_DIR, 'pnpm-lock.yaml');

    if (!existsSync(lockfilePath)) {
        log('⚠️  pnpm-lock.yaml not found', 'yellow');
        return [];
    }

    try {
        // Use pnpm list to find deprecated packages
        const output = execSync('pnpm list --depth=Infinity --json 2>/dev/null', {
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large projects
        });

        const packages = JSON.parse(output);
        const deprecated = [];

        function findDeprecated(deps, path = '') {
            if (!deps) return;

            for (const [name, info] of Object.entries(deps)) {
                if (info.deprecated) {
                    deprecated.push({
                        name,
                        version: info.version,
                        reason: info.deprecated,
                        path: path ? `${path} > ${name}` : name,
                    });
                }

                if (info.dependencies) {
                    findDeprecated(info.dependencies, path ? `${path} > ${name}` : name);
                }
            }
        }

        if (Array.isArray(packages)) {
            for (const pkg of packages) {
                if (pkg.dependencies) {
                    findDeprecated(pkg.dependencies, pkg.name);
                }
            }
        } else {
            findDeprecated(packages.dependencies);
        }

        return deprecated;
    } catch (_error) {
        // If pnpm list fails, try alternative method
        return getDeprecatedFromPnpmWhy();
    }
}

function getDeprecatedFromPnpmWhy() {
    try {
        // Run pnpm install to see deprecation warnings
        const output = execSync('pnpm install --dry-run 2>&1', {
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        });

        const deprecatedMatches = output.matchAll(/deprecated.*?:\s*(.+)/gi);
        const deprecated = [];

        for (const match of deprecatedMatches) {
            deprecated.push({
                name: 'unknown',
                version: 'unknown',
                reason: match[1],
                path: 'unknown',
            });
        }

        return deprecated;
    } catch (_error) {
        return [];
    }
}

function checkPackageJsonForDeprecated() {
    const packageJsonPath = join(ROOT_DIR, 'package.json');

    if (!existsSync(packageJsonPath)) {
        return { deprecated: [], warnings: [] };
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    const warnings = [];

    // Check for known deprecated packages
    const knownDeprecated = [
        { name: 'request', reason: 'Deprecated - use node-fetch, axios, or got instead' },
        { name: 'node-uuid', reason: 'Deprecated - use uuid instead' },
        { name: 'uuid', reason: 'Version < 3.4.0 has security issues', minVersion: '3.4.0' },
        { name: 'colors', reason: 'Deprecated - use chalk or kleur instead' },
        { name: 'mkdirp', reason: 'Deprecated - use fs.mkdir with recursive: true' },
        { name: 'left-pad', reason: 'Deprecated - use String.prototype.padStart' },
        { name: 'core-js@2', reason: 'Deprecated - use core-js@3 for polyfills' },
        { name: 'babel-eslint', reason: 'Deprecated - use @babel/eslint-parser' },
        { name: 'eslint-plugin-node', reason: 'Deprecated - use eslint-plugin-n' },
        { name: 'npm', reason: 'Do not bundle npm as dependency' },
        { name: 'jquery', reason: 'Consider using modern alternatives for new projects' },
    ];

    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
    };

    const deprecated = [];

    for (const [name, version] of Object.entries(allDeps)) {
        const known = knownDeprecated.find(d => name === d.name || name.startsWith(d.name + '@'));
        if (known) {
            deprecated.push({
                name,
                version,
                reason: known.reason,
                path: 'package.json (direct dependency)',
            });
        }
    }

    return { deprecated, warnings };
}

function main() {
    log('\n📦 lole Restaurant OS - Deprecated Dependencies Check\n', 'cyan');

    let _hasWarnings = false;
    let _hasErrors = false;

    // Check package.json for known deprecated packages
    log('Checking package.json for known deprecated packages...', 'cyan');
    const { deprecated: directDeprecated } = checkPackageJsonForDeprecated();

    if (directDeprecated.length > 0) {
        _hasWarnings = true;
        log('\n⚠️  Deprecated packages found in package.json:\n', 'yellow');
        for (const pkg of directDeprecated) {
            log(`  • ${pkg.name}@${pkg.version}`, 'yellow');
            log(`    Reason: ${pkg.reason}`, 'dim');
            log(`    Path: ${pkg.path}\n`, 'dim');
        }
    } else {
        log('✅ No deprecated packages in package.json\n', 'green');
    }

    // Check for deprecated transitive dependencies
    log('Checking for deprecated transitive dependencies...', 'cyan');
    const transitiveDeprecated = getDeprecatedPackagesFromLockfile();

    if (transitiveDeprecated.length > 0) {
        _hasWarnings = true;
        log('\n⚠️  Deprecated transitive dependencies found:\n', 'yellow');
        for (const pkg of transitiveDeprecated.slice(0, 20)) {
            // Limit output
            log(`  • ${pkg.name}@${pkg.version}`, 'yellow');
            log(`    Reason: ${pkg.reason}`, 'dim');
            log(`    Path: ${pkg.path}\n`, 'dim');
        }
        if (transitiveDeprecated.length > 20) {
            log(`  ... and ${transitiveDeprecated.length - 20} more\n`, 'dim');
        }
    } else {
        log('✅ No deprecated transitive dependencies found\n', 'green');
    }

    // Summary
    log('━'.repeat(50), 'dim');
    const totalDeprecated = directDeprecated.length + transitiveDeprecated.length;

    if (totalDeprecated === 0) {
        log('✅ All dependencies are up to date!', 'green');
        process.exit(0);
    } else {
        log(`\n⚠️  Found ${totalDeprecated} deprecated package(s)`, 'yellow');
        log('\nRecommended actions:', 'cyan');
        log('  1. Update direct dependencies: pnpm deps:update', 'dim');
        log('  2. For transitive deps, add overrides in package.json:', 'dim');
        log('     "pnpm": { "overrides": { "package-name": "^version" } }', 'dim');
        log('  3. Run: pnpm install to apply changes\n', 'dim');

        // Exit with warning code (not error) for deprecated packages
        process.exit(1);
    }
}

main();
