#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        stdio: 'inherit',
        shell: false,
        ...options,
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function commandExists(command) {
    const checker = process.platform === 'win32' ? 'where' : 'which';
    const result = spawnSync(checker, [command], { stdio: 'ignore' });
    return result.status === 0;
}

function resolveTrivy() {
    if (commandExists('trivy')) return { command: 'trivy', argsPrefix: [] };

    const localAppData = process.env.LOCALAPPDATA;
    if (localAppData) {
        const wingetPath = join(
            localAppData,
            'Microsoft',
            'WinGet',
            'Packages',
            'AquaSecurity.Trivy_Microsoft.Winget.Source_8wekyb3d8bbwe',
            'trivy.exe'
        );
        if (existsSync(wingetPath)) {
            return { command: wingetPath, argsPrefix: [] };
        }
    }

    return null;
}

function resolveGgshield() {
    if (commandExists('ggshield')) return { command: 'ggshield', argsPrefix: [] };
    if (commandExists('python')) return { command: 'python', argsPrefix: ['-m', 'ggshield'] };
    return null;
}

console.log('Running GitGuardian secret scan (ggshield)...');
const gg = resolveGgshield();
if (!gg) {
    console.error(
        'ggshield is not installed or not on PATH. Install with: python -m pip install --user ggshield'
    );
    process.exit(1);
}
run(gg.command, [...gg.argsPrefix, 'secret', 'scan', 'pre-commit']);

console.log('Running Trivy vulnerability scan...');
const trivy = resolveTrivy();
if (!trivy) {
    console.error(
        'Trivy is not installed or not on PATH. Install with: winget install -e --id AquaSecurity.Trivy'
    );
    process.exit(1);
}
run(trivy.command, [
    ...trivy.argsPrefix,
    'fs',
    'pnpm-lock.yaml',
    '--scanners',
    'vuln',
    '--severity',
    'HIGH,CRITICAL',
    '--exit-code',
    '1',
    '--timeout',
    '30m',
    '--skip-db-update',
]);
