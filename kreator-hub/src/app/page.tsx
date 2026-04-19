import { LangProvider } from '@/components/LangProvider'
import { SettingsProvider } from '@/lib/settings'
import HomePage from './page-content'

export default function Page() {
  return (
    <LangProvider>
      <SettingsProvider>
        <HomePage />
      </SettingsProvider>
    </LangProvider>
  )
}
