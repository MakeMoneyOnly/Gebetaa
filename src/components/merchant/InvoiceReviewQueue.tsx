'use client';

import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { formatLocalizedDate } from '@/lib/format/et';
import type { AppLocale } from '@/lib/i18n/locale';

export type InvoiceRow = {
    id: string;
    invoice_number: string;
    supplier_name: string;
    status: 'pending_review' | 'approved' | 'disputed' | 'paid' | 'voided';
    currency: string;
    total_amount: number;
    due_at: string | null;
    created_at: string;
};

interface InvoiceReviewQueueProps {
    invoices: InvoiceRow[];
    loading: boolean;
    creating: boolean;
    parsing: boolean;
    ingesting: boolean;
    locale: AppLocale;
    onIngestInvoice: (payload: {
        file: File;
        provider?: 'auto' | 'oss' | 'azure_document_intelligence' | 'google_document_ai' | 'aws_textract';
        supplier_hint?: string;
        currency?: string;
    }) => Promise<{
        draft: {
            supplier_name: string;
            invoice_number: string | null;
            currency: string;
            subtotal: number;
            tax_amount: number;
            total_amount: number;
            issued_at: string | null;
            due_at: string | null;
        };
        line_items: Array<{
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
        }>;
        summary: {
            mapped_items: number;
            unmapped_items: number;
            average_match_confidence: number;
        };
        metadata: {
            provider: 'oss' | 'azure_document_intelligence' | 'google_document_ai' | 'aws_textract';
            provider_confidence: number;
        };
        addis_review_policy: {
            city_profile: string;
            auto_receive_eligible: boolean;
            recommended_mode: 'auto_receive' | 'human_review';
        };
    }>;
    onParseInvoice: (payload: { raw_text: string; currency?: string }) => Promise<{
        draft: {
            supplier_name: string;
            invoice_number: string | null;
            currency: string;
            subtotal: number;
            tax_amount: number;
            total_amount: number;
            issued_at: string | null;
            due_at: string | null;
        };
        line_items: Array<{
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
        }>;
        summary: {
            mapped_items: number;
            unmapped_items: number;
            average_match_confidence: number;
        };
    }>;
    onCreateInvoice: (payload: {
        invoice_number?: string;
        supplier_name: string;
        status: InvoiceRow['status'];
        currency: string;
        subtotal: number;
        tax_amount: number;
        due_at?: string;
        line_items?: Array<{
            description: string;
            normalized_description?: string;
            qty?: number | null;
            unit_price?: number | null;
            line_total?: number | null;
            uom?: string | null;
            inventory_item_id?: string | null;
            inventory_item_name?: string | null;
            match_confidence?: number;
            match_method?: 'exact' | 'contains' | 'token_overlap' | 'none';
        }>;
        ocr_source?: {
            provider:
                | 'manual_text'
                | 'google_vision'
                | 'google_document_ai'
                | 'aws_textract'
                | 'azure_document_intelligence'
                | 'oss';
            raw_text_excerpt?: string;
            parsed_at?: string;
            average_match_confidence?: number;
        };
        notes?: string;
    }) => Promise<void>;
}

