-- 1. Tabel Master Unit Dump Truck
CREATE TABLE public.dump_trucks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_code VARCHAR(50) UNIQUE NOT NULL, -- Contoh: DT-001, DT-014
    model VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active', -- Active, Breakdown, Service
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Log Ritase / Hauling (Mendukung input lapangan / offline-first)
CREATE TABLE public.hauling_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    unit_id UUID REFERENCES public.dump_trucks(id),
    driver_name VARCHAR(150),
    pit_location VARCHAR(100) NOT NULL, -- Contoh: Pit B-01
    material_type VARCHAR(50) NOT NULL, -- Saprolite, Limonite, OB
    netto_weight NUMERIC(10, 2), -- Tonase (WMT) atau BCM
    destination VARCHAR(100), -- Stockpile 1, Disposal C, dll
    status_sync VARCHAR(20) DEFAULT 'Synced', -- Synced, Pending (jika offline)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);