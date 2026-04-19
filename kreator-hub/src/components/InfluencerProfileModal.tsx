'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const TAG_COLORS: Record<string,string> = {
  Fashion:'bg-violet-100 text-violet-700', Technology:'bg-blue-100 text-blue-700',
  Fitness:'bg-teal-100 text-teal-700', Food:'bg-amber-100 text-amber-700',
  Travel:'bg-orange-100 text-orange-700', Beauty:'bg-pink-100 text-pink-700',
  Gaming:'bg-indigo-100 text-indigo-700', Lifestyle:'bg-violet-100 text-violet-700',
  Moda:'bg-violet-100 text-violet-700', Tecnología:'bg-blue-100 text-blue-700',
  패션:'bg-violet-100 text-violet-700', 기술:'bg-blue-100 text-blue-700',
}

function fmt(n: number) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`
  return n.toString()
}

interface Props {
  name: string
  profile: any       // creator_profiles row
  campaignTitle?: string
  campaignOffer?: string
  message?: string
  status?: string
  onClose: () => void
  onAccept?: () => void
  onReject?: () => void
  showMessage?: () => void
  brandId?: string
  creatorId?: string
  campaignId?: string
}

export default function InfluencerProfileModal({
  name, profile: cp, campaignTitle, campaignOffer, message,
  status, onClose, onAccept, onReject, showMessage,
  brandId, creatorId, campaignId
}: Props) {
  const router = useRouter()
  const [contacting, setContacting] = useState(false)
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function startConversation() {
    if (!brandId || !creatorId) return
    setContacting(true)
    const sb = createClient()
    const { data: existing } = await sb.from('conversations').select('id')
      .eq('brand_id', brandId).eq('creator_id', creatorId)
      .is(campaignId ? 'campaign_id' : 'campaign_id', campaignId || null)
      .maybeSingle()
    if (!existing) {
      await sb.from('conversations').insert({ brand_id: brandId, creator_id: creatorId, campaign_id: campaignId || null })
    }
    setContacting(false)
    router.push('/messages')
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start gap-3 sticky top-0 bg-white z-10">
          {cp?.avatar_url
            ? <img src={cp.avatar_url} alt={name} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border border-gray-100" />
            : <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-medium flex-shrink-0">{initials}</div>
          }
          <div className="flex-1 min-w-0">
            <p className="font-medium text-base">{name}</p>
            <p className="text-sm text-gray-500">{cp?.handle || '—'} · {cp?.location || '—'}</p>
            {cp?.language && <p className="text-xs text-gray-400 mt-0.5">Lang: {cp.language.toUpperCase()}</p>}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cp?.categories?.map((c:string) => (
                <span key={c} className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[c]||'bg-gray-100 text-gray-600'}`}>{c}</span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl flex-shrink-0">×</button>
        </div>

        <div className="p-5 space-y-5">

          {/* Social metrics */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Social metrics</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label:'Instagram', val:fmt(cp?.instagram_followers||0), color:'text-pink-600', sub: cp?.instagram_url },
                { label:'TikTok', val:fmt(cp?.tiktok_followers||0), color:'text-gray-700', sub: cp?.tiktok_url },
                { label:'YouTube', val:fmt(cp?.youtube_followers||0), color:'text-red-600', sub: cp?.youtube_url },
                { label:'Engagement', val:`${cp?.engagement_rate||0}%`, color:'text-green-600', sub: null },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className={`font-medium text-lg ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  {s.sub && <a href={s.sub} target="_blank" className="text-xs text-violet-500 hover:underline truncate block mt-0.5">{s.sub.replace('https://','')}</a>}
                </div>
              ))}
            </div>
          </div>

          {/* Bio */}
          {cp?.bio && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Bio</p>
              <p className="text-sm text-gray-600 leading-relaxed">{cp.bio}</p>
            </div>
          )}

          {/* Audience demographics */}
          {(cp?.audience_gender_female > 0 || cp?.audience_gender_male > 0 ||
            cp?.audience_age_18_24 > 0 || cp?.audience_age_25_34 > 0) && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Audience demographics</p>
              {(cp?.audience_gender_female > 0 || cp?.audience_gender_male > 0) && (
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 bg-pink-50 rounded-lg p-2 text-center">
                    <p className="font-medium text-pink-600">{cp.audience_gender_female}%</p>
                    <p className="text-xs text-gray-400">Female</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                    <p className="font-medium text-blue-600">{cp.audience_gender_male}%</p>
                    <p className="text-xs text-gray-400">Male</p>
                  </div>
                </div>
              )}
              {/* Age groups */}
              {[
                ['13–17', cp?.audience_age_13_17],
                ['18–24', cp?.audience_age_18_24],
                ['25–34', cp?.audience_age_25_34],
                ['35–44', cp?.audience_age_35_44],
                ['45+', cp?.audience_age_45_plus],
              ].some(([,v]) => v > 0) && (
                <div className="grid grid-cols-5 gap-1">
                  {[['13–17', cp?.audience_age_13_17],['18–24', cp?.audience_age_18_24],['25–34', cp?.audience_age_25_34],['35–44', cp?.audience_age_35_44],['45+', cp?.audience_age_45_plus]].map(([label, val]) => (
                    val > 0 ? (
                      <div key={label as string} className="bg-gray-50 rounded-lg p-1.5 text-center">
                        <p className="font-medium text-sm">{val}%</p>
                        <p className="text-xs text-gray-400">{label}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top countries */}
          {cp?.audience_top_countries?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Top audience countries</p>
              <div className="flex flex-wrap gap-1.5">
                {cp.audience_top_countries.map((c:string, i:number) => (
                  <span key={c} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full">
                    <span className="text-violet-400 mr-1">#{i+1}</span>{c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Featured content */}
          {cp?.featured_videos?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Featured content</p>
              <div className="grid grid-cols-2 gap-2">
                {cp.featured_videos.map((url:string, i:number) => {
                  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/#]+)/)
                  const isReel = url.includes('instagram.com/reel') || url.includes('instagram.com/p/')
                  const isTT = url.includes('tiktok.com')
                  return yt ? (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden">
                      <iframe src={`https://www.youtube.com/embed/${yt[1]}`} className="w-full h-full" allowFullScreen />
                    </div>
                  ) : isReel ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="aspect-video rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex flex-col items-center justify-center text-white hover:opacity-90">
                      <span className="text-2xl mb-1">📱</span>
                      <span className="text-xs">Instagram Reel ↗</span>
                    </a>
                  ) : isTT ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="aspect-video rounded-xl bg-gray-900 flex flex-col items-center justify-center text-white hover:opacity-90">
                      <span className="text-2xl mb-1">▶</span>
                      <span className="text-xs">TikTok ↗</span>
                    </a>
                  ) : (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="aspect-video rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-200">
                      View content ↗
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Application message */}
          {message && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Message from creator</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 leading-relaxed">{message}</p>
            </div>
          )}

          {/* Campaign info */}
          {campaignTitle && (
            <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
              <p className="text-xs font-medium text-violet-700 mb-1">Applied to: {campaignTitle}</p>
              {campaignOffer && <p className="text-xs text-violet-600">Offer: {campaignOffer}</p>}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {status === 'pending' && onAccept && onReject && (
              <>
                <button onClick={onReject} className="flex-1 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50">Reject</button>
                <button onClick={onAccept} className="flex-1 py-2.5 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700">Accept</button>
              </>
            )}
            {status === 'accepted' && <span className="flex-1 py-2.5 text-sm text-center bg-green-50 text-green-700 rounded-xl font-medium">✓ Accepted</span>}
            {status === 'rejected' && <span className="flex-1 py-2.5 text-sm text-center bg-red-50 text-red-600 rounded-xl font-medium">Rejected</span>}
            {(brandId && creatorId) && (
              <button onClick={startConversation} disabled={contacting}
                className="flex-1 py-2.5 text-sm bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-60">
                {contacting ? '...' : 'Message ↗'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
