/**
 * API Documentation Route
 * Serves OpenAPI specification for the API
 */

import { apiSuccess } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
    const openApiSpec = {
        openapi: '3.1.0',
        info: {
            title: 'Gebeta Restaurant OS API',
            version: '1.0.0',
            description: 'Enterprise-grade restaurant operating system API for Ethiopia',
        },
        servers: [
            {
                url: '/api',
                description: 'API Server',
            },
        ],
        paths: {
            '/health': {
                get: {
                    summary: 'Health check endpoint',
                    tags: ['System'],
                    responses: {
                        '200': {
                            description: 'System health status',
                        },
                    },
                },
            },
            '/orders': {
                get: {
                    summary: 'List orders',
                    tags: ['Orders'],
                    responses: {
                        '200': {
                            description: 'List of orders',
                        },
                    },
                },
                post: {
                    summary: 'Create a new order',
                    tags: ['Orders'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['items'],
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    responses: {
                        '201': {
                            description: 'Order created',
                        },
                    },
                },
            },
            '/menu': {
                get: {
                    summary: 'Get menu items',
                    tags: ['Menu'],
                    responses: {
                        '200': {
                            description: 'Menu items',
                        },
                    },
                },
            },
            '/restaurant/{slug}': {
                get: {
                    summary: 'Get restaurant by slug',
                    tags: ['Restaurant'],
                    parameters: [
                        {
                            name: 'slug',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    responses: {
                        '200': {
                            description: 'Restaurant details',
                        },
                        '404': {
                            description: 'Restaurant not found',
                        },
                    },
                },
            },
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                },
                deviceToken: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-Device-Token',
                },
            },
        },
    };

    return apiSuccess(openApiSpec);
}
