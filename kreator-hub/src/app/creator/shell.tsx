'use client'
import Navbar from '@/components/Navbar'

export default function CreatorShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role="creator" userName={userName} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
