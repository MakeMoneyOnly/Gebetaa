// Shared utility for creating GraphQL subgraph handlers
// Reduces boilerplate for individual subgraph routes

import { NextRequest } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import type { GraphQLContext } from './context';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ResolversType = Record<string, any>;

export interface SubgraphConfig {
    typeDefs: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: Record<string, any>;
}

/**
 * Creates a Next.js API handler for a GraphQL subgraph
 */
export function createSubgraphHandler(config: SubgraphConfig) {
    const server = new ApolloServer<GraphQLContext>({
        typeDefs: config.typeDefs,
        resolvers: config.resolvers,
        introspection: process.env.NODE_ENV !== 'production',
    });

    return startServerAndCreateNextHandler<NextRequest, GraphQLContext>(server, {
        context: async (req: NextRequest): Promise<GraphQLContext> => {
            // Extract user info from headers (set by Apollo Router)
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
}
