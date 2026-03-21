# Lint Warning Tasks

## Summary

- **Original warnings**: 927 (primarily `@typescript-eslint/explicit-function-return-type`)
- **After config fix**: 62 warnings remaining
- **Approach taken**: Disabled `@typescript-eslint/explicit-function-return-type` rule as it requires adding return types to 900+ functions

## Remaining Warnings (62 total)

### @typescript-eslint/no-unused-vars (46 warnings)

These are actual unused variables/imports that should be fixed:

| #   | File                                                           | Line               | Issue                                                                   |
| --- | -------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| 1   | k6/peak-flow-scenarios.js                                      | 188                | `success` assigned but never used                                       |
| 2   | middleware.ts                                                  | 6                  | `hasExplicitVersionHeader` defined but never used                       |
| 3   | src/app\(guest)\[slug]\menu-client.tsx                         | 6                  | `Drawer` defined but never used                                         |
| 4   | src/app\api\delivery\aggregator\orders\route.ts                | 139                | `platform` assigned but never used                                      |
| 5   | src/app\api\menu\items\[itemId]\upsell\route.ts                | 4                  | `createClient` defined but never used                                   |
| 6   | src/app\api\orders\[orderId]\calculate-fire-times\route.ts     | 71                 | `restaurantId` assigned but never used                                  |
| 7   | src/app\api\reports\scheduled\route.ts                         | 15                 | `executeScheduledReport` defined but never used                         |
| 8   | src/components\kds\FireTimeIndicator.tsx                       | 28                 | `orderId` defined but never used                                        |
| 9   | src/components\marketing\CampaignBuilder.tsx                   | 34                 | `restaurantId` defined but never used                                   |
| 10  | src/components\merchant\MerchantDashboardClient.tsx            | 34-38              | `Star`, `Utensils`, `RefreshCw`, `cn` defined but never used            |
| 11  | src/components\reports\ScheduleReportModal.tsx                 | 54                 | `restaurantId` defined but never used                                   |
| 12  | src/components\ui\Pagination.tsx                               | 58, 144-145        | `totalDots`, `isFirst`, `isLast` assigned but never used                |
| 13  | src/domains\guests\resolvers.ts                                | 17, 50, 161        | `PAGINATION`, `limit`, `context` issues                                 |
| 14  | src/domains\orders\resolvers.ts                                | 16, 25             | `ErrorCode`, `PAGINATION` defined but never used                        |
| 15  | src/domains\payments\resolvers.ts                              | 59, 95             | `context` defined but never used                                        |
| 16  | src/domains\staff\resolvers.ts                                 | 17, 50, 153        | `PAGINATION`, `limit`, `context` issues                                 |
| 17  | src/lib\kds\prepTimeCalculator.ts                              | 252                | `db` assigned but never used                                            |
| 18  | src/lib\services\_\_tests\_\_\orderService.integration.test.ts | 20                 | `OrderValidationResult` defined but never used                          |
| 19  | src/lib\services\centralizedMenuService.ts                     | 411, 458, 492, 525 | `e` caught error not used                                               |
| 20  | src/lib\services\guestAnalyticsService.ts                      | 273-274, 467, 511  | `startDate`, `endDate`, `trends` issues                                 |
| 21  | src/lib\services\laborReportsService.ts                        | 198, 229, 328      | `salesPerStaff`, `groupBy`, `dailySummary` issues                       |
| 22  | src/lib\services\loyaltyService.ts                             | 13, 500            | `Json`, `reward` issues                                                 |
| 23  | src/lib\services\marketingCampaignService.ts                   | 10, 432            | `Json`, `options` issues                                                |
| 24  | src/lib\services\scheduledReportsService.ts                    | 431, 533, 590      | `timezone`, `filters`, `fileUrl` issues                                 |
| 25  | src/lib\supabase\_\_tests\_\_\service-role.integration.test.ts | 24, 170, 174       | `ServiceRoleAuditParams`, `logServiceRoleAudit`, `mockOperation` issues |

### react-hooks/exhaustive-deps (16 warnings)

These are missing useEffect dependencies that can cause bugs:

| #   | File                                            | Line          | Issue                    |
| --- | ----------------------------------------------- | ------------- | ------------------------ |
| 1   | src/app\(dashboard)\merchant\tables\page.tsx    | 129, 143      | Missing dependencies     |
| 2   | src/app\(guest)\[slug]\tracker\page.tsx         | 193, 202, 239 | Missing `fetchStatus`    |
| 3   | src/app\(pos)\waiter\pin\page.tsx               | 72            | Missing `handleSubmit`   |
| 4   | src/app\page.tsx                                | 607           | Missing `logs`           |
| 5   | src/components\delivery\AggregatorDashboard.tsx | 51            | Missing `loadData`       |
| 6   | src/features\menu\components\CartDrawer.tsx     | 206           | Missing `clearCart`      |
| 7   | src/hooks\useAbortableEffect.ts                 | 55            | Missing dependency issue |

## Recommended Fixes

1. **For unused variables**: Either remove the unused code or prefix with `_` to indicate intentional non-use
2. **For react-hooks/exhaustive-deps**: Either add the missing dependencies or use eslint-disable comments for intentional exclusions
