import swaggerJsdoc from 'swagger-jsdoc';
import { NextResponse } from 'next/server';

/**
 * @openapi
 * /api/docs:
 *   get:
 *     summary: OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for the Gebeta Restaurant OS API
 *     tags:
 *       - Documentation
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Gebeta Restaurant OS API',
            version: '1.0.0',
            description:
                'Comprehensive REST API for Gebeta Restaurant OS - A multi-tenant, offline-first restaurant management platform for Addis Ababa, Ethiopia.',
            contact: {
                name: 'Gebeta Support',
                email: 'support@gebeta.app',
            },
            license: {
                name: 'Proprietary',
            },
        },
        servers: [
            {
                url: 'https://gebeta.app/api',
                description: 'Production server',
            },
            {
                url: 'https://staging.gebeta.app/api',
                description: 'Staging server',
            },
            {
                url: 'http://localhost:3000/api',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Supabase JWT token from authentication',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    description: 'Error code',
                                    example: 'VALIDATION_ERROR',
                                },
                                message: {
                                    type: 'string',
                                    description: 'Human-readable error message',
                                    example: 'Invalid request parameters',
                                },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                    },
                                    description: 'Additional error details',
                                },
                            },
                            required: ['code', 'message'],
                        },
                    },
                    required: ['error'],
                },
                Success: {
                    type: 'object',
                    properties: {
                        data: {
                            type: 'object',
                            description: 'Response data',
                        },
                        meta: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer' },
                                limit: { type: 'integer' },
                                total: { type: 'integer' },
                            },
                        },
                    },
                    required: ['data'],
                },
                Order: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Order ID',
                        },
                        restaurant_id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Restaurant ID',
                        },
                        table_id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'Table ID',
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'],
                            description: 'Order status',
                        },
                        total: {
                            type: 'number',
                            description: 'Total order amount in ETB',
                        },
                        items: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/OrderItem',
                            },
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                        },
                    },
                },
                OrderItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        menu_item_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        quantity: {
                            type: 'integer',
                            minimum: 1,
                        },
                        unit_price: {
                            type: 'number',
                        },
                        subtotal: {
                            type: 'number',
                        },
                        notes: {
                            type: 'string',
                        },
                    },
                },
                MenuItem: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        description: {
                            type: 'string',
                        },
                        price: {
                            type: 'number',
                        },
                        category_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        is_available: {
                            type: 'boolean',
                        },
                        image_url: {
                            type: 'string',
                            format: 'uri',
                        },
                    },
                },
                Restaurant: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        name: {
                            type: 'string',
                        },
                        slug: {
                            type: 'string',
                        },
                        currency: {
                            type: 'string',
                            default: 'ETB',
                        },
                        is_active: {
                            type: 'boolean',
                        },
                    },
                },
                Table: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        restaurant_id: {
                            type: 'string',
                            format: 'uuid',
                        },
                        number: {
                            type: 'string',
                        },
                        capacity: {
                            type: 'integer',
                        },
                        status: {
                            type: 'string',
                            enum: ['available', 'occupied', 'reserved'],
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/app/api/**/*.ts'],
};

export async function GET() {
    try {
        const specs = swaggerJsdoc(options);
        return NextResponse.json(specs);
    } catch (error) {
        console.error('Error generating OpenAPI spec:', error);
        return NextResponse.json(
            { error: { code: 'OPENAPI_ERROR', message: 'Failed to generate API documentation' } },
            { status: 500 }
        );
    }
}