type InvoiceInventoryItem = {
    id: string;
    name: string;
    sku: string | null;
    uom: string;
};

type ParsedInvoiceLineItem = {
    description: string;
    normalized_description: string;
    qty: number | null;
    unit_price: number | null;
    line_total: number | null;
    uom: string | null;
    inventory_item_id: string | null;
    inventory_item_name: string | null;
    match_confidence: number;
    match_method: 'exact' | 'contains' | 'token_overlap' | 'none';
};

type ParsedInvoiceDraft = {
    supplier_name: string;
    invoice_number: string | null;
    currency: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    issued_at: string | null;
    due_at: string | null;
};

export type ParsedInvoiceResult = {
    draft: ParsedInvoiceDraft;
    line_items: ParsedInvoiceLineItem[];
    summary: {
        mapped_items: number;
        unmapped_items: number;
        average_match_confidence: number;
    };
};

const MONEY_PATTERN = /(\d[\d,]*(?:\.\d{1,2})?)/g;
const DATE_PATTERN = /\b(\d{4}-\d{2}-\d{2}|\d{2}[\/-]\d{2}[\/-]\d{2,4})\b/g;
const LINE_ITEM_PATTERN =
    /^([A-Za-z][A-Za-z0-9\s\-_/().,&%]+?)\s+(\d+(?:\.\d{1,3})?)\s+(\d[\d,]*(?:\.\d{1,2})?)\s+(\d[\d,]*(?:\.\d{1,2})?)$/;

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(value: string) {
    return normalizeText(value)
        .split(' ')
        .map(token => token.trim())
        .filter(token => token.length > 1);
}

function parseMoney(value: string | undefined | null) {
    if (!value) return null;
    const cleaned = value.replace(/,/g, '').trim();
    const parsed = Number(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return Number(parsed.toFixed(2));
}

function parseDateValue(value: string | undefined | null) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
}

function extractLabelMoney(source: string, label: string, fallback = 0) {
    const pattern = new RegExp(`${label}[^\\d]{0,12}(\\d[\\d,]*(?:\\.\\d{1,2})?)`, 'i');
    const match = source.match(pattern);
    const parsed = parseMoney(match?.[1]);
    return parsed ?? fallback;
}

