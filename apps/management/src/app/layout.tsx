import './globals.css'

export const metadata = {
    title: 'Manajemen Operasi Tambang - PT. JEEP',
    description: 'Portal Divisi Operasional dan Manajemen PT. Jangkar Energi Eka Perkasa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="id">
            <head>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body className="bg-[#060c14] text-slate-100 antialiased min-h-screen">
                {children}
            </body>
        </html>
    )
}