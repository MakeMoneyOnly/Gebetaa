export type CommandCenterRange = 'today' | 'week' | 'month';

export interface CommandCenterMetrics {
    orders_in_flight: number;
    avg_ticket_time_minutes: number;
    active_tables: number;
    open_requests: number;
    payment_success_rate: number;
    gross_sales_today: number;
    gross_sales_previous: number;
    total_orders_today: number;
    avg_order_value_etb: number;
    unique_tables_today: number;
}

export interface AttentionItem {
    id: string;
    type: 'order' | 'service_request' | 'alert';
    label: string;
    status: string;
    severity?: string | null;
    created_at: string | null;
    table_number: string | null;
}

export interface CommandCenterData {
    metrics: CommandCenterMetrics;
    attention_queue: AttentionItem[];
    alert_summary?: {
        open_alerts: number;
    };
    sync_status: {
        generated_at: string;
        source: string;
    };
}
