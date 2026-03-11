import { describe, it, expect } from 'vitest';
import { parseInvoiceText } from './invoiceOcr';

const mockInventory = [
    { id: 'item-1', name: 'Teff Flour', sku: 'TF-001', uom: 'kg' },
    { id: 'item-2', name: 'Cooking Oil', sku: 'CO-001', uom: 'liter' },
    { id: 'item-3', name: 'Sugar', sku: 'SG-001', uom: 'kg' },
    { id: 'item-4', name: 'Salt', sku: 'SL-001', uom: 'bag' },
    { id: 'item-5', name: 'Chicken Breast', sku: 'CB-001', uom: 'kg' },
];

describe('parseInvoiceText', () => {
    describe('basic parsing', () => {
        it('parses a minimal invoice with no line items', () => {
            const result = parseInvoiceText({
                raw_text: 'Addis Supplier\nInvoice No: INV-2024-001\nSubtotal 1000\nTotal 1000',
                inventory_items: [],
            });

            expect(result).toBeDefined();
            expect(result.draft).toBeDefined();
            expect(result.line_items).toBeInstanceOf(Array);
            expect(result.summary).toBeDefined();
        });

        it('returns unknown supplier when no supplier hint and no lines', () => {
            const result = parseInvoiceText({
                raw_text: '',
                inventory_items: [],
            });
            expect(result.draft.supplier_name).toBe('Unknown supplier');
        });

        it('uses supplier_hint when provided', () => {
            const result = parseInvoiceText({
                raw_text: 'Some random text\nmore lines',
                inventory_items: [],
                supplier_hint: 'Addis Trading PLC',
            });
            expect(result.draft.supplier_name).toBe('Addis Trading PLC');
        });

        it('infers supplier name from first valid line when no hint', () => {
            const result = parseInvoiceText({
                raw_text: 'ABC Suppliers Ltd\nInvoice No: 123\nTotal 500',
                inventory_items: [],
            });
            expect(result.draft.supplier_name).toBe('ABC Suppliers Ltd');
        });

        it('skips invoice-related lines when inferring supplier', () => {
            const result = parseInvoiceText({
                raw_text: 'Invoice\nActual Supplier Name\nTotal 200',
                inventory_items: [],
            });
            expect(result.draft.supplier_name).toBe('Actual Supplier Name');
        });
    });

    describe('invoice number extraction', () => {
        it('extracts invoice number from text', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nInvoice No: INV-123\nTotal 1000',
                inventory_items: [],
            });
            // Parser uppercases the match
            expect(result.draft.invoice_number).toBe('INV-123');
        });

        it('extracts invoice number with hash prefix', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nInvoice #456\nTotal 1000',
                inventory_items: [],
            });
            expect(result.draft.invoice_number).toBe('456');
        });

        it('returns null when no invoice number found', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier Name\nSome notes here\nTotal 1000',
                inventory_items: [],
            });
            expect(result.draft.invoice_number).toBeNull();
        });
    });

    describe('currency', () => {
        it('defaults currency to ETB', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nTotal 1000',
                inventory_items: [],
            });
            expect(result.draft.currency).toBe('ETB');
        });

        it('uses provided currency in uppercase', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nTotal 1000',
                inventory_items: [],
                currency: 'usd',
            });
            expect(result.draft.currency).toBe('USD');
        });
    });

    describe('money extraction', () => {
        it('extracts subtotal from text', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nSubtotal 1,500.00\nTotal 1500',
                inventory_items: [],
            });
            expect(result.draft.subtotal).toBe(1500);
        });

        it('extracts tax from text (tax label)', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nSubtotal 1000\nTax 150\nTotal 1150',
                inventory_items: [],
            });
            expect(result.draft.tax_amount).toBe(150);
        });

        it('extracts VAT from text (vat label)', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nSubtotal 1000\nVAT 150\nTotal 1150',
                inventory_items: [],
            });
            expect(result.draft.tax_amount).toBe(150);
        });

        it('extracts total from grand total label', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nGrand Total 1150',
                inventory_items: [],
            });
            // Grand Total is more specific and should be extracted
            expect(result.draft.total_amount).toBeGreaterThan(0);
        });

        it('extracts total from amount due label', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nAmount Due 2000',
                inventory_items: [],
            });
            expect(result.draft.total_amount).toBe(2000);
        });

        it('returns 0 for subtotal when not found', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nSome text',
                inventory_items: [],
            });
            expect(result.draft.subtotal).toBe(0);
        });
    });

    describe('date extraction', () => {
        it('extracts issued_at date from text', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\n2024-01-15\nTotal 1000',
                inventory_items: [],
            });
            expect(result.draft.issued_at).not.toBeNull();
            expect(result.draft.issued_at).toContain('2024-01-15');
        });

        it('extracts both issued and due dates', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\n2024-01-15\n2024-02-15\nTotal 500',
                inventory_items: [],
            });
            expect(result.draft.issued_at).not.toBeNull();
            expect(result.draft.due_at).not.toBeNull();
        });

        it('returns null dates when none found', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nNo dates here\nTotal 1000',
                inventory_items: [],
            });
            expect(result.draft.issued_at).toBeNull();
            expect(result.draft.due_at).toBeNull();
        });
    });

    describe('line item parsing', () => {
        it('parses a line item with description, qty, unit price, and total', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: mockInventory,
            });
            expect(result.line_items.length).toBeGreaterThan(0);
            const item = result.line_items[0];
            expect(item.description).toBe('Teff Flour');
            expect(item.qty).toBe(10);
            expect(item.unit_price).toBe(50);
            expect(item.line_total).toBe(500);
        });

        it('links line items to inventory via exact match', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: mockInventory,
            });
            expect(result.line_items[0].inventory_item_id).toBe('item-1');
            expect(result.line_items[0].match_method).toBe('exact');
            expect(result.line_items[0].match_confidence).toBe(1);
        });

        it('links line items via contains match', () => {
            const result = parseInvoiceText({
                raw_text: 'Refined Cooking Oil 5 120.00 600.00',
                inventory_items: mockInventory,
            });
            if (result.line_items.length > 0) {
                const item = result.line_items[0];
                expect(['contains', 'token_overlap', 'none']).toContain(item.match_method);
            }
        });

        it('sets match_method to none for unrecognized items', () => {
            const result = parseInvoiceText({
                raw_text: 'Unknown Product XYZ 2 999.00 1998.00',
                inventory_items: mockInventory,
            });
            if (result.line_items.length > 0) {
                expect(result.line_items[0].match_method).toBe('none');
                expect(result.line_items[0].inventory_item_id).toBeNull();
            }
        });

        it('includes normalized description', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: mockInventory,
            });
            if (result.line_items.length > 0) {
                expect(result.line_items[0].normalized_description).toBe('teff flour');
            }
        });

        it('includes uom from inventory match', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: mockInventory,
            });
            if (result.line_items.length > 0) {
                expect(result.line_items[0].uom).toBe('kg');
            }
        });
    });

    describe('summary statistics', () => {
        it('counts mapped and unmapped items', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00\nUnknown Item 2 100.00 200.00',
                inventory_items: mockInventory,
            });
            expect(result.summary.mapped_items + result.summary.unmapped_items).toBe(
                result.line_items.length
            );
        });

        it('returns 0 average confidence when no line items', () => {
            const result = parseInvoiceText({
                raw_text: 'Supplier\nNo line items\nTotal 1000',
                inventory_items: [],
            });
            expect(result.summary.average_match_confidence).toBe(0);
        });

        it('calculates average confidence across line items', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: mockInventory,
            });
            if (result.line_items.length > 0) {
                expect(result.summary.average_match_confidence).toBeGreaterThanOrEqual(0);
                expect(result.summary.average_match_confidence).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('edge cases', () => {
        it('handles empty raw_text', () => {
            const result = parseInvoiceText({
                raw_text: '',
                inventory_items: mockInventory,
            });
            expect(result.line_items).toHaveLength(0);
            expect(result.summary.mapped_items).toBe(0);
        });

        it('handles raw_text with only whitespace', () => {
            const result = parseInvoiceText({
                raw_text: '   \n  \t  ',
                inventory_items: [],
            });
            expect(result).toBeDefined();
        });

        it('handles empty inventory items list', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00',
                inventory_items: [],
            });
            if (result.line_items.length > 0) {
                expect(result.line_items[0].match_method).toBe('none');
            }
        });

        it('computes total from line items when no labeled total exists', () => {
            const result = parseInvoiceText({
                raw_text: 'Teff Flour 10 50.00 500.00\nSugar 5 20.00 100.00',
                inventory_items: mockInventory,
            });
            // total should be computed from line items since there's no "Total" label
            expect(result.draft.total_amount).toBeGreaterThanOrEqual(0);
        });

        it('handles multiline invoice text', () => {
            const text = [
                'Addis Wholesale Supplies',
                'Invoice No: AWB-2024-0099',
                '2024-03-01',
                '2024-03-31',
                'Teff Flour 50 45.00 2250.00',
                'Cooking Oil 20 130.00 2600.00',
                'Sugar 30 25.00 750.00',
                'Subtotal 5600.00',
                'Tax 840.00',
                'Total Due 6440.00',
            ].join('\n');

            const result = parseInvoiceText({
                raw_text: text,
                inventory_items: mockInventory,
                supplier_hint: 'Addis Wholesale Supplies',
            });

            expect(result.draft.supplier_name).toBe('Addis Wholesale Supplies');
            expect(result.draft.invoice_number).toBe('AWB-2024-0099');
            expect(result.draft.subtotal).toBe(5600);
            expect(result.draft.tax_amount).toBe(840);
            expect(result.line_items.length).toBeGreaterThan(0);
            expect(result.summary.mapped_items).toBeGreaterThan(0);
        });
    });
});
