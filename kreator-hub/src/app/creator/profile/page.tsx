'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/components/LangProvider'

const PLATFORMS = [
  { key:'instagram', label:'Instagram', color:'bg-pink-100 text-pink-700', placeholder:'https://instagram.com/yourusername' },
  { key:'tiktok', label:'TikTok', color:'bg-gray-100 text-gray-700', placeholder:'https://tiktok.com/@yourusername' },
  { key:'youtube', label:'YouTube', color:'bg-red-100 text-red-700', placeholder:'https://youtube.com/@yourchannel' },
]

const COMMON_COUNTRIES = [
  'Spain','South Korea','Mexico','USA','UK','France','Germany',
  'Japan','Brazil','Argentina','Colombia','Italy','Portugal',
  'Australia','Canada','Chile','Peru','Netherlands','Poland','Turkey',
]

function fmt(n:number) {
  if(!n) return '0'
  if(n>=1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if(n>=1_000) return `${(n/1_000).toFixed(0)}k`
  return n.toString()
}

function getYouTubeEmbed(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/#]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}` : null
}

function getTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  return m ? m[1] : null
}

function isReel(url: string): boolean {
  return url.includes('instagram.com/reel') || url.includes('instagram.com/p/')
}

function VideoCard({ url, onRemove }: { url: string; onRemove: () => void }) {
  const ytEmbed = getYouTubeEmbed(url)
  const ttId = getTikTokId(url)
  const reel = isReel(url)

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-100 group">
      {ytEmbed ? (
        <div className="aspect-video">
          <iframe src={ytEmbed} className="w-full h-full" allowFullScreen />
        </div>
      ) : ttId ? (
        <div className="aspect-video flex items-center justify-center bg-gray-900">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-white text-center p-3">
            <div className="text-3xl mb-2">▶</div>
            <div className="text-xs opacity-70">TikTok</div>
            <div className="text-xs opacity-50 mt-1 break-all">{url.slice(0,40)}...</div>
          </a>
        </div>
      ) : reel ? (
        <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-white text-center p-3">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-sm font-medium">Instagram Reel</div>
            <div className="text-xs opacity-70 mt-1">Tap to open</div>
          </a>
        </div>
      ) : (
        <div className="aspect-video flex items-center justify-center bg-gray-200 p-3">
          <a href={url} target="_blank" className="text-xs text-gray-500 break-all text-center">{url}</a>
        </div>
      )}
      <button onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">×</button>
    </div>
  )
}

