/**
 * API Documentation Route
 * Serves OpenAPI 3.1 specification for the lole Restaurant OS API
 *
 * This documentation covers:
 * - Order management endpoints
 * - Payment processing endpoints
 * - Guest management endpoints
 * - Menu item endpoints
 * - Health check endpoints
 */

import { apiSuccess } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

/**
 * OpenAPI Specification for lole Restaurant OS
 */
const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'lole Restaurant OS API',
        version: '1.0.0',
        description: `
## Overview
Enterprise-grade restaurant operating system API for Ethiopia ("Toast for Addis Ababa").

## Authentication
The API supports multiple authentication methods:
- **Bearer Token**: JWT token from Supabase Auth (header: \`Authorization: Bearer <token>\`)
- **Device Token**: For kiosk/terminal devices (header: \`X-Device-Token\`)
- **Guest Context**: HMAC-signed QR code for guest ordering (includes \`sig\`, \`exp\` in request)

## Rate Limiting
- **Payment endpoints**: 10 requests/minute per restaurant
- **Order endpoints**: 60 requests/minute per restaurant
- **General endpoints**: 120 requests/minute per restaurant
- Rate limit headers: \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\`, \`X-RateLimit-Reset\`

## Error Responses
All endpoints return consistent error responses:
- \`400\`: Bad Request - Invalid input parameters
- \`401\`: Unauthorized - Missing or invalid authentication
- \`403\`: Forbidden - Insufficient permissions
- \`404\`: Not Found - Resource not found
- \`429\`: Too Many Requests - Rate limit exceeded
- \`500\`: Internal Server Error - Server-side error

## Idempotency
Mutating endpoints (POST, PUT, PATCH) support idempotency keys via the \`X-Idempotency-Key\` header.
This prevents duplicate operations when network errors occur.

## Currency
All monetary values are in Ethiopian Birr (ETB).
        `.trim(),
        contact: {
            name: 'lole Support',
            email: 'support@lole.app',
        },
        license: {
            name: 'Proprietary',
            url: 'https://lole.app/terms',
        },
    },
    servers: [
        {
            url: '/api',
            description: 'API Server',
        },
    ],
    tags: [
        { name: 'Health', description: 'System health and monitoring endpoints' },
        { name: 'Orders', description: 'Order management and lifecycle' },
        { name: 'Payments', description: 'Payment processing and verification' },
        { name: 'Guests', description: 'Guest profile and visit management' },
        { name: 'Menu', description: 'Menu items and categories' },
        { name: 'Restaurant', description: 'Restaurant information and settings' },
    ],
    paths: {
        '/health': {
            get: {
                summary: 'Health check endpoint',
                description: `
Provides comprehensive health status for monitoring and observability.

Monitors:
- Database connectivity (Supabase)
- Redis connectivity (Upstash)
- QStash availability (job queue)
- Environment configuration

Used by Better Uptime for monitoring with Telegram alerting on non-200.
                `.trim(),
                tags: ['Health'],
                responses: {
                    '200': {
                        description: 'System is healthy',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            enum: ['healthy', 'unhealthy', 'degraded'],
                                        },
                                        timestamp: { type: 'string', format: 'date-time' },
                                        version: { type: 'string' },
                                        uptime: { type: 'number' },
                                        checks: {
                                            type: 'object',
                                            properties: {
                                                database: {
                                                    type: 'object',
                                                    properties: {
                                                        status: {
                                                            type: 'string',
                                                            enum: ['pass', 'fail'],
                                                        },
                                                        latencyMs: { type: 'number' },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                                redis: {
                                                    type: 'object',
                                                    properties: {
                                                        status: {
                                                            type: 'string',
                                                            enum: [
                                                                'pass',
                                                                'fail',
                                                                'not_configured',
                                                            ],
                                                        },
                                                        latencyMs: { type: 'number' },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                                supabase: {
                                                    type: 'object',
                                                    properties: {
                                                        status: {
                                                            type: 'string',
                                                            enum: ['pass', 'fail'],
                                                        },
                                                        latencyMs: { type: 'number' },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                                qstash: {
                                                    type: 'object',
                                                    properties: {
                                                        status: {
                                                            type: 'string',
                                                            enum: [
                                                                'pass',
                                                                'fail',
                                                                'not_configured',
                                                            ],
                                                        },
                                                        latencyMs: { type: 'number' },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                                environment: {
                                                    type: 'object',
                                                    properties: {
                                                        status: {
                                                            type: 'string',
                                                            enum: ['pass', 'fail'],
                                                        },
                                                        message: { type: 'string' },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/orders': {
            get: {
                summary: 'List orders',
                description:
                    "Retrieve a paginated list of orders for the authenticated user's restaurant",
                tags: ['Orders'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'status',
                        schema: { type: 'string' },
                        description:
                            'Filter by order status (e.g., "pending", "preparing", "ready", "completed", "cancelled")',
                    },
                    {
                        in: 'query',
                        name: 'search',
                        schema: { type: 'string' },
                        description: 'Search by table number, order number, or customer name',
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 50, maximum: 200 },
                        description: 'Maximum number of orders to return',
                    },
                    {
                        in: 'query',
                        name: 'offset',
                        schema: { type: 'integer', default: 0 },
                        description: 'Number of orders to skip for pagination',
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of orders',
                        headers: {
                            'X-RateLimit-Limit': { schema: { type: 'integer' } },
                            'X-RateLimit-Remaining': { schema: { type: 'integer' } },
                        },
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                orders: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Order' },
                                                },
                                                total: { type: 'integer' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            post: {
                summary: 'Create a new order',
                description: 'Create a new order from guest context with HMAC-validated QR code',
                tags: ['Orders'],
                security: [{ guestContext: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/IdempotencyKey',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateOrderRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Order created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                order: { $ref: '#/components/schemas/Order' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '429': { $ref: '#/components/responses/RateLimitExceeded' },
                },
            },
        },
        '/orders/{orderId}': {
            get: {
                summary: 'Get order by ID',
                description: 'Retrieve a specific order by its ID',
                tags: ['Orders'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/OrderId',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Order details',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Order' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                summary: 'Update order status',
                description: 'Update the status of an existing order',
                tags: ['Orders'],
                security: [{ bearerAuth: [] }, { deviceToken: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/OrderId',
                    },
                    {
                        $ref: '#/components/parameters/IdempotencyKey',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['status'],
                                properties: {
                                    status: {
                                        type: 'string',
                                        enum: [
                                            'pending',
                                            'preparing',
                                            'ready',
                                            'served',
                                            'completed',
                                            'cancelled',
                                        ],
                                    },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Order updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Order' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/orders/{orderId}/split': {
            post: {
                summary: 'Split an order',
                description: 'Split an order into multiple sub-orders for split checks',
                tags: ['Orders'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/OrderId',
                    },
                    {
                        $ref: '#/components/parameters/IdempotencyKey',
                    },
                ],
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
                                        description: 'Array of item IDs to include in the split',
                                        items: { type: 'string', format: 'uuid' },
                                    },
                                    notes: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Order split successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                original_order: {
                                                    $ref: '#/components/schemas/Order',
                                                },
                                                split_order: { $ref: '#/components/schemas/Order' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/payments/initiate': {
            post: {
                summary: 'Initiate payment',
                description: 'Start a payment transaction with the specified provider',
                tags: ['Payments'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/IdempotencyKey',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/InitiatePaymentRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Payment initiated successfully',
                        headers: {
                            'X-Idempotency-Key': { schema: { type: 'string' } },
                        },
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                payment_id: { type: 'string', format: 'uuid' },
                                                checkout_url: { type: 'string', format: 'uri' },
                                                status: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '429': { $ref: '#/components/responses/RateLimitExceeded' },
                    '500': { $ref: '#/components/responses/InternalServerError' },
                },
            },
        },
        '/payments/verify': {
            post: {
                summary: 'Verify payment',
                description: 'Verify a payment transaction status',
                tags: ['Payments'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        $ref: '#/components/parameters/IdempotencyKey',
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['transaction_id'],
                                properties: {
                                    transaction_id: { type: 'string' },
                                    provider: { type: 'string', enum: ['chapa'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Payment verification result',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                verified: { type: 'boolean' },
                                                status: { type: 'string' },
                                                amount: { type: 'number' },
                                                currency: { type: 'string' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/payments/sessions': {
            get: {
                summary: 'List payment sessions',
                description: 'Get all active payment sessions for the restaurant',
                tags: ['Payments'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'status',
                        schema: { type: 'string', enum: ['pending', 'completed', 'failed'] },
                        description: 'Filter by session status',
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 50, maximum: 200 },
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of payment sessions',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                sessions: {
                                                    type: 'array',
                                                    items: {
                                                        $ref: '#/components/schemas/PaymentSession',
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/payments/callback': {
            post: {
                summary: 'Payment webhook callback',
                description: 'Webhook endpoint for payment provider callbacks (Chapa, etc.)',
                tags: ['Payments'],
                security: [{ webhookSignature: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { type: 'object' },
                        },
                    },
                },
                responses: {
                    '200': { description: 'Callback processed successfully' },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/guests': {
            get: {
                summary: 'List guests',
                description: "Retrieve a list of guests for the authenticated user's restaurant",
                tags: ['Guests'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: 'query',
                        name: 'query',
                        schema: { type: 'string' },
                        description: 'Search by guest name',
                    },
                    {
                        in: 'query',
                        name: 'segment',
                        schema: {
                            type: 'string',
                            enum: ['all', 'vip', 'returning', 'new'],
                            default: 'all',
                        },
                        description: 'Filter by guest segment',
                    },
                    {
                        in: 'query',
                        name: 'tag',
                        schema: { type: 'string' },
                        description: 'Filter by guest tag',
                    },
                    {
                        in: 'query',
                        name: 'limit',
                        schema: { type: 'integer', default: 50, maximum: 200 },
                    },
                ],
                responses: {
                    '200': {
                        description: 'List of guests',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: {
                                            type: 'object',
                                            properties: {
                                                guests: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Guest' },
                                                },
                                                total: { type: 'integer' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/guests/{guestId}': {
            get: {
                summary: 'Get guest by ID',
                description: 'Retrieve detailed information about a specific guest',
                tags: ['Guests'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'guestId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                        description: 'Guest unique identifier',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Guest details',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Guest' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                summary: 'Update guest',
                description: 'Update guest information',
                tags: ['Guests'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'guestId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    language: { type: 'string', enum: ['en', 'am'] },
                                    tags: { type: 'array', items: { type: 'string' } },
                                    is_vip: { type: 'boolean' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Guest updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Guest' },
                                    },
                                },
                            },
                        },
                    },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/menu': {
            get: {
                summary: 'Get menu items',
                description: 'Retrieve all menu items available for the restaurant',
                tags: ['Menu'],
                responses: {
                    '200': {
                        description: 'List of menu items',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/MenuItem' },
                                },
                            },
                        },
                    },
                    '500': { $ref: '#/components/responses/InternalServerError' },
                },
            },
            post: {
                summary: 'Create menu item',
                description: 'Add a new menu item (requires authentication)',
                tags: ['Menu'],
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateMenuItemRequest' },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Menu item created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/MenuItem' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                },
            },
        },
        '/menu/{itemId}': {
            get: {
                summary: 'Get menu item by ID',
                description: 'Retrieve a specific menu item',
                tags: ['Menu'],
                parameters: [
                    {
                        name: 'itemId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Menu item details',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/MenuItem' },
                            },
                        },
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            patch: {
                summary: 'Update menu item',
                description: 'Update an existing menu item',
                tags: ['Menu'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'itemId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateMenuItemRequest' },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Menu item updated successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/MenuItem' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
            delete: {
                summary: 'Delete menu item',
                description: 'Remove a menu item from the restaurant',
                tags: ['Menu'],
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: 'itemId',
                        in: 'path',
                        required: true,
                        schema: { type: 'string', format: 'uuid' },
                    },
                ],
                responses: {
                    '204': { description: 'Menu item deleted successfully' },
                    '401': { $ref: '#/components/responses/Unauthorized' },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
        '/restaurants/{slug}': {
            get: {
                summary: 'Get restaurant by slug',
                description: 'Retrieve restaurant information by its URL slug',
                tags: ['Restaurant'],
                parameters: [
                    {
                        name: 'slug',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                        description: 'Restaurant URL slug',
                    },
                ],
                responses: {
                    '200': {
                        description: 'Restaurant details',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        data: { $ref: '#/components/schemas/Restaurant' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                },
            },
        },
    },
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Supabase JWT token from authentication',
            },
            deviceToken: {
                type: 'apiKey',
                in: 'header',
                name: 'X-Device-Token',
                description: 'Device token for kiosk/terminal authentication',
            },
            guestContext: {
                type: 'object',
                description: 'Guest context embedded in request body with HMAC signature',
                properties: {
                    sig: {
                        type: 'string',
                        description: 'HMAC signature from QR code',
                    },
                    exp: {
                        type: 'string',
                        description: 'Expiration timestamp',
                    },
                },
            },
            webhookSignature: {
                type: 'apiKey',
                in: 'header',
                name: 'X-Webhook-Signature',
                description: 'Signature for webhook verification',
            },
        },
        parameters: {
            IdempotencyKey: {
                name: 'X-Idempotency-Key',
                in: 'header',
                schema: { type: 'string', format: 'uuid' },
                description: 'Unique key to ensure idempotent operations',
            },
            OrderId: {
                name: 'orderId',
                in: 'path',
                required: true,
                schema: { type: 'string', format: 'uuid' },
                description: 'Order unique identifier',
            },
        },
        schemas: {
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    order_number: { type: 'string' },
                    status: {
                        type: 'string',
                        enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
                    },
                    items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/OrderItem' },
                    },
                    total_price: { type: 'number' },
                    currency: { type: 'string', default: 'ETB' },
                    table: { type: 'string' },
                    guest_name: { type: 'string' },
                    notes: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            OrderItem: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    menu_item_id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    quantity: { type: 'integer' },
                    unit_price: { type: 'number' },
                    total_price: { type: 'number' },
                    modifiers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                price: { type: 'number' },
                            },
                        },
                    },
                    notes: { type: 'string' },
                    status: { type: 'string', enum: ['pending', 'preparing', 'ready', 'served'] },
                },
            },
            CreateOrderRequest: {
                type: 'object',
                required: ['guest_context', 'items', 'total_price'],
                properties: {
                    guest_context: {
                        type: 'object',
                        required: ['slug', 'table', 'sig', 'exp'],
                        properties: {
                            slug: { type: 'string', description: 'Restaurant slug' },
                            table: { type: 'string', description: 'Table number' },
                            sig: { type: 'string', description: 'HMAC signature' },
                            exp: { type: 'string', description: 'Expiration timestamp' },
                        },
                    },
                    items: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/OrderItem' },
                    },
                    total_price: { type: 'number' },
                    notes: { type: 'string' },
                    idempotency_key: { type: 'string', format: 'uuid' },
                },
            },
            PaymentSession: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    order_id: { type: 'string', format: 'uuid' },
                    amount: { type: 'number' },
                    currency: { type: 'string', default: 'ETB' },
                    status: {
                        type: 'string',
                        enum: ['pending', 'completed', 'failed', 'refunded'],
                    },
                    provider: { type: 'string', enum: ['chapa', 'cash'] },
                    transaction_id: { type: 'string' },
                    created_at: { type: 'string', format: 'date-time' },
                    completed_at: { type: 'string', format: 'date-time' },
                },
            },
            InitiatePaymentRequest: {
                type: 'object',
                required: ['provider', 'amount', 'email'],
                properties: {
                    provider: { type: 'string', enum: ['chapa'] },
                    amount: { type: 'number', minimum: 0.01, maximum: 100000000 },
                    currency: { type: 'string', default: 'ETB' },
                    email: { type: 'string', format: 'email' },
                    metadata: {
                        type: 'object',
                        description: 'Additional metadata for the payment',
                    },
                },
            },
            Guest: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    language: { type: 'string', enum: ['en', 'am'] },
                    tags: { type: 'array', items: { type: 'string' } },
                    is_vip: { type: 'boolean' },
                    first_seen_at: { type: 'string', format: 'date-time' },
                    last_seen_at: { type: 'string', format: 'date-time' },
                    visit_count: { type: 'integer' },
                    lifetime_value: { type: 'number' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            MenuItem: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    shop: { type: 'string' },
                    price: { type: 'number' },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    image: { type: 'string', format: 'uri' },
                    available: { type: 'boolean', default: true },
                    modifiers: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                options: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            price: { type: 'number' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            CreateMenuItemRequest: {
                type: 'object',
                required: ['title', 'shop', 'price', 'category'],
                properties: {
                    title: { type: 'string', minLength: 2 },
                    shop: { type: 'string', minLength: 2 },
                    price: { type: 'number', minimum: 0 },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    image: { type: 'string', format: 'uri' },
                    available: { type: 'boolean', default: true },
                },
            },
            UpdateMenuItemRequest: {
                type: 'object',
                properties: {
                    title: { type: 'string', minLength: 2 },
                    shop: { type: 'string', minLength: 2 },
                    price: { type: 'number', minimum: 0 },
                    category: { type: 'string' },
                    description: { type: 'string' },
                    image: { type: 'string', format: 'uri' },
                    available: { type: 'boolean' },
                },
            },
            Restaurant: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    description: { type: 'string' },
                    logo: { type: 'string', format: 'uri' },
                    address: { type: 'string' },
                    phone: { type: 'string' },
                    currency: { type: 'string', default: 'ETB' },
                    timezone: { type: 'string', default: 'Africa/Addis_Ababa' },
                    language: { type: 'string', enum: ['en', 'am'] },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' },
                },
            },
            Error: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                            details: { type: 'array', items: { type: 'object' } },
                        },
                    },
                },
            },
        },
        responses: {
            BadRequest: {
                description: 'Bad Request - Invalid input parameters',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'VALIDATION_ERROR',
                                message: 'Invalid request parameters',
                                details: [{ field: 'email', message: 'Invalid email format' }],
                            },
                        },
                    },
                },
            },
            Unauthorized: {
                description: 'Unauthorized - Missing or invalid authentication',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'UNAUTHORIZED',
                                message: 'Authentication required',
                            },
                        },
                    },
                },
            },
            Forbidden: {
                description: 'Forbidden - Insufficient permissions',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'FORBIDDEN',
                                message: 'Insufficient permissions',
                            },
                        },
                    },
                },
            },
            NotFound: {
                description: 'Not Found - Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'NOT_FOUND',
                                message: 'Resource not found',
                            },
                        },
                    },
                },
            },
            RateLimitExceeded: {
                description: 'Too Many Requests - Rate limit exceeded',
                headers: {
                    'X-RateLimit-Limit': { schema: { type: 'integer' } },
                    'X-RateLimit-Remaining': { schema: { type: 'integer' } },
                    'X-RateLimit-Reset': { schema: { type: 'integer' } },
                },
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'RATE_LIMIT_EXCEEDED',
                                message: 'Too many requests. Please try again later.',
                            },
                        },
                    },
                },
            },
            InternalServerError: {
                description: 'Internal Server Error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: {
                            error: {
                                code: 'INTERNAL_ERROR',
                                message: 'An unexpected error occurred',
                            },
                        },
                    },
                },
            },
        },
    },
};

export async function GET() {
    return apiSuccess(openApiSpec);
}
