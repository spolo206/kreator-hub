'use client'
import Link from 'next/link'
import LangSwitcher from '@/components/LangSwitcher'
import { useLang } from '@/components/LangProvider'
import { useSettings } from '@/lib/settings'

const FEATURES = [
  { icon: '🔍', en: 'Search 2,400+ verified creators', es: 'Busca entre 2,400+ creadores verificados', ko: '인증된 크리에이터 2,400명+ 검색' },
  { icon: '📊', en: 'Filter by followers, engagement, location, language', es: 'Filtra por seguidores, engagement, ubicación e idioma', ko: '팔로워, 인게이지먼트, 위치, 언어로 필터링' },
  { icon: '📢', en: 'Post campaigns and receive applications', es: 'Publica campañas y recibe aplicaciones', ko: '캠페인 등록 및 지원서 수신' },
  { icon: '✅', en: 'Select your ideal influencers', es: 'Selecciona a los influencers ideales', ko: '이상적인 인플루언서 선택' },
  { icon: '💬', en: 'Message creators directly inside the platform', es: 'Contacta creadores directamente en la plataforma', ko: '플랫폼 내에서 크리에이터에게 직접 메시지' },
  { icon: '🌍', en: 'Platform in English, Spanish and Korean', es: 'Plataforma en inglés, español y coreano', ko: '영어, 스페인어, 한국어 지원' },
]

const HOW_IT_WORKS = [
  { step:'01', en:{title:'Contact us',desc:'Reach out and tell us about your brand and marketing goals.'}, es:{title:'Contáctanos',desc:'Escríbenos y cuéntanos sobre tu marca y objetivos de marketing.'}, ko:{title:'문의하기',desc:'브랜드와 마케팅 목표를 알려주세요.'} },
  { step:'02', en:{title:'We create your account',desc:'Once approved, we set up your brand account and send you your credentials.'}, es:{title:'Creamos tu cuenta',desc:'Una vez aprobado, configuramos tu cuenta y te enviamos tus credenciales.'}, ko:{title:'계정 생성',desc:'승인 후 브랜드 계정을 만들어 자격 증명을 보내드립니다.'} },
  { step:'03', en:{title:'Find & contact creators',desc:'Search our database, post campaigns and start working with the right influencers.'}, es:{title:'Encuentra y contacta creadores',desc:'Busca en nuestra base de datos, publica campañas y empieza a trabajar con los influencers adecuados.'}, ko:{title:'크리에이터 탐색 및 연락',desc:'데이터베이스를 검색하고 캠페인을 등록해 적합한 인플루언서와 협업하세요.'} },
]

