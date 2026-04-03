#!/usr/bin/env tsx
/**
 * CI Check: Detect migration timestamp conflicts
 *
 * Ensures no two migration files share the same timestamp prefix.
 * This prevents undefined execution order in Supabase migrations.
 *
 * Exit codes:
 *   0 - No conflicts
 *   1 - Conflicts found
 *
 * @see PRE-PRODUCTION-REMEDIATION-TASKS.md HIGH-004
 */

import { readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');

interface Conflict {
    prefix: string;
    files: string[];
}

function extractTimestamp(filename: string): string | null {
    const match = filename.match(/^(\d{8,14})/);
    return match ? match[1] : null;
}

function checkMigrationConflicts(): Conflict[] {
    const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));

    const prefixMap = new Map<string, string[]>();

    for (const file of files) {
        const prefix = extractTimestamp(file);
        if (!prefix) continue;

        const datePrefix = prefix.slice(0, 8);

        if (!prefixMap.has(datePrefix)) {
            prefixMap.set(datePrefix, []);
        }
        prefixMap.get(datePrefix)!.push(file);
    }

    const conflicts: Conflict[] = [];

    for (const [prefix, files] of prefixMap) {
        if (files.length > 1) {
            const fullTimestamps = new Set(files.map(f => extractTimestamp(f)));
            if (fullTimestamps.size < files.length) {
                conflicts.push({ prefix, files });
            }
        }
    }

    return conflicts;
}

const conflicts = checkMigrationConflicts();

if (conflicts.length === 0) {
    console.log('✅ No migration timestamp conflicts found');
    process.exit(0);
}

console.error('❌ Migration timestamp conflicts detected:\n');

for (const conflict of conflicts) {
    console.error(`  Prefix ${conflict.prefix}:`);
    for (const file of conflict.files) {
        console.error(`    - ${file}`);
    }
    console.error('');
}

console.error('Fix by renaming files to have unique timestamps.');
console.error('Example: 20260324000000_file.sql → 20260324000001_file.sql');

process.exit(1);
