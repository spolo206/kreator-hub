import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LangProvider } from '@/components/LangProvider'
import BrandShell from './shell'

export default async function BrandLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (profile?.role === 'creator') redirect('/creator/explore')

  const { data: brand } = await supabase
    .from('brand_profiles').select('subscription_status, created_by_admin').eq('id', user.id).single()

  const isSubscribePage = false // handled client-side
  const hasAccess = brand?.subscription_status === 'active' || brand?.created_by_admin === true

  return (
    <LangProvider>
      <BrandShell userName={profile?.full_name || ''} hasAccess={hasAccess}>
        {children}
      </BrandShell>
    </LangProvider>
  )
}
