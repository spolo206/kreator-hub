'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

export default function BrandDashboard() {
  const { lang, t } = useLang()
  const b = t.brand
  const supabase = createClient()

  const [stats, setStats] = useState({ active: 0, apps: 0, accepted: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
      setUserName(profile?.full_name || '')

      const { data: camps } = await supabase.from('campaigns').select('id, status').eq('brand_id', user.id)
      const active = camps?.filter(c => c.status === 'active').length || 0
      const campIds = camps?.map(c => c.id) || []

      let allApps: any[] = []
      if (campIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('*, campaigns(title_en, title_es, title_ko), profiles(full_name, id)')
          .in('campaign_id', campIds)
          .order('created_at', { ascending: false })
          .limit(10)
        allApps = apps || []
      }
      const accepted = allApps.filter(a => a.status === 'accepted').length
      setStats({ active, apps: allApps.length, accepted })
      setRecentApps(allApps.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(appId: string, status: 'accepted' | 'rejected') {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setRecentApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-medium">{b.welcome}, {userName}</h1>
        <p className="text-sm text-gray-500">{b.recentApps}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { num: stats.active, label: b.activeCampaigns, color: 'text-violet-600' },
          { num: stats.apps, label: b.receivedApps, color: 'text-green-600' },
          { num: stats.accepted, label: b.selectedInf, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
            <p className={`text-2xl font-medium ${s.color}`}>{s.num}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-medium mb-3">{b.recentApps}</h2>
      {recentApps.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">
          No applications yet.
        </div>
      ) : (
        <div className="space-y-2">
          {recentApps.map(app => {
            const campTitle = app.campaigns?.[`title_${lang}`] || app.campaigns?.title_en
            const creatorName = app.profiles?.full_name || '?'
            const initials = creatorName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.pending
            return (
              <div key={app.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
                <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-32">
                  <p className="font-medium text-sm">{creatorName}</p>
                  <p className="text-xs text-gray-500 truncate">{campTitle}</p>
                </div>
                {app.proposed_rate && (
                  <span className="text-sm font-medium text-green-700">€{app.proposed_rate.toLocaleString()}</span>
                )}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyle}`}>
                  {t.creator[app.status as keyof typeof t.creator] as string || app.status}
                </span>
                {app.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <button onClick={() => updateStatus(app.id, 'accepted')}
                      className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-700 hover:bg-green-50">{b.accept}</button>
                    <button onClick={() => updateStatus(app.id, 'rejected')}
                      className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">✕</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
