// GraphQL Context Types
// Types for the GraphQL request context

export interface GraphQLContext {
    token: string | null;
    guestSession: string | null;
    user: {
        id: string;
        restaurantId?: string;
        role?: string;
    } | null;
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
