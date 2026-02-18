function parseCsv(value: string): string[] {
    return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

export function isPilotRolloutEnabled(): boolean {
    return String(process.env.ENABLE_P0_PILOT_ROLLOUT ?? 'false').toLowerCase() === 'true';
}

export function isPilotMutationBlockEnabled(): boolean {
    return String(process.env.PILOT_BLOCK_MUTATIONS ?? 'false').toLowerCase() === 'true';
}

export function getPilotRestaurantAllowlist(): Set<string> {
    return new Set(parseCsv(process.env.PILOT_RESTAURANT_IDS ?? ''));
}

export function isRestaurantInPilotCohort(restaurantId: string): boolean {
    const allowlist = getPilotRestaurantAllowlist();
    return allowlist.has(restaurantId);
}
