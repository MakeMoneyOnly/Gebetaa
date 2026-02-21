#!/usr/bin/env node

/**
 * P2 peak-flow load test runner.
 *
 * Usage:
 *   node scripts/load-tests/p2-peak-flows.mjs
 *   LOAD_BASE_URL=http://localhost:3000 node scripts/load-tests/p2-peak-flows.mjs
 *   LOAD_CONCURRENCY=20 LOAD_REQUESTS=300 node scripts/load-tests/p2-peak-flows.mjs
 */

const baseUrl = process.env.LOAD_BASE_URL || 'http://localhost:3000';
const concurrency = Number(process.env.LOAD_CONCURRENCY || 16);
const requestsPerScenario = Number(process.env.LOAD_REQUESTS || 160);
const p95ThresholdMs = Number(process.env.LOAD_P95_THRESHOLD_MS || 1200);
const errorRateThresholdPct = Number(process.env.LOAD_ERROR_RATE_THRESHOLD_PCT || 2);
const failOnThreshold = String(process.env.LOAD_FAIL_ON_THRESHOLD ?? 'true') !== 'false';
const authToken = process.env.LOAD_AUTH_TOKEN || '';

const scenarios = [
    { name: 'Command Center', path: '/api/merchant/command-center?range=today' },
    { name: 'Loyalty Programs', path: '/api/loyalty/programs' },
    { name: 'Gift Cards', path: '/api/gift-cards?limit=100' },
    { name: 'Inventory Variance', path: '/api/inventory/variance?limit=100' },
    { name: 'Finance Reconciliation', path: '/api/finance/reconciliation?limit=100' },
    { name: 'Provider Health', path: '/api/payments/providers/health' },
];

const commonHeaders = {
    'x-e2e-bypass-auth': '1',
};
if (authToken.trim().length > 0) {
    commonHeaders.Authorization = `Bearer ${authToken.trim()}`;
}

function percentile(values, target) {
    if (values.length === 0) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.min(sorted.length - 1, Math.ceil((target / 100) * sorted.length) - 1);
    return sorted[index];
}

async function runScenario(scenario) {
    const latencies = [];
    let successCount = 0;
    let failureCount = 0;

    let nextIndex = 0;
    const startTime = Date.now();

    async function worker() {
        while (true) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= requestsPerScenario) break;

            const requestStartedAt = performance.now();
            try {
                const response = await fetch(`${baseUrl}${scenario.path}`, {
                    method: 'GET',
                    headers: commonHeaders,
                    cache: 'no-store',
                });
                const durationMs = performance.now() - requestStartedAt;
                latencies.push(durationMs);

                if (response.ok) {
                    successCount += 1;
                } else {
                    failureCount += 1;
                }
            } catch {
                const durationMs = performance.now() - requestStartedAt;
                latencies.push(durationMs);
                failureCount += 1;
            }
        }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    const elapsedMs = Date.now() - startTime;

    const total = successCount + failureCount;
    const errorRatePct = total === 0 ? 100 : (failureCount / total) * 100;
    const p50Ms = percentile(latencies, 50);
    const p95Ms = percentile(latencies, 95);
    const p99Ms = percentile(latencies, 99);
    const rps = elapsedMs > 0 ? (total / elapsedMs) * 1000 : 0;

    return {
        name: scenario.name,
        path: scenario.path,
        total,
        successCount,
        failureCount,
        errorRatePct,
        p50Ms,
        p95Ms,
        p99Ms,
        rps,
    };
}

function printSummary(results) {
    console.log('\nP2 Peak-Flow Load Test Results');
    console.log(`Base URL: ${baseUrl}`);
    console.log(
        `Requests per scenario: ${requestsPerScenario}, Concurrency: ${concurrency}, P95 threshold: ${p95ThresholdMs}ms, Error threshold: ${errorRateThresholdPct}%\n`
    );
    if (!authToken.trim()) {
        console.log(
            'Note: LOAD_AUTH_TOKEN is not set; protected endpoints may return 401/403 and fail the run.\n'
        );
    }

    for (const result of results) {
        const status =
            result.p95Ms <= p95ThresholdMs && result.errorRatePct <= errorRateThresholdPct
                ? 'PASS'
                : 'FAIL';
        console.log(
            `${status} ${result.name} (${result.path})\n` +
                `  total=${result.total} success=${result.successCount} fail=${result.failureCount} ` +
                `error=${result.errorRatePct.toFixed(2)}% ` +
                `p50=${result.p50Ms.toFixed(1)}ms p95=${result.p95Ms.toFixed(1)}ms p99=${result.p99Ms.toFixed(1)}ms ` +
                `rps=${result.rps.toFixed(1)}`
        );
    }

    const failed = results.filter(
        result => result.p95Ms > p95ThresholdMs || result.errorRatePct > errorRateThresholdPct
    );
    if (failed.length === 0) {
        console.log('\nOverall: PASS');
        return true;
    }

    console.log('\nOverall: FAIL');
    console.log('Failed scenarios:');
    for (const result of failed) {
        console.log(
            `  - ${result.name} (p95=${result.p95Ms.toFixed(1)}ms, error=${result.errorRatePct.toFixed(2)}%)`
        );
    }
    return false;
}

async function main() {
    console.log('Running P2 peak-flow load test scenarios...');
    const results = [];
    for (const scenario of scenarios) {
        process.stdout.write(`- ${scenario.name} ... `);
        const result = await runScenario(scenario);
        results.push(result);
        process.stdout.write('done\n');
    }

    const passed = printSummary(results);
    if (!passed && failOnThreshold) {
        process.exit(1);
    }
}

await main();
