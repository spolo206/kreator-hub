'use client'
import { useState, useEffect, createContext, useContext } from 'react'

type Settings = Record<string, string>

const DEFAULT: Settings = {
  brand_name: 'KreatorHub',
  primary_color: '#534AB7',
  contact_email: 'hello@kreatorhub.com',
  subscription_price: '99000',
  subscription_currency: '₩',
  landing_title_en: 'Connect creators with the best brands',
  landing_title_es: 'Conecta creadores con las mejores marcas',
  landing_title_ko: '크리에이터와 최고의 브랜드를 연결하다',
  landing_subtitle_en: 'Find campaigns, apply with your profile and collaborate with brands that need your audience',
  landing_subtitle_es: 'Encuentra campañas, aplica con tu perfil y colabora con empresas que necesitan tu audiencia',
  landing_subtitle_ko: '캠페인을 찾고 프로필로 지원하고 당신의 팔로워를 필요로 하는 기업과 협력하세요',
  stat_creators: '2,400+',
  stat_brands: '340+',
  stat_campaigns: '1,200+',
  brands_headline_en: 'Find the right creators for your brand',
  brands_headline_es: 'Encuentra los creadores perfectos para tu marca',
  brands_headline_ko: '브랜드에 맞는 크리에이터를 찾으세요',
  brands_subtitle_en: 'Access thousands of verified influencers across Instagram, TikTok and YouTube',
  brands_subtitle_es: 'Accede a miles de influencers verificados en Instagram, TikTok y YouTube',
  brands_subtitle_ko: 'Instagram TikTok YouTube의 수천 명의 인증된 인플루언서에 접근하세요',
}

const SettingsContext = createContext<Settings>(DEFAULT)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setSettings({ ...DEFAULT, ...data })
      })
      .catch(() => {})
  }, [])

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
