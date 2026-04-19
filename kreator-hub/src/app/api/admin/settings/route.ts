import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET() {
  const sb = supabaseAdmin()
  const { data } = await sb.from('site_settings').select('key, value')
  const settings: Record<string, string> = {}
  data?.forEach(s => { settings[s.key] = s.value })
  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const { adminPassword, settings } = await req.json()
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sb = supabaseAdmin()
  const upserts = Object.entries(settings).map(([key, value]) => ({
    key, value: String(value), updated_at: new Date().toISOString()
  }))

  const { error } = await sb.from('site_settings').upsert(upserts, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
