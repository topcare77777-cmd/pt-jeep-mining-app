import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Input Ritase Lapangan - PT. JEEP',
  description: 'Modul Input Ritase Pengawas Tambang Nikel PT. JEEP',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}