import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LangProvider } from '@/components/LangProvider'
import CreatorShell from './shell'

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single()

  if (profile?.role === 'brand') redirect('/brand/dashboard')

  return (
    <LangProvider>
      <CreatorShell userName={profile?.full_name || ''}>
        {children}
      </CreatorShell>
    </LangProvider>
  )
}