function extractInvoiceNumber(source: string) {
    const match = source.match(/invoice\s*(?:no|number|#)?\s*[:#]?\s*([a-z0-9\-\/]+)/i);
    return match?.[1]?.toUpperCase() ?? null;
}

function inferSupplierName(lines: string[], hint?: string) {
    if (hint?.trim()) return hint.trim();
    const skip = new Set(['invoice', 'bill to', 'subtotal', 'total', 'vat', 'tax', 'amount due']);
    for (const line of lines) {
        const normalized = line.toLowerCase();
        if (line.length < 3 || line.length > 120) continue;
        if (Array.from(skip).some(fragment => normalized.includes(fragment))) continue;
        return line.trim();
    }
    return 'Unknown supplier';
}

function extractDates(source: string) {
    const dates = Array.from(source.matchAll(DATE_PATTERN)).map(match => match[1]);
    const issuedAt = parseDateValue(dates[0] ?? null);
    const dueAt = parseDateValue(dates[1] ?? null);
    return { issuedAt, dueAt };
}

function matchInventoryItem(
    description: string,
    inventoryItems: InvoiceInventoryItem[]
): {
    item: InvoiceInventoryItem | null;
    confidence: number;
    method: 'exact' | 'contains' | 'token_overlap' | 'none';
} {
    const normalizedDescription = normalizeText(description);
    if (!normalizedDescription) {
        return { item: null, confidence: 0, method: 'none' };
    }

    for (const item of inventoryItems) {
        if (normalizeText(item.name) === normalizedDescription) {
            return { item, confidence: 1, method: 'exact' };
        }
    }

    for (const item of inventoryItems) {
        const normalizedName = normalizeText(item.name);
        if (normalizedName && normalizedDescription.includes(normalizedName)) {
            return { item, confidence: 0.88, method: 'contains' };
        }
    }

    const descTokens = new Set(tokenize(description));
    let best: { item: InvoiceInventoryItem | null; confidence: number } = {
        item: null,
        confidence: 0,
    };

    for (const item of inventoryItems) {
        const itemTokens = new Set(tokenize(item.name));
        if (itemTokens.size === 0) continue;
        const overlap = Array.from(descTokens).filter(token => itemTokens.has(token)).length;
        const confidence = overlap / itemTokens.size;
        if (confidence > best.confidence) {
            best = { item, confidence };
        }
    }

    if (best.item && best.confidence >= 0.5) {
        return { item: best.item, confidence: Number(best.confidence.toFixed(2)), method: 'token_overlap' };
    }

    return { item: null, confidence: 0, method: 'none' };
}

function parseLineItem(line: string) {
    const match = line.match(LINE_ITEM_PATTERN);
    if (!match) return null;

    const description = match[1]?.trim() ?? '';
    const qty = parseMoney(match[2]);
    const unitPrice = parseMoney(match[3]);
    const lineTotal = parseMoney(match[4]);

    if (!description || qty === null || unitPrice === null || lineTotal === null) {
        return null;
    }

    return { description, qty, unitPrice, lineTotal };
}

export function parseInvoiceText(input: {
    raw_text: string;
    inventory_items: InvoiceInventoryItem[];
    supplier_hint?: string;
    currency?: string;
}): ParsedInvoiceResult {
    const lines = input.raw_text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const lineItems = lines
        .map(line => parseLineItem(line))
        .filter((line): line is NonNullable<typeof line> => Boolean(line))
        .slice(0, 200);

    const mappedLineItems: ParsedInvoiceLineItem[] = lineItems.map(lineItem => {
        const match = matchInventoryItem(lineItem.description, input.inventory_items);
        return {
            description: lineItem.description,
            normalized_description: normalizeText(lineItem.description),
            qty: lineItem.qty,
            unit_price: lineItem.unitPrice,
            line_total: lineItem.lineTotal,
            uom: match.item?.uom ?? null,
            inventory_item_id: match.item?.id ?? null,
            inventory_item_name: match.item?.name ?? null,
            match_confidence: match.confidence,
            match_method: match.method,
        };
    });

    const source = input.raw_text;
    const { issuedAt, dueAt } = extractDates(source);
    const subtotal = extractLabelMoney(source, 'subtotal');
    const taxAmount = extractLabelMoney(source, '(tax|vat)');
    const computedTotal = mappedLineItems.reduce((sum, item) => sum + (item.line_total ?? 0), 0);
    const labeledTotal = extractLabelMoney(source, '(grand\\s+total|total\\s+due|amount\\s+due|total)');
    const totalAmount = Number((labeledTotal || computedTotal || subtotal + taxAmount).toFixed(2));

    const mappedCount = mappedLineItems.filter(line => line.inventory_item_id).length;
    const averageConfidence =
        mappedLineItems.length === 0
            ? 0
            : Number(
                  (
                      mappedLineItems.reduce((sum, line) => sum + line.match_confidence, 0) /
                      mappedLineItems.length
                  ).toFixed(2)
              );

    return {
        draft: {
            supplier_name: inferSupplierName(lines, input.supplier_hint),
            invoice_number: extractInvoiceNumber(source),
            currency: (input.currency ?? 'ETB').toUpperCase(),
            subtotal: Number(subtotal.toFixed(2)),
            tax_amount: Number(taxAmount.toFixed(2)),
            total_amount: totalAmount,
            issued_at: issuedAt,
            due_at: dueAt,
        },
        line_items: mappedLineItems,
        summary: {
            mapped_items: mappedCount,
            unmapped_items: mappedLineItems.length - mappedCount,
            average_match_confidence: averageConfidence,
        },
    };
}
