import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This endpoint charges all active subscribers whose subscription is expiring today
// Set up a daily cron in Supabase: call POST /api/toss/rebill with header x-cron-secret

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret')
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const secretKey = process.env.TOSS_SECRET_KEY!
  const encodedKey = Buffer.from(`${secretKey}:`).toString('base64')

  // Find subscriptions expiring today or past due
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const { data: brands } = await supabase
    .from('brand_profiles')
    .select('id, stripe_customer_id, stripe_subscription_id, profiles(email)')
    .eq('subscription_status', 'active')
    .lte('subscription_end_date', today.toISOString())

  if (!brands?.length) return NextResponse.json({ charged: 0 })

  let charged = 0
  for (const brand of brands) {
    const billingKey = brand.stripe_subscription_id
    const customerKey = brand.stripe_customer_id
    if (!billingKey || !customerKey) continue

    const res = await fetch(`https://api.tosspayments.com/v1/billing/${billingKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey,
        amount: 99000,
        orderId: `kreatorhub-${brand.id}-${Date.now()}`,
        orderName: 'Kreator Hub 월 구독',
        customerEmail: (brand.profiles as any)?.email || '',
      }),
    })

    if (res.ok) {
      const nextEnd = new Date()
      nextEnd.setMonth(nextEnd.getMonth() + 1)
      await supabase.from('brand_profiles').update({
        subscription_status: 'active',
        subscription_end_date: nextEnd.toISOString(),
      }).eq('id', brand.id)
      charged++
    } else {
      await supabase.from('brand_profiles').update({
        subscription_status: 'past_due',
      }).eq('id', brand.id)
    }
  }

  return NextResponse.json({ charged, total: brands.length })
}
