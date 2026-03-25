# Gebeta Restaurant OS - API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.gebeta.app`
**Last Updated:** 2026-03-23

---

## Table of Contents

1. [Authentication](#authentication)
2. [Orders API](#orders-api)
3. [Payments API](#payments-api)
4. [Menu API](#menu-api)
5. [KDS API](#kds-api)
6. [Guest API](#guest-api)
7. [Webhooks](#webhooks)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints require authentication unless otherwise noted. Gebeta uses Supabase Auth with JWT tokens.

### Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
X-Idempotency-Key: <unique_key>  # Required for mutations
```

### Token Types

| Token Type      | Use Case      | Lifetime |
| --------------- | ------------- | -------- |
| `access_token`  | API requests  | 1 hour   |
| `refresh_token` | Token refresh | 30 days  |

### Roles

| Role      | Permissions                           |
| --------- | ------------------------------------- |
| `owner`   | Full restaurant access                |
| `admin`   | Full restaurant access except billing |
| `manager` | Orders, menu, staff management        |
| `staff`   | Orders, KDS access                    |
| `guest`   | Menu viewing, order placement         |

---

## Orders API

### List Orders

Retrieves orders for a restaurant with pagination.

**Endpoint:** `GET /api/orders`

#### Query Parameters

| Name            | Type   | Required | Description                                                                  |
| --------------- | ------ | -------- | ---------------------------------------------------------------------------- |
| `restaurant_id` | string | Yes      | Restaurant UUID                                                              |
| `status`        | string | No       | Filter by status: pending, confirmed, preparing, ready, completed, cancelled |
| `limit`         | number | No       | Results per page (default: 50, max: 200)                                     |
| `offset`        | number | No       | Pagination offset (default: 0)                                               |
| `from_date`     | string | No       | Filter from date (ISO 8601)                                                  |
| `to_date`       | string | No       | Filter to date (ISO 8601)                                                    |

#### Response

```json
{
    "data": [
        {
            "id": "uuid",
            "restaurant_id": "uuid",
            "order_number": 1001,
            "status": "confirmed",
            "order_type": "dine_in",
            "table_number": 5,
            "subtotal_santim": 50000,
            "vat_santim": 7500,
            "total_santim": 57500,
            "payment_status": "pending",
            "created_at": "2026-03-23T10:00:00Z",
            "items": [
                {
                    "id": "uuid",
                    "menu_item_id": "uuid",
                    "menu_item_name": "Tibs",
                    "quantity": 2,
                    "unit_price_santim": 25000,
                    "total_price_santim": 50000,
                    "status": "pending"
                }
            ]
        }
    ],
    "pagination": {
        "total": 150,
        "limit": 50,
        "offset": 0,
        "has_more": true
    }
}
```

#### Error Responses

| Status | Code               | Meaning                  |
| ------ | ------------------ | ------------------------ |
| 400    | `VALIDATION_ERROR` | Invalid query parameters |
| 401    | `UNAUTHORIZED`     | Missing or invalid token |
| 403    | `FORBIDDEN`        | No access to restaurant  |

---

### Create Order

Creates a new order.

**Endpoint:** `POST /api/orders`

#### Request Body

```json
{
    "restaurant_id": "uuid",
    "order_type": "dine_in",
    "table_number": 5,
    "guest_name": "Abebe",
    "guest_phone": "+251911123456",
    "notes": "Extra spicy please",
    "items": [
        {
            "menu_item_id": "uuid",
            "quantity": 2,
            "modifiers": [{ "name": "Spice Level", "value": "Hot" }],
            "notes": "Well done"
        }
    ],
    "idempotency_key": "unique-key-123"
}
```

#### Response

```json
{
    "data": {
        "id": "uuid",
        "order_number": 1002,
        "status": "pending",
        "total_santim": 57500,
        "created_at": "2026-03-23T10:05:00Z"
    }
}
```

#### Side Effects

- DB writes: `orders`, `order_items` tables
- Audit logs: Order creation logged
- Events: `order.created` event emitted
- Realtime: Broadcast to KDS and merchant dashboard

---

### Update Order Status

Updates the status of an order.

**Endpoint:** `PATCH /api/orders/:id/status`

#### Request Body

```json
{
    "status": "confirmed",
    "idempotency_key": "unique-key-456"
}
```

#### Valid Status Transitions

```
pending → confirmed → preparing → ready → completed
    ↓         ↓           ↓
cancelled  cancelled  cancelled
```

#### Response

```json
{
    "data": {
        "id": "uuid",
        "status": "confirmed",
        "updated_at": "2026-03-23T10:10:00Z"
    }
}
```

---

## Payments API

### Initiate Payment

Initiates a payment with the specified provider.

**Endpoint:** `POST /api/payments/initiate`

#### Request Body

```json
{
    "order_id": "uuid",
    "provider": "chapa",
    "amount_santim": 57500,
    "currency": "ETB",
    "return_url": "https://gebeta.app/order/success",
    "idempotency_key": "unique-payment-key"
}
```

#### Supported Providers

| Provider   | Type         | Description               |
| ---------- | ------------ | ------------------------- |
| `chapa`    | Card/Mobile  | Ethiopian payment gateway |
| `telebirr` | Mobile Money | Telebirr QR payments      |
| `internal` | Cash         | Cash payment recording    |

#### Response

```json
{
    "data": {
        "checkout_url": "https://checkout.chapa.co/...",
        "transaction_reference": "tx-123456",
        "provider": "chapa"
    }
}
```

---

### Verify Payment

Verifies the status of a payment.

**Endpoint:** `GET /api/payments/verify/:reference`

#### Response

```json
{
    "data": {
        "status": "success",
        "transaction_reference": "tx-123456",
        "amount_santim": 57500,
        "currency": "ETB",
        "provider": "chapa",
        "verified_at": "2026-03-23T10:15:00Z"
    }
}
```

---

## Menu API

### List Menu Items

Retrieves menu items for a restaurant.

**Endpoint:** `GET /api/menu/items`

#### Query Parameters

| Name            | Type    | Required | Description            |
| --------------- | ------- | -------- | ---------------------- |
| `restaurant_id` | string  | Yes      | Restaurant UUID        |
| `category_id`   | string  | No       | Filter by category     |
| `is_available`  | boolean | No       | Filter by availability |

#### Response

```json
{
    "data": [
        {
            "id": "uuid",
            "name": "Tibs",
            "name_am": "ጥብስ",
            "description": "Grilled beef with spices",
            "price_santim": 25000,
            "category": "Main Course",
            "is_available": true,
            "image_url": "https://...",
            "modifiers": [
                {
                    "name": "Spice Level",
                    "options": ["Mild", "Medium", "Hot"]
                }
            ]
        }
    ]
}
```

---

## KDS API

### Get KDS Items

Retrieves items for kitchen display.

**Endpoint:** `GET /api/kds/items`

#### Query Parameters

| Name      | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `station` | string | No       | Filter by station (grill, fry, etc.)     |
| `status`  | string | No       | Filter by status: queued, cooking, ready |

#### Response

```json
{
    "data": [
        {
            "id": "uuid",
            "order_id": "uuid",
            "order_number": 1001,
            "menu_item_name": "Tibs",
            "quantity": 2,
            "status": "queued",
            "station": "grill",
            "priority": 1,
            "created_at": "2026-03-23T10:00:00Z",
            "modifiers": ["Extra spicy"],
            "notes": "Well done"
        }
    ]
}
```

---

### KDS Action

Performs an action on a KDS item.

**Endpoint:** `POST /api/kds/items/:id/action`

#### Request Body

```json
{
    "action": "start",
    "idempotency_key": "unique-action-key"
}
```

#### Valid Actions

| Action   | Description       |
| -------- | ----------------- |
| `start`  | Mark as cooking   |
| `hold`   | Put on hold       |
| `ready`  | Mark as ready     |
| `recall` | Recall from ready |
| `bump`   | Mark as served    |

---

## Guest API

### Get Restaurant by Slug

Retrieves restaurant information for guest menu viewing.

**Endpoint:** `GET /api/guest/restaurants/:slug`

#### Response

```json
{
    "data": {
        "id": "uuid",
        "name": "Abebe's Restaurant",
        "slug": "abebes-restaurant",
        "description": "Traditional Ethiopian cuisine",
        "logo_url": "https://...",
        "address": "Bole, Addis Ababa",
        "phone": "+251911123456"
    }
}
```

**Auth Required:** No (public endpoint)

---

### Create Guest Order

Creates an order from guest menu.

**Endpoint:** `POST /api/guest/orders`

#### Request Body

```json
{
    "restaurant_slug": "abebes-restaurant",
    "table_number": 5,
    "guest_name": "Abebe",
    "guest_phone": "+251911123456",
    "items": [
        {
            "menu_item_id": "uuid",
            "quantity": 2,
            "modifiers": [{ "name": "Spice Level", "value": "Hot" }]
        }
    ],
    "guest_fingerprint": "sha256-hash",
    "idempotency_key": "unique-guest-order-key"
}
```

**Auth Required:** No (uses guest fingerprint for validation)

---

## Webhooks

### Chapa Webhook

**Endpoint:** `POST /api/webhooks/chapa`

#### Headers

```
X-Chapa-Signature: <hmac_signature>
```

#### Payload

```json
{
    "tx_ref": "tx-123456",
    "status": "success",
    "amount": "575.00",
    "currency": "ETB"
}
```

---

### Telebirr Webhook

**Endpoint:** `POST /api/webhooks/telebirr`

#### Headers

```
X-Telebirr-Sign: <hmac_signature>
```

#### Payload

```json
{
    "outTradeNo": "TB123456789",
    "tradeNo": "telebirr-tx-id",
    "tradeStatus": "TRADE_SUCCESS",
    "totalAmount": "575",
    "currency": "ETB"
}
```

---

## Error Handling

All errors follow a consistent format:

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid order items",
        "details": [
            {
                "field": "items[0].quantity",
                "message": "Quantity must be at least 1"
            }
        ]
    }
}
```

### Error Codes

| Code                  | HTTP Status | Description              |
| --------------------- | ----------- | ------------------------ |
| `VALIDATION_ERROR`    | 400         | Invalid request data     |
| `UNAUTHORIZED`        | 401         | Authentication required  |
| `FORBIDDEN`           | 403         | Insufficient permissions |
| `NOT_FOUND`           | 404         | Resource not found       |
| `CONFLICT`            | 409         | Resource conflict        |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests        |
| `INTERNAL_ERROR`      | 500         | Server error             |

---

## Rate Limiting

All API endpoints are rate-limited. Limits are returned in response headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1648051200
```

### Limits by Endpoint Type

| Type      | Limit | Window     |
| --------- | ----- | ---------- |
| Mutations | 10    | 60 seconds |
| Auth      | 5     | 60 seconds |
| Reads     | 60    | 60 seconds |

When rate limited, the API returns:

```json
{
    "error": {
        "code": "RATE_LIMIT_EXCEEDED",
        "message": "Too many requests. Please try again later.",
        "retryAfter": 45
    }
}
```

---

## Idempotency

All mutation endpoints require an `X-Idempotency-Key` header or `idempotency_key` field. This allows safe retries without duplicate operations.

### Requirements

- Must be unique per operation
- Maximum length: 255 characters
- Recommended: UUID v4

### Behavior

- Same idempotency key + same request = same response (cached for 24h)
- Same idempotency key + different request = error

---

## Observability

### Structured Logs

All API requests are logged with:

```json
{
    "timestamp": "2026-03-23T10:00:00Z",
    "level": "info",
    "method": "POST",
    "path": "/api/orders",
    "status": 201,
    "duration_ms": 145,
    "restaurant_id": "uuid",
    "user_id": "uuid",
    "request_id": "req-123"
}
```

### Metrics

- Request latency (P50, P95, P99)
- Error rate by endpoint
- Rate limit hits
- Active connections

---

## Versioning

The API uses URL versioning: `/api/v1/orders`

Current version: `v1` (default, no prefix required)

Breaking changes will be introduced under new version prefixes with 6-month deprecation notice.
