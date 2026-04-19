'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading'|'success'|'error'>('loading')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    async function activate() {
      const authKey = params.get('authKey')
      const customerKey = params.get('customerKey')
      if (!authKey || !customerKey) { setStatus('error'); setMsg('Missing parameters'); return }

      const res = await fetch('/api/toss/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey, customerKey }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setTimeout(() => router.push('/brand/dashboard'), 2000)
      } else {
        setStatus('error')
        setMsg(data.error || 'Payment failed')
      }
    }
    activate()
  }, [])

  if (status === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-3">⏳</div>
        <p className="text-gray-500 text-sm">결제 처리 중...</p>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-2xl">✓</div>
        <h1 className="font-medium text-lg mb-2">구독이 시작되었습니다!</h1>
        <p className="text-sm text-gray-500">잠시 후 대시보드로 이동합니다...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-3">❌</div>
        <h1 className="font-medium text-lg mb-2">결제 실패</h1>
        <p className="text-sm text-gray-500 mb-4">{msg}</p>
        <button onClick={() => router.push('/brand/subscribe')}
          className="bg-violet-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-violet-700">
          다시 시도
        </button>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>
}
