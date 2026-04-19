'use client'
import Navbar from '@/components/Navbar'

export default function BrandShell({ children, userName, hasAccess }: {
  children: React.ReactNode; userName: string; hasAccess: boolean
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="brand" userName={userName} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
