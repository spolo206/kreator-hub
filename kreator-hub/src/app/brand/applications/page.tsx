'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'
import InfluencerProfileModal from '@/components/InfluencerProfileModal'

const STATUS_STYLES: Record<string,string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
}

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`
  return n.toString()
}

export default function BrandApplicationsPage() {
  const { lang, t } = useLang()
  const supabase = createClient()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any|null>(null)
  const [brandId, setBrandId] = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setBrandId(user.id)

    const { data: camps } = await supabase.from('campaigns').select('id').eq('brand_id', user.id)
    const campIds = camps?.map(c => c.id) || []
    if (!campIds.length) { setLoading(false); return }

    const { data: applications } = await supabase
      .from('applications')
      .select('*, campaigns(title_en, title_es, title_ko, what_creator_gets)')
      .in('campaign_id', campIds)
      .order('created_at', { ascending: false })

    if (!applications?.length) { setApps([]); setLoading(false); return }

    const enriched = await Promise.all(applications.map(async (app) => {
      const [{ data: profile }, { data: cp }] = await Promise.all([
        supabase.from('profiles').select('id, full_name').eq('id', app.creator_id).single(),
        supabase.from('creator_profiles').select('*').eq('id', app.creator_id).single(),
      ])
      return { ...app, profile, creator_profile: cp }
    }))

    setApps(enriched)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function updateStatus(appId: string, status: 'accepted'|'rejected') {
    await supabase.from('applications').update({ status }).eq('id', appId)
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status } : a))
    if (selected?.id === appId) setSelected((p: any) => ({ ...p, status }))
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <h1 className="text-base font-medium mb-5">{t.brand.receivedApps}</h1>

      {apps.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">No applications yet.</div>
      ) : (
        <div className="space-y-2">
          {apps.map(app => {
            const campTitle = app.campaigns?.[`title_${lang}`] || app.campaigns?.title_en
            const name = app.profile?.full_name || '?'
            const initials = name.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0, 2)
            const cp = app.creator_profile
            const total = (cp?.instagram_followers||0)+(cp?.tiktok_followers||0)+(cp?.youtube_followers||0)
            return (
              <div key={app.id} onClick={() => setSelected(app)}
                className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap cursor-pointer hover:border-gray-200">
                {cp?.avatar_url
                  ? <img src={cp.avatar_url} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                  : <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-medium flex-shrink-0">{initials}</div>
                }
                <div className="flex-1 min-w-32">
                  <p className="font-medium text-sm">{name}
                    {cp?.handle && <span className="text-gray-400 font-normal ml-1 text-xs">{cp.handle}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{campTitle}</p>
                </div>
                <div className="flex gap-3 text-xs">
                  {total > 0 && <span><span className="font-medium">{fmt(total)}</span> <span className="text-gray-400">followers</span></span>}
                  {cp?.engagement_rate > 0 && <span className="text-green-600 font-medium">{cp.engagement_rate}%</span>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_STYLES[app.status]||STATUS_STYLES.pending}`}>
                  {t.creator[app.status as keyof typeof t.creator] as string || app.status}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <InfluencerProfileModal
          name={selected.profile?.full_name || '?'}
          profile={selected.creator_profile}
          campaignTitle={selected.campaigns?.[`title_${lang}`] || selected.campaigns?.title_en}
          campaignOffer={selected.campaigns?.what_creator_gets}
          message={selected.message}
          status={selected.status}
          onClose={() => setSelected(null)}
          onAccept={() => updateStatus(selected.id, 'accepted')}
          onReject={() => updateStatus(selected.id, 'rejected')}
          brandId={brandId}
          creatorId={selected.creator_id}
          campaignId={selected.campaign_id}
        />
      )}
    </div>
  )
}
