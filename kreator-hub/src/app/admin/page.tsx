'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Brand {
  id: string; company_name: string; subscription_status: string; notes: string
  profiles: { email: string; full_name: string; created_at: string }
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-500',
  past_due: 'bg-amber-100 text-amber-700', canceled: 'bg-red-100 text-red-600',
}

const COLOR_PRESETS = [
  { name: 'Violet', value: '#534AB7' },
  { name: 'Rose', value: '#E11D48' },
  { name: 'Teal', value: '#0F766E' },
  { name: 'Blue', value: '#1D4ED8' },
  { name: 'Amber', value: '#B45309' },
  { name: 'Slate', value: '#334155' },
]

export default function AdminPage() {
  const [adminPass, setAdminPass] = useState('')
  const [authed, setAuthed] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [tab, setTab] = useState<'brands'|'create'|'appearance'>('brands')
  const [form, setForm] = useState({ email:'', companyName:'', password:'', notes:'' })
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  async function checkPassword() {
    const res = await fetch('/api/admin/verify', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ password: adminPass })
    })
    if (res.ok) { setAuthed(true); loadBrands(); loadSettings() }
    else alert('Wrong password')
  }

  async function loadBrands() {
    const sb = createClient()
    const { data } = await sb.from('brand_profiles')
      .select('*, profiles(email, full_name, created_at)')
    setBrands(data || [])
  }

  async function loadSettings() {
    const res = await fetch('/api/admin/settings')
    const data = await res.json()
    if (!data.error) setSettings(data)
  }

  async function handleCreate() {
    setCreating(true); setMsg('')
    const res = await fetch('/api/admin/create-brand', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ ...form, adminPassword: adminPass }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`✓ Account created! Send them:\nEmail: ${form.email}\nPassword: ${form.password}`)
      setForm({ email:'', companyName:'', password:'', notes:'' })
      loadBrands()
    } else { setMsg(`Error: ${data.error}`) }
    setCreating(false)
  }

  async function saveSettings() {
    setSavingSettings(true); setSettingsMsg('')
    const res = await fetch('/api/admin/settings', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ adminPassword: adminPass, settings })
    })
    const data = await res.json()
    setSettingsMsg(res.ok ? '✓ Saved! Reload the site to see changes.' : `Error: ${data.error}`)
    setSavingSettings(false)
  }

  const setSetting = (key: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setSettings(s => ({ ...s, [key]: e.target.value }))

  if (!authed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-8 w-full max-w-sm">
        <div className="font-medium text-lg mb-1">Kreator<span className="text-violet-600">Hub</span></div>
        <p className="text-sm text-gray-500 mb-6">Admin — acceso restringido</p>
        <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && checkPassword()}
          placeholder="Contraseña admin"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-violet-400" />
        <button onClick={checkPassword} className="w-full bg-violet-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-violet-700">
          Entrar
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between">
        <div className="font-medium">Kreator<span className="text-violet-600">Hub</span> <span className="text-gray-400 text-sm">Admin</span></div>
        <div className="flex gap-2">
          {(['brands','create','appearance'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-md text-sm ${tab===t ? 'bg-violet-100 text-violet-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}>
              {t === 'brands' ? `Empresas (${brands.length})` : t === 'create' ? 'Crear cuenta' : 'Apariencia'}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* BRANDS TAB */}
        {tab === 'brands' && (
          <div>
            <h1 className="text-base font-medium mb-4">Cuentas de empresa</h1>
            {brands.length === 0
              ? <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-xl border border-gray-100">No hay empresas aún.</div>
              : <div className="space-y-2">{brands.map(b => (
                  <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 flex-wrap">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {(b.company_name||b.profiles?.full_name||'?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-40">
                      <p className="font-medium text-sm">{b.company_name||b.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{b.profiles?.email} · {b.profiles?.created_at ? new Date(b.profiles.created_at).toLocaleDateString('es-ES') : ''}</p>
                      {b.notes && <p className="text-xs text-gray-400 italic mt-0.5">{b.notes}</p>}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[b.subscription_status||'inactive']}`}>
                      {b.subscription_status||'inactive'}
                    </span>
                  </div>
                ))}</div>
            }
          </div>
        )}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div className="max-w-md">
            <h1 className="text-base font-medium mb-4">Crear cuenta de empresa</h1>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Nombre empresa</label>
                <input value={form.companyName} onChange={e => setForm(f=>({...f,companyName:e.target.value}))} placeholder="Zara España"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="marketing@empresa.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Contraseña temporal</label>
                <input value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="TempPass2024!"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Notas internas</label>
                <textarea value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} rows={2}
                  placeholder="Contactado por LinkedIn, pago recibido..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>
              {msg && <div className={`text-xs p-3 rounded-lg whitespace-pre-line ${msg.startsWith('✓') ? 'bg-green-50 text-green-700 font-medium' : 'bg-red-50 text-red-600'}`}>{msg}</div>}
              <button onClick={handleCreate} disabled={creating||!form.email||!form.companyName||!form.password}
                className="w-full bg-violet-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
                {creating ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {tab === 'appearance' && (
          <div className="space-y-4">
            <h1 className="text-base font-medium">Apariencia y contenido</h1>

            {/* Brand */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Marca</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Nombre de la plataforma</label>
                  <input value={settings.brand_name||''} onChange={setSetting('brand_name')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Email de contacto</label>
                  <input value={settings.contact_email||''} onChange={setSetting('contact_email')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              </div>
            </div>

            {/* Color */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Color principal</h2>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map(p => (
                  <button key={p.value} onClick={() => setSettings(s => ({...s, primary_color: p.value}))}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${settings.primary_color === p.value ? 'border-gray-400 font-medium' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-4 h-4 rounded-full" style={{background: p.value}}></div>
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Color personalizado:</label>
                <input type="color" value={settings.primary_color||'#534AB7'} onChange={setSetting('primary_color')}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                <span className="text-xs text-gray-400">{settings.primary_color}</span>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Precio de suscripción</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Precio (sin símbolo)</label>
                  <input value={settings.subscription_price||''} onChange={setSetting('subscription_price')} placeholder="99000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Moneda</label>
                  <input value={settings.subscription_currency||''} onChange={setSetting('subscription_currency')} placeholder="₩"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
              </div>
              <p className="text-xs text-gray-400">Se muestra como: {settings.subscription_currency}{parseInt(settings.subscription_price||'0').toLocaleString()}/mes</p>
            </div>

            {/* Stats */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Estadísticas de la landing</h2>
              <div className="grid grid-cols-3 gap-2">
                {[['stat_creators','Creadores'],['stat_brands','Marcas'],['stat_campaigns','Campañas']].map(([k,l]) => (
                  <div key={k}><label className="block text-xs text-gray-500 mb-1">{l}</label>
                    <input value={settings[k]||''} onChange={setSetting(k)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                ))}
              </div>
            </div>

            {/* Landing texts */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Textos de la landing</h2>
              {(['en','es','ko'] as const).map(lang => (
                <div key={lang} className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase">{lang === 'en' ? 'English' : lang === 'es' ? 'Español' : '한국어'}</p>
                  <div><label className="block text-xs text-gray-500 mb-1">Título principal</label>
                    <input value={settings[`landing_title_${lang}`]||''} onChange={setSetting(`landing_title_${lang}`)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Subtítulo</label>
                    <textarea value={settings[`landing_subtitle_${lang}`]||''} onChange={setSetting(`landing_subtitle_${lang}`)} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>
                </div>
              ))}
            </div>

            {/* For brands texts */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
              <h2 className="font-medium text-sm text-gray-700">Textos de la página de empresas</h2>
              {(['en','es','ko'] as const).map(lang => (
                <div key={lang} className="space-y-2">
                  <p className="text-xs font-medium text-gray-400 uppercase">{lang === 'en' ? 'English' : lang === 'es' ? 'Español' : '한국어'}</p>
                  <div><label className="block text-xs text-gray-500 mb-1">Título</label>
                    <input value={settings[`brands_headline_${lang}`]||''} onChange={setSetting(`brands_headline_${lang}`)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400" /></div>
                  <div><label className="block text-xs text-gray-500 mb-1">Subtítulo</label>
                    <textarea value={settings[`brands_subtitle_${lang}`]||''} onChange={setSetting(`brands_subtitle_${lang}`)} rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 resize-none" /></div>
                </div>
              ))}
            </div>

            {settingsMsg && (
              <div className={`text-sm p-3 rounded-lg ${settingsMsg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {settingsMsg}
              </div>
            )}
            <button onClick={saveSettings} disabled={savingSettings}
              className="w-full bg-violet-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-violet-700 disabled:opacity-60">
              {savingSettings ? 'Guardando...' : 'Guardar todos los cambios'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
