import { describe, it, expect } from 'vitest';
import {
    validateInput,
    validateInputDetailed,
    OrderItemInputSchema,
    CreateOrderInputSchema,
    UpdateOrderStatusInputSchema,
    CancelOrderInputSchema,
    CreateMenuItemInputSchema,
    UpdateMenuItemInputSchema,
    CreateGuestInputSchema,
    UpdateGuestInputSchema,
    CreateStaffInputSchema,
    UpdateStaffInputSchema,
    InitiatePaymentInputSchema,
} from '../graphql';

// Valid UUIDs for testing
const validRestaurantId = '123e4567-e89b-12d3-a456-426614174000';
const validMenuItemId = '123e4567-e89b-12d3-a456-426614174001';
const validOrderId = '123e4567-e89b-12d3-a456-426614174002';
const validTableId = '123e4567-e89b-12d3-a456-426614174003';
const validCategoryId = '123e4567-e89b-12d3-a456-426614174004';
const validGuestId = '123e4567-e89b-12d3-a456-426614174005';
const validStaffId = '123e4567-e89b-12d3-a456-426614174006';

describe('GraphQL Input Validation', () => {
    describe('validateInput', () => {
        it('should return success with data for valid input', () => {
            const schema = CreateOrderInputSchema;
            const input = {
                restaurantId: validRestaurantId,
                type: 'DINE_IN',
                items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                idempotencyKey: 'key-main',
            };

            const result = validateInput(schema, input);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.restaurantId).toBe(validRestaurantId);
                expect(result.data.type).toBe('DINE_IN');
            }
        });

        it('should return failure with error message for invalid input', () => {
            const schema = CreateOrderInputSchema;
            const input = {
                restaurantId: 'invalid',
                type: 'DINE_IN',
                items: [],
                idempotencyKey: 'key',
            };

            const result = validateInput(schema, input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error).toBeDefined();
                expect(typeof result.error).toBe('string');
            }
        });
    });

    describe('validateInputDetailed', () => {
        it('should return detailed field errors for invalid input', () => {
            const input = {
                restaurantId: 'invalid-uuid',
                type: 'INVALID_TYPE',
                items: [],
                idempotencyKey: '',
            };

            const result = validateInputDetailed(CreateOrderInputSchema, input);

            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toBeInstanceOf(Array);
                expect(result.errors.length).toBeGreaterThan(0);
                result.errors.forEach(error => {
                    expect(error).toHaveProperty('field');
                    expect(error).toHaveProperty('message');
                });
            }
        });

        it('should return success with data for valid input', () => {
            const input = {
                restaurantId: validRestaurantId,
                type: 'TAKEAWAY',
                items: [{ menuItemId: validMenuItemId, quantity: 2, idempotencyKey: 'key-1' }],
                idempotencyKey: 'key-main',
            };

            const result = validateInputDetailed(CreateOrderInputSchema, input);

            expect(result.success).toBe(true);
        });
    });

    describe('OrderItemInputSchema', () => {
        it('should validate valid order item', () => {
            const input = {
                menuItemId: validMenuItemId,
                quantity: 2,
                modifiers: { size: 'large' },
                notes: 'No onions',
                idempotencyKey: 'key-1',
            };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid menu item ID', () => {
            const input = { menuItemId: 'invalid', quantity: 1, idempotencyKey: 'key' };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject quantity exceeding max', () => {
            const input = { menuItemId: validMenuItemId, quantity: 101, idempotencyKey: 'key' };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject zero quantity', () => {
            const input = { menuItemId: validMenuItemId, quantity: 0, idempotencyKey: 'key' };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject negative quantity', () => {
            const input = { menuItemId: validMenuItemId, quantity: -1, idempotencyKey: 'key' };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject notes exceeding max length', () => {
            const input = {
                menuItemId: validMenuItemId,
                quantity: 1,
                notes: 'a'.repeat(501),
                idempotencyKey: 'key',
            };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject missing idempotency key', () => {
            const input = { menuItemId: validMenuItemId, quantity: 1 };

            const result = validateInput(OrderItemInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('CreateOrderInputSchema', () => {
        it('should validate valid order input', () => {
            const input = {
                restaurantId: validRestaurantId,
                type: 'DINE_IN',
                items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should validate order with optional fields', () => {
            const input = {
                restaurantId: validRestaurantId,
                tableId: validTableId,
                type: 'DINE_IN',
                items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                notes: 'Window seat please',
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid restaurant ID', () => {
            const input = {
                restaurantId: 'invalid',
                type: 'DINE_IN',
                items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject empty items array', () => {
            const input = {
                restaurantId: validRestaurantId,
                type: 'DINE_IN',
                items: [],
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject items exceeding max count', () => {
            const input = {
                restaurantId: validRestaurantId,
                type: 'DINE_IN',
                items: Array(101)
                    .fill(null)
                    .map((_, i) => ({
                        menuItemId: validMenuItemId,
                        quantity: 1,
                        idempotencyKey: `key-${i}`,
                    })),
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject invalid order type', () => {
            const input = {
                restaurantId: validRestaurantId,
                type: 'INVALID',
                items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                idempotencyKey: 'key-main',
            };

            const result = validateInput(CreateOrderInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should accept all valid order types', () => {
            const types = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const;

            types.forEach(type => {
                const input = {
                    restaurantId: validRestaurantId,
                    type,
                    items: [{ menuItemId: validMenuItemId, quantity: 1, idempotencyKey: 'key-1' }],
                    idempotencyKey: 'key-main',
                };

                const result = validateInput(CreateOrderInputSchema, input);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('UpdateOrderStatusInputSchema', () => {
        it('should validate valid status update', () => {
            const input = { id: validOrderId, status: 'CONFIRMED' };

            const result = validateInput(UpdateOrderStatusInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid status', () => {
            const input = { id: validOrderId, status: 'INVALID' };

            const result = validateInput(UpdateOrderStatusInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject invalid order ID', () => {
            const input = { id: 'invalid', status: 'CONFIRMED' };

            const result = validateInput(UpdateOrderStatusInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should accept all valid statuses', () => {
            const statuses = [
                'PENDING',
                'CONFIRMED',
                'PREPARING',
                'READY',
                'SERVED',
                'CANCELLED',
            ] as const;

            statuses.forEach(status => {
                const input = { id: validOrderId, status };
                const result = validateInput(UpdateOrderStatusInputSchema, input);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('CancelOrderInputSchema', () => {
        it('should validate valid cancel input', () => {
            const input = { id: validOrderId, reason: 'Customer request' };

            const result = validateInput(CancelOrderInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should validate cancel without reason', () => {
            const input = { id: validOrderId };

            const result = validateInput(CancelOrderInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject reason exceeding max length', () => {
            const input = { id: validOrderId, reason: 'a'.repeat(501) };

            const result = validateInput(CancelOrderInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('CreateMenuItemInputSchema', () => {
        it('should validate valid menu item input', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'Injera',
                price: 50.0,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should validate menu item with all optional fields', () => {
            const input = {
                restaurantId: validRestaurantId,
                categoryId: validCategoryId,
                name: 'Injera',
                nameAm: 'እንጀራ',
                description: 'Traditional Ethiopian flatbread',
                descriptionAm: 'ባህላዊ የኢትዮጵያ ምግብ',
                price: 50.0,
                isAvailable: true,
                preparationTimeMinutes: 30,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject empty name', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: '',
                price: 50.0,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject negative price', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'Injera',
                price: -10.0,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject zero price', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'Injera',
                price: 0,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject price exceeding maximum', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'Expensive Item',
                price: 1000001,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject name exceeding max length', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'a'.repeat(201),
                price: 50.0,
            };

            const result = validateInput(CreateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('UpdateMenuItemInputSchema', () => {
        it('should validate valid update input', () => {
            const input = {
                id: validMenuItemId,
                name: 'Updated Name',
                price: 75.0,
            };

            const result = validateInput(UpdateMenuItemInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should validate partial update', () => {
            const input = { id: validMenuItemId, isAvailable: false };

            const result = validateInput(UpdateMenuItemInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid menu item ID', () => {
            const input = { id: 'invalid', name: 'Test' };

            const result = validateInput(UpdateMenuItemInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('CreateGuestInputSchema', () => {
        it('should validate valid guest input', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'John Doe',
            };

            const result = validateInput(CreateGuestInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should validate guest with all fields', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'John Doe',
                phone: '+251911123456',
                email: 'john@example.com',
            };

            const result = validateInput(CreateGuestInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject empty name', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: '',
            };

            const result = validateInput(CreateGuestInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject invalid email', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'John Doe',
                email: 'invalid-email',
            };

            const result = validateInput(CreateGuestInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should accept empty string email', () => {
            const input = {
                restaurantId: validRestaurantId,
                name: 'John Doe',
                email: '',
            };

            const result = validateInput(CreateGuestInputSchema, input);

            expect(result.success).toBe(true);
        });
    });

    describe('UpdateGuestInputSchema', () => {
        it('should validate valid update input', () => {
            const input = {
                id: validGuestId,
                name: 'Jane Doe',
            };

            const result = validateInput(UpdateGuestInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid guest ID', () => {
            const input = { id: 'invalid', name: 'Test' };

            const result = validateInput(UpdateGuestInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('CreateStaffInputSchema', () => {
        it('should validate valid staff input', () => {
            const input = {
                restaurantId: validRestaurantId,
                fullName: 'Abebe Bikila',
                role: 'CHEF',
            };

            const result = validateInput(CreateStaffInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should accept all valid staff roles', () => {
            const roles = ['MANAGER', 'CHEF', 'WAITER', 'CASHIER', 'HOST', 'DELIVERY'] as const;

            roles.forEach(role => {
                const input = {
                    restaurantId: validRestaurantId,
                    fullName: 'Test Staff',
                    role,
                };

                const result = validateInput(CreateStaffInputSchema, input);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid role', () => {
            const input = {
                restaurantId: validRestaurantId,
                fullName: 'Test Staff',
                role: 'INVALID',
            };

            const result = validateInput(CreateStaffInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject empty name', () => {
            const input = {
                restaurantId: validRestaurantId,
                fullName: '',
                role: 'WAITER',
            };

            const result = validateInput(CreateStaffInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('UpdateStaffInputSchema', () => {
        it('should validate valid update input', () => {
            const input = {
                id: validStaffId,
                fullName: 'Updated Name',
                role: 'MANAGER',
            };

            const result = validateInput(UpdateStaffInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should reject invalid staff ID', () => {
            const input = { id: 'invalid', fullName: 'Test' };

            const result = validateInput(UpdateStaffInputSchema, input);

            expect(result.success).toBe(false);
        });
    });

    describe('InitiatePaymentInputSchema', () => {
        it('should validate valid payment input', () => {
            const input = {
                orderId: validOrderId,
                method: 'CASH',
                amount: 150.0,
                idempotencyKey: 'payment-key-1',
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(true);
        });

        it('should accept all valid payment methods', () => {
            const methods = ['CASH', 'CHAPA', 'CARD'] as const;

            methods.forEach(method => {
                const input = {
                    orderId: validOrderId,
                    method,
                    amount: 100.0,
                    idempotencyKey: 'key',
                };

                const result = validateInput(InitiatePaymentInputSchema, input);
                expect(result.success).toBe(true);
            });
        });

        it('should reject invalid payment method', () => {
            const input = {
                orderId: validOrderId,
                method: 'INVALID',
                amount: 100.0,
                idempotencyKey: 'key',
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject negative amount', () => {
            const input = {
                orderId: validOrderId,
                method: 'CASH',
                amount: -50.0,
                idempotencyKey: 'key',
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject zero amount', () => {
            const input = {
                orderId: validOrderId,
                method: 'CASH',
                amount: 0,
                idempotencyKey: 'key',
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject amount exceeding maximum', () => {
            const input = {
                orderId: validOrderId,
                method: 'CASH',
                amount: 10000001,
                idempotencyKey: 'key',
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(false);
        });

        it('should reject missing idempotency key', () => {
            const input = {
                orderId: validOrderId,
                method: 'CASH',
                amount: 100.0,
            };

            const result = validateInput(InitiatePaymentInputSchema, input);

            expect(result.success).toBe(false);
        });
    });
});
