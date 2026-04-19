import { LangProvider } from '@/components/LangProvider'
import MessagesContent from './content'

export default function MessagesPage() {
  return (
    <LangProvider>
      <MessagesContent />
    </LangProvider>
  )
}
