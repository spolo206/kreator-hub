'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Script from 'next/script'

declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestBillingAuth: (method: string, options: object) => Promise<void>
    }
  }
}

export default function SubscribePage() {
  const [status, setStatus] = useState<string>('loading')
  const [loading, setLoading] = useState(false)
  const [endDate, setEndDate] = useState<string>('')
  const [tossReady, setTossReady] = useState(false)

  useEffect(() => {
    async function check() {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return
      const { data } = await sb.from('brand_profiles')
        .select('subscription_status, subscription_end_date').eq('id', user.id).single()
      setStatus(data?.subscription_status || 'inactive')
      if (data?.subscription_end_date) {
        setEndDate(new Date(data.subscription_end_date).toLocaleDateString('ko-KR'))
      }
    }
    check()
  }, [])

  async function handleSubscribe() {
    if (!tossReady || !window.TossPayments) return
    setLoading(true)
    try {
      const sb = createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return

      const customerKey = `kreatorhub-${user.id}`
      const tossPayments = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)

      await tossPayments.requestBillingAuth('카드', {
        customerKey,
        successUrl: `${window.location.origin}/brand/subscribe/success?customerKey=${customerKey}`,
        failUrl: `${window.location.origin}/brand/subscribe?error=1`,
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (status === 'loading') return (
    <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading...</div>
  )

  if (status === 'active') return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-xl">✓</div>
        <h1 className="font-medium text-lg mb-2">구독 활성화됨</h1>
        <p className="text-sm text-gray-500">Kreator Hub를 자유롭게 이용하실 수 있습니다.</p>
        {endDate && <p className="text-xs text-gray-400 mt-2">다음 결제일: {endDate}</p>}
      </div>
    </div>
  )

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1/payment"
        onReady={() => setTossReady(true)}
      />
      <div className="max-w-md mx-auto mt-12 px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="text-3xl mb-4">🚀</div>
          <h1 className="font-medium text-xl mb-2">
            Kreator<span className="text-violet-600">Hub</span>
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            인플루언서 마케팅 플랫폼 — 브랜드 플랜
          </p>

          <div className="bg-violet-50 border border-violet-100 rounded-xl p-5 mb-6 text-left space-y-2">
            {[
              '인증된 크리에이터 2,400명+ 검색',
              '캠페인 무제한 등록',
              '지원서 관리 및 인플루언서 선택',
              '팔로워·인게이지먼트·위치 필터',
              'EN / ES / KO 지원',
              '자동 월간 구독 결제',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-violet-800">
                <span className="text-violet-500">✓</span> {f}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <span className="text-3xl font-medium">₩99,000</span>
            <span className="text-gray-400 text-sm">/월</span>
          </div>

          {status === 'past_due' && (
            <div className="bg-amber-50 text-amber-700 text-xs p-3 rounded-lg mb-4">
              결제가 실패했습니다. 카드를 다시 등록해주세요.
            </div>
          )}

          <button
            onClick={handleSubscribe}
            disabled={loading || !tossReady}
            className="w-full bg-violet-600 text-white rounded-xl py-3 font-medium hover:bg-violet-700 disabled:opacity-60"
          >
            {loading ? '처리 중...' : '구독 시작하기 — ₩99,000/월'}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            Toss Payments로 안전하게 결제됩니다. 언제든 취소 가능합니다.
          </p>
        </div>
      </div>
    </>
  )
}
