import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrdersKanbanBoard } from './OrdersKanbanBoard';
import { Order } from '@/types/database';

// Mock the cn utility
vi.mock('@/lib/utils', () => ({
    cn: (...args: string[]) => args.filter(Boolean).join(' '),
}));

// Mock lucide-react to avoid heavy icon loading in tests
vi.mock('lucide-react', () => ({
    Clock: () => null,
    DollarSign: () => null,
}));

// Helper to create a minimal valid Order mock
function createMockOrder(overrides: Partial<Order> & { id: string }): Order {
    return {
        acknowledged_at: null,
        bar_status: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        customer_name: null,
        customer_phone: null,
        guest_fingerprint: null,
        idempotency_key: null,
        items: [],
        kitchen_status: null,
        notes: null,
        order_number: '001',
        restaurant_id: 'rest-1',
        status: 'pending',
        table_number: 'T1',
        total_price: 0,
        updated_at: new Date().toISOString(),
        ...overrides,
    } as Order;
}

describe('OrdersKanbanBoard', () => {
    const mockOrders: Order[] = [
        createMockOrder({
            id: 'order-1',
            table_number: 'T1',
            status: 'pending',
            total_price: 150,
        }),
        createMockOrder({
            id: 'order-2',
            table_number: 'T2',
            status: 'preparing',
            total_price: 250,
        }),
        createMockOrder({
            id: 'sr_123',
            table_number: 'T3',
            status: 'service_pending',
            notes: 'Extra napkins',
        }),
    ];

    const defaultProps = {
        orders: mockOrders,
        onOpenDetails: vi.fn(),
        onStatusUpdate: vi.fn(),
        getNextStatus: vi.fn((status: string | null) => {
            if (status === 'pending') return 'preparing';
            if (status === 'preparing') return 'ready';
            if (status === 'ready') return 'completed';
            return null;
        }),
        loadingOrderId: null,
        updatingOrderId: null,
        selectedOrderIds: [],
        onToggleOrder: vi.fn(),
    };

    it('renders all four columns', () => {
        render(<OrdersKanbanBoard {...defaultProps} />);
        // Check for column headers specifically by looking for h3 elements
        expect(screen.getByRole('heading', { name: 'Pending' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'In Progress' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Ready' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Done' })).toBeInTheDocument();
    });

    it('displays order counts in column headers', () => {
        render(<OrdersKanbanBoard {...defaultProps} />);
        // Pending column should have 1 (pending order)
        const counts = screen.getAllByText('1');
        expect(counts.length).toBeGreaterThan(0);
    });

    it('shows "No orders" for empty columns', () => {
        render(<OrdersKanbanBoard {...defaultProps} orders={[]} />);
        const noOrdersMessages = screen.getAllByText('No orders');
        expect(noOrdersMessages.length).toBe(4); // One for each column
    });

    it('displays table numbers for orders', () => {
        render(<OrdersKanbanBoard {...defaultProps} />);
        expect(screen.getByText('T1')).toBeInTheDocument();
        expect(screen.getByText('T2')).toBeInTheDocument();
    });

    it('shows service request badge for SR orders', () => {
        render(<OrdersKanbanBoard {...defaultProps} />);
        // The component renders "Service request" badge for sr_ prefixed orders
        const serviceRequestBadges = screen.getAllByText(/service request/i);
        expect(serviceRequestBadges.length).toBeGreaterThan(0);
    });

    it('calls onOpenDetails when Details button is clicked', async () => {
        const onOpenDetails = vi.fn();
        render(<OrdersKanbanBoard {...defaultProps} onOpenDetails={onOpenDetails} />);

        const detailsButtons = screen.getAllByText('Details');
        fireEvent.click(detailsButtons[0]);

        expect(onOpenDetails).toHaveBeenCalled();
    });

    it('calls onToggleOrder when checkbox is clicked', async () => {
        const onToggleOrder = vi.fn();
        render(<OrdersKanbanBoard {...defaultProps} onToggleOrder={onToggleOrder} />);

        // There are multiple checkboxes (one per order), get the first one
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
        fireEvent.click(checkboxes[0]);

        expect(onToggleOrder).toHaveBeenCalled();
    });

    it('shows loading state for order', () => {
        render(<OrdersKanbanBoard {...defaultProps} loadingOrderId="order-1" />);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows updating state for order', () => {
        render(<OrdersKanbanBoard {...defaultProps} updatingOrderId="order-1" />);
        expect(screen.getByText('Updating…')).toBeInTheDocument();
    });

    it('disables next status button when no next status', () => {
        const getNextStatus = vi.fn(() => null);
        render(<OrdersKanbanBoard {...defaultProps} getNextStatus={getNextStatus} />);

        const doneButtons = screen.getAllByText('Done');
        expect(doneButtons[0]).toBeDisabled();
    });
});
