/**
 * Fiscal Module Barrel Export
 * MED-024: ERCA integration and fiscal printer support
 */

// ERCA Service
export {
    ERCAService,
    getERCAService,
    extractVAT,
    calculateVAT,
    etbToSantim,
    santimToEtb,
    generateInvoiceNumber,
    VAT_RATE,
    VAT_EXTRACTION_RATE,
    SANTIM_PER_ETB,
    MAX_RETRY_ATTEMPTS,
    RETENTION_YEARS,
    type ERCAInvoicePayload,
    type ERCALineItem,
    type ERCASubmissionResult,
    type ERCAOrderData,
    type VATSummary,
    type ERCAConfig,
} from './erca-service';

// MoR Fiscal Client
export {
    submitFiscalTransaction,
    isMorLiveConfigured,
    FiscalSubmissionError,
    type FiscalLineItem,
    type FiscalSubmissionRequest,
    type FiscalSubmissionResult,
} from './mor-client';

// Offline Queue for fiscal submissions
export {
    queueFiscalJob,
    getPendingFiscalJobs,
    markFiscalJobSubmitted,
    markFiscalJobFailed,
    type FiscalQueueJob,
    type FiscalJobStatus,
} from './offline-queue';
