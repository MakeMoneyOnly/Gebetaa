export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
      audit_log: {
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
          description: string | null
          description_am: string | null
          icon: string | null
          id: string
          name: string
          name_am: string | null
          position: number | null
          restaurant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_am?: string | null
          icon?: string | null
          id?: string
          name: string
          name_am?: string | null
          position?: number | null
          restaurant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_am?: string | null
          icon?: string | null
          id?: string
          name?: string
          name_am?: string | null
          position?: number | null
          restaurant_id?: string
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
      items: {
        Row: {
          available: boolean | null
          category_id: string
          created_at: string | null
          description: string | null
          description_am: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_fasting: boolean | null
          modifiers: Json | null
          name: string
          name_am: string | null
          pairings: string[] | null
          position: number | null
          preparation_time: number | null
          price: number
          restaurant_id: string
          section: string | null
          spicy_level: number | null
          station: string | null
          stock_quantity: number | null
        }
        Insert: {
          available?: boolean | null
          category_id: string
          created_at?: string | null
          description?: string | null
          description_am?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_fasting?: boolean | null
          modifiers?: Json | null
          name: string
          name_am?: string | null
          pairings?: string[] | null
          position?: number | null
          preparation_time?: number | null
          price: number
          restaurant_id: string
          section?: string | null
          spicy_level?: number | null
          station?: string | null
          stock_quantity?: number | null
        }
        Update: {
          available?: boolean | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          description_am?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_fasting?: boolean | null
          modifiers?: Json | null
          name?: string
          name_am?: string | null
          pairings?: string[] | null
          position?: number | null
          preparation_time?: number | null
          price?: number
          restaurant_id?: string
          section?: string | null
          spicy_level?: number | null
          station?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          bar_status: string | null
          created_at: string | null
          id: string
          items: Json
          kitchen_status: string | null
          restaurant_id: string
          status: string | null
          table_number: number
          total: number
        }
        Insert: {
          bar_status?: string | null
          created_at?: string | null
          id?: string
          items: Json
          kitchen_status?: string | null
          restaurant_id: string
          status?: string | null
          table_number: number
          total: number
        }
        Update: {
          bar_status?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          kitchen_status?: string | null
          restaurant_id?: string
          status?: string | null
          table_number?: number
          total?: number
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
      restaurants: {
        Row: {
          brand_color: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          currency: string | null
          currency_symbol: string | null
          description: string | null
          features: Json | null
          hero_image_url: string | null
          hours_weekday: string | null
          hours_weekend: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          owner_telegram_chat_id: string | null
          settings: Json | null
          slug: string
          social: Json | null
          telegram_chat_id: string | null
        }
        Insert: {
          brand_color?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          description?: string | null
          features?: Json | null
          hero_image_url?: string | null
          hours_weekday?: string | null
          hours_weekend?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          owner_telegram_chat_id?: string | null
          settings?: Json | null
          slug: string
          social?: Json | null
          telegram_chat_id?: string | null
        }
        Update: {
          brand_color?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          currency?: string | null
          currency_symbol?: string | null
          description?: string | null
          features?: Json | null
          hero_image_url?: string | null
          hours_weekday?: string | null
          hours_weekend?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_telegram_chat_id?: string | null
          settings?: Json | null
          slug?: string
          social?: Json | null
          telegram_chat_id?: string | null
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
          rating?: number
          restaurant_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
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
      stations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          restaurant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          restaurant_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          type?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T }
    ? T & (Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Views: infer V } ? V : unknown)
    : never)
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T, Views: infer V }
  ? (T & V)[TableName & keyof (T & V)] extends { Row: infer R }
  ? R
  : never
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T } ? T : never)
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T }
  ? T extends Record<string, { Insert: unknown }>
  ? T[TableName & keyof T]["Insert"]
  : never
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T } ? T : never)
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]] extends { Tables: infer T }
  ? T extends Record<string, { Update: unknown }>
  ? T[TableName & keyof T]["Update"]
  : never
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[DefaultSchemaEnumNameOrOptions["schema"]] extends { Enums: infer E } ? E : never)
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]] extends { Enums: infer E }
  ? E extends Record<string, unknown>
  ? E[EnumName & keyof E]
  : never
  : never
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

// Additional types for convenience
export type Restaurant = Tables<"restaurants">
export type Category = Tables<"categories">
export type MenuItem = Tables<"items">
export type Order = Tables<"orders">
export type Review = Tables<"reviews">
export type ServiceRequest = Tables<"service_requests">
export type Station = Tables<"stations">
export type AuditLog = Tables<"audit_log">
export type AgencyUser = Tables<"agency_users">
export type SystemHealthMonitor = Tables<"system_health_monitor">

// Extended types with relations
export interface RestaurantWithMenu extends Restaurant {
  categories: (Category & {
    items: MenuItem[]
  })[]
}

export interface CategoryWithItems extends Category {
  items: MenuItem[]
}
