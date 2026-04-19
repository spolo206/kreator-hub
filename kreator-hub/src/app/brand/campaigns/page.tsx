'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'

const EMPTY = {
  title_en:'', title_es:'', title_ko:'',
  description_en:'', description_es:'', description_ko:'',
  category:'Fashion', campaign_type:'paid', budget_min:'', budget_max:'',
  deadline:'', deliverable_date:'', spots:'',
  min_followers:'', min_engagement:'',
  what_creator_gets:'', content_guidelines:'', brand_info:'',
  target_countries:[] as string[], required_platforms:[] as string[],
}

const COUNTRIES = ['Spain','South Korea','Mexico','USA','UK','France','Germany','Japan','Brazil','Argentina','Colombia','Italy','Portugal','Australia','Canada']
const PLATFORMS_LIST = ['Instagram','TikTok','YouTube','Twitter/X','Pinterest']
const STATUS_COLORS: Record<string,string> = {
  active: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function BrandCampaignsPage() {
  const { lang, t } = useLang()
  const b = t.brand
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('campaigns')
      .select('*, applications(count)').eq('brand_id', user.id).order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleArr(k: 'target_countries'|'required_platforms', val: string) {
    setForm(f => ({ ...f, [k]: f[k].includes(val) ? f[k].filter(x => x !== val) : [...f[k], val] }))
  }

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY)
    setShowModal(true)
  }

  function openEdit(c: any) {
    setEditingId(c.id)
    setForm({
      title_en: c.title_en||'', title_es: c.title_es||'', title_ko: c.title_ko||'',
      description_en: c.description_en||'', description_es: c.description_es||'', description_ko: c.description_ko||'',
      category: c.category||'Fashion', campaign_type: c.campaign_type||'paid',
      budget_min: c.budget_min?.toString()||'', budget_max: c.budget_max?.toString()||'',
      deadline: c.deadline||'', deliverable_date: c.deliverable_date||'',
      spots: c.spots?.toString()||'',
      min_followers: c.min_followers?.toString()||'', min_engagement: c.min_engagement?.toString()||'',
      what_creator_gets: c.what_creator_gets||'', content_guidelines: c.content_guidelines||'',
      brand_info: c.brand_info||'',
      target_countries: c.target_countries||[], required_platforms: c.required_platforms||[],
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      brand_id: user.id,
      title_en: form.title_en || form.title_es || form.title_ko,
      title_es: form.title_es || form.title_en,
      title_ko: form.title_ko || form.title_en,
      description_en: form.description_en || form.description_es,
      description_es: form.description_es || form.description_en,
      description_ko: form.description_ko || form.description_en,
      category: form.category,
      campaign_type: form.campaign_type,
      budget_min: parseInt(form.budget_min)||0,
      budget_max: parseInt(form.budget_max)||0,
      deadline: form.deadline||null,
      deliverable_date: form.deliverable_date||null,
      spots: parseInt(form.spots)||1,
      min_followers: parseInt(form.min_followers)||0,
      min_engagement: parseFloat(form.min_engagement)||0,
      what_creator_gets: form.what_creator_gets,
      content_guidelines: form.content_guidelines,
      brand_info: form.brand_info,
      target_countries: form.target_countries,
      required_platforms: form.required_platforms,
      status: 'active',
    }

    if (editingId) {
      await supabase.from('campaigns').update(payload).eq('id', editingId)
    } else {
      await supabase.from('campaigns').insert(payload)
    }

    setForm(EMPTY); setShowModal(false); setEditingId(null); setSaving(false); load()
  }

  async function toggleStatus(c: any) {
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', c.id)
    load()
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-medium">{b.myCampaigns}</h1>
        <button onClick={openCreate} className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700">{b.newCampaign}</button>
      </div>

      {campaigns.length === 0
        ? <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">{b.noCampaigns}</div>
        : <div className="space-y-2">
            {campaigns.map(c => {
              const title = c[`title_${lang}`] || c.title_en
              const appCount = c.applications?.[0]?.count || 0
              const typeColors: Record<string,string> = { paid:'bg-green-100 text-green-700', gifted:'bg-blue-100 text-blue-700', both:'bg-violet-100 text-violet-700' }
              return (
                <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-40">
                    <p className="font-medium text-sm">{title}</p>
                    <p className="text-xs text-gray-500">{c.category} · {c.campaign_type === 'paid' ? `€${c.budget_min?.toLocaleString()}–€${c.budget_max?.toLocaleString()}` : c.campaign_type}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[c.campaign_type]||'bg-gray-100 text-gray-600'}`}>{c.campaign_type}</span>
                  <span className="text-sm"><span className="font-medium text-violet-600">{appCount}</span> <span className="text-gray-500">{b.applications}</span></span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[c.status]||STATUS_COLORS.active}`}>{c.status}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)}
                      className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                    <button onClick={() => toggleStatus(c)}
                      className={`text-xs px-3 py-1 border rounded-lg ${c.status === 'active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-green-200 text-green-700 hover:bg-green-50'}`}>
                      {c.status === 'active' ? 'Pause' : 'Activate'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="font-medium text-base mb-4">{editingId ? 'Edit campaign' : b.newCampaignTitle}</h2>
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-400 uppercase">Campaign titles</p>
              {[['title_en','EN'],['title_es','ES'],['title_ko','KO']].map(([k,l]) => (
                <div key={k}><label className="block text-xs text-gray-500 mb-1">{b.campaignName} ({l})</label>
                  <input value={(form as any)[k]} onChange={set(k)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              ))}

              <p className="text-xs font-medium text-gray-400 uppercase pt-2">Campaign details</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">{b.category}</label>
                  <select value={form.category} onChange={set('category')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
                    {t.cats.map(c => <option key={c}>{c}</option>)}
                  </select></div>
                <div><label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={form.campaign_type} onChange={set('campaign_type')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
                    <option value="paid">Paid</option>
                    <option value="gifted">Gifted</option>
                    <option value="both">Paid + Gifted</option>
                  </select></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">Budget min (€)</label>
                  <input type="number" value={form.budget_min} onChange={set('budget_min')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Budget max (€)</label>
                  <input type="number" value={form.budget_max} onChange={set('budget_max')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              </div>

              <div><label className="block text-xs text-gray-500 mb-1">What creators receive</label>
                <textarea value={form.what_creator_gets} onChange={set('what_creator_gets')} rows={2}
                  placeholder="€500 + free product worth €200..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>

              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">Application deadline</label>
                  <input type="date" value={form.deadline} onChange={set('deadline')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Deliverable date</label>
                  <input type="date" value={form.deliverable_date} onChange={set('deliverable_date')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs text-gray-500 mb-1">Spots</label>
                  <input type="number" value={form.spots} onChange={set('spots')} placeholder="5" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Min. followers</label>
                  <input type="number" value={form.min_followers} onChange={set('min_followers')} placeholder="10000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Min. engagement %</label>
                  <input type="number" step="0.1" value={form.min_engagement} onChange={set('min_engagement')} placeholder="3.0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              </div>

              <p className="text-xs font-medium text-gray-400 uppercase pt-2">Platforms required</p>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS_LIST.map(p => (
                  <button key={p} type="button" onClick={() => toggleArr('required_platforms', p)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.required_platforms.includes(p) ? 'bg-violet-100 text-violet-700 border-violet-300' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{p}</button>
                ))}
              </div>

              <p className="text-xs font-medium text-gray-400 uppercase pt-2">Target countries</p>
              <div className="flex flex-wrap gap-1.5">
                {COUNTRIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleArr('target_countries', c)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.target_countries.includes(c) ? 'bg-violet-100 text-violet-700 border-violet-300' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{c}</button>
                ))}
              </div>

              <div><label className="block text-xs text-gray-500 mb-1">Content guidelines</label>
                <textarea value={form.content_guidelines} onChange={set('content_guidelines')} rows={3}
                  placeholder="What to create, tone of voice, what to avoid..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>

              <div><label className="block text-xs text-gray-500 mb-1">About the brand</label>
                <textarea value={form.brand_info} onChange={set('brand_info')} rows={2}
                  placeholder="Short description of your brand and campaign goals..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => { setShowModal(false); setEditingId(null) }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{t.creator.cancel}</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-60">
                {saving ? '...' : editingId ? 'Save changes' : b.publish}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
