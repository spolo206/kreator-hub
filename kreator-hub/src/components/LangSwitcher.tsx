'use client'
import { useLang } from './LangProvider'
import type { Lang } from '@/lib/i18n'

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'ko', label: '한국어' },
]

export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex gap-1">
      {LANGS.map(l => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
            lang === l.code
              ? 'bg-violet-100 text-violet-700 border-violet-300'
              : 'bg-transparent text-gray-500 border-gray-200 hover:bg-gray-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
