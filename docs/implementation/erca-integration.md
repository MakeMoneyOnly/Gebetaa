# ERCA Integration

## Overview

Gebeta integrates with the Ethiopian Revenue and Customs Authority (ERCA) for VAT compliance. All VAT-registered restaurants must fiscalize receipts through ERCA's digital invoicing system.

## Architecture

### Components

1. **ERCA Service** (`src/lib/fiscal/erca-service.ts`) - Main integration service
2. **MoR Client** (`src/lib/fiscal/mor-client.ts`) - Ministry of Revenue fiscal client
3. **Offline Queue** (`src/lib/fiscal/offline-queue.ts`) - Queue for offline fiscalization
4. **ERCA Submissions Table** - Audit trail of all submissions

### Flow

```
Order Created → VAT Calculated → Invoice Built → Submit to ERCA → Record Result
                      ↓                                  ↓
              15% Ethiopian VAT              Success: QR + Signature
              Tax-inclusive pricing           Failure: Retry Queue
```

## Environment Variables

| Variable                | Required    | Description                                   |
| ----------------------- | ----------- | --------------------------------------------- |
| `ERCA_API_URL`          | Production  | ERCA API endpoint URL                         |
| `ERCA_API_KEY`          | Production  | API key for authentication                    |
| `ERCA_SANDBOX_MODE`     | No          | Set to `true` for sandbox testing             |
| `ERCA_CERTIFICATE_PATH` | Production  | Path to digital certificate for signing       |
| `MOR_FISCAL_API_URL`    | Alternative | MoR fiscal API endpoint (alternative to ERCA) |
| `MOR_FISCAL_API_KEY`    | Alternative | MoR fiscal API key                            |

## Sandbox vs Production Mode

### Sandbox Mode

- Set `ERCA_SANDBOX_MODE=true`
- Uses stub responses with simulated QR codes and signatures
- No real submissions to ERCA
- Safe for development and testing

### Production Mode

- Requires valid `ERCA_API_URL` and `ERCA_API_KEY`
- Submits real invoices to ERCA
- Must have valid TIN (Taxpayer Identification Number)
- All submissions are legally binding

### Stub Mode (No API Configured)

- When neither ERCA nor MoR API is configured
- Records submissions in database with stub status
- QR code format: `stub:{TIN}:{invoice_number}:{amount}`
- Warning logged for each stub submission

## VAT Calculation

### Ethiopian VAT Rate

- Standard rate: **15%**
- Tax-inclusive pricing (VAT is included in displayed prices)
- VAT extraction formula: `VAT = Price × (15/115)`

### Code Reference

```typescript
import { extractVAT, calculateVAT, VAT_RATE } from '@/lib/fiscal/erca-service';

// Extract VAT from tax-inclusive price (1500 santim = 15 ETB)
const { netPriceSantim, vatPortionSantim } = extractVAT(1500);
// netPriceSantim: 1304, vatPortionSantim: 196

// Calculate VAT for tax-exclusive price
const vat = calculateVAT(1304); // 196 santim
```

## Invoice Submission

### Automatic Submission

Invoices are automatically submitted when:

1. An order is completed (status → `served`)
2. The restaurant has a valid VAT number
3. ERCA integration is enabled

### Manual Submission

```typescript
const ercaService = getERCAService();
const result = await ercaService.submitInvoice(orderId);
```

### Invoice Number Format

`{RESTAURANT_PREFIX}-{ORDER_NUMBER}`

- Restaurant prefix: First 8 characters of restaurant ID (uppercase)
- Example: `ABCD1234-001234`

## Error Handling and Retry

### Retry Logic

- Maximum retry attempts: **5**
- Failed submissions are recorded with `status: 'failed'`
- Retry via `retrySubmission(submissionId)`

### Common Errors

| Error             | Cause                         | Resolution                   |
| ----------------- | ----------------------------- | ---------------------------- |
| Network timeout   | Connectivity issues           | Automatic retry with backoff |
| Invalid TIN       | Restaurant TIN not registered | Verify TIN with ERCA         |
| Duplicate invoice | Invoice already submitted     | Check existing submission    |
| Rate limited      | Too many requests             | Implement request queuing    |

### Failed Submission Queue

```typescript
const failed = await ercaService.getFailedSubmissions(restaurantId);
for (const submission of failed) {
    await ercaService.retrySubmission(submission.id);
}
```

## Reporting

### Daily VAT Summary

```typescript
const summary = await ercaService.generateDailyVATSummary(restaurantId, '2024-01-15');
// Returns: { date, invoice_count, total_revenue_etb, total_vat_etb, pending_count, failed_count }
```

### Monthly VAT Report

```typescript
const report = await ercaService.generateMonthlyVATReport(restaurantId, 2024, 1);
// Returns: { restaurant_id, period, total_invoices, total_revenue_etb, total_vat_etb, daily_summaries }
```

## Compliance Requirements

### Record Retention

- Ethiopian law requires **7 years** of fiscal records
- All submissions stored in `erca_submissions` table
- Include: invoice number, amounts, timestamps, QR payload, digital signature

### Audit Trail

- Every submission logged with full request/response data
- Conflict resolution logged for concurrent submissions
- Failed submissions tracked with error messages

## Testing with ERCA Sandbox

1. Configure sandbox environment:

    ```env
    ERCA_API_URL=https://sandbox.erca.gov.et/api/v1
    ERCA_API_KEY=your-sandbox-key
    ERCA_SANDBOX_MODE=true
    ```

2. Run ERCA service tests:

    ```bash
    pnpm test src/lib/fiscal/__tests__/erca-service.test.ts
    ```

3. Verify stub mode works without API:
    - Leave `ERCA_API_URL` and `ERCA_API_KEY` empty
    - All submissions should record with stub status
    - Verify `warning` field in response

4. Test with ERCA sandbox:
    - Contact ERCA for sandbox credentials
    - Verify invoice submission flow
    - Verify QR code and digital signature format
    - Test error scenarios (invalid TIN, duplicate invoice)
