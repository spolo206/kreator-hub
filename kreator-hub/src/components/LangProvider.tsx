'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import { translations, type Lang } from '@/lib/i18n'

const LangContext = createContext<{
  lang: Lang
  setLang: (l: Lang) => void
  t: typeof translations.en
}>({ lang: 'en', setLang: () => {}, t: translations.en })

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  
  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved && ['en','es','ko'].includes(saved)) setLangState(saved)
  }, [])
  
  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }
  
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
