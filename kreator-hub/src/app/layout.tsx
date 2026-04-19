import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kreator Hub — Influencer Marketing Platform',
  description: 'Connect creators with brands · EN ES KO',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
