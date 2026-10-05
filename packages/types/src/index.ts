export type CompanyStatus = 'Aktif' | 'Non-Aktif' | 'Suspended'
export type VerificationStatus = 'Belum Diverifikasi' | 'Dalam Verifikasi' | 'Terverifikasi' | 'Ditolak'

export interface Company {
    id: string
    name: string
    slug: string
    logo_url: string | null
    user_limit: number
    iup_status: VerificationStatus
    rkab_status: VerificationStatus
    status: CompanyStatus
    created_at: string
    updated_at: string
}

export interface CompanyCreateInput {
    company_name: string
    company_slug: string
    company_logo_url?: string | null
    company_user_limit?: number
    company_iup_status?: VerificationStatus
    company_rkab_status?: VerificationStatus
}

export interface TenantScopedRecord {
    id: string
    company_id: string
    created_at?: string
}

export interface CompanyMember extends TenantScopedRecord {
