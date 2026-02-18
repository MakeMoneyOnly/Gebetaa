export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            agency_users: {
                Row: {
                    created_at: string | null
                    id: string
                    restaurant_ids: string[] | null
                    role: string | null
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    restaurant_ids?: string[] | null
                    role?: string | null
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    restaurant_ids?: string[] | null
                    role?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            alert_events: {
                Row: {
                    created_at: string
                    entity_id: string | null
                    entity_type: string
                    id: string
                    payload: Json
                    resolved_at: string | null
                    restaurant_id: string
                    rule_id: string | null
                    severity: string
                    status: string
                }
                Insert: {
                    created_at?: string
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    payload?: Json
                    resolved_at?: string | null
                    restaurant_id: string
                    rule_id?: string | null
                    severity?: string
                    status?: string
                }
                Update: {
                    created_at?: string
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    payload?: Json
                    resolved_at?: string | null
                    restaurant_id?: string
                    rule_id?: string | null
                    severity?: string
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "alert_events_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "alert_events_rule_id_fkey"
                        columns: ["rule_id"]
                        isOneToOne: false
                        referencedRelation: "alert_rules"
                        referencedColumns: ["id"]
                    },
                ]
            }
            alert_rules: {
                Row: {
                    condition_json: Json
                    created_at: string
                    enabled: boolean
                    id: string
                    name: string
                    restaurant_id: string
                    severity: string
                    target_json: Json
                    updated_at: string
                }
                Insert: {
                    condition_json?: Json
                    created_at?: string
                    enabled?: boolean
                    id?: string
                    name: string
                    restaurant_id: string
                    severity?: string
                    target_json?: Json
                    updated_at?: string
                }
                Update: {
                    condition_json?: Json
                    created_at?: string
                    enabled?: boolean
                    id?: string
                    name?: string
                    restaurant_id?: string
                    severity?: string
                    target_json?: Json
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "alert_rules_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            audit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    metadata: Json | null
                    new_value: Json | null
                    old_value: Json | null
                    restaurant_id: string | null
                    telegram_user_id: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    metadata?: Json | null
                    new_value?: Json | null
                    old_value?: Json | null
                    restaurant_id?: string | null
                    telegram_user_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    metadata?: Json | null
                    new_value?: Json | null
                    old_value?: Json | null
                    restaurant_id?: string | null
                    telegram_user_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_log_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    name_am: string | null
                    order_index: number | null
                    restaurant_id: string
                    section: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    name_am?: string | null
                    order_index?: number | null
                    restaurant_id: string
                    section?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    name_am?: string | null
                    order_index?: number | null
                    restaurant_id?: string
                    section?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "categories_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            global_orders: {
                Row: {
                    created_at: string | null
                    currency: string | null
                    external_order_id: string | null
                    id: string
                    items: Json
                    status: string | null
                    table_number: string | null
                    tenant_id: string | null
                    total_amount: number | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    currency?: string | null
                    external_order_id?: string | null
                    id?: string
                    items: Json
                    status?: string | null
                    table_number?: string | null
                    tenant_id?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    currency?: string | null
                    external_order_id?: string | null
                    id?: string
                    items?: Json
                    status?: string | null
                    table_number?: string | null
                    tenant_id?: string | null
                    total_amount?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "global_orders_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            menu_items: {
                Row: {
                    allergens: string[] | null
                    category_id: string
                    created_at: string | null
                    description: string | null
                    description_am: string | null
                    dietary_tags: string[] | null
                    has_ar: boolean | null
                    id: string
                    image_url: string | null
                    ingredients: string[] | null
                    is_available: boolean | null
                    is_chef_special: boolean | null
                    is_fasting: boolean | null
                    likes_count: number | null
                    model_glb: string | null
                    model_scale: string | null
                    model_usdz: string | null
                    modifiers: Json | null
                    name: string
                    name_am: string | null
                    nutrition: Json | null
                    order_count: number | null
                    pairings: string[] | null
                    popularity: number | null
                    preparation_time: number | null
                    preparation_time_minutes: number | null
                    price: number
                    rating: number | null
                    reviews_count: number | null
                    spicy_level: number | null
                    station: string | null
                    stock_quantity: number | null
                    updated_at: string | null
                }
                Insert: {
                    allergens?: string[] | null
                    category_id: string
                    created_at?: string | null
                    description?: string | null
                    description_am?: string | null
                    dietary_tags?: string[] | null
                    has_ar?: boolean | null
                    id?: string
                    image_url?: string | null
                    ingredients?: string[] | null
                    is_available?: boolean | null
                    is_chef_special?: boolean | null
                    is_fasting?: boolean | null
                    likes_count?: number | null
                    model_glb?: string | null
                    model_scale?: string | null
                    model_usdz?: string | null
                    modifiers?: Json | null
                    name: string
                    name_am?: string | null
                    nutrition?: Json | null
                    order_count?: number | null
                    pairings?: string[] | null
                    popularity?: number | null
                    preparation_time?: number | null
                    preparation_time_minutes?: number | null
                    price: number
                    rating?: number | null
                    reviews_count?: number | null
                    spicy_level?: number | null
                    station?: string | null
                    stock_quantity?: number | null
                    updated_at?: string | null
                }
                Update: {
                    allergens?: string[] | null
                    category_id?: string
                    created_at?: string | null
                    description?: string | null
                    description_am?: string | null
                    dietary_tags?: string[] | null
                    has_ar?: boolean | null
                    id?: string
                    image_url?: string | null
                    ingredients?: string[] | null
                    is_available?: boolean | null
                    is_chef_special?: boolean | null
                    is_fasting?: boolean | null
                    likes_count?: number | null
                    model_glb?: string | null
                    model_scale?: string | null
                    model_usdz?: string | null
                    modifiers?: Json | null
                    name?: string
                    name_am?: string | null
                    nutrition?: Json | null
                    order_count?: number | null
                    pairings?: string[] | null
                    popularity?: number | null
                    preparation_time?: number | null
                    preparation_time_minutes?: number | null
                    price?: number
                    rating?: number | null
                    reviews_count?: number | null
                    spicy_level?: number | null
                    station?: string | null
                    stock_quantity?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "items_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                ]
            }
            order_events: {
                Row: {
                    actor_user_id: string | null
                    created_at: string
                    event_type: string
                    from_status: string | null
                    id: string
                    metadata: Json
                    order_id: string
                    restaurant_id: string
                    to_status: string | null
                }
                Insert: {
                    actor_user_id?: string | null
                    created_at?: string
                    event_type: string
                    from_status?: string | null
                    id?: string
                    metadata?: Json
                    order_id: string
                    restaurant_id: string
                    to_status?: string | null
                }
                Update: {
                    actor_user_id?: string | null
                    created_at?: string
                    event_type?: string
                    from_status?: string | null
                    id?: string
                    metadata?: Json
                    order_id?: string
                    restaurant_id?: string
                    to_status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "order_events_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_events_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            order_items: {
                Row: {
                    completed_at: string | null
                    created_at: string | null
                    id: string
                    item_id: string
                    modifiers: Json | null
                    name: string
                    notes: string | null
                    order_id: string
                    price: number
                    quantity: number | null
                    started_at: string | null
                    station: string | null
                    status: string | null
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    item_id: string
                    modifiers?: Json | null
                    name: string
                    notes?: string | null
                    order_id: string
                    price: number
                    quantity?: number | null
                    started_at?: string | null
                    station?: string | null
                    status?: string | null
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    item_id?: string
                    modifiers?: Json | null
                    name?: string
                    notes?: string | null
                    order_id?: string
                    price?: number
                    quantity?: number | null
                    started_at?: string | null
                    station?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "order_items_item_id_fkey"
                        columns: ["item_id"]
                        isOneToOne: false
                        referencedRelation: "menu_items"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "order_items_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    acknowledged_at: string | null
                    bar_status: string | null
                    completed_at: string | null
                    created_at: string | null
                    customer_name: string | null
                    customer_phone: string | null
                    guest_fingerprint: string | null
                    id: string
                    idempotency_key: string | null
                    items: Json
                    kitchen_status: string | null
                    notes: string | null
                    order_number: string
                    restaurant_id: string
                    status: string | null
                    table_number: string
                    total_price: number
                    updated_at: string | null
                }
                Insert: {
                    acknowledged_at?: string | null
                    bar_status?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    customer_name?: string | null
                    customer_phone?: string | null
                    guest_fingerprint?: string | null
                    id?: string
                    idempotency_key?: string | null
                    items: Json
                    kitchen_status?: string | null
                    notes?: string | null
                    order_number: string
                    restaurant_id: string
                    status?: string | null
                    table_number: string
                    total_price: number
                    updated_at?: string | null
                }
                Update: {
                    acknowledged_at?: string | null
                    bar_status?: string | null
                    completed_at?: string | null
                    created_at?: string | null
                    customer_name?: string | null
                    customer_phone?: string | null
                    guest_fingerprint?: string | null
                    id?: string
                    idempotency_key?: string | null
                    items?: Json
                    kitchen_status?: string | null
                    notes?: string | null
                    order_number?: string
                    restaurant_id?: string
                    status?: string | null
                    table_number?: string
                    total_price?: number
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rate_limit_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    fingerprint: string
                    id: string
                    ip_address: string | null
                    metadata: Json | null
                    restaurant_id: string | null
                    user_agent: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    fingerprint: string
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    restaurant_id?: string | null
                    user_agent?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    fingerprint?: string
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    restaurant_id?: string | null
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "rate_limit_logs_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            restaurant_staff: {
                Row: {
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    restaurant_id: string
                    role: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    restaurant_id: string
                    role: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    restaurant_id?: string
                    role?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "restaurant_staff_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            restaurants: {
                Row: {
                    brand_color: string | null
                    contact_email: string | null
                    contact_phone: string | null
                    cover_image_url: string | null
                    created_at: string | null
                    currency: string | null
                    currency_symbol: string | null
                    description: string | null
                    features: Json | null
                    hero_image_url: string | null
                    hours_weekday: string | null
                    hours_weekend: string | null
                    id: string
                    is_active: boolean | null
                    location: string | null
                    logo_url: string | null
                    name: string
                    owner_telegram_chat_id: string | null
                    promo_banners: Json | null
                    settings: Json | null
                    slug: string
                    social: Json | null
                    telegram_chat_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    brand_color?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    currency?: string | null
                    currency_symbol?: string | null
                    description?: string | null
                    features?: Json | null
                    hero_image_url?: string | null
                    hours_weekday?: string | null
                    hours_weekend?: string | null
                    id?: string
                    is_active?: boolean | null
                    location?: string | null
                    logo_url?: string | null
                    name: string
                    owner_telegram_chat_id?: string | null
                    promo_banners?: Json | null
                    settings?: Json | null
                    slug: string
                    social?: Json | null
                    telegram_chat_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    brand_color?: string | null
                    contact_email?: string | null
                    contact_phone?: string | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    currency?: string | null
                    currency_symbol?: string | null
                    description?: string | null
                    features?: Json | null
                    hero_image_url?: string | null
                    hours_weekday?: string | null
                    hours_weekend?: string | null
                    id?: string
                    is_active?: boolean | null
                    location?: string | null
                    logo_url?: string | null
                    name?: string
                    owner_telegram_chat_id?: string | null
                    promo_banners?: Json | null
                    settings?: Json | null
                    slug?: string
                    social?: Json | null
                    telegram_chat_id?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            reviews: {
                Row: {
                    comment: string | null
                    created_at: string | null
                    id: string
                    item_id: string | null
                    rating: number
                    restaurant_id: string | null
                    user_name: string
                }
                Insert: {
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    item_id?: string | null
                    rating: number
                    restaurant_id?: string | null
                    user_name: string
                }
                Update: {
                    comment?: string | null
                    created_at?: string | null
                    id?: string
                    item_id?: string | null
                    rating: number
                    restaurant_id?: string | null
                    user_name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "reviews_item_id_fkey"
                        columns: ["item_id"]
                        isOneToOne: false
                        referencedRelation: "menu_items"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "reviews_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            service_requests: {
                Row: {
                    completed_at: string | null
                    created_at: string | null
                    id: string
                    notes: string | null
                    request_type: string
                    restaurant_id: string | null
                    status: string | null
                    table_number: string
                }
                Insert: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    request_type: string
                    restaurant_id?: string | null
                    status?: string | null
                    table_number: string
                }
                Update: {
                    completed_at?: string | null
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    request_type?: string
                    restaurant_id?: string | null
                    status?: string | null
                    table_number?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "service_requests_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            staff_invites: {
                Row: {
                    code: string
                    created_at: string | null
                    created_by: string | null
                    email: string | null
                    expires_at: string
                    id: string
                    restaurant_id: string
                    role: string
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    code: string
                    created_at?: string | null
                    created_by?: string | null
                    email?: string | null
                    expires_at?: string
                    id?: string
                    restaurant_id: string
                    role: string
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    code?: string
                    created_at?: string | null
                    created_by?: string | null
                    email?: string | null
                    expires_at?: string
                    id?: string
                    restaurant_id?: string
                    role?: string
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "staff_invites_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            stations: {
                Row: {
                    created_at: string | null
                    description: string | null
                    enabled: boolean | null
                    id: string
                    name: string
                    restaurant_id: string
                    station_type: string
                    telegram_chat_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    enabled?: boolean | null
                    id?: string
                    name: string
                    restaurant_id: string
                    station_type: string
                    telegram_chat_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    enabled?: boolean | null
                    id?: string
                    name?: string
                    restaurant_id?: string
                    station_type?: string
                    telegram_chat_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "stations_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            support_tickets: {
                Row: {
                    created_at: string
                    created_by: string | null
                    description: string
                    diagnostics_json: Json
                    id: string
                    priority: string
                    restaurant_id: string
                    source: string
                    status: string
                    subject: string
                    updated_at: string
                }
                Insert: {
                    created_at?: string
                    created_by?: string | null
                    description: string
                    diagnostics_json?: Json
                    id?: string
                    priority?: string
                    restaurant_id: string
                    source?: string
                    status?: string
                    subject: string
                    updated_at?: string
                }
                Update: {
                    created_at?: string
                    created_by?: string | null
                    description?: string
                    diagnostics_json?: Json
                    id?: string
                    priority?: string
                    restaurant_id?: string
                    source?: string
                    status?: string
                    subject?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "support_tickets_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            system_health: {
                Row: {
                    created_at: string | null
                    id: string
                    last_checked: string | null
                    latency_ms: number | null
                    message: string | null
                    metadata: Json | null
                    service: string
                    status: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    last_checked?: string | null
                    latency_ms?: number | null
                    message?: string | null
                    metadata?: Json | null
                    service: string
                    status: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    last_checked?: string | null
                    latency_ms?: number | null
                    message?: string | null
                    metadata?: Json | null
                    service?: string
                    status?: string
                }
                Relationships: []
            }
            system_health_monitor: {
                Row: {
                    id: string
                    last_checked: string | null
                    latency_ms: number | null
                    message: string | null
                    metadata: Json | null
                    service: string
                    status: string
                }
                Insert: {
                    id?: string
                    last_checked?: string | null
                    latency_ms?: number | null
                    message?: string | null
                    metadata?: Json | null
                    service: string
                    status: string
                }
                Update: {
                    id?: string
                    last_checked?: string | null
                    latency_ms?: number | null
                    message?: string | null
                    metadata?: Json | null
                    service?: string
                    status?: string
                }
                Relationships: []
            }
            table_sessions: {
                Row: {
                    assigned_staff_id: string | null
                    closed_at: string | null
                    created_at: string
                    guest_count: number
                    id: string
                    metadata: Json
                    notes: string | null
                    opened_at: string
                    restaurant_id: string
                    status: string
                    table_id: string
                    updated_at: string
                }
                Insert: {
                    assigned_staff_id?: string | null
                    closed_at?: string | null
                    created_at?: string
                    guest_count?: number
                    id?: string
                    metadata?: Json
                    notes?: string | null
                    opened_at?: string
                    restaurant_id: string
                    status?: string
                    table_id: string
                    updated_at?: string
                }
                Update: {
                    assigned_staff_id?: string | null
                    closed_at?: string | null
                    created_at?: string
                    guest_count?: number
                    id?: string
                    metadata?: Json
                    notes?: string | null
                    opened_at?: string
                    restaurant_id?: string
                    status?: string
                    table_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "table_sessions_assigned_staff_id_fkey"
                        columns: ["assigned_staff_id"]
                        isOneToOne: false
                        referencedRelation: "restaurant_staff"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "table_sessions_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "table_sessions_table_id_fkey"
                        columns: ["table_id"]
                        isOneToOne: false
                        referencedRelation: "tables"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tables: {
                Row: {
                    active_order_id: string | null
                    capacity: number | null
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    qr_code_url: string | null
                    qr_version: number | null
                    restaurant_id: string | null
                    status: string | null
                    table_number: string
                    updated_at: string | null
                    zone: string | null
                }
                Insert: {
                    active_order_id?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    qr_code_url?: string | null
                    qr_version?: number | null
                    restaurant_id?: string | null
                    status?: string | null
                    table_number: string
                    updated_at?: string | null
                    zone?: string | null
                }
                Update: {
                    active_order_id?: string | null
                    capacity?: number | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    qr_code_url?: string | null
                    qr_version?: number | null
                    restaurant_id?: string | null
                    status?: string | null
                    table_number?: string
                    updated_at?: string | null
                    zone?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "tables_restaurant_id_fkey"
                        columns: ["restaurant_id"]
                        isOneToOne: false
                        referencedRelation: "restaurants"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tenants: {
                Row: {
                    api_key: string | null
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    settings: Json | null
                    slug: string
                }
                Insert: {
                    api_key?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    settings?: Json | null
                    slug: string
                }
                Update: {
                    api_key?: string | null
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    settings?: Json | null
                    slug?: string
                }
                Relationships: []
            }
            workflow_audit_logs: {
                Row: {
                    created_at: string | null
                    error_message: string | null
                    execution_id: string | null
                    id: string
                    status: string | null
                    tenant_id: string | null
                    workflow_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    error_message?: string | null
                    execution_id?: string | null
                    id?: string
                    status?: string | null
                    tenant_id?: string | null
                    workflow_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    error_message?: string | null
                    execution_id?: string | null
                    id?: string
                    status?: string | null
                    tenant_id?: string | null
                    workflow_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "workflow_audit_logs_tenant_id_fkey"
                        columns: ["tenant_id"]
                        isOneToOne: false
                        referencedRelation: "tenants"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            increment_likes: {
                Args: { delta: number; item_id: string }
                Returns: undefined
            }
            is_agency_admin: { Args: never; Returns: boolean }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

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
export type AlertRule = Tables<'alert_rules'>;
export type AlertEvent = Tables<'alert_events'>;
export type SupportTicket = Tables<'support_tickets'>;

// Extended types with relations
export interface RestaurantWithMenu extends Restaurant {
    categories: (Category & {
        items: MenuItem[];
    })[];
}

export interface CategoryWithItems extends Category {
    items: MenuItem[];
}
