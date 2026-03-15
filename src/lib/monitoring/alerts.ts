/**
 * Telegram Alert System
 *
 * Addresses CRIT-08 from ENTERPRISE_MASTER_BLUEPRINT Section 13
 * Provides critical alerting via Telegram for production incidents.
 *
 * Alert Types:
 * - Critical: POS offline, payment failures, database down
 * - Warning: High latency, queue backlog, low stock
 *
 * @see docs/1. Engineering Foundation/0. ENTERPRISE_MASTER_BLUEPRINT.md - Sprint 1.7
 */

/**
 * Alert severity levels
 */
export type AlertLevel = 'critical' | 'warning' | 'info';

/**
 * Alert context with additional metadata
 */
export interface AlertContext {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Configuration for Telegram alerts
 */
interface TelegramConfig {
    botToken: string | undefined;
    chatId: string | undefined;
    enabled: boolean;
}

/**
 * Get Telegram configuration from environment
 */
function getTelegramConfig(): TelegramConfig {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

    return {
        botToken,
        chatId,
        enabled: !!(botToken && chatId),
    };
}

/**
 * Format alert message for Telegram (Markdown format)
 */
function formatAlertMessage(level: AlertLevel, message: string, context?: AlertContext): string {
    const emoji = level === 'critical' ? '🔴' : level === 'warning' ? '🟡' : 'ℹ️';
    const levelText = level === 'critical' ? 'CRITICAL' : level === 'warning' ? 'Warning' : 'Info';

    const lines: string[] = [`${emoji} *Gebeta ${levelText}*`, '', message];

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
        lines.push('');
        for (const [key, value] of Object.entries(context)) {
            if (value !== undefined) {
                // Escape special characters in Markdown
                const escapedKey = escapeMarkdown(key);
                const escapedValue = escapeMarkdown(String(value));
                lines.push(`*${escapedKey}:* ${escapedValue}`);
            }
        }
    }

