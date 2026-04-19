'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'
import InfluencerProfileModal from '@/components/InfluencerProfileModal'

const TAG_COLORS: Record<string,string> = {
  Fashion:'bg-violet-100 text-violet-700', Technology:'bg-blue-100 text-blue-700',
  Fitness:'bg-teal-100 text-teal-700', Food:'bg-amber-100 text-amber-700',
  Travel:'bg-orange-100 text-orange-700', Beauty:'bg-pink-100 text-pink-700',
  Gaming:'bg-indigo-100 text-indigo-700', Lifestyle:'bg-violet-100 text-violet-700',
  Moda:'bg-violet-100 text-violet-700', 패션:'bg-violet-100 text-violet-700',
}

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`
  return n.toString()
}

export default function BrandSearchPage() {
  const { t } = useLang()
  const b = t.brand
  const supabase = createClient()

  const [influencers, setInfluencers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('')
  const [size, setSize] = useState('')
  const [minEng, setMinEng] = useState('')
  const [location, setLocation] = useState('')
  const [selected, setSelected] = useState<any|null>(null)
  const [brandId, setBrandId] = useState('')

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setBrandId(user.id)
    const { data } = await supabase
      .from('creator_profiles')
      .select('*, profiles(id, full_name, email)')
      .eq('is_visible', true)
      .order('instagram_followers', { ascending: false })
    setInfluencers(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const filtered = influencers.filter(inf => {
    const name = inf.profiles?.full_name?.toLowerCase() || ''
    const handle = (inf.handle||'').toLowerCase()
    const total = (inf.instagram_followers||0)+(inf.tiktok_followers||0)+(inf.youtube_followers||0)
    return (
      (!search || name.includes(search.toLowerCase()) || handle.includes(search.toLowerCase())) &&
      (!cat || inf.categories?.includes(cat)) &&
      (!size ||
        (size==='micro' && total < 10000) ||
        (size==='mid' && total>=10000 && total<100000) ||
        (size==='macro' && total>=100000)) &&
      (!minEng || (inf.engagement_rate||0) >= parseFloat(minEng)) &&
      (!location || (inf.location||'').toLowerCase().includes(location.toLowerCase()))
    )
  })

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <h1 className="text-base font-medium mb-4">{b.searchInfluencers}</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={b.searchPlaceholder}
          className="col-span-2 sm:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400" />
        <select value={cat} onChange={e => setCat(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
          <option value="">{t.creator.allCategories}</option>
          {t.cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={size} onChange={e => setSize(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
          <option value="">{b.anySize}</option>
          <option value="micro">{b.micro}</option>
          <option value="mid">{b.mid}</option>
          <option value="macro">{b.macro}</option>
        </select>
        <input value={minEng} onChange={e => setMinEng(e.target.value)} type="number" step="0.1" placeholder="Min. eng. %"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400" />
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400" />
      </div>

      <p className="text-xs text-gray-400 mb-3">{filtered.length} influencers found</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No influencers found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((inf) => {
            const name = inf.profiles?.full_name || 'Creator'
            const initials = name.split(' ').map((w:string) => w[0]).join('').toUpperCase().slice(0, 2)
            const total = (inf.instagram_followers||0)+(inf.tiktok_followers||0)+(inf.youtube_followers||0)
            return (
              <div key={inf.id} onClick={() => setSelected(inf)}
                className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:border-violet-200 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  {inf.avatar_url
                    ? <img src={inf.avatar_url} alt={name} className="w-11 h-11 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                    : <div className="w-11 h-11 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-medium flex-shrink-0">{initials}</div>
                  }
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-gray-500">{inf.handle||'—'} · {inf.location||'—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {inf.categories?.slice(0,3).map((c:string) => (
                    <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[c]||'bg-gray-100 text-gray-600'}`}>{c}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-gray-50 rounded-lg py-1.5">
                    <p className="text-xs font-medium text-pink-600">{fmt(inf.instagram_followers)}</p>
                    <p className="text-xs text-gray-400">IG</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-1.5">
                    <p className="text-xs font-medium text-gray-700">{fmt(inf.tiktok_followers)}</p>
                    <p className="text-xs text-gray-400">TT</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg py-1.5">
                    <p className="text-xs font-medium text-green-600">{inf.engagement_rate||0}%</p>
                    <p className="text-xs text-gray-400">Eng.</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <InfluencerProfileModal
          name={selected.profiles?.full_name || '?'}
          profile={selected}
          onClose={() => setSelected(null)}
          brandId={brandId}
          creatorId={selected.profiles?.id || selected.id}
        />
      )}
    </div>
  )
}
