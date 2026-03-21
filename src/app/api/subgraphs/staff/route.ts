// Staff Subgraph API Route
// Handles GraphQL requests for the Staff domain
// This is a Federation 2 subgraph

import { NextRequest } from 'next/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { staffResolvers } from '@/domains/staff/resolvers';
import type { GraphQLContext } from '@/lib/graphql/context';
import { createDataLoaders } from '@/lib/graphql/dataloaders';
import { createSubgraphServer } from '@/lib/graphql/apollo-config';

// Load the staff subgraph schema
const staffSchema = readFileSync(
    join(process.cwd(), 'graphql', 'subgraphs', 'staff.graphql'),
    'utf-8'
);

// Create Apollo Server for staff subgraph with shared security configuration
const server = createSubgraphServer({
    typeDefs: staffSchema,
    resolvers: staffResolvers,
});

// Handler for the staff subgraph
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
    context: async (req: NextRequest): Promise<GraphQLContext> => {
        // Create fresh DataLoaders for this request (prevents cache leakage)
        const dataLoaders = createDataLoaders();

        const userId = req.headers.get('x-user-id');
        const userRole = req.headers.get('x-user-role');
        const restaurantId = req.headers.get('x-restaurant-id');
        const guestSession = req.headers.get('x-guest-session');
        const authHeader = req.headers.get('authorization');

        if (guestSession) {
            return {
                token: authHeader?.replace('Bearer ', '') || null,
                guestSession,
                user: null,
                dataLoaders,
            };
        }

        if (userId && restaurantId) {
            return {
                token: authHeader?.replace('Bearer ', '') || null,
                guestSession: null,
                user: {
                    id: userId,
                    restaurantId,
                    role: userRole || undefined,
                },
                dataLoaders,
            };
        }

        return {
            token: null,
            guestSession: null,
            user: null,
            dataLoaders,
        };
    },
});

export async function GET(request: NextRequest) {
    return handler(request);
}

export async function POST(request: NextRequest) {
    return handler(request);
}
