'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'
import type { Lang } from '@/lib/i18n'

const TAG_COLORS: Record<string, string> = {
  Fashion:'bg-violet-100 text-violet-700', Moda:'bg-violet-100 text-violet-700', 패션:'bg-violet-100 text-violet-700',
  Technology:'bg-blue-100 text-blue-700', Tecnología:'bg-blue-100 text-blue-700', 기술:'bg-blue-100 text-blue-700',
  Fitness:'bg-teal-100 text-teal-700', 피트니스:'bg-teal-100 text-teal-700',
  Food:'bg-amber-100 text-amber-700', Gastronomía:'bg-amber-100 text-amber-700', 음식:'bg-amber-100 text-amber-700',
  Travel:'bg-orange-100 text-orange-700', Viajes:'bg-orange-100 text-orange-700', 여행:'bg-orange-100 text-orange-700',
  Beauty:'bg-pink-100 text-pink-700', Belleza:'bg-pink-100 text-pink-700', 뷰티:'bg-pink-100 text-pink-700',
  Gaming:'bg-indigo-100 text-indigo-700', 게이밍:'bg-indigo-100 text-indigo-700',
  Lifestyle:'bg-violet-100 text-violet-700',
}

interface Campaign {
  id: string; brand_id: string; category: string
  title_en: string; title_es: string; title_ko: string
  description_en: string; description_es: string; description_ko: string
  budget_min: number; budget_max: number; deadline: string; spots: number
  profiles: { full_name: string }
  applied?: boolean
}

interface ApplyModalProps {
  campaign: Campaign; lang: Lang
  onClose: () => void; onSubmit: (msg: string) => void
}

function ApplyModal({ campaign, lang, onClose, onSubmit }: ApplyModalProps) {
  const { t } = useLang()
  const c = t.creator
  const [msg, setMsg] = useState('')
  const title = campaign[`title_${lang}` as keyof Campaign] as string || campaign.title_en

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-medium text-base mb-1">{c.modalTitle}</h2>
        <p className="text-sm text-gray-500 mb-4">{title}</p>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">{c.whyIdeal} <span className="text-gray-400">(optional)</span></label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{c.cancel}</button>
          <button onClick={() => onSubmit(msg)} className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700">{c.send}</button>
        </div>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { lang, t } = useLang()
  const c = t.creator
  const supabase = createClient()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [applying, setApplying] = useState<Campaign | null>(null)
  const [userId, setUserId] = useState<string>('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    let q = supabase.from('campaigns')
      .select('*, profiles(full_name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (cat) q = q.eq('category', cat)

    const { data } = await q
    if (!data) { setLoading(false); return }

    const { data: myApps } = await supabase
      .from('applications').select('campaign_id').eq('creator_id', user!.id)
    const appliedIds = new Set(myApps?.map(a => a.campaign_id) || [])

    setCampaigns(data.map(c => ({ ...c, applied: appliedIds.has(c.id) })))
    setLoading(false)
  }, [cat, supabase])

  useEffect(() => { load() }, [load])

  const filtered = campaigns.filter(c => {
    if (!search) return true
    const title = c[`title_${lang}` as keyof Campaign] as string || c.title_en
    return title.toLowerCase().includes(search.toLowerCase()) ||
      c.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
  })

  async function handleApply(msg: string) {
    if (!applying) return
    await supabase.from('applications').insert({
      campaign_id: applying.id,
      creator_id: userId,
      message: msg,
    })
    setCampaigns(prev => prev.map(c => c.id === applying.id ? { ...c, applied: true } : c))
    setApplying(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={c.searchPlaceholder}
          className="flex-1 min-w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white" />
        <select value={cat} onChange={e => setCat(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
          <option value="">{c.allCategories}</option>
          {t.cats.map(cat => <option key={cat}>{cat}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No campaigns found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(campaign => {
            const title = campaign[`title_${lang}` as keyof Campaign] as string || campaign.title_en
            const desc = campaign[`description_${lang}` as keyof Campaign] as string || campaign.description_en
            const tagColor = TAG_COLORS[campaign.category] || 'bg-gray-100 text-gray-600'
            return (
              <div key={campaign.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-gray-500">{campaign.profiles?.full_name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor}`}>
                    {campaign.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{desc}</p>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-medium text-green-700">
                    €{campaign.budget_min?.toLocaleString()}–€{campaign.budget_max?.toLocaleString()}
                  </span>
                  <span className="text-gray-400">{campaign.deadline} · {campaign.spots} {c.spots}</span>
                </div>
                <button
                  disabled={campaign.applied}
                  onClick={() => !campaign.applied && setApplying(campaign)}
                  className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${
                    campaign.applied
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-violet-600 text-white hover:bg-violet-700'
                  }`}>
                  {campaign.applied ? c.applied : c.applyNow}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {applying && (
        <ApplyModal
          campaign={applying}
          lang={lang}
          onClose={() => setApplying(null)}
          onSubmit={handleApply}
        />
      )}
    </div>
  )
}
