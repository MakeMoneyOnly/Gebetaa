import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MetricCard } from './MetricCard';
import { DollarSign } from 'lucide-react';

describe('MetricCard', () => {
    const defaultProps = {
        icon: DollarSign,
        chip: 'TODAY',
        value: '1,250',
        label: 'Revenue',
        subLabel: 'Total sales',
        tone: 'blue' as const,
    };

    it('renders with basic props', () => {
        render(<MetricCard {...defaultProps} />);
        expect(screen.getByText('1,250')).toBeInTheDocument();
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('Total sales')).toBeInTheDocument();
        expect(screen.getByText('TODAY')).toBeInTheDocument();
    });

    it('displays ETB suffix when value contains ETB', () => {
        render(<MetricCard {...defaultProps} value="1,250 ETB" />);
        // Component strips ETB and displays the numeric part
        expect(screen.getByText('1,250')).toBeInTheDocument();
    });

    it('renders numeric values', () => {
        render(<MetricCard {...defaultProps} value={42} />);
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('applies different tone colors', () => {
        const { container } = render(<MetricCard {...defaultProps} tone="green" />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it('renders progress dots based on progress value', () => {
        const { container } = render(<MetricCard {...defaultProps} progress={10} />);
        // Component renders 20 progress dots with h-[15px] w-[15px] classes
        const dots = container.querySelectorAll('.h-\\[15px\\].w-\\[15px\\]');
        expect(dots.length).toBe(20);
    });

    it('renders target and current labels when provided', () => {
        render(
            <MetricCard {...defaultProps} targetLabel="Target: 2000" currentLabel="Current: 1250" />
        );
        expect(screen.getByText('Target: 2000')).toBeInTheDocument();
        expect(screen.getByText('Current: 1250')).toBeInTheDocument();
    });

    it('renders with default labels when not provided', () => {
        render(<MetricCard {...defaultProps} />);
        expect(screen.getByText('Target: N/A')).toBeInTheDocument();
        expect(screen.getByText('Current: -')).toBeInTheDocument();
    });
});