export default function CreatorProfilePage() {
  const { t } = useLang()
  const c = t.creator
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({
    full_name:'', handle:'', bio:'', location:'', language:'en',
    instagram_followers:0, tiktok_followers:0, youtube_followers:0, engagement_rate:'',
    categories:[] as string[],
    audience_gender_female:'', audience_gender_male:'',
    audience_age_13_17:'', audience_age_18_24:'', audience_age_25_34:'', audience_age_35_44:'', audience_age_45_plus:'',
    audience_top_countries:[] as string[],
    featured_videos:[] as string[],
    avatar_url:'',
  })
  const [urls, setUrls] = useState({ instagram:'', tiktok:'', youtube:'' })
  const [verifying, setVerifying] = useState<string|null>(null)
  const [verified, setVerified] = useState<Record<string,{username:string;followers:number;note?:string}>>({})
  const [verifyError, setVerifyError] = useState<string|null>(null)
  const [newVideo, setNewVideo] = useState('')
  const [newCountry, setNewCountry] = useState('')

  useEffect(() => {
    async function load() {
      const { data:{ user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data:profile } = await supabase.from('profiles').select('full_name').eq('id',user.id).single()
      const { data:cp } = await supabase.from('creator_profiles').select('*').eq('id',user.id).single()
      setForm({
        full_name: profile?.full_name||'',
        handle: cp?.handle||'', bio: cp?.bio||'', location: cp?.location||'', language: cp?.language||'en',
        instagram_followers: cp?.instagram_followers||0,
        tiktok_followers: cp?.tiktok_followers||0,
        youtube_followers: cp?.youtube_followers||0,
        engagement_rate: cp?.engagement_rate?.toString()||'',
        categories: cp?.categories||[],
        audience_gender_female: cp?.audience_gender_female?.toString()||'',
        audience_gender_male: cp?.audience_gender_male?.toString()||'',
        audience_age_13_17: cp?.audience_age_13_17?.toString()||'',
        audience_age_18_24: cp?.audience_age_18_24?.toString()||'',
        audience_age_25_34: cp?.audience_age_25_34?.toString()||'',
        audience_age_35_44: cp?.audience_age_35_44?.toString()||'',
        audience_age_45_plus: cp?.audience_age_45_plus?.toString()||'',
        audience_top_countries: cp?.audience_top_countries||[],
        featured_videos: cp?.featured_videos||[],
        avatar_url: cp?.avatar_url||'',
      })
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setForm(f => ({ ...f, avatar_url: data.publicUrl }))
    }
    setUploadingAvatar(false)
  }

  async function handleVerify(platform: string) {
    const url = urls[platform as keyof typeof urls]
    if (!url.trim()) return
    setVerifying(platform); setVerifyError(null)
    try {
      const res = await fetch('/api/verify-social', {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ url })
      })
      const data = await res.json()
      if (!res.ok) { setVerifyError(data.error); setVerifying(null); return }
      setVerified(prev => ({ ...prev, [platform]: data }))
      setForm(prev => ({
        ...prev,
        [`${platform}_followers`]: data.followers > 0 ? data.followers : prev[`${platform}_followers` as keyof typeof prev],
        handle: prev.handle || (data.username ? `@${data.username}` : ''),
      }))
    } catch { setVerifyError('Connection error. Try again.') }
    setVerifying(null)
  }

  async function handleSave() {
    setSaving(true)
    const { data:{ user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user.id)
    await supabase.from('creator_profiles').upsert({
      id: user.id,
      handle: form.handle, bio: form.bio, location: form.location, language: form.language,
      instagram_followers: form.instagram_followers,
      tiktok_followers: form.tiktok_followers,
      youtube_followers: form.youtube_followers,
      engagement_rate: parseFloat(form.engagement_rate)||0,
      categories: form.categories,
      audience_gender_female: parseInt(form.audience_gender_female)||0,
      audience_gender_male: parseInt(form.audience_gender_male)||0,
      audience_age_13_17: parseInt(form.audience_age_13_17)||0,
      audience_age_18_24: parseInt(form.audience_age_18_24)||0,
      audience_age_25_34: parseInt(form.audience_age_25_34)||0,
      audience_age_35_44: parseInt(form.audience_age_35_44)||0,
      audience_age_45_plus: parseInt(form.audience_age_45_plus)||0,
      audience_top_countries: form.audience_top_countries,
      featured_videos: form.featured_videos,
      avatar_url: form.avatar_url,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
  }

  function toggleCat(cat:string) {
    setForm(f => ({ ...f, categories: f.categories.includes(cat) ? f.categories.filter(c=>c!==cat) : [...f.categories,cat] }))
  }

  function toggleCountry(c:string) {
    setForm(f => ({ ...f, audience_top_countries: f.audience_top_countries.includes(c) ? f.audience_top_countries.filter(x=>x!==c) : [...f.audience_top_countries,c] }))
  }

  function addCustomCountry() {
    const c = newCountry.trim()
    if (!c || form.audience_top_countries.includes(c)) return
    setForm(f => ({ ...f, audience_top_countries: [...f.audience_top_countries, c] }))
    setNewCountry('')
  }

  function addVideo() {
    const v = newVideo.trim()
    if (!v || form.featured_videos.length >= 6) return
    setForm(f => ({ ...f, featured_videos: [...f.featured_videos, v] }))
    setNewVideo('')
  }

  const initials = form.full_name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
  const total = (form.instagram_followers||0)+(form.tiktok_followers||0)+(form.youtube_followers||0)

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>

  return (
    <div className="max-w-xl space-y-4">

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-shrink-0">
            {form.avatar_url
              ? <img src={form.avatar_url} className="w-16 h-16 rounded-full object-cover" />
              : <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-medium">{initials||'?'}</div>
            }
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-violet-700">
              {uploadingAvatar ? '…' : '+'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-medium">{form.full_name||'Your name'}</p>
            <p className="text-sm text-gray-500">{form.handle||'@handle'} · {form.location||'Location'}</p>
            {total > 0 && <p className="text-xs text-violet-600 font-medium mt-0.5">{fmt(total)} total followers</p>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{label:'Instagram',val:form.instagram_followers,color:'text-pink-600'},{label:'TikTok',val:form.tiktok_followers,color:'text-gray-700'},{label:'YouTube',val:form.youtube_followers,color:'text-red-600'}].map(s=>(
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className={`text-base font-medium ${s.color}`}>{fmt(s.val)}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Social verification */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="font-medium mb-1">Connect social networks</h2>
        <p className="text-xs text-gray-400 mb-4">Paste your profile URL — we verify it and try to import your follower count automatically</p>
        {verifyError && <div className="bg-red-50 text-red-600 text-xs rounded-lg p-3 mb-3">{verifyError}</div>}
        <div className="space-y-3">
          {PLATFORMS.map(p => {
            const v = verified[p.key]
            return (
              <div key={p.key}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.color}`}>{p.label}</span>
                  {v && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Verified {v.followers > 0 ? `· ${fmt(v.followers)} followers imported` : '· enter followers manually below'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input value={urls[p.key as keyof typeof urls]} onChange={e=>setUrls(prev=>({...prev,[p.key]:e.target.value}))}
                    placeholder={p.placeholder}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
                  <button onClick={()=>handleVerify(p.key)} disabled={verifying===p.key||!urls[p.key as keyof typeof urls].trim()}
                    className="px-3 py-2 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40 whitespace-nowrap">
                    {verifying===p.key ? '…' : v ? 'Update' : 'Verify'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Basic info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium">{c.editProfile}</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">{t.auth.nameLabel}</label>
            <input value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Handle</label>
            <input value={form.handle} onChange={e=>setForm(f=>({...f,handle:e.target.value}))} placeholder="@yourhandle"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
        </div>
        <div><label className="block text-xs text-gray-500 mb-1">Bio</label>
          <textarea value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} rows={3} placeholder={c.bioPlaceholder}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs text-gray-500 mb-1">Location</label>
            <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="Madrid, Spain"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Main language</label>
            <select value={form.language} onChange={e=>setForm(f=>({...f,language:e.target.value}))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-violet-400">
              <option value="en">English</option><option value="es">Spanish</option><option value="ko">Korean</option>
              <option value="fr">French</option><option value="de">German</option><option value="ja">Japanese</option>
              <option value="pt">Portuguese</option><option value="it">Italian</option>
            </select></div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{label:'Instagram followers',k:'instagram_followers'},{label:'TikTok followers',k:'tiktok_followers'},{label:'YouTube subscribers',k:'youtube_followers'}].map(({label,k})=>(
            <div key={k}><label className="block text-xs text-gray-500 mb-1">{label}</label>
              <input type="number" value={(form as any)[k]} onChange={e=>setForm(f=>({...f,[k]:parseInt(e.target.value)||0}))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
          ))}
        </div>

        <div><label className="block text-xs text-gray-500 mb-1">{c.engagement} (%)</label>
          <input type="number" step="0.1" value={form.engagement_rate} onChange={e=>setForm(f=>({...f,engagement_rate:e.target.value}))}
            placeholder="4.5" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>

        <div><label className="block text-xs text-gray-500 mb-2">Categories</label>
          <div className="flex flex-wrap gap-1.5">
            {t.cats.map(cat=>(
              <button key={cat} onClick={()=>toggleCat(cat)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.categories.includes(cat)?'bg-violet-100 text-violet-700 border-violet-300':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{cat}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Audience demographics */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium">Audience demographics</h2>
        <p className="text-xs text-gray-400">Add data from Instagram Insights or TikTok Analytics</p>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Gender split (%)</label>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs text-pink-500 mb-1">Female %</label>
              <input type="number" value={form.audience_gender_female} onChange={e=>setForm(f=>({...f,audience_gender_female:e.target.value}))} placeholder="65"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
            <div><label className="block text-xs text-blue-500 mb-1">Male %</label>
              <input type="number" value={form.audience_gender_male} onChange={e=>setForm(f=>({...f,audience_gender_male:e.target.value}))} placeholder="35"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Age groups (%)</label>
          <div className="grid grid-cols-5 gap-2">
            {[['13–17','audience_age_13_17'],['18–24','audience_age_18_24'],['25–34','audience_age_25_34'],['35–44','audience_age_35_44'],['45+','audience_age_45_plus']].map(([label,key])=>(
              <div key={key}><label className="block text-xs text-gray-400 mb-1 text-center">{label}</label>
                <input type="number" value={(form as any)[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.value}))} placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-violet-400" /></div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-2">Top audience countries <span className="text-gray-400">(add in order: biggest first)</span></label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {COMMON_COUNTRIES.map(country=>(
              <button key={country} onClick={()=>toggleCountry(country)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.audience_top_countries.includes(country)?'bg-violet-100 text-violet-700 border-violet-300':'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{country}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCountry} onChange={e=>setNewCountry(e.target.value)} placeholder="Add other country..."
              onKeyDown={e=>e.key==='Enter'&&addCustomCountry()}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" />
            <button onClick={addCustomCountry} className="px-3 py-2 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700">Add</button>
          </div>
          {form.audience_top_countries.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.audience_top_countries.map((c,i)=>(
                <span key={c} className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="text-violet-400 font-medium">#{i+1}</span> {c}
                  <button onClick={()=>setForm(f=>({...f,audience_top_countries:f.audience_top_countries.filter(x=>x!==c)}))} className="text-violet-400 hover:text-violet-700 ml-0.5">×</button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured videos */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium">Featured content</h2>
        <p className="text-xs text-gray-400">Add up to 6 links — YouTube embeds directly, TikTok and Instagram Reels open in a new tab</p>
        <div className="flex gap-2">
          <input value={newVideo} onChange={e=>setNewVideo(e.target.value)}
            placeholder="YouTube, TikTok or Instagram Reel URL..."
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            onKeyDown={e=>e.key==='Enter'&&addVideo()} />
          <button onClick={addVideo} disabled={form.featured_videos.length>=6}
            className="px-3 py-2 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40">Add</button>
        </div>
        {form.featured_videos.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {form.featured_videos.map((url,i) => (
              <VideoCard key={i} url={url} onRemove={()=>setForm(f=>({...f,featured_videos:f.featured_videos.filter((_,idx)=>idx!==i)}))} />
            ))}
          </div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
        {saving ? c.saving : c.saveChanges}
      </button>
    </div>
  )
}