export default function ForBrandsContent() {
  const { lang } = useLang()
  const s = useSettings()

  const primaryColor = s.primary_color || '#534AB7'
  const brandName = s.brand_name || 'KreatorHub'
  const [first, second] = brandName.length > 6
    ? [brandName.slice(0, Math.floor(brandName.length/2)), brandName.slice(Math.floor(brandName.length/2))]
    : [brandName.slice(0,-3)||brandName, brandName.slice(-3)]

  const headline = s[`brands_headline_${lang}`] || { en:'Find the right creators for your brand', es:'Encuentra los creadores perfectos para tu marca', ko:'브랜드에 맞는 크리에이터를 찾으세요' }[lang]
  const subtitle = s[`brands_subtitle_${lang}`] || { en:'Access thousands of verified influencers across Instagram, TikTok and YouTube', es:'Accede a miles de influencers verificados en Instagram, TikTok y YouTube', ko:'Instagram, TikTok, YouTube의 수천 명의 인증된 인플루언서에 접근하세요' }[lang]

  const price = parseInt(s.subscription_price || '99000').toLocaleString()
  const currency = s.subscription_currency || '₩'
  const contactEmail = s.contact_email || 'hello@kreatorhub.com'

  const perMonth = { en:'/month', es:'/mes', ko:'/월' }[lang]
  const ctaText = { en:'Contact us to get started', es:'Contáctanos para empezar', ko:'시작하려면 문의하세요' }[lang]
  const loginText = { en:'Already have an account? Log in', es:'¿Ya tienes cuenta? Inicia sesión', ko:'이미 계정이 있으신가요? 로그인' }[lang]
  const howTitle = { en:'How it works', es:'Cómo funciona', ko:'이용 방법' }[lang]
  const featTitle = { en:'Everything you need', es:'Todo lo que necesitas', ko:'필요한 모든 것' }[lang]
  const planTitle = { en:'Simple pricing', es:'Precio simple', ko:'간단한 요금제' }[lang]
  const planSub = { en:'One plan, full access.', es:'Un plan, acceso completo.', ko:'하나의 플랜, 완전한 접근.' }[lang]
  const planBtn = { en:'Get started', es:'Empezar', ko:'시작하기' }[lang]
  const planNote = { en:'Account created by our team after approval.', es:'Cuenta creada por nuestro equipo tras aprobación.', ko:'승인 후 저희 팀이 수동으로 계정을 생성합니다.' }[lang]
  const included = { en:"What's included", es:'Qué incluye', ko:'포함 내용' }[lang]

  return (
    <div className="min-h-screen bg-white">
      <style>{`:root { --brand-primary: ${primaryColor}; }`}</style>
      <nav className="border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-medium text-base">{first}<span style={{color: primaryColor}}>{second}</span></Link>
        <div className="flex items-center gap-3">
          <LangSwitcher />
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-gray-900">{loginText}</Link>
        </div>
      </nav>

      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <p className="text-xs font-medium tracking-widest mb-4" style={{color: primaryColor}}>
          {lang === 'ko' ? '브랜드를 위한 서비스' : lang === 'es' ? 'PARA EMPRESAS' : 'FOR BRANDS'}
        </p>
        <h1 className="text-4xl font-medium text-gray-900 leading-tight mb-5">{headline}</h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">{subtitle}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href={`mailto:${contactEmail}`} className="text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 text-sm"
            style={{background: primaryColor}}>{ctaText}</a>
          <Link href="/auth/login" className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 text-sm">{loginText}</Link>
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-10">{featTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f,i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                <div className="text-2xl mb-3">{f.icon}</div>
                <p className="text-sm text-gray-700">{f[lang as keyof typeof f] as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-10">{howTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(s => {
              const content = s[lang as keyof typeof s] as {title:string;desc:string}
              return (
                <div key={s.step} className="text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-sm font-medium"
                    style={{background: primaryColor}}>{s.step}</div>
                  <p className="font-medium mb-2">{content.title}</p>
                  <p className="text-sm text-gray-500">{content.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-medium mb-2">{planTitle}</h2>
          <p className="text-gray-500 text-sm mb-8">{planSub}</p>
          <div className="bg-white border-2 rounded-2xl p-8" style={{borderColor: primaryColor+'44'}}>
            <div className="mb-6">
              <span className="text-5xl font-medium text-gray-900">{currency}{price}</span>
              <span className="text-gray-400 text-sm">{perMonth}</span>
            </div>
            <div className="text-left mb-8">
              <p className="text-xs font-medium text-gray-400 uppercase mb-3">{included}</p>
              <div className="space-y-2">
                {FEATURES.map((f,i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0" style={{color: primaryColor}}>✓</span>
                    <span className="text-sm text-gray-600">{f[lang as keyof typeof f] as string}</span>
                  </div>
                ))}
              </div>
            </div>
            <a href={`mailto:${contactEmail}`} className="block w-full text-white rounded-xl py-3 font-medium hover:opacity-90 text-center text-sm"
              style={{background: primaryColor}}>{planBtn}</a>
            <p className="text-xs text-gray-400 mt-3">{planNote}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 px-6 text-center">
        <p className="text-sm text-gray-400">
          {first}<span style={{color: primaryColor}}>{second}</span> · <Link href="/" className="hover:text-gray-600">Home</Link>
        </p>
      </footer>
    </div>
  )
}
