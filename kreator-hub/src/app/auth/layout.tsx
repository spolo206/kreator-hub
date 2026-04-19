import { LangProvider } from '@/components/LangProvider'

export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <LangProvider>{children}</LangProvider>
}
