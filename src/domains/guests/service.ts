// Guests Domain - Service Layer
// Business logic layer - loyalty calculations, visit tracking, etc.
import { guestsRepository, GuestRow, GuestListOptions } from './repository';

export interface CreateGuestInput {
    restaurantId: string;
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    tags?: string[];
}

export interface UpdateGuestInput {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
    tags?: string[];
}

/**
 * Calculate loyalty tier based on total spent
 */
export function calculateLoyaltyTier(
    totalSpent: number
): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (totalSpent >= 100000) return 'platinum';
    if (totalSpent >= 50000) return 'gold';
    if (totalSpent >= 20000) return 'silver';
    return 'bronze';
}

/**
 * Calculate loyalty points earned from an order
 * Basic implementation: 1 point per 100 ETB spent
 */
export function calculateLoyaltyPoints(amountSpent: number): number {
    return Math.floor(amountSpent / 100);
}

export class GuestsService {
    /**
     * Get a single guest by ID with tenant validation
     */
    async getGuest(id: string, expectedRestaurantId?: string): Promise<GuestRow | null> {
        const guest = await guestsRepository.getGuest(id);

        // Tenant isolation check
        if (guest && expectedRestaurantId && guest.restaurant_id !== expectedRestaurantId) {
            console.error(
                `[guests/service] Tenant isolation violation: Attempted to access guest ${id} from restaurant ${expectedRestaurantId}`
            );
            return null;
        }

        return guest;
    }

    /**
     * Get paginated guests list for a restaurant
     */
    async getGuests(restaurantId: string, options: GuestListOptions = {}): Promise<GuestRow[]> {
        return guestsRepository.getGuests(restaurantId, options);
    }

    /**
     * Create a new guest with validation
     */
    async createGuest(input: CreateGuestInput): Promise<GuestRow> {
        // Validate phone format if provided
        if (input.phone && !this.isValidPhone(input.phone)) {
            throw new Error('Invalid phone number format');
        }

        // Validate email format if provided
        if (input.email && !this.isValidEmail(input.email)) {
            throw new Error('Invalid email format');
        }

        return guestsRepository.createGuest({
            restaurant_id: input.restaurantId,
            name: input.name,
            phone: input.phone,
            email: input.email,
            notes: input.notes,
            tags: input.tags ?? [],
        });
    }

    /**
     * Update a guest with validation
     */
    async updateGuest(
        id: string,
        input: UpdateGuestInput,
        expectedRestaurantId?: string
    ): Promise<GuestRow> {
        // Verify tenant isolation
        const existing = await this.getGuest(id, expectedRestaurantId);
        if (!existing) {
            throw new Error(`Guest ${id} not found or access denied`);
        }

        // Validate phone if provided
        if (input.phone && !this.isValidPhone(input.phone)) {
            throw new Error('Invalid phone number format');
        }

        // Validate email if provided
        if (input.email && !this.isValidEmail(input.email)) {
            throw new Error('Invalid email format');
        }

        return guestsRepository.updateGuest(id, {
            name: input.name,
            phone: input.phone,
            email: input.email,
            notes: input.notes,
            tags: input.tags,
        });
    }

    /**
     * Record a guest visit and update stats
     */
    async recordVisit(
        guestId: string,
        amountSpent: number,
        expectedRestaurantId?: string
    ): Promise<GuestRow> {
        // Verify tenant isolation
        const existing = await this.getGuest(guestId, expectedRestaurantId);
        if (!existing) {
            throw new Error(`Guest ${guestId} not found or access denied`);
        }

        return guestsRepository.updateVisitStats(guestId, amountSpent);
    }

    /**
     * Search guests by query
     */
    async searchGuests(restaurantId: string, query: string, limit?: number): Promise<GuestRow[]> {
        return guestsRepository.searchGuests(restaurantId, query, limit);
    }

    /**
     * Get guest loyalty tier
     */
    getLoyaltyTier(guest: GuestRow): 'bronze' | 'silver' | 'gold' | 'platinum' {
        return calculateLoyaltyTier(guest.lifetime_value ?? 0);
    }

    /**
     * Calculate points to earn from a purchase
     */
    getPointsToEarn(amount: number): number {
        return calculateLoyaltyPoints(amount);
    }

    /**
     * Validate phone number format
     */
    private isValidPhone(phone: string): boolean {
        // Ethiopian phone format: +251XXXXXXXXX or 0XXXXXXXXXX
        const phoneRegex = /^(\+251|0)?[9][0-9]{8}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

export const guestsService = new GuestsService();