export function InvoiceReviewQueue({
    invoices,
    loading,
    creating,
    parsing,
    ingesting,
    locale,
    onIngestInvoice,
    onParseInvoice,
    onCreateInvoice,
}: InvoiceReviewQueueProps) {
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [rawText, setRawText] = useState('');
    const [supplierName, setSupplierName] = useState('');
    const [status, setStatus] = useState<InvoiceRow['status']>('pending_review');
    const [subtotal, setSubtotal] = useState('0');
    const [taxAmount, setTaxAmount] = useState('0');
    const [dueAt, setDueAt] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [provider, setProvider] = useState<
        'auto' | 'oss' | 'azure_document_intelligence' | 'google_document_ai' | 'aws_textract'
    >('auto');
    const [ingestMeta, setIngestMeta] = useState<{
        provider: 'oss' | 'azure_document_intelligence' | 'google_document_ai' | 'aws_textract';
        provider_confidence: number;
        recommended_mode: 'auto_receive' | 'human_review';
    } | null>(null);
    const [lineItems, setLineItems] = useState<
        Array<{
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
        }>
    >([]);
    const [parseSummary, setParseSummary] = useState<{
        mapped_items: number;
        unmapped_items: number;
        average_match_confidence: number;
    } | null>(null);

    const submitParse = async () => {
        if (!rawText.trim()) return;
        const parsed = await onParseInvoice({ raw_text: rawText.trim(), currency: 'ETB' });

        setSupplierName(parsed.draft.supplier_name);
        setInvoiceNumber(parsed.draft.invoice_number ?? '');
        setSubtotal(String(parsed.draft.subtotal));
        setTaxAmount(String(parsed.draft.tax_amount));
        if (parsed.draft.due_at) {
            setDueAt(parsed.draft.due_at.slice(0, 10));
        }
        setLineItems(parsed.line_items);
        setParseSummary(parsed.summary);
        setIngestMeta(null);
    };

    const submitIngest = async () => {
        if (!selectedFile) return;
        const parsed = await onIngestInvoice({
            file: selectedFile,
            provider,
            supplier_hint: supplierName.trim() || undefined,
            currency: 'ETB',
        });

        setSupplierName(parsed.draft.supplier_name);
        setInvoiceNumber(parsed.draft.invoice_number ?? '');
        setSubtotal(String(parsed.draft.subtotal));
        setTaxAmount(String(parsed.draft.tax_amount));
        if (parsed.draft.due_at) {
            setDueAt(parsed.draft.due_at.slice(0, 10));
        }
        setLineItems(parsed.line_items);
        setParseSummary(parsed.summary);
        setIngestMeta({
            provider: parsed.metadata.provider,
            provider_confidence: parsed.metadata.provider_confidence,
            recommended_mode: parsed.addis_review_policy.recommended_mode,
        });
    };

    const submitCreate = async () => {
        const subtotalValue = Number(subtotal);
        const taxValue = Number(taxAmount);
        if (!supplierName.trim() || !Number.isFinite(subtotalValue) || !Number.isFinite(taxValue))
            return;

        await onCreateInvoice({
            ...(invoiceNumber.trim() ? { invoice_number: invoiceNumber.trim() } : {}),
            supplier_name: supplierName.trim(),
            status,
            currency: 'ETB',
            subtotal: subtotalValue,
            tax_amount: taxValue,
            ...(dueAt ? { due_at: new Date(dueAt).toISOString() } : {}),
            ...(lineItems.length > 0 ? { line_items: lineItems } : {}),
            ...(lineItems.length > 0
                ? {
                      ocr_source: {
                          provider: ingestMeta?.provider ?? ('manual_text' as const),
                          raw_text_excerpt: rawText.trim().slice(0, 4000),
                          parsed_at: new Date().toISOString(),
                          average_match_confidence:
                              parseSummary?.average_match_confidence ?? undefined,
                      },
                  }
                : {}),
            ...(notes.trim() ? { notes: notes.trim() } : {}),
        });

        setInvoiceNumber('');
        setRawText('');
        setSupplierName('');
        setStatus('pending_review');
        setSubtotal('0');
        setTaxAmount('0');
        setDueAt('');
        setNotes('');
        setSelectedFile(null);
        setLineItems([]);
        setParseSummary(null);
        setIngestMeta(null);
    };

    return (
        <section className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Invoice Review Queue</h3>
                    <p className="text-sm text-gray-500">
                        Capture supplier invoices and review approval/payment status.
                    </p>
                </div>
                <FileText className="h-5 w-5 text-gray-500" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
                <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp,image/tiff"
                    onChange={event => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm file:mr-3 file:border-0 file:bg-transparent md:col-span-3"
                />
                <select
                    value={provider}
                    onChange={event =>
                        setProvider(
                            event.target.value as
                                | 'auto'
                                | 'oss'
                                | 'azure_document_intelligence'
                                | 'google_document_ai'
                                | 'aws_textract'
                        )
                    }
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 md:col-span-2"
                >
                    <option value="auto">Provider: Auto (Addis default)</option>
                    <option value="oss">Provider: Open-source OCR</option>
                    <option value="azure_document_intelligence">Provider: Azure DI</option>
                    <option value="google_document_ai">Provider: Google DocAI</option>
                    <option value="aws_textract">Provider: AWS Textract</option>
                </select>
                <button
                    type="button"
                    onClick={submitIngest}
                    disabled={ingesting || !selectedFile}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50 md:col-span-1"
                >
                    {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Ingest file
                </button>
                <textarea
                    value={rawText}
                    onChange={event => setRawText(event.target.value)}
                    placeholder="Paste OCR text from supplier invoice"
                    className="min-h-24 rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 md:col-span-6"
                />
                <button
                    type="button"
                    onClick={submitParse}
                    disabled={parsing || !rawText.trim()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 disabled:opacity-50 md:col-span-2"
                >
                    {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Auto-fill from OCR text
                </button>
                <input
                    value={invoiceNumber}
                    onChange={event => setInvoiceNumber(event.target.value)}
                    placeholder="Invoice number"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 md:col-span-2"
                />
                <input
                    value={supplierName}
                    onChange={event => setSupplierName(event.target.value)}
                    placeholder="Supplier name"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400 md:col-span-2"
                />
                <select
                    value={status}
                    onChange={event => setStatus(event.target.value as InvoiceRow['status'])}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                >
                    <option value="pending_review">Pending review</option>
                    <option value="approved">Approved</option>
                    <option value="disputed">Disputed</option>
                    <option value="paid">Paid</option>
                    <option value="voided">Voided</option>
                </select>
                <input
                    value={subtotal}
                    onChange={event => setSubtotal(event.target.value)}
                    inputMode="decimal"
                    placeholder="Subtotal"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    value={taxAmount}
                    onChange={event => setTaxAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="Tax"
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <input
                    type="date"
                    value={dueAt}
                    onChange={event => setDueAt(event.target.value)}
                    className="h-10 rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                />
                <div className="flex gap-2">
                    <input
                        value={notes}
                        onChange={event => setNotes(event.target.value)}
                        placeholder="Notes"
                        className="h-10 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-gray-400"
                    />
                    <button
                        type="button"
                        onClick={submitCreate}
                        disabled={creating}
                        className="bg-brand-crimson inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Add
                    </button>
                </div>
            </div>

            {parseSummary ? (
                <p className="mt-3 text-xs text-gray-600">
                    OCR mapped {parseSummary.mapped_items} line items,{' '}
                    {parseSummary.unmapped_items} need review (avg confidence{' '}
                    {Math.round(parseSummary.average_match_confidence * 100)}%).
                </p>
            ) : null}
            {ingestMeta ? (
                <p className="mt-1 text-xs text-gray-600">
                    Provider {ingestMeta.provider} confidence{' '}
                    {Math.round(ingestMeta.provider_confidence * 100)}% · Addis recommendation:{' '}
                    {ingestMeta.recommended_mode === 'auto_receive'
                        ? 'Auto receive eligible'
                        : 'Human review required'}
                </p>
            ) : null}

            {loading ? (
                <p className="mt-4 text-sm text-gray-500">Loading invoices...</p>
            ) : invoices.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No invoices in queue.</p>
            ) : (
                <div className="mt-4 space-y-2">
                    {invoices.map(invoice => (
                        <div key={invoice.id} className="rounded-xl border border-gray-100 p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {invoice.invoice_number}
                                    </p>
                                    <p className="text-xs text-gray-600">{invoice.supplier_name}</p>
                                </div>
                                <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-700 uppercase">
                                    {invoice.status.replace('_', ' ')}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                {invoice.currency} {Number(invoice.total_amount).toFixed(2)}
                                {invoice.due_at
                                    ? ` · due ${formatLocalizedDate(invoice.due_at, locale)}`
                                    : ''}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
