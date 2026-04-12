#!/usr/bin/env node

/**
 * post-merge + post-checkout hook helper.
 * Enforces repository-wide git config that makes --no-verify harder to use.
 * Run via: node scripts/security/enforce-hooks.mjs
 *
 * This does NOT replace server-side enforcement (CI is the real gate).
 * It makes local bypasses inconvenient enough that devs use hooks instead.
 */

import { spawnSync } from 'node:child_process';

const REQUIRED_CONFIG = {
    'core.hooksPath': '.husky',
};

function getGitConfig(key) {
    const result = spawnSync('git', ['config', '--local', key], {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.stdout.trim();
}

function setGitConfig(key, value) {
    spawnSync('git', ['config', '--local', key, value], { stdio: 'inherit' });
}

console.warn('🔒 Enforcing hook configuration...');

for (const [key, expectedValue] of Object.entries(REQUIRED_CONFIG)) {
    const current = getGitConfig(key);
    if (current !== expectedValue) {
        console.warn(`   Setting ${key} = ${expectedValue}`);
        setGitConfig(key, expectedValue);
    }
}

// Disable git push --no-verify by aliasing push to always use --verify
const pushAlias = getGitConfig('alias.push');
if (!pushAlias) {
    console.warn('   Setting alias.push = push --verify');
    setGitConfig('alias.push', 'push --verify');
}

console.warn('✅ Hook configuration enforced. CI is the real gate — hooks are defense-in-depth.');
