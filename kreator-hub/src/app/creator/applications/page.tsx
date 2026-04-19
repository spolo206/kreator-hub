'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function ApplicationsPage() {
  const { lang, t } = useLang()
  const c = t.creator
  const supabase = createClient()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('applications')
        .select('*, campaigns(title_en, title_es, title_ko, budget_min, budget_max, profiles(full_name))')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      setApps(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  if (apps.length === 0) return (
    <div className="text-center py-20 text-gray-400 text-sm">{c.noApps}</div>
  )

  return (
    <div className="space-y-3 max-w-2xl">
      <h1 className="text-base font-medium mb-4">{t.nav.applications}</h1>
      {apps.map(app => {
        const campaign = app.campaigns
        const title = campaign?.[`title_${lang}`] || campaign?.title_en
        const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.pending
        const statusLabel = c[app.status as keyof typeof c] as string || app.status
        return (
          <div key={app.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
              {campaign?.profiles?.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{title}</p>
              <p className="text-xs text-gray-500">{campaign?.profiles?.full_name} · €{campaign?.budget_min?.toLocaleString()}–€{campaign?.budget_max?.toLocaleString()}</p>
            </div>
            {app.proposed_rate && (
              <span className="text-sm font-medium text-green-700">€{app.proposed_rate.toLocaleString()}</span>
            )}
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}
