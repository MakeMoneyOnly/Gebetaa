// Guests Subgraph API Route
// Handles GraphQL requests for the Guests domain
// This is a Federation 2 subgraph

import { NextRequest } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { guestsResolvers } from '@/domains/guests/resolvers';
import type { GraphQLContext } from '@/lib/graphql/context';

// Load the guests subgraph schema
const guestsSchema = readFileSync(
    join(process.cwd(), 'graphql', 'subgraphs', 'guests.graphql'),
    'utf-8'
);

// Create Apollo Server for guests subgraph
const server = new ApolloServer<GraphQLContext>({
    typeDefs: guestsSchema,
    resolvers: guestsResolvers,
    introspection: process.env.NODE_ENV !== 'production',
});

// Handler for the guests subgraph
const handler = startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
    context: async (req: NextRequest): Promise<GraphQLContext> => {
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
            };
        }

        return {
            token: null,
            guestSession: null,
            user: null,
        };
    },
});

export const GET = handler;
export const POST = handler;
