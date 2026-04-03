# HIGH-013: Intentional SELECT \* Usage Documentation

## Purpose

This document tracks instances where `SELECT *` queries are intentionally kept for valid reasons.

## Criteria for Intentional SELECT \*

1. **Dynamic Schema**: Tables where columns may be added via extensions or plugins
2. **Full Entity Required**: Operations that genuinely need all columns (e.g., export, backup)
3. **Metadata/JSON Heavy**: Tables where most data is in a JSON/JSONB column
4. **Transitional Code**: Tables undergoing schema changes where column list would be fragile

## Documented Instances

### 1. `src/app/api/guest/verify-contact/route.ts`

**Lines**: 32-36, 130-134  
**Reason**: Guest verification requires access to phone/email columns that may be in a separate `guest_contacts` table or added via extension. The schema is transitional for P1 guest CRM features.  
**Action**: Keep SELECT \* with comment documentation. Revisit after guest contacts schema stabilizes.

### 2. `src/lib/services/queryMonitor.ts`

**Lines**: 91, 306  
**Reason**: Documentation/examples only - these are JSDoc comments showing usage patterns, not actual queries.  
**Action**: No change needed (not actual queries).

### 3. `src/lib/services/marketingCampaignService.ts`

**Lines**: 390, 452  
**Reason**: Guest data needed for email/SMS campaigns may include dynamic fields from integrations.  
**Action**: Keep for now, but consider explicit column selection after campaign schema stabilizes.

### 4. `src/lib/services/campaignService.ts`

**Lines**: 390, 452  
**Reason**: Same as marketingCampaignService - guest data for campaigns.  
**Action**: Keep for now, revisit after campaign features stabilize.

## Review Schedule

- **Next Review**: After P1 guest CRM features are complete
- **Owner**: Backend team
- **Related**: HIGH-013 SELECT \* optimization task

## Migration Guide

When converting SELECT \* to explicit columns:

1. **Check schema definition** in `supabase/migrations/` for the table
2. **Identify used columns** by tracing the response data usage
3. **Add explicit column list** using Supabase syntax:

    ```typescript
    // Before
    .select('*')

    // After
    .select('id, restaurant_id, name, status, created_at, updated_at')
    ```

4. **Test** that TypeScript types still compile
5. **Run** the endpoint to verify response shape

## Statistics

- **Total SELECT \* found**: ~167 instances
- **Hot paths fixed**: 12 instances (orders, kds, guests, tables APIs)
- **Intentional (documented)**: 4 instances
- **Remaining**: ~151 instances (lower priority paths)
