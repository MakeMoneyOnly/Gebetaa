// GraphQL API Route
// Note: This endpoint is disabled in development.
// For production, use Apollo Router (see router/ directory).
// Federation schemas are in graphql/subgraphs/ and published via CI.

import { NextRequest, NextResponse } from 'next/server';

// Disabled - GraphQL federation is handled by Apollo Router
// The subgraph schemas are in graphql/subgraphs/ and published to Apollo GraphOS
export async function GET(_request: NextRequest): Promise<NextResponse> {
    return NextResponse.json(
        {
            error: {
                message: 'GraphQL API is disabled. Use Apollo Router for production.',
                code: 'GRAPHQL_DISABLED',
                docs: 'See router/ directory for Apollo Router configuration',
            },
        },
        { status: 503 }
    );
}

export async function POST(_request: NextRequest): Promise<NextResponse> {
    return NextResponse.json(
        {
            error: {
                message: 'GraphQL API is disabled. Use Apollo Router for production.',
                code: 'GRAPHQL_DISABLED',
                docs: 'See router/ directory for Apollo Router configuration',
            },
        },
        { status: 503 }
    );
}
