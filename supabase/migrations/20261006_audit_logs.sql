-- Real audit trail for user and admin activity.
-- Run after 20261006_multitenant_foundation.sql in staging first.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    module TEXT NOT NULL DEFAULT 'system',
    entity_type TEXT,
    entity_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS audit_logs_company_created_idx ON public.audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_created_idx ON public.audit_logs (actor_user_id, created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
CREATE POLICY audit_logs_select ON public.audit_logs
    FOR SELECT USING (public.is_superadmin() OR company_id = public.current_company_id());
CREATE POLICY audit_logs_insert ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_superadmin() OR company_id = public.current_company_id());

CREATE OR REPLACE FUNCTION public.write_audit_log(
    log_action TEXT,
    log_module TEXT,
    log_entity_type TEXT DEFAULT NULL,
    log_entity_id TEXT DEFAULT NULL,
    log_company_id UUID DEFAULT NULL,
    log_details JSONB DEFAULT '{}'::jsonb
)
RETURNS public.audit_logs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    created_log public.audit_logs;
    current_user_id UUID := auth.uid();
BEGIN
    INSERT INTO public.audit_logs (company_id, actor_user_id, actor_email, actor_role, action, module, entity_type, entity_id, details)
    SELECT
        COALESCE(log_company_id, public.current_company_id()),
        current_user_id,
        u.email,
        p.role,
        log_action,
        log_module,
        log_entity_type,
        log_entity_id,
        COALESCE(log_details, '{}'::jsonb)
    FROM (SELECT 1) AS seed
    LEFT JOIN auth.users u ON u.id = current_user_id
    LEFT JOIN public.profiles p ON p.id = current_user_id
    RETURNING * INTO created_log;
    RETURN created_log;
END;
$$;

GRANT EXECUTE ON FUNCTION public.write_audit_log(TEXT, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;

CREATE OR REPLACE FUNCTION public.audit_row_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    changed_row JSONB;
    row_id TEXT;
    row_company_id UUID;
BEGIN
    changed_row := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
    row_id := COALESCE(changed_row->>'id', changed_row->>'code', changed_row->>'ticket_number');
    row_company_id := NULLIF(changed_row->>'company_id', '')::UUID;
    INSERT INTO public.audit_logs (company_id, actor_user_id, actor_email, actor_role, action, module, entity_type, entity_id, details)
    SELECT row_company_id, auth.uid(), u.email, p.role, lower(TG_OP), TG_TABLE_NAME, TG_TABLE_NAME, row_id, jsonb_build_object('source', 'database_trigger')
    FROM (SELECT 1) AS seed
    LEFT JOIN auth.users u ON u.id = auth.uid()
    LEFT JOIN public.profiles p ON p.id = auth.uid();
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DO $$
DECLARE target_table TEXT;
DECLARE table_list TEXT[] := ARRAY[
    'companies', 'profiles', 'company_members', 'hrd_employees', 'dump_trucks', 'hauling_logs', 'roles',
    'division_permissions', 'custom_form_fields', 'company_assets', 'company_legal_licenses', 'site_vendors',
    'ga_transport_shuttle', 'safety_training_records', 'sparepart_inventory', 'security_gate_logs',
    'safety_hazard_reports', 'radio_inventory', 'employee_performance_reviews', 'ga_mess_facilities',
    'finance_transactions', 'environmental_compliance_logs', 'site_production_logs', 'csr_program_logs',
    'clinic_patient_logs', 'ga_catering_logs', 'fuel_logs', 'adm_documents', 'environment_logs',
    'jetty_barging_logs', 'it_helpdesk_tickets', 'corporate_investor_reports', 'dor_reports', 'geology_samples',
    'radio_devices', 'fleet_maintenance_logs', 'fleet_units', 'ga_helpdesk_tickets'
];
BEGIN
    FOREACH target_table IN ARRAY table_list LOOP
        IF to_regclass(format('public.%I', target_table)) IS NOT NULL AND target_table <> 'audit_logs' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target_table || '_audit_log', target_table);
            EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.audit_row_change()', target_table || '_audit_log', target_table);
        END IF;
    END LOOP;
END $$;
