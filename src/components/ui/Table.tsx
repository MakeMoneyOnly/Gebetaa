'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    variant?: 'default' | 'striped' | 'bordered';
    size?: 'sm' | 'md' | 'lg';
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        const variants = {
            default: 'w-full caption-bottom border-collapse',
            striped: 'w-full caption-bottom border-collapse',
            bordered: 'w-full caption-bottom border-collapse border border-brand-neutral-soft/10',
        };

        const sizes = {
            sm: 'text-xs',
            md: 'text-sm',
            lg: 'text-base',
        };

        return (
            <div className="relative w-full overflow-auto">
                <table
                    ref={ref}
                    className={cn(variants[variant], sizes[size], className)}
                    {...props}
                />
            </div>
        );
    }
);
Table.displayName = 'Table';

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className, ...props }, ref) => (
        <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
    )
);
TableHeader.displayName = 'TableHeader';

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
    ({ className, ...props }, ref) => (
        <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
    )
);
TableBody.displayName = 'TableBody';

type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableFooter = React.forwardRef<HTMLTableSectionElement, TableFooterProps>(
    ({ className, ...props }, ref) => (
        <tfoot
            ref={ref}
            className={cn(
                'border-brand-neutral-soft/10 bg-surface-muted border-t font-medium [&>tr]:last:border-b-0',
                className
            )}
            {...props}
        />
    )
);
TableFooter.displayName = 'TableFooter';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    variant?: 'default' | 'hover' | 'selected';
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, variant = 'default', ...props }, ref) => {
        const variants = {
            default: '',
            hover: 'hover:bg-surface-muted',
            selected: 'bg-brand-accent/5 hover:bg-brand-accent/10',
        };

        return (
            <tr
                ref={ref}
                className={cn(
                    'border-brand-neutral-soft/10 data-[state=selected]:bg-brand-neutral-soft/5 border-b transition-colors',
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
TableRow.displayName = 'TableRow';

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn(
                'text-text-secondary h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0',
                className
            )}
            {...props}
        />
    )
);
TableHead.displayName = 'TableHead';

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, ...props }, ref) => (
        <td
            ref={ref}
            className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
            {...props}
        />
    )
);
TableCell.displayName = 'TableCell';

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
    ({ className, ...props }, ref) => (
        <caption
            ref={ref}
            className={cn('text-text-secondary mt-4 text-sm', className)}
            {...props}
        />
    )
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
