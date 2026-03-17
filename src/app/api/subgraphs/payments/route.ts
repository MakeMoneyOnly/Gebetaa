// Payments Subgraph API Route
// Handles GraphQL requests for the Payments domain
// This is a Federation 2 subgraph

import { NextRequest } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { paymentsResolvers } from '@/domains/payments/resolvers';
import type { GraphQLContext } from '@/lib/graphql/context';
import { createDataLoaders } from '@/lib/graphql/dataloaders';

// Load the payments subgraph schema
const paymentsSchema = readFileSync(
    join(process.cwd(), 'graphql', 'subgraphs', 'payments.graphql'),
    'utf-8'
);

// Create Apollo Server for payments subgraph
const server = new ApolloServer<GraphQLContext>({
    typeDefs: paymentsSchema,
    resolvers: paymentsResolvers,
    introspection: process.env.NODE_ENV !== 'production',
});

// Handler for the payments subgraph
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

export const GET = handler;
export const POST = handler;
