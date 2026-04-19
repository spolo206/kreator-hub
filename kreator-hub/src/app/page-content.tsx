'use client'
import Link from 'next/link'
import { useLang } from '@/components/LangProvider'
import LangSwitcher from '@/components/LangSwitcher'
import { useSettings } from '@/lib/settings'

export default function HomePage() {
  const { t, lang } = useLang()
  const s = useSettings()
  const l = t.landing

  const title = s[`landing_title_${lang}`] || l.title
  const subtitle = s[`landing_subtitle_${lang}`] || l.subtitle
  const brandName = s.brand_name || 'KreatorHub'
  const [first, second] = brandName.length > 6
    ? [brandName.slice(0, Math.floor(brandName.length/2)), brandName.slice(Math.floor(brandName.length/2))]
    : [brandName.slice(0,-3) || brandName, brandName.slice(-3)]

  const primaryColor = s.primary_color || '#534AB7'

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`:root { --brand-primary: ${primaryColor}; }`}</style>
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <div className="font-medium text-base">
          {first}<span style={{color: primaryColor}}>{second}</span>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link href="/for-brands" className="text-sm text-gray-600 hover:text-gray-900 hidden sm:block">
            {lang === 'ko' ? '브랜드' : lang === 'es' ? 'Empresas' : 'For brands'}
          </Link>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">{t.nav.login}</Link>
          <Link href="/auth/register" className="text-sm text-white px-3 py-1.5 rounded-lg hover:opacity-90"
            style={{background: primaryColor}}>{t.nav.register}</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-xs font-medium tracking-widest mb-3" style={{color: primaryColor}}>
          {lang === 'ko' ? '인플루언서 마케팅 플랫폼' : lang === 'es' ? 'PLATAFORMA DE MARKETING DE INFLUENCERS' : 'INFLUENCER MARKETING PLATFORM'}
        </p>
        <h1 className="text-3xl font-medium text-gray-900 mb-3 leading-tight">{title}</h1>
        <p className="text-gray-500 text-base mb-10 max-w-lg mx-auto">{subtitle}</p>

        <div className="flex gap-4 justify-center flex-wrap mb-12">
          <Link href="/auth/register?role=creator"
            className="bg-white border border-gray-200 rounded-xl p-6 w-52 text-left hover:shadow-sm transition-all block"
            style={{'--hover-border': primaryColor} as any}>
            <div className="text-2xl mb-2">🎨</div>
            <p className="font-medium text-sm mb-1">{l.creatorTitle}</p>
            <p className="text-xs text-gray-500 mb-4">{l.creatorSub}</p>
            <span className="text-xs text-white px-3 py-1.5 rounded-lg" style={{background: primaryColor}}>{l.creatorBtn}</span>
          </Link>
          <Link href="/for-brands"
            className="bg-white border border-gray-200 rounded-xl p-6 w-52 text-left hover:shadow-sm transition-all block">
            <div className="text-2xl mb-2">🏢</div>
            <p className="font-medium text-sm mb-1">{l.brandTitle}</p>
            <p className="text-xs text-gray-500 mb-4">{l.brandSub}</p>
            <span className="text-xs border px-3 py-1.5 rounded-lg" style={{borderColor: primaryColor, color: primaryColor}}>{l.brandBtn}</span>
          </Link>
        </div>

        <div className="flex gap-10 justify-center">
          {[
            { num: s.stat_creators || '2,400+', label: l.statCreators },
            { num: s.stat_brands || '340+', label: l.statBrands },
            { num: s.stat_campaigns || '1,200+', label: l.statCampaigns },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-medium" style={{color: primaryColor}}>{stat.num}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
