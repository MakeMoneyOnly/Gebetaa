import { z } from 'zod';

/**
 * Update Price Schema
 * Validates price update requests
 */
export const UpdatePriceSchema = z.object({
    itemId: z.string().uuid('Invalid item ID'),
    price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
    restaurant_id: z.string().uuid('Invalid restaurant ID'),
});

/**
 * Update Availability Schema
 * Validates availability update requests
 */
export const UpdateAvailabilitySchema = z.object({
    itemId: z.string().uuid('Invalid item ID'),
    is_available: z.boolean('Availability must be a boolean'),
    restaurant_id: z.string().uuid('Invalid restaurant ID'),
});

/**
 * Create Category Schema
 * Validates category creation requests
 */
export const CreateCategorySchema = z.object({
    restaurant_id: z.string().uuid('Invalid restaurant ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    name_am: z.string().max(100, 'Amharic name too long').optional().nullable(),
    order_index: z.number().int().min(0).optional(),
});

/**
 * Update Category Schema
 * Validates category update requests
 */
export const UpdateCategorySchema = z.object({
    category_id: z.string().uuid('Invalid category ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    name_am: z.string().max(100, 'Amharic name too long').optional().nullable(),
    order_index: z.number().int().min(0).optional(),
});

/**
 * Create Menu Item Schema
 * Validates menu item creation requests
 */
export const CreateMenuItemSchema = z.object({
    category_id: z.string().uuid('Invalid category ID'),
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    name_am: z.string().max(200, 'Amharic name too long').optional().nullable(),
    description: z.string().max(1000, 'Description too long').optional().nullable(),
    description_am: z.string().max(1000, 'Amharic description too long').optional().nullable(),
    price: z.number().positive('Price must be positive').max(999999.99, 'Price too high'),
    is_available: z.boolean().optional(),
    is_fasting: z.boolean().optional(),
    is_chef_special: z.boolean().optional(),
    station: z.enum(['kitchen', 'bar', 'dessert', 'coffee']).optional(),
    ingredients: z.array(z.string().max(100)).max(50).optional(),
    allergens: z.array(z.string().max(100)).max(20).optional(),
    preparation_time: z.number().int().min(1).max(180).optional(),
    spicy_level: z.number().int().min(0).max(5).optional(),
});

/**
 * Type exports for TypeScript
 */
export type UpdatePriceInput = z.infer<typeof UpdatePriceSchema>;
export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateMenuItemInput = z.infer<typeof CreateMenuItemSchema>;
