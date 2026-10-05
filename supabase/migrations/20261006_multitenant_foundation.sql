-- Multi-tenant foundation for PT Jeep Mining and future mining companies.
-- This migration is additive: existing rows are assigned to the seeded PT Jeep tenant.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    user_limit INTEGER NOT NULL DEFAULT 25 CHECK (user_limit > 0),
    iup_status TEXT NOT NULL DEFAULT 'Belum Diverifikasi',
    rkab_status TEXT NOT NULL DEFAULT 'Belum Diverifikasi',
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Non-Aktif', 'Suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.companies (name, slug)
VALUES ('PT. Jangkar Energi Eka Perkasa', 'pt-jeep-mining')
ON CONFLICT (slug) DO NOTHING;

-- Existing installations may already have profiles. CREATE TABLE is only a fallback
-- for a fresh Supabase project; it does not replace an existing table definition.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    username TEXT,
    email TEXT,
    role TEXT,
    status TEXT NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'Staff',
    status TEXT NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (company_id, user_id)
);

DO $$
DECLARE
    target_table TEXT;
    table_list TEXT[] := ARRAY[
        'profiles', 'hrd_employees', 'dump_trucks', 'hauling_logs', 'roles',
        'division_permissions', 'custom_form_fields', 'company_assets',
        'company_legal_licenses', 'site_vendors', 'ga_transport_shuttle',
        'safety_training_records', 'sparepart_inventory', 'security_gate_logs',
        'safety_hazard_reports', 'radio_inventory', 'employee_performance_reviews',
        'ga_mess_facilities', 'finance_transactions', 'environmental_compliance_logs',
        'site_production_logs', 'csr_program_logs', 'clinic_patient_logs',
        'ga_catering_logs', 'fuel_logs', 'adm_documents', 'environment_logs',
        'jetty_barging_logs', 'it_helpdesk_tickets', 'corporate_investor_reports',
        'dor_reports', 'geology_samples', 'radio_devices', 'fleet_maintenance_logs',
        'fleet_units', 'ga_helpdesk_tickets'
    ];
BEGIN
    FOREACH target_table IN ARRAY table_list LOOP
        IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
            EXECUTE format(
                'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE RESTRICT',
                target_table
            );
            EXECUTE format(
                'CREATE INDEX IF NOT EXISTS %I ON public.%I (company_id)',
                target_table || '_company_id_idx', target_table
            );
        END IF;
    END LOOP;
END $$;

-- Preserve all existing data under the original tenant. New records get the
-- authenticated user's tenant automatically through the trigger below.
DO $$
DECLARE
    target_table TEXT;
    table_list TEXT[] := ARRAY[
        'profiles', 'hrd_employees', 'dump_trucks', 'hauling_logs', 'roles',
        'division_permissions', 'custom_form_fields', 'company_assets',
        'company_legal_licenses', 'site_vendors', 'ga_transport_shuttle',
        'safety_training_records', 'sparepart_inventory', 'security_gate_logs',
        'safety_hazard_reports', 'radio_inventory', 'employee_performance_reviews',
        'ga_mess_facilities', 'finance_transactions', 'environmental_compliance_logs',
        'site_production_logs', 'csr_program_logs', 'clinic_patient_logs',
        'ga_catering_logs', 'fuel_logs', 'adm_documents', 'environment_logs',
        'jetty_barging_logs', 'it_helpdesk_tickets', 'corporate_investor_reports',
        'dor_reports', 'geology_samples', 'radio_devices', 'fleet_maintenance_logs',
        'fleet_units', 'ga_helpdesk_tickets'
    ];
    jeep_company_id UUID;
BEGIN
    SELECT id INTO jeep_company_id FROM public.companies WHERE slug = 'pt-jeep-mining';
    FOREACH target_table IN ARRAY table_list LOOP
        IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
            EXECUTE format('UPDATE public.%I SET company_id = $1 WHERE company_id IS NULL', target_table)
            USING jeep_company_id;
        END IF;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        lower(role) IN ('admin', 'administrator', 'superadmin'),
        false
    ) FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.assign_current_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.company_id IS NULL THEN
        NEW.company_id := public.current_company_id();
    END IF;
    IF NEW.company_id IS NULL THEN
        RAISE EXCEPTION 'Company context is required for this record';
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    target_table TEXT;
    table_list TEXT[] := ARRAY[
        'profiles', 'hrd_employees', 'dump_trucks', 'hauling_logs', 'roles',
        'division_permissions', 'custom_form_fields', 'company_assets',
        'company_legal_licenses', 'site_vendors', 'ga_transport_shuttle',
        'safety_training_records', 'sparepart_inventory', 'security_gate_logs',
        'safety_hazard_reports', 'radio_inventory', 'employee_performance_reviews',
        'ga_mess_facilities', 'finance_transactions', 'environmental_compliance_logs',
        'site_production_logs', 'csr_program_logs', 'clinic_patient_logs',
        'ga_catering_logs', 'fuel_logs', 'adm_documents', 'environment_logs',
        'jetty_barging_logs', 'it_helpdesk_tickets', 'corporate_investor_reports',
        'dor_reports', 'geology_samples', 'radio_devices', 'fleet_maintenance_logs',
        'fleet_units', 'ga_helpdesk_tickets'
    ];
