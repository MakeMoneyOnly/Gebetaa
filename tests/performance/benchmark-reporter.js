/**
 * Benchmark Report Generator
 * Reads k6 JSON output and generates a markdown report
 *
 * Usage:
 *   k6 run --out json=results.json slo-validation.js
 *   node benchmark-reporter.js --input results.json --output report.md
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--') && i + 1 < args.length) {
            parsed[args[i].substring(2)] = args[i + 1];
            i++;
        }
    }
    return parsed;
}

function loadResults(filePath) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    const metrics = {};

    for (const line of lines) {
        try {
            const entry = JSON.parse(line);
            if (entry.type === 'Point' && entry.metric) {
                if (!metrics[entry.metric]) metrics[entry.metric] = [];
                metrics[entry.metric].push(entry.data);
            }
        } catch {
            /* skip invalid lines */
        }
    }

    return metrics;
}

function calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

function generateReport(metrics) {
    const sloTargets = {
        command_center_duration: { p95: 500, name: 'GET /api/merchant/command-center' },
        orders_duration: { p95: 400, name: 'GET /api/orders' },
        order_status_duration: { p95: 300, name: 'PATCH /api/orders/:id/status' },
    };

    let report = '# Performance SLO Validation Report\n\n';
    report += `**Date**: ${new Date().toISOString().split('T')[0]}\n`;
    report += `**Environment**: ${process.env.BASE_URL || 'http://localhost:3000'}\n\n`;

    report += '## SLO Results\n\n';
    report += '| Endpoint | P50 | P95 | P99 | SLO Target | Status |\n';
    report += '|----------|-----|-----|-----|------------|--------|\n';

    for (const [metric, config] of Object.entries(sloTargets)) {
        const values = (metrics[metric] || []).map(d => d.value);
        if (values.length === 0) {
            report += `| ${config.name} | — | — | — | ${config.p95}ms | ⚠️ No data |\n`;
            continue;
        }
        const p50 = Math.round(calculatePercentile(values, 50));
        const p95 = Math.round(calculatePercentile(values, 95));
        const p99 = Math.round(calculatePercentile(values, 99));
        const status = p95 <= config.p95 ? '✅ Pass' : '❌ Fail';
        report += `| ${config.name} | ${p50}ms | ${p95}ms | ${p99}ms | ${config.p95}ms | ${status} |\n`;
    }

    const errorValues = (metrics['error_rate'] || []).map(d => d.value);
    const errorRate =
        errorValues.length > 0
            ? ((errorValues.reduce((a, b) => a + b, 0) / errorValues.length) * 100).toFixed(2)
            : '0.00';
    const errorStatus = parseFloat(errorRate) < 1 ? '✅ Pass' : '❌ Fail';
    report += `| Error Rate | — | — | — | < 1% | ${errorStatus} (${errorRate}%) |\n`;

    report += '\n## Summary\n\n';
    report += `All SLOs met: ${report.includes('❌') ? 'No' : 'Yes'}\n`;

    return report;
}

const args = parseArgs();
const inputPath = args.input || 'results.json';
const outputPath = args.output || 'slo-report.md';

if (!fs.existsSync(inputPath)) {
    console.error(`Input file not found: ${inputPath}`);
    process.exit(1);
}

const metrics = loadResults(inputPath);
const report = generateReport(metrics);
fs.writeFileSync(outputPath, report, 'utf8');
console.log(`Report generated: ${outputPath}`);