    // Add timestamp in Addis Ababa timezone
    lines.push('');
    const timestamp = new Date().toLocaleString('am-ET', {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
    lines.push(`_${escapeMarkdown(timestamp)} EAT_`);

    return lines.join('\n');
}

/**
 * Escape special characters for Telegram Markdown
 * @see https://core.telegram.org/bots/api#markdown-style
 */
function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/**
 * Send alert to Telegram
 *
 * @param level - Alert severity level
 * @param message - Alert message
 * @param context - Optional additional context
 * @returns Promise<boolean> - Whether the alert was sent successfully
 *
 * @example
 * // Critical alert for POS offline
 * await sendAlert('critical', 'POS device has not synced for 5 minutes', {
 *   restaurant_id: 'rest-123',
 *   restaurant_name: 'Saba Grill',
 *   device_type: 'pos',
 *   last_sync: '5 minutes ago',
 * });
 */
export async function sendAlert(
    level: AlertLevel,
    message: string,
    context?: AlertContext
): Promise<boolean> {
    const config = getTelegramConfig();

    if (!config.enabled) {
        // Log to console if Telegram is not configured
        console.warn(
            `[ALERT ${level.toUpperCase()}] Telegram alerts not configured. Message: ${message}`,
            context
        );
        return false;
    }

    try {
        const text = formatAlertMessage(level, message, context);

        const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.chatId,
                text,
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Failed to send Telegram alert: ${response.status} ${errorText}`);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to send Telegram alert:', error);
        return false;
    }
}

/**
 * Send critical alert (convenience wrapper)
 *
 * Use for:
 * - POS offline during business hours
 * - Payment webhook silent for 10+ minutes
 * - Payment failure rate > 5%
 * - Database connection pool > 80%
 * - Job queue backlog > 100 jobs
 */
export async function sendCriticalAlert(message: string, context?: AlertContext): Promise<boolean> {
    return sendAlert('critical', message, context);
}

/**
 * Send warning alert (convenience wrapper)
 *
 * Use for:
 * - API P99 latency > 2s
 * - Low stock warnings
 * - Non-critical service degradation
 */
export async function sendWarningAlert(message: string, context?: AlertContext): Promise<boolean> {
    return sendAlert('warning', message, context);
}

/**
 * Send info alert (convenience wrapper)
 *
 * Use for:
 * - Deployment notifications
 * - Scheduled maintenance
 * - Feature flag changes
 */
export async function sendInfoAlert(message: string, context?: AlertContext): Promise<boolean> {
    return sendAlert('info', message, context);
}

/**
 * Predefined alert types for common scenarios
 */
export const Alerts = {
    /**
     * POS device has not synced recently
     */
    posOffline: (restaurantId: string, restaurantName: string, lastSyncMinutes: number) =>
        sendCriticalAlert('POS device has not synced for 5+ minutes during business hours', {
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            last_sync_minutes: lastSyncMinutes,
            action: 'Restaurant may be taking paper orders',
        }),

    /**
     * Payment webhook has not been received
     */
    paymentWebhookSilent: (provider: string, minutesSinceLast: number) =>
        sendCriticalAlert(
            `No ${provider} webhook received in ${minutesSinceLast} minutes after payment initiation`,
            {
                provider,
                minutes_since_last: minutesSinceLast,
                action: 'Revenue may need manual confirmation',
            }
        ),

    /**
     * Payment failure rate is high
     */
    paymentFailureRate: (
        provider: string,
        failureRate: number,
        failureCount: number,
        windowMinutes: number
    ) =>
        sendCriticalAlert(`Payment failure rate exceeds 5% for ${provider}`, {
            provider,
            failure_rate_percent: failureRate.toFixed(1),
            failure_count: failureCount,
            window_minutes: windowMinutes,
        }),

    /**
     * Database connection pool is high
     */
    dbPoolHigh: (utilizationPercent: number, activeConnections: number) =>
        sendCriticalAlert('Database connection pool utilization exceeds 80%', {
            utilization_percent: utilizationPercent,
            active_connections: activeConnections,
            action: 'Cascading failures may occur',
        }),

    /**
     * Job queue backlog is building
     */
    jobQueueBacklog: (queueDepth: number, queueName: string) =>
        sendCriticalAlert('Job queue backlog exceeds 100 jobs', {
            queue_depth: queueDepth,
            queue_name: queueName,
            action: 'ERCA or payments may be delayed',
        }),

    /**
     * API latency is high
     */
    apiLatencyHigh: (endpoint: string, p99Latency: number) =>
        sendWarningAlert(`API P99 latency exceeds 2 seconds for ${endpoint}`, {
            endpoint,
            p99_latency_ms: p99Latency,
        }),

    /**
     * Low stock alert for restaurant
     */
    lowStock: (
        restaurantId: string,
        restaurantName: string,
        itemName: string,
        currentStock: number,
        reorderLevel: number
    ) =>
        sendWarningAlert(`Low stock: ${itemName}`, {
            restaurant_id: restaurantId,
            restaurant_name: restaurantName,
            item_name: itemName,
            current_stock: currentStock,
            reorder_level: reorderLevel,
        }),

    /**
     * Service health check failed
     */
    healthCheckFailed: (service: string, error: string, endpoint?: string) =>
        sendCriticalAlert(`Health check failed for ${service}`, {
            service,
            error: error.substring(0, 200), // Truncate long errors
            endpoint: endpoint || 'N/A',
        }),

    /**
     * Deployment notification
     */
    deployment: (version: string, environment: string, deployer?: string) =>
        sendInfoAlert(`Deployment completed`, {
            version,
            environment,
            deployer: deployer || 'CI/CD',
            timestamp: new Date().toISOString(),
        }),

    /**
     * Sentry error spike detected
     */
    errorSpike: (
        errorType: string,
        count: number,
        restaurantId?: string,
        timeWindow: string = '10 minutes'
    ) =>
        sendWarningAlert(`Error spike detected: ${errorType}`, {
            error_type: errorType,
            error_count: count,
            time_window: timeWindow,
            restaurant_id: restaurantId || 'N/A',
        }),
} as const;

/**
 * Check if alerts are enabled
 */
export function areAlertsEnabled(): boolean {
    return getTelegramConfig().enabled;
}

/**
 * Test alert system (sends a test message)
 * Use this to verify Telegram configuration
 */
export async function testAlerts(): Promise<{
    success: boolean;
    message: string;
}> {
    const config = getTelegramConfig();

    if (!config.enabled) {
        return {
            success: false,
            message:
                'Telegram alerts not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALERT_CHAT_ID.',
        };
    }

    const success = await sendInfoAlert('Test alert from Gebeta monitoring', {
        test: true,
        timestamp: new Date().toISOString(),
    });

    return {
        success,
        message: success
            ? 'Test alert sent successfully'
            : 'Failed to send test alert. Check bot token and chat ID.',
    };
}

const alertSystem = {
    sendAlert,
    sendCriticalAlert,
    sendWarningAlert,
    sendInfoAlert,
    Alerts,
    areAlertsEnabled,
    testAlerts,
};

export default alertSystem;