BEGIN
    FOREACH target_table IN ARRAY table_list LOOP
        IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', target_table || '_tenant_context', target_table);
            EXECUTE format(
                'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_current_company_id()',
                target_table || '_tenant_context', target_table
            );
        END IF;
    END LOOP;
END $$;

-- Replace table policies for known tenant tables so an old permissive policy
-- cannot accidentally expose another company's rows.
DO $$
DECLARE
    target_table TEXT;
    existing_policy TEXT;
    table_list TEXT[] := ARRAY[
        'profiles', 'hrd_employees', 'dump_trucks', 'hauling_logs', 'roles',
        'division_permissions', 'custom_form_fields', 'company_assets',
        'company_legal_licenses', 'site_vendors', 'ga_transport_shuttle',
        'safety_training_records', 'sparepart_inventory', 'security_gate_logs',
        'safety_hazard_reports', 'radio_inventory', 'employee_performance_reviews',
        'ga_mess_facilities', 'finance_transactions', 'environmental_compliance_logs',
        'site_production_logs', 'csr_program_logs', 'clinic_patient_logs',
        'ga_catering_logs', 'fuel_logs', 'adm_documents', 'environment_logs',
        'jetty_barging_logs', 'it_helpdesk_tickets', 'corporate_investor_reports',
        'dor_reports', 'geology_samples', 'radio_devices', 'fleet_maintenance_logs',
        'fleet_units', 'ga_helpdesk_tickets'
    ];
BEGIN
    FOREACH target_table IN ARRAY table_list LOOP
        IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
            FOR existing_policy IN
                SELECT policyname FROM pg_policies
                WHERE schemaname = 'public' AND tablename = target_table
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', existing_policy, target_table);
            END LOOP;
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
            EXECUTE format('CREATE POLICY tenant_select ON public.%I FOR SELECT USING (company_id = public.current_company_id() OR public.is_superadmin())', target_table);
            EXECUTE format('CREATE POLICY tenant_insert ON public.%I FOR INSERT WITH CHECK (company_id = public.current_company_id() OR public.is_superadmin())', target_table);
            EXECUTE format('CREATE POLICY tenant_update ON public.%I FOR UPDATE USING (company_id = public.current_company_id() OR public.is_superadmin()) WITH CHECK (company_id = public.current_company_id() OR public.is_superadmin())', target_table);
            EXECUTE format('CREATE POLICY tenant_delete ON public.%I FOR DELETE USING (company_id = public.current_company_id() OR public.is_superadmin())', target_table);
        END IF;
    END LOOP;
END $$;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_manage ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT USING (id = public.current_company_id() OR public.is_superadmin());
CREATE POLICY companies_manage ON public.companies FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

CREATE OR REPLACE FUNCTION public.create_company(
    company_name TEXT,
    company_slug TEXT,
    company_logo_url TEXT DEFAULT NULL,
    company_user_limit INTEGER DEFAULT 25,
    company_iup_status TEXT DEFAULT 'Belum Diverifikasi',
    company_rkab_status TEXT DEFAULT 'Belum Diverifikasi'
)
RETURNS public.companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    created_company public.companies;
BEGIN
    IF NOT public.is_superadmin() THEN
        RAISE EXCEPTION 'Only a superadmin can create a company';
    END IF;
    INSERT INTO public.companies (name, slug, logo_url, user_limit, iup_status, rkab_status)
    VALUES (trim(company_name), lower(trim(company_slug)), company_logo_url, company_user_limit, company_iup_status, company_rkab_status)
    RETURNING * INTO created_company;
    RETURN created_company;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_company(TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_members_select ON public.company_members;
DROP POLICY IF EXISTS company_members_manage ON public.company_members;
CREATE POLICY company_members_select ON public.company_members
    FOR SELECT USING (user_id = auth.uid() OR company_id = public.current_company_id() OR public.is_superadmin());
CREATE POLICY company_members_manage ON public.company_members
    FOR ALL USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());
