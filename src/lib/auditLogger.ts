import { createClient } from './supabase/server';
import type { Database } from '@/types/database';

export interface AuditLogEntry {
    restaurant_id: string;
    user_id?: string;
    telegram_user_id?: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_value?: Database['public']['Tables']['audit_log']['Row']['old_value'];
    new_value?: Database['public']['Tables']['audit_log']['Row']['new_value'];
    metadata?: Database['public']['Tables']['audit_log']['Row']['metadata'];
}

/**
 * Logs an action to the audit_log table
 */
export async function logAction(entry: AuditLogEntry) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('audit_log')
            .insert({
                ...entry,
                created_at: new Date().toISOString()
            } as Database['public']['Tables']['audit_log']['Insert']);

        if (error) {
            console.error('[AuditLogger] Database error:', error);
        }
    } catch (error) {
        console.error('[AuditLogger] Failed to log action:', error);
    }
}
