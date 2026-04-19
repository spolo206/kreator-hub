import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Toss sends webhooks for billing events
// Set webhook URL in Toss dashboard: https://yourapp.vercel.app/api/toss/webhook

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createClient()

  const { eventType, data } = body

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    const { customerKey, status } = data

    if (status === 'DONE') {
      // Payment successful - extend subscription 1 month
      const { data: brand } = await supabase
        .from('brand_profiles')
        .select('subscription_end_date')
        .eq('stripe_customer_id', customerKey)
        .single()

      const currentEnd = brand?.subscription_end_date
        ? new Date(brand.subscription_end_date)
        : new Date()
      currentEnd.setMonth(currentEnd.getMonth() + 1)

      await supabase.from('brand_profiles').update({
        subscription_status: 'active',
        subscription_end_date: currentEnd.toISOString(),
      }).eq('stripe_customer_id', customerKey)
    }

    if (status === 'CANCELED' || status === 'ABORTED') {
      await supabase.from('brand_profiles').update({
        subscription_status: 'canceled',
      }).eq('stripe_customer_id', customerKey)
    }
  }

  return NextResponse.json({ ok: true })
}
