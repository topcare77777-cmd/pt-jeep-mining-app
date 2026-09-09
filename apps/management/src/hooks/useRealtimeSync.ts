'use client'

import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

type TableName =
    | 'dor_reports'
    | 'fleet_maintenance_logs'
    | 'radio_dispatch_logs'
    | 'clinic_patient_logs'
    | 'security_gate_logs'
    | 'finance_transactions'

interface RealtimeConfig<T> {
    table: TableName
    onInsert?: (newItem: T) => void
    onUpdate?: (updatedItem: T) => void
    onDelete?: (deletedItem: { id: string }) => void
}

export function useRealtimeSync<T>({
    table,
    onInsert,
    onUpdate,
    onDelete,
}: RealtimeConfig<T>) {
    useEffect(() => {
        const channel = supabase
            .channel(`realtime_${table}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table },
                (payload) => {
                    if (onInsert) onInsert(payload.new as T)
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table },
                (payload) => {
                    if (onUpdate) onUpdate(payload.new as T)
                }
            )
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table },
                (payload) => {
                    if (onDelete) onDelete(payload.old as { id: string })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, onInsert, onUpdate, onDelete])
}