import { LangProvider } from '@/components/LangProvider'
import { SettingsProvider } from '@/lib/settings'
import ForBrandsContent from './content'

export default function ForBrandsPage() {
  return (
    <LangProvider>
      <SettingsProvider>
        <ForBrandsContent />
      </SettingsProvider>
    </LangProvider>
  )
}
