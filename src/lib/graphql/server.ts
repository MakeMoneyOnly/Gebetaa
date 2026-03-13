// Apollo Server Configuration for Gebeta GraphQL API
// Subgraph mode - serves all domain schemas federated
import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Import resolvers from domains
import { ordersResolvers } from '@/domains/orders/resolvers';
// import { menuResolvers } from '@/domains/menu/resolvers';
// import { paymentsResolvers } from '@/domains/payments/resolvers';
// import { guestsResolvers } from '@/domains/guests/resolvers';
// import { staffResolvers } from '@/domains/staff/resolvers';

// Load subgraph schemas
const ordersSchema = readFileSync(
    join(process.cwd(), 'src/domains/orders/schema.graphql'),
    'utf-8'
);

const menuSchema = readFileSync(join(process.cwd(), 'src/domains/menu/schema.graphql'), 'utf-8');

const paymentsSchema = readFileSync(
    join(process.cwd(), 'src/domains/payments/schema.graphql'),
    'utf-8'
);

const guestsSchema = readFileSync(
    join(process.cwd(), 'src/domains/guests/schema.graphql'),
    'utf-8'
);

const staffSchema = readFileSync(join(process.cwd(), 'src/domains/staff/schema.graphql'), 'utf-8');

// Combined typeDefs for federated graph
const typeDefs = [
    ordersSchema,
    menuSchema,
    paymentsSchema,
    guestsSchema,
    staffSchema,
    `
  scalar JSON
  
  type Query {
    _empty: String
  }
  
  type Mutation {
    _empty: String
  }
  
  type Subscription {
    _empty: String
  }
  `,
];

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

export async function createApolloServer() {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        introspection: true,
    });

    await server.start();

    return server;
}
