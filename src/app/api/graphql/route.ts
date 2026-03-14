// GraphQL API Route
// Next.js App Router handler for GraphQL queries and mutations
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { readFileSync } from 'fs';
import { join } from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';

import { ordersResolvers } from '@/domains/orders/resolvers';

// Helper to remove federation directives from schema
function stripFederationDirectives(schema: string): string {
    return schema.replace(/extend schema @link.*$/gm, '').replace(/@key\(fields: "[^"]*"\)/g, '');
}

// Load and parse subgraph schemas, stripping federation directives
const ordersSchema = gql(
    stripFederationDirectives(
        readFileSync(join(process.cwd(), 'src/domains/orders/schema.graphql'), 'utf-8')
    )
);

const menuSchema = gql(
    stripFederationDirectives(
        readFileSync(join(process.cwd(), 'src/domains/menu/schema.graphql'), 'utf-8')
    )
);

const paymentsSchema = gql(
    stripFederationDirectives(
        readFileSync(join(process.cwd(), 'src/domains/payments/schema.graphql'), 'utf-8')
    )
);

const guestsSchema = gql(
    stripFederationDirectives(
        readFileSync(join(process.cwd(), 'src/domains/guests/schema.graphql'), 'utf-8')
    )
);

const staffSchema = gql(
    stripFederationDirectives(
        readFileSync(join(process.cwd(), 'src/domains/staff/schema.graphql'), 'utf-8')
    )
);

// Combined typeDefs
const typeDefs = [ordersSchema, menuSchema, paymentsSchema, guestsSchema, staffSchema];

// Combine all resolvers
const resolvers = {
    JSON: {
        __parseValue(value: unknown) {
            return JSON.parse(JSON.stringify(value));
        },
        __serialize(value: unknown) {
            return value;
        },
    },
    Query: {
        ...ordersResolvers.Query,
    },
    Mutation: {
        ...ordersResolvers.Mutation,
    },
    Order: ordersResolvers.Order,
    OrderItem: ordersResolvers.OrderItem,
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
});

const apolloHandler = startServerAndCreateNextHandler<NextRequest>(server, {
    context: async req => {
        // Extract JWT from authorization header
        const authHeader = req.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || null;

        // Extract guest session from header
        const guestSession = req.headers.get('x-guest-session') || null;

        return {
            token,
            guestSession,
            // TODO: Validate token and extract user context
            user: token ? { id: 'user-from-jwt' } : null,
        };
    },
});

// Next.js App Router compatible handler
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        return (await apolloHandler(request)) as NextResponse;
    } catch (error) {
        console.error('GraphQL GET error:', error);
        return NextResponse.json(
            { error: { message: 'GraphQL endpoint error', code: 'GRAPHQL_ERROR' } },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        return (await apolloHandler(request)) as NextResponse;
    } catch (error) {
        console.error('GraphQL POST error:', error);
        return NextResponse.json(
            { error: { message: 'GraphQL endpoint error', code: 'GRAPHQL_ERROR' } },
            { status: 500 }
        );
    }
}
