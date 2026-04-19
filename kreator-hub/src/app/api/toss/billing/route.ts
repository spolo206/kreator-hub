import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Toss Payments Billing API
// Docs: https://docs.tosspayments.com/reference/billing

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { authKey, customerKey } = await req.json()

  const secretKey = process.env.TOSS_SECRET_KEY!
  const encodedKey = Buffer.from(`${secretKey}:`).toString('base64')

  // Exchange authKey for billingKey
  const res = await fetch('https://api.tosspayments.com/v1/billing/authorizations/issue', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ authKey, customerKey }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: 400 })

  // Store billingKey in DB
  await supabase.from('brand_profiles').update({
    stripe_customer_id: customerKey, // reusing field for customerKey
    stripe_subscription_id: data.billingKey, // reusing field for billingKey
  }).eq('id', user.id)

  // Make first charge immediately
  const chargeRes = await fetch(`https://api.tosspayments.com/v1/billing/${data.billingKey}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodedKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerKey,
      amount: 99000, // ₩99,000
      orderId: `kreatorhub-${user.id}-${Date.now()}`,
      orderName: 'Kreator Hub 월 구독',
      customerEmail: user.email,
    }),
  })

  const chargeData = await chargeRes.json()
  if (!chargeRes.ok) return NextResponse.json({ error: chargeData.message }, { status: 400 })

  // Activate subscription
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  await supabase.from('brand_profiles').update({
    subscription_status: 'active',
    subscription_end_date: nextMonth.toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ success: true })
}
