'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from './LangProvider'
import LangSwitcher from './LangSwitcher'

interface NavbarProps { role: 'creator'|'brand'; userName?: string }

export default function Navbar({ role, userName }: NavbarProps) {
  const { t } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const creatorItems = [
    { href: '/creator/explore', label: t.nav.explore },
    { href: '/creator/applications', label: t.nav.applications },
    { href: '/messages', label: 'Messages' },
    { href: '/creator/profile', label: t.nav.profile },
  ]
  const brandItems = [
    { href: '/brand/dashboard', label: t.nav.dashboard },
    { href: '/brand/campaigns', label: t.nav.campaigns },
    { href: '/brand/applications', label: 'Applications' },
    { href: '/brand/search', label: t.nav.search },
    { href: '/messages', label: 'Messages' },
  ]
  const items = role === 'creator' ? creatorItems : brandItems
  const initials = userName ? userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '?'

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <nav className="bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-2">
      <Link href="/" className="font-medium text-base flex-shrink-0">
        Kreator<span className="text-violet-600">Hub</span>
      </Link>
      <div className="flex gap-1 flex-wrap justify-center">
        {items.map(item => (
          <Link key={item.href} href={item.href}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? 'bg-violet-100 text-violet-700 font-medium'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <LangSwitcher />
        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium">
          {initials}
        </div>
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded-md">
          {t.nav.logout}
        </button>
      </div>
    </nav>
  )
}
