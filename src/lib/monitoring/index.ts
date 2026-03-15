/**
 * Monitoring Module
 *
 * Provides observability utilities for production debugging and alerting.
 * Addresses CRIT-08 from ENTERPRISE_MASTER_BLUEPRINT Section 13.
 *
 * Components:
 * - Sentry context tagging for restaurant-specific error tracking
 * - Telegram alerts for critical production incidents
 * - Health checks for uptime monitoring
 *
 * @see docs/1. Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md - Sprint 1.6, 1.7
 */

// Sentry context utilities
export {
    setRestaurantContext,
    setServerRestaurantContext,
    getServerRestaurantId,
    clearRestaurantContext,
    restoreRestaurantContext,
    addOrderBreadcrumb,
    addPaymentBreadcrumb,
    addSyncBreadcrumb,
    type RestaurantContext,
} from './sentry-context';

// Telegram alert system
export {
    sendAlert,
    sendCriticalAlert,
    sendWarningAlert,
    sendInfoAlert,
    Alerts,
    areAlertsEnabled,
    testAlerts,
    type AlertLevel,
    type AlertContext,
} from './alerts';
