// GraphQL Context Types
// Types for the GraphQL request context

import { DataLoaders } from './dataloaders';

export interface GraphQLContext {
    token: string | null;
    guestSession: string | null;
    user: {
        id: string;
        restaurantId?: string;
        role?: string;
    } | null;
    /** DataLoaders for N+1 query prevention - created per-request */
    dataLoaders: DataLoaders;
}

export interface StaffContext extends GraphQLContext {
    user: {
        id: string;
        restaurantId: string;
        role: 'owner' | 'admin' | 'manager' | 'kitchen' | 'bar' | 'waiter';
    };
}

export interface GuestContext extends GraphQLContext {
    guestSession: string;
    user: null;
}
