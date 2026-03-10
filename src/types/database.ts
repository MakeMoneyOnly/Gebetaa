export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    public: {
        Tables: {
            agency_users: {
                Row: {
                    created_at: string | null;
                    id: string;
                    restaurant_ids: string[] | null;
                    role: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    restaurant_ids?: string[] | null;
                    role?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    restaurant_ids?: string[] | null;
                    role?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            alert_events: {
                Row: {
                    created_at: string;
                    entity_id: string | null;
                    entity_type: string;
                    id: string;
                    payload: Json;
                    resolved_at: string | null;
                    restaurant_id: string;
                    rule_id: string | null;
                    severity: string;
                    status: string;
                };
                Insert: {
                    created_at?: string;
                    entity_id?: string | null;
                    entity_type: string;
                    id?: string;
                    payload?: Json;
                    resolved_at?: string | null;
                    restaurant_id: string;
                    rule_id?: string | null;
                    severity?: string;
                    status?: string;
                };
                Update: {
                    created_at?: string;
                    entity_id?: string | null;
                    entity_type?: string;
                    id?: string;
                    payload?: Json;
                    resolved_at?: string | null;
                    restaurant_id?: string;
                    rule_id?: string | null;
                    severity?: string;
                    status?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'alert_events_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'alert_events_rule_id_fkey';
                        columns: ['rule_id'];
                        isOneToOne: false;
                        referencedRelation: 'alert_rules';
                        referencedColumns: ['id'];
                    },
                ];
            };
            alert_rules: {
                Row: {
                    condition_json: Json;
                    created_at: string;
                    enabled: boolean;
                    id: string;
                    name: string;
                    restaurant_id: string;
                    severity: string;
                    target_json: Json;
                    updated_at: string;
                };
                Insert: {
                    condition_json?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    name: string;
                    restaurant_id: string;
                    severity?: string;
                    target_json?: Json;
                    updated_at?: string;
                };
                Update: {
                    condition_json?: Json;
                    created_at?: string;
                    enabled?: boolean;
                    id?: string;
                    name?: string;
                    restaurant_id?: string;
                    severity?: string;
                    target_json?: Json;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'alert_rules_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            audit_logs: {
                Row: {
                    action: string;
                    created_at: string | null;
                    entity_id: string | null;
                    entity_type: string;
                    id: string;
                    metadata: Json | null;
                    new_value: Json | null;
                    old_value: Json | null;
                    restaurant_id: string | null;
                    telegram_user_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    action: string;
                    created_at?: string | null;
                    entity_id?: string | null;
                    entity_type: string;
                    id?: string;
                    metadata?: Json | null;
                    new_value?: Json | null;
                    old_value?: Json | null;
                    restaurant_id?: string | null;
                    telegram_user_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    action?: string;
                    created_at?: string | null;
                    entity_id?: string | null;
                    entity_type?: string;
                    id?: string;
                    metadata?: Json | null;
                    new_value?: Json | null;
                    old_value?: Json | null;
                    restaurant_id?: string | null;
                    telegram_user_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'audit_log_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            categories: {
                Row: {
                    created_at: string | null;
                    id: string;
                    name: string;
                    name_am: string | null;
                    order_index: number | null;
                    restaurant_id: string;
                    section: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    name: string;
                    name_am?: string | null;
                    order_index?: number | null;
                    restaurant_id: string;
                    section?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    name?: string;
                    name_am?: string | null;
                    order_index?: number | null;
                    restaurant_id?: string;
                    section?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'categories_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            delivery_partners: {
                Row: {
                    api_key: string | null;
                    created_at: string;
                    created_by: string | null;
                    credentials_ref: string | null;
                    display_name: string | null;
                    id: string;
                    last_sync_at: string | null;
                    provider: string;
                    restaurant_id: string;
                    settings_json: Json;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    api_key?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    credentials_ref?: string | null;
                    display_name?: string | null;
                    id?: string;
                    last_sync_at?: string | null;
                    provider: string;
                    restaurant_id: string;
                    settings_json?: Json;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    api_key?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    credentials_ref?: string | null;
                    display_name?: string | null;
                    id?: string;
                    last_sync_at?: string | null;
                    provider?: string;
                    restaurant_id?: string;
                    settings_json?: Json;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'delivery_partners_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            external_orders: {
                Row: {
                    acked_by: string | null;
                    acknowledged_at: string | null;
                    created_at: string;
                    currency: string;
                    delivery_partner_id: string | null;
                    id: string;
                    normalized_status: string;
                    payload_json: Json;
                    provider: string;
                    provider_order_id: string;
                    restaurant_id: string;
                    source_channel: string;
                    total_amount: number;
                    updated_at: string;
                };
                Insert: {
                    acked_by?: string | null;
                    acknowledged_at?: string | null;
                    created_at?: string;
                    currency?: string;
                    delivery_partner_id?: string | null;
                    id?: string;
                    normalized_status?: string;
                    payload_json?: Json;
                    provider: string;
                    provider_order_id: string;
                    restaurant_id: string;
                    source_channel?: string;
                    total_amount?: number;
                    updated_at?: string;
                };
                Update: {
                    acked_by?: string | null;
                    acknowledged_at?: string | null;
                    created_at?: string;
                    currency?: string;
                    delivery_partner_id?: string | null;
                    id?: string;
                    normalized_status?: string;
                    payload_json?: Json;
                    provider?: string;
                    provider_order_id?: string;
                    restaurant_id?: string;
                    source_channel?: string;
                    total_amount?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'external_orders_delivery_partner_id_fkey';
                        columns: ['delivery_partner_id'];
                        isOneToOne: false;
                        referencedRelation: 'delivery_partners';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'external_orders_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            global_orders: {
                Row: {
                    created_at: string | null;
                    currency: string | null;
                    external_order_id: string | null;
                    id: string;
                    items: Json;
                    status: string | null;
                    table_number: string | null;
                    tenant_id: string | null;
                    total_amount: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    currency?: string | null;
                    external_order_id?: string | null;
                    id?: string;
                    items: Json;
                    status?: string | null;
                    table_number?: string | null;
                    tenant_id?: string | null;
                    total_amount?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    currency?: string | null;
                    external_order_id?: string | null;
                    id?: string;
                    items?: Json;
                    status?: string | null;
                    table_number?: string | null;
                    tenant_id?: string | null;
                    total_amount?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'global_orders_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            guests: {
                Row: {
                    created_at: string;
                    email_hash: string | null;
                    fingerprint_hash: string | null;
                    first_seen_at: string;
                    id: string;
                    identity_key: string;
                    is_vip: boolean;
                    language: string;
                    last_seen_at: string;
                    lifetime_value: number;
                    metadata: Json;
                    name: string | null;
                    notes: string | null;
                    phone_hash: string | null;
                    restaurant_id: string;
                    tags: string[];
                    updated_at: string;
                    visit_count: number;
                };
                Insert: {
                    created_at?: string;
                    email_hash?: string | null;
                    fingerprint_hash?: string | null;
                    first_seen_at?: string;
                    id?: string;
                    identity_key: string;
                    is_vip?: boolean;
                    language?: string;
                    last_seen_at?: string;
                    lifetime_value?: number;
                    metadata?: Json;
                    name?: string | null;
                    notes?: string | null;
                    phone_hash?: string | null;
                    restaurant_id: string;
                    tags?: string[];
                    updated_at?: string;
                    visit_count?: number;
                };
                Update: {
                    created_at?: string;
                    email_hash?: string | null;
                    fingerprint_hash?: string | null;
                    first_seen_at?: string;
                    id?: string;
                    identity_key?: string;
                    is_vip?: boolean;
                    language?: string;
                    last_seen_at?: string;
                    lifetime_value?: number;
                    metadata?: Json;
                    name?: string | null;
                    notes?: string | null;
                    phone_hash?: string | null;
                    restaurant_id?: string;
                    tags?: string[];
                    updated_at?: string;
                    visit_count?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'guests_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            guest_visits: {
                Row: {
                    channel: string;
                    created_at: string;
                    guest_id: string;
                    id: string;
                    metadata: Json;
                    order_id: string | null;
                    restaurant_id: string;
                    spend: number;
                    table_id: string | null;
                    visited_at: string;
                };
                Insert: {
                    channel?: string;
                    created_at?: string;
                    guest_id: string;
                    id?: string;
                    metadata?: Json;
                    order_id?: string | null;
                    restaurant_id: string;
                    spend?: number;
                    table_id?: string | null;
                    visited_at?: string;
                };
                Update: {
                    channel?: string;
                    created_at?: string;
                    guest_id?: string;
                    id?: string;
                    metadata?: Json;
                    order_id?: string | null;
                    restaurant_id?: string;
                    spend?: number;
                    table_id?: string | null;
                    visited_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'guest_visits_guest_id_fkey';
                        columns: ['guest_id'];
                        isOneToOne: false;
                        referencedRelation: 'guests';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'guest_visits_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'guest_visits_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'guest_visits_table_id_fkey';
                        columns: ['table_id'];
                        isOneToOne: false;
                        referencedRelation: 'tables';
                        referencedColumns: ['id'];
                    },
                ];
            };
            inventory_items: {
                Row: {
                    cost_per_unit: number;
                    created_at: string;
                    created_by: string | null;
                    current_stock: number;
                    id: string;
                    is_active: boolean;
                    metadata: Json;
                    name: string;
                    reorder_level: number;
                    restaurant_id: string;
                    sku: string | null;
                    uom: string;
                    updated_at: string;
                };
                Insert: {
                    cost_per_unit?: number;
                    created_at?: string;
                    created_by?: string | null;
                    current_stock?: number;
                    id?: string;
                    is_active?: boolean;
                    metadata?: Json;
                    name: string;
                    reorder_level?: number;
                    restaurant_id: string;
                    sku?: string | null;
                    uom?: string;
                    updated_at?: string;
                };
                Update: {
                    cost_per_unit?: number;
                    created_at?: string;
                    created_by?: string | null;
                    current_stock?: number;
                    id?: string;
                    is_active?: boolean;
                    metadata?: Json;
                    name?: string;
                    reorder_level?: number;
                    restaurant_id?: string;
                    sku?: string | null;
                    uom?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'inventory_items_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            menu_items: {
                Row: {
                    allergens: string[] | null;
                    category_id: string;
                    connected_stations: string[];
                    created_at: string | null;
                    description: string | null;
                    description_am: string | null;
                    dietary_tags: string[] | null;
                    has_ar: boolean | null;
                    id: string;
                    image_url: string | null;
                    ingredients: string[] | null;
                    is_available: boolean | null;
                    is_chef_special: boolean | null;
                    is_fasting: boolean | null;
                    likes_count: number | null;
                    model_glb: string | null;
                    model_scale: string | null;
                    model_usdz: string | null;
                    modifiers: Json | null;
                    name: string;
                    name_am: string | null;
                    nutrition: Json | null;
                    order_count: number | null;
                    pairings: string[] | null;
                    popularity: number | null;
                    preparation_time: number | null;
                    preparation_time_minutes: number | null;
                    price: number;
                    rating: number | null;
                    reviews_count: number | null;
                    spicy_level: number | null;
                    station: string | null;
                    stock_quantity: number | null;
                    updated_at: string | null;
                };
                Insert: {
                    allergens?: string[] | null;
                    category_id: string;
                    connected_stations?: string[];
                    created_at?: string | null;
                    description?: string | null;
                    description_am?: string | null;
                    dietary_tags?: string[] | null;
                    has_ar?: boolean | null;
                    id?: string;
                    image_url?: string | null;
                    ingredients?: string[] | null;
                    is_available?: boolean | null;
                    is_chef_special?: boolean | null;
                    is_fasting?: boolean | null;
                    likes_count?: number | null;
                    model_glb?: string | null;
                    model_scale?: string | null;
                    model_usdz?: string | null;
                    modifiers?: Json | null;
                    name: string;
                    name_am?: string | null;
                    nutrition?: Json | null;
                    order_count?: number | null;
                    pairings?: string[] | null;
                    popularity?: number | null;
                    preparation_time?: number | null;
                    preparation_time_minutes?: number | null;
                    price: number;
                    rating?: number | null;
                    reviews_count?: number | null;
                    spicy_level?: number | null;
                    station?: string | null;
                    stock_quantity?: number | null;
                    updated_at?: string | null;
                };
                Update: {
                    allergens?: string[] | null;
                    category_id?: string;
                    connected_stations?: string[];
                    created_at?: string | null;
                    description?: string | null;
                    description_am?: string | null;
                    dietary_tags?: string[] | null;
                    has_ar?: boolean | null;
                    id?: string;
                    image_url?: string | null;
                    ingredients?: string[] | null;
                    is_available?: boolean | null;
                    is_chef_special?: boolean | null;
                    is_fasting?: boolean | null;
                    likes_count?: number | null;
                    model_glb?: string | null;
                    model_scale?: string | null;
                    model_usdz?: string | null;
                    modifiers?: Json | null;
                    name?: string;
                    name_am?: string | null;
                    nutrition?: Json | null;
                    order_count?: number | null;
                    pairings?: string[] | null;
                    popularity?: number | null;
                    preparation_time?: number | null;
                    preparation_time_minutes?: number | null;
                    price?: number;
                    rating?: number | null;
                    reviews_count?: number | null;
                    spicy_level?: number | null;
                    station?: string | null;
                    stock_quantity?: number | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'items_category_id_fkey';
                        columns: ['category_id'];
                        isOneToOne: false;
                        referencedRelation: 'categories';
                        referencedColumns: ['id'];
                    },
                ];
            };
            order_events: {
                Row: {
                    actor_user_id: string | null;
                    created_at: string;
                    event_type: string;
                    from_status: string | null;
                    id: string;
                    metadata: Json;
                    order_id: string;
                    restaurant_id: string;
                    to_status: string | null;
                };
                Insert: {
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type: string;
                    from_status?: string | null;
                    id?: string;
                    metadata?: Json;
                    order_id: string;
                    restaurant_id: string;
                    to_status?: string | null;
                };
                Update: {
                    actor_user_id?: string | null;
                    created_at?: string;
                    event_type?: string;
                    from_status?: string | null;
                    id?: string;
                    metadata?: Json;
                    order_id?: string;
                    restaurant_id?: string;
                    to_status?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'order_events_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'order_events_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            order_items: {
                Row: {
                    completed_at: string | null;
                    created_at: string | null;
                    id: string;
                    item_id: string;
                    modifiers: Json | null;
                    name: string;
                    notes: string | null;
                    order_id: string;
                    price: number;
                    quantity: number | null;
                    started_at: string | null;
                    station: string | null;
                    status: string | null;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id: string;
                    modifiers?: Json | null;
                    name: string;
                    notes?: string | null;
                    order_id: string;
                    price: number;
                    quantity?: number | null;
                    started_at?: string | null;
                    station?: string | null;
                    status?: string | null;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id?: string;
                    modifiers?: Json | null;
                    name?: string;
                    notes?: string | null;
                    order_id?: string;
                    price?: number;
                    quantity?: number | null;
                    started_at?: string | null;
                    station?: string | null;
                    status?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'order_items_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'menu_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'order_items_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                ];
            };
            orders: {
                Row: {
                    acknowledged_at: string | null;
                    bar_status: string | null;
                    chapa_verified: boolean;
                    chapa_tx_ref: string | null;
                    completed_at: string | null;
                    created_at: string | null;
                    customer_name: string | null;
                    customer_phone: string | null;
                    delivery_address: string | null;
                    guest_fingerprint: string | null;
                    id: string;
                    idempotency_key: string | null;
                    items: Json;
                    kitchen_status: string | null;
                    metadata: Json | null;
                    notes: string | null;
                    order_number: string;
                    order_type: string | null;
                    paid_at: string | null;
                    restaurant_id: string;
                    status: string | null;
                    table_number: string;
                    total_price: number;
                    updated_at: string | null;
                };
                Insert: {
                    acknowledged_at?: string | null;
                    bar_status?: string | null;
                    chapa_verified?: boolean;
                    chapa_tx_ref?: string | null;
                    completed_at?: string | null;
                    created_at?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    delivery_address?: string | null;
                    guest_fingerprint?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    items: Json;
                    kitchen_status?: string | null;
                    metadata?: Json | null;
                    notes?: string | null;
                    order_number: string;
                    order_type?: string | null;
                    paid_at?: string | null;
                    restaurant_id: string;
                    status?: string | null;
                    table_number: string;
                    total_price: number;
                    updated_at?: string | null;
                };
                Update: {
                    acknowledged_at?: string | null;
                    bar_status?: string | null;
                    chapa_verified?: boolean;
                    chapa_tx_ref?: string | null;
                    completed_at?: string | null;
                    created_at?: string | null;
                    customer_name?: string | null;
                    customer_phone?: string | null;
                    delivery_address?: string | null;
                    guest_fingerprint?: string | null;
                    id?: string;
                    idempotency_key?: string | null;
                    items?: Json;
                    kitchen_status?: string | null;
                    metadata?: Json | null;
                    notes?: string | null;
                    order_number?: string;
                    order_type?: string | null;
                    paid_at?: string | null;
                    restaurant_id?: string;
                    status?: string | null;
                    table_number?: string;
                    total_price?: number;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'orders_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payments: {
                Row: {
                    amount: number;
                    authorized_at: string | null;
                    captured_at: string | null;
                    created_at: string;
                    created_by: string | null;
                    currency: string;
                    id: string;
                    metadata: Json;
                    method: string;
                    order_id: string | null;
                    provider: string;
                    provider_reference: string | null;
                    restaurant_id: string;
                    status: string;
                    tip_amount: number;
                    updated_at: string;
                };
                Insert: {
                    amount: number;
                    authorized_at?: string | null;
                    captured_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    id?: string;
                    metadata?: Json;
                    method: string;
                    order_id?: string | null;
                    provider?: string;
                    provider_reference?: string | null;
                    restaurant_id: string;
                    status?: string;
                    tip_amount?: number;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    authorized_at?: string | null;
                    captured_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    id?: string;
                    metadata?: Json;
                    method?: string;
                    order_id?: string | null;
                    provider?: string;
                    provider_reference?: string | null;
                    restaurant_id?: string;
                    status?: string;
                    tip_amount?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payments_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payouts: {
                Row: {
                    adjustments: number;
                    channel: string;
                    created_at: string;
                    created_by: string | null;
                    currency: string;
                    fees: number;
                    gross: number;
                    id: string;
                    metadata: Json;
                    net: number;
                    paid_at: string | null;
                    period_end: string;
                    period_start: string;
                    provider: string;
                    restaurant_id: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    adjustments?: number;
                    channel?: string;
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    fees?: number;
                    gross?: number;
                    id?: string;
                    metadata?: Json;
                    net?: number;
                    paid_at?: string | null;
                    period_end: string;
                    period_start: string;
                    provider: string;
                    restaurant_id: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    adjustments?: number;
                    channel?: string;
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    fees?: number;
                    gross?: number;
                    id?: string;
                    metadata?: Json;
                    net?: number;
                    paid_at?: string | null;
                    period_end?: string;
                    period_start?: string;
                    provider?: string;
                    restaurant_id?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payouts_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            purchase_orders: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    currency: string;
                    expected_at: string | null;
                    id: string;
                    metadata: Json;
                    notes: string | null;
                    po_number: string;
                    received_at: string | null;
                    restaurant_id: string;
                    status: string;
                    subtotal: number;
                    supplier_name: string;
                    tax_amount: number;
                    total_amount: number;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    expected_at?: string | null;
                    id?: string;
                    metadata?: Json;
                    notes?: string | null;
                    po_number: string;
                    received_at?: string | null;
                    restaurant_id: string;
                    status?: string;
                    subtotal?: number;
                    supplier_name: string;
                    tax_amount?: number;
                    total_amount?: number;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    expected_at?: string | null;
                    id?: string;
                    metadata?: Json;
                    notes?: string | null;
                    po_number?: string;
                    received_at?: string | null;
                    restaurant_id?: string;
                    status?: string;
                    subtotal?: number;
                    supplier_name?: string;
                    tax_amount?: number;
                    total_amount?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'purchase_orders_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            reconciliation_entries: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    delta_amount: number;
                    expected_amount: number;
                    id: string;
                    ledger_id: string;
                    ledger_type: string;
                    metadata: Json;
                    notes: string | null;
                    payment_id: string | null;
                    payout_id: string | null;
                    refund_id: string | null;
                    restaurant_id: string;
                    settled_amount: number;
                    source_id: string | null;
                    source_type: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    delta_amount?: number;
                    expected_amount?: number;
                    id?: string;
                    ledger_id: string;
                    ledger_type: string;
                    metadata?: Json;
                    notes?: string | null;
                    payment_id?: string | null;
                    payout_id?: string | null;
                    refund_id?: string | null;
                    restaurant_id: string;
                    settled_amount?: number;
                    source_id?: string | null;
                    source_type: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    delta_amount?: number;
                    expected_amount?: number;
                    id?: string;
                    ledger_id?: string;
                    ledger_type?: string;
                    metadata?: Json;
                    notes?: string | null;
                    payment_id?: string | null;
                    payout_id?: string | null;
                    refund_id?: string | null;
                    restaurant_id?: string;
                    settled_amount?: number;
                    source_id?: string | null;
                    source_type?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reconciliation_entries_payment_id_fkey';
                        columns: ['payment_id'];
                        isOneToOne: false;
                        referencedRelation: 'payments';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reconciliation_entries_payout_id_fkey';
                        columns: ['payout_id'];
                        isOneToOne: false;
                        referencedRelation: 'payouts';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reconciliation_entries_refund_id_fkey';
                        columns: ['refund_id'];
                        isOneToOne: false;
                        referencedRelation: 'refunds';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reconciliation_entries_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            refunds: {
                Row: {
                    amount: number;
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    metadata: Json;
                    order_id: string | null;
                    payment_id: string;
                    processed_at: string | null;
                    provider_reference: string | null;
                    reason: string;
                    restaurant_id: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    amount: number;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    metadata?: Json;
                    order_id?: string | null;
                    payment_id: string;
                    processed_at?: string | null;
                    provider_reference?: string | null;
                    reason: string;
                    restaurant_id: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    amount?: number;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    metadata?: Json;
                    order_id?: string | null;
                    payment_id?: string;
                    processed_at?: string | null;
                    provider_reference?: string | null;
                    reason?: string;
                    restaurant_id?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'refunds_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'refunds_payment_id_fkey';
                        columns: ['payment_id'];
                        isOneToOne: false;
                        referencedRelation: 'payments';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'refunds_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            recipe_ingredients: {
                Row: {
                    created_at: string;
                    id: string;
                    inventory_item_id: string;
                    qty_per_recipe: number;
                    recipe_id: string;
                    restaurant_id: string;
                    uom: string;
                    waste_pct: number;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    inventory_item_id: string;
                    qty_per_recipe: number;
                    recipe_id: string;
                    restaurant_id: string;
                    uom?: string;
                    waste_pct?: number;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    inventory_item_id?: string;
                    qty_per_recipe?: number;
                    recipe_id?: string;
                    restaurant_id?: string;
                    uom?: string;
                    waste_pct?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'recipe_ingredients_inventory_item_id_fkey';
                        columns: ['inventory_item_id'];
                        isOneToOne: false;
                        referencedRelation: 'inventory_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'recipe_ingredients_recipe_id_fkey';
                        columns: ['recipe_id'];
                        isOneToOne: false;
                        referencedRelation: 'recipes';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'recipe_ingredients_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            recipes: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    is_active: boolean;
                    menu_item_id: string | null;
                    name: string;
                    output_qty: number;
                    output_uom: string;
                    restaurant_id: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    is_active?: boolean;
                    menu_item_id?: string | null;
                    name: string;
                    output_qty?: number;
                    output_uom?: string;
                    restaurant_id: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    is_active?: boolean;
                    menu_item_id?: string | null;
                    name?: string;
                    output_qty?: number;
                    output_uom?: string;
                    restaurant_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'recipes_menu_item_id_fkey';
                        columns: ['menu_item_id'];
                        isOneToOne: false;
                        referencedRelation: 'menu_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'recipes_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            rate_limit_logs: {
                Row: {
                    action: string;
                    created_at: string | null;
                    fingerprint: string;
                    id: string;
                    ip_address: string | null;
                    metadata: Json | null;
                    restaurant_id: string | null;
                    user_agent: string | null;
                };
                Insert: {
                    action: string;
                    created_at?: string | null;
                    fingerprint: string;
                    id?: string;
                    ip_address?: string | null;
                    metadata?: Json | null;
                    restaurant_id?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    action?: string;
                    created_at?: string | null;
                    fingerprint?: string;
                    id?: string;
                    ip_address?: string | null;
                    metadata?: Json | null;
                    restaurant_id?: string | null;
                    user_agent?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'rate_limit_logs_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            restaurant_staff: {
                Row: {
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    restaurant_id: string;
                    role: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    restaurant_id: string;
                    role: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    restaurant_id?: string;
                    role?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'restaurant_staff_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            restaurants: {
                Row: {
                    brand_color: string | null;
                    chapa_settlement_account_name: string | null;
                    chapa_settlement_account_number_masked: string | null;
                    chapa_settlement_bank_code: string | null;
                    chapa_settlement_bank_name: string | null;
                    chapa_subaccount_id: string | null;
                    chapa_subaccount_last_error: string | null;
                    chapa_subaccount_provisioned_at: string | null;
                    chapa_subaccount_status: string;
                    contact_email: string | null;
                    contact_phone: string | null;
                    cover_image_url: string | null;
                    created_at: string | null;
                    currency: string | null;
                    currency_symbol: string | null;
                    description: string | null;
                    features: Json | null;
                    hero_image_url: string | null;
                    hosted_checkout_fee_percentage: number;
                    hours_weekday: string | null;
                    hours_weekend: string | null;
                    id: string;
                    is_active: boolean | null;
                    location: string | null;
                    logo_url: string | null;
                    name: string;
                    onboarding_completed: boolean;
                    owner_telegram_chat_id: string | null;
                    platform_fee_percentage: number;
                    promo_banners: Json | null;
                    settings: Json | null;
                    slug: string;
                    social: Json | null;
                    telegram_chat_id: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    brand_color?: string | null;
                    chapa_settlement_account_name?: string | null;
                    chapa_settlement_account_number_masked?: string | null;
                    chapa_settlement_bank_code?: string | null;
                    chapa_settlement_bank_name?: string | null;
                    chapa_subaccount_id?: string | null;
                    chapa_subaccount_last_error?: string | null;
                    chapa_subaccount_provisioned_at?: string | null;
                    chapa_subaccount_status?: string;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    cover_image_url?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    currency_symbol?: string | null;
                    description?: string | null;
                    features?: Json | null;
                    hero_image_url?: string | null;
                    hosted_checkout_fee_percentage?: number;
                    hours_weekday?: string | null;
                    hours_weekend?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    location?: string | null;
                    logo_url?: string | null;
                    name: string;
                    onboarding_completed?: boolean;
                    owner_telegram_chat_id?: string | null;
                    platform_fee_percentage?: number;
                    promo_banners?: Json | null;
                    settings?: Json | null;
                    slug: string;
                    social?: Json | null;
                    telegram_chat_id?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    brand_color?: string | null;
                    chapa_settlement_account_name?: string | null;
                    chapa_settlement_account_number_masked?: string | null;
                    chapa_settlement_bank_code?: string | null;
                    chapa_settlement_bank_name?: string | null;
                    chapa_subaccount_id?: string | null;
                    chapa_subaccount_last_error?: string | null;
                    chapa_subaccount_provisioned_at?: string | null;
                    chapa_subaccount_status?: string;
                    contact_email?: string | null;
                    contact_phone?: string | null;
                    cover_image_url?: string | null;
                    created_at?: string | null;
                    currency?: string | null;
                    currency_symbol?: string | null;
                    description?: string | null;
                    features?: Json | null;
                    hero_image_url?: string | null;
                    hosted_checkout_fee_percentage?: number;
                    hours_weekday?: string | null;
                    hours_weekend?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    location?: string | null;
                    logo_url?: string | null;
                    name?: string;
                    onboarding_completed?: boolean;
                    owner_telegram_chat_id?: string | null;
                    platform_fee_percentage?: number;
                    promo_banners?: Json | null;
                    settings?: Json | null;
                    slug?: string;
                    social?: Json | null;
                    telegram_chat_id?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            reviews: {
                Row: {
                    comment: string | null;
                    created_at: string | null;
                    id: string;
                    item_id: string | null;
                    rating: number;
                    restaurant_id: string | null;
                    user_name: string;
                };
                Insert: {
                    comment?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    rating: number;
                    restaurant_id?: string | null;
                    user_name: string;
                };
                Update: {
                    comment?: string | null;
                    created_at?: string | null;
                    id?: string;
                    item_id?: string | null;
                    rating: number;
                    restaurant_id?: string | null;
                    user_name?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'reviews_item_id_fkey';
                        columns: ['item_id'];
                        isOneToOne: false;
                        referencedRelation: 'menu_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'reviews_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            service_requests: {
                Row: {
                    completed_at: string | null;
                    created_at: string | null;
                    id: string;
                    notes: string | null;
                    request_type: string;
                    restaurant_id: string | null;
                    status: string | null;
                    table_number: string;
                };
                Insert: {
                    completed_at?: string | null;
                    created_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    request_type: string;
                    restaurant_id?: string | null;
                    status?: string | null;
                    table_number: string;
                };
                Update: {
                    completed_at?: string | null;
                    created_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    request_type?: string;
                    restaurant_id?: string | null;
                    status?: string | null;
                    table_number?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'service_requests_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            shifts: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    end_time: string;
                    id: string;
                    notes: string | null;
                    restaurant_id: string;
                    role: string;
                    shift_date: string;
                    staff_id: string;
                    start_time: string;
                    station: string | null;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    end_time: string;
                    id?: string;
                    notes?: string | null;
                    restaurant_id: string;
                    role: string;
                    shift_date: string;
                    staff_id: string;
                    start_time: string;
                    station?: string | null;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    end_time?: string;
                    id?: string;
                    notes?: string | null;
                    restaurant_id?: string;
                    role?: string;
                    shift_date?: string;
                    staff_id?: string;
                    start_time?: string;
                    station?: string | null;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'shifts_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'shifts_staff_id_fkey';
                        columns: ['staff_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurant_staff';
                        referencedColumns: ['id'];
                    },
                ];
            };
            staff_invites: {
                Row: {
                    code: string;
                    created_at: string | null;
                    created_by: string | null;
                    email: string | null;
                    expires_at: string;
                    id: string;
                    restaurant_id: string;
                    role: string;
                    status: string | null;
                    updated_at: string | null;
                };
                Insert: {
                    code: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    email?: string | null;
                    expires_at?: string;
                    id?: string;
                    restaurant_id: string;
                    role: string;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Update: {
                    code?: string;
                    created_at?: string | null;
                    created_by?: string | null;
                    email?: string | null;
                    expires_at?: string;
                    id?: string;
                    restaurant_id?: string;
                    role?: string;
                    status?: string | null;
                    updated_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'staff_invites_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stations: {
                Row: {
                    created_at: string | null;
                    description: string | null;
                    enabled: boolean | null;
                    id: string;
                    name: string;
                    restaurant_id: string;
                    station_type: string;
                    telegram_chat_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    description?: string | null;
                    enabled?: boolean | null;
                    id?: string;
                    name: string;
                    restaurant_id: string;
                    station_type: string;
                    telegram_chat_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    description?: string | null;
                    enabled?: boolean | null;
                    id?: string;
                    name?: string;
                    restaurant_id?: string;
                    station_type?: string;
                    telegram_chat_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'stations_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            stock_movements: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    inventory_item_id: string;
                    metadata: Json;
                    movement_type: string;
                    qty: number;
                    reason: string | null;
                    reference_id: string | null;
                    reference_type: string;
                    restaurant_id: string;
                    unit_cost: number | null;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    inventory_item_id: string;
                    metadata?: Json;
                    movement_type: string;
                    qty: number;
                    reason?: string | null;
                    reference_id?: string | null;
                    reference_type?: string;
                    restaurant_id: string;
                    unit_cost?: number | null;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    inventory_item_id?: string;
                    metadata?: Json;
                    movement_type?: string;
                    qty?: number;
                    reason?: string | null;
                    reference_id?: string | null;
                    reference_type?: string;
                    restaurant_id?: string;
                    unit_cost?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'stock_movements_inventory_item_id_fkey';
                        columns: ['inventory_item_id'];
                        isOneToOne: false;
                        referencedRelation: 'inventory_items';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'stock_movements_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            supplier_invoices: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    currency: string;
                    due_at: string | null;
                    id: string;
                    invoice_number: string;
                    issued_at: string | null;
                    metadata: Json;
                    notes: string | null;
                    paid_at: string | null;
                    purchase_order_id: string | null;
                    restaurant_id: string;
                    status: string;
                    subtotal: number;
                    supplier_name: string;
                    tax_amount: number;
                    total_amount: number;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    due_at?: string | null;
                    id?: string;
                    invoice_number: string;
                    issued_at?: string | null;
                    metadata?: Json;
                    notes?: string | null;
                    paid_at?: string | null;
                    purchase_order_id?: string | null;
                    restaurant_id: string;
                    status?: string;
                    subtotal?: number;
                    supplier_name: string;
                    tax_amount?: number;
                    total_amount?: number;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    currency?: string;
                    due_at?: string | null;
                    id?: string;
                    invoice_number?: string;
                    issued_at?: string | null;
                    metadata?: Json;
                    notes?: string | null;
                    paid_at?: string | null;
                    purchase_order_id?: string | null;
                    restaurant_id?: string;
                    status?: string;
                    subtotal?: number;
                    supplier_name?: string;
                    tax_amount?: number;
                    total_amount?: number;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'supplier_invoices_purchase_order_id_fkey';
                        columns: ['purchase_order_id'];
                        isOneToOne: false;
                        referencedRelation: 'purchase_orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'supplier_invoices_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            support_tickets: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    description: string;
                    diagnostics_json: Json;
                    id: string;
                    priority: string;
                    restaurant_id: string;
                    source: string;
                    status: string;
                    subject: string;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    description: string;
                    diagnostics_json?: Json;
                    id?: string;
                    priority?: string;
                    restaurant_id: string;
                    source?: string;
                    status?: string;
                    subject: string;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string;
                    diagnostics_json?: Json;
                    id?: string;
                    priority?: string;
                    restaurant_id?: string;
                    source?: string;
                    status?: string;
                    subject?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'support_tickets_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            system_health: {
                Row: {
                    created_at: string | null;
                    id: string;
                    last_checked: string | null;
                    latency_ms: number | null;
                    message: string | null;
                    metadata: Json | null;
                    service: string;
                    status: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    last_checked?: string | null;
                    latency_ms?: number | null;
                    message?: string | null;
                    metadata?: Json | null;
                    service: string;
                    status: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    last_checked?: string | null;
                    latency_ms?: number | null;
                    message?: string | null;
                    metadata?: Json | null;
                    service?: string;
                    status?: string;
                };
                Relationships: [];
            };
            system_health_monitor: {
                Row: {
                    id: string;
                    last_checked: string | null;
                    latency_ms: number | null;
                    message: string | null;
                    metadata: Json | null;
                    service: string;
                    status: string;
                };
                Insert: {
                    id?: string;
                    last_checked?: string | null;
                    latency_ms?: number | null;
                    message?: string | null;
                    metadata?: Json | null;
                    service: string;
                    status: string;
                };
                Update: {
                    id?: string;
                    last_checked?: string | null;
                    latency_ms?: number | null;
                    message?: string | null;
                    metadata?: Json | null;
                    service?: string;
                    status?: string;
                };
                Relationships: [];
            };
            table_sessions: {
                Row: {
                    assigned_staff_id: string | null;
                    closed_at: string | null;
                    created_at: string;
                    guest_count: number;
                    id: string;
                    metadata: Json;
                    notes: string | null;
                    opened_at: string;
                    restaurant_id: string;
                    status: string;
                    table_id: string;
                    updated_at: string;
                };
                Insert: {
                    assigned_staff_id?: string | null;
                    closed_at?: string | null;
                    created_at?: string;
                    guest_count?: number;
                    id?: string;
                    metadata?: Json;
                    notes?: string | null;
                    opened_at?: string;
                    restaurant_id: string;
                    status?: string;
                    table_id: string;
                    updated_at?: string;
                };
                Update: {
                    assigned_staff_id?: string | null;
                    closed_at?: string | null;
                    created_at?: string;
                    guest_count?: number;
                    id?: string;
                    metadata?: Json;
                    notes?: string | null;
                    opened_at?: string;
                    restaurant_id?: string;
                    status?: string;
                    table_id?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'table_sessions_assigned_staff_id_fkey';
                        columns: ['assigned_staff_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurant_staff';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'table_sessions_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'table_sessions_table_id_fkey';
                        columns: ['table_id'];
                        isOneToOne: false;
                        referencedRelation: 'tables';
                        referencedColumns: ['id'];
                    },
                ];
            };
            tables: {
                Row: {
                    active_order_id: string | null;
                    capacity: number | null;
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    qr_code_url: string | null;
                    qr_version: number | null;
                    restaurant_id: string | null;
                    status: string | null;
                    table_number: string;
                    updated_at: string | null;
                    zone: string | null;
                };
                Insert: {
                    active_order_id?: string | null;
                    capacity?: number | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    qr_code_url?: string | null;
                    qr_version?: number | null;
                    restaurant_id?: string | null;
                    status?: string | null;
                    table_number: string;
                    updated_at?: string | null;
                    zone?: string | null;
                };
                Update: {
                    active_order_id?: string | null;
                    capacity?: number | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    qr_code_url?: string | null;
                    qr_version?: number | null;
                    restaurant_id?: string | null;
                    status?: string | null;
                    table_number?: string;
                    updated_at?: string | null;
                    zone?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'tables_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
            time_entries: {
                Row: {
                    clock_in_at: string;
                    clock_out_at: string | null;
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    metadata: Json;
                    restaurant_id: string;
                    shift_id: string | null;
                    source: string;
                    staff_id: string;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    clock_in_at: string;
                    clock_out_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    metadata?: Json;
                    restaurant_id: string;
                    shift_id?: string | null;
                    source?: string;
                    staff_id: string;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    clock_in_at?: string;
                    clock_out_at?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    metadata?: Json;
                    restaurant_id?: string;
                    shift_id?: string | null;
                    source?: string;
                    staff_id?: string;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'time_entries_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'time_entries_shift_id_fkey';
                        columns: ['shift_id'];
                        isOneToOne: false;
                        referencedRelation: 'shifts';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'time_entries_staff_id_fkey';
                        columns: ['staff_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurant_staff';
                        referencedColumns: ['id'];
                    },
                ];
            };
            tenants: {
                Row: {
                    api_key: string | null;
                    created_at: string | null;
                    id: string;
                    is_active: boolean | null;
                    name: string;
                    settings: Json | null;
                    slug: string;
                };
                Insert: {
                    api_key?: string | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    name: string;
                    settings?: Json | null;
                    slug: string;
                };
                Update: {
                    api_key?: string | null;
                    created_at?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    name?: string;
                    settings?: Json | null;
                    slug?: string;
                };
                Relationships: [];
            };
            workflow_audit_logs: {
                Row: {
                    created_at: string | null;
                    error_message: string | null;
                    execution_id: string | null;
                    id: string;
                    status: string | null;
                    tenant_id: string | null;
                    workflow_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    error_message?: string | null;
                    execution_id?: string | null;
                    id?: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    workflow_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    error_message?: string | null;
                    execution_id?: string | null;
                    id?: string;
                    status?: string | null;
                    tenant_id?: string | null;
                    workflow_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'workflow_audit_logs_tenant_id_fkey';
                        columns: ['tenant_id'];
                        isOneToOne: false;
                        referencedRelation: 'tenants';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            restaurant_staff_with_users: {
                Row: {
                    created_at: string | null;
                    email: string | null;
                    first_name: string | null;
                    full_name: string | null;
                    id: string | null;
                    is_active: boolean | null;
                    last_name: string | null;
                    name: string | null;
                    restaurant_id: string | null;
                    role: string | null;
                    user_id: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'restaurant_staff_restaurant_id_fkey';
                        columns: ['restaurant_id'];
                        isOneToOne: false;
                        referencedRelation: 'restaurants';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Functions: {
            increment_likes: {
                Args: { delta: number; item_id: string };
                Returns: undefined;
            };
            is_agency_admin: { Args: never; Returns: boolean };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

// Additional types for convenience
export type Restaurant = Tables<'restaurants'>;
export type Category = Tables<'categories'>;
export type MenuItem = Tables<'menu_items'>;
export type Order = Tables<'orders'>;
export type Review = Tables<'reviews'>;
export type ServiceRequest = Tables<'service_requests'>;
export type Station = Tables<'stations'>;
export type AuditLog = Tables<'audit_logs'>;
export type AgencyUser = Tables<'agency_users'>;
export type SystemHealthMonitor = Tables<'system_health_monitor'>;
export type RestaurantStaff = Tables<'restaurant_staff'>;
export type Table = Tables<'tables'>;
export type TableSession = Tables<'table_sessions'>;
export type OrderItem = Tables<'order_items'>;
export type OrderEvent = Tables<'order_events'>;
export type Payment = Tables<'payments'>;
export type Payout = Tables<'payouts'>;
export type AlertRule = Tables<'alert_rules'>;
export type AlertEvent = Tables<'alert_events'>;
export type SupportTicket = Tables<'support_tickets'>;
export type Guest = Tables<'guests'>;
export type GuestVisit = Tables<'guest_visits'>;
export type InventoryItem = Tables<'inventory_items'>;
export type DeliveryPartner = Tables<'delivery_partners'>;
export type ExternalOrder = Tables<'external_orders'>;
export type Recipe = Tables<'recipes'>;
export type RecipeIngredient = Tables<'recipe_ingredients'>;
export type StockMovement = Tables<'stock_movements'>;
export type PurchaseOrder = Tables<'purchase_orders'>;
export type ReconciliationEntry = Tables<'reconciliation_entries'>;
export type Refund = Tables<'refunds'>;
export type SupplierInvoice = Tables<'supplier_invoices'>;
export type Shift = Tables<'shifts'>;
export type TimeEntry = Tables<'time_entries'>;

// Extended types with relations
export interface RestaurantWithMenu extends Restaurant {
    categories: (Category & {
        items: MenuItem[];
    })[];
}

export interface CategoryWithItems extends Category {
    items: MenuItem[];
}
