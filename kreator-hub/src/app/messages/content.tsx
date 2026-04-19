'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useLang } from '@/components/LangProvider'

interface Conversation {
  id: string
  brand_id: string
  creator_id: string
  campaign_id: string | null
  other_name: string
  other_initials: string
  campaign_title: string | null
  last_message: string | null
  unread: number
}

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n/1_000).toFixed(0)}k`
  return n.toString()
}

export default function MessagesContent() {
  const { t } = useLang()
  const supabase = createClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [userId, setUserId] = useState('')
  const [userRole, setUserRole] = useState<'creator'|'brand'>('creator')
  const [userName, setUserName] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
      setUserRole(profile?.role || 'creator')
      setUserName(profile?.full_name || '')
      loadConversations(user.id, profile?.role)
    }
    init()
  }, [])

  async function loadConversations(uid: string, role: string) {
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, brand_id, creator_id, campaign_id,
        brand:profiles!conversations_brand_id_fkey(full_name),
        creator:profiles!conversations_creator_id_fkey(full_name),
        campaigns(title_en, title_es, title_ko)
      `)
      .or(`brand_id.eq.${uid},creator_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (!data) { setLoading(false); return }

    const convs: Conversation[] = await Promise.all(data.map(async (c: any) => {
      const isCreator = role === 'creator'
      const otherName = isCreator ? c.brand?.full_name : c.creator?.full_name
      const initials = (otherName || '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

      const { data: msgs } = await supabase
        .from('messages')
        .select('content, read, sender_id')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const unreadCount = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('conversation_id', c.id)
        .eq('read', false)
        .neq('sender_id', uid)

      return {
        id: c.id,
        brand_id: c.brand_id,
        creator_id: c.creator_id,
        campaign_id: c.campaign_id,
        other_name: otherName || 'Unknown',
        other_initials: initials,
        campaign_title: c.campaigns?.title_en || null,
        last_message: msgs?.[0]?.content || null,
        unread: unreadCount.count || 0,
      }
    }))

    setConversations(convs)
    setLoading(false)
  }

  async function openConversation(conv: Conversation) {
    setSelected(conv)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark as read
    await supabase.from('messages')
      .update({ read: true })
      .eq('conversation_id', conv.id)
      .neq('sender_id', userId)

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)

    // Subscribe to new messages
    supabase.channel(`conv-${conv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        })
      .subscribe()
  }

  async function sendMessage() {
    if (!newMsg.trim() || !selected || sending) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: userId,
      content: newMsg.trim(),
    })
    setNewMsg('')
    setSending(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar role={userRole} userName={userName} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ height: '70vh', display: 'flex' }}>

          {/* Conversation list */}
          <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <p className="font-medium text-sm">Messages</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">No conversations yet</div>
              ) : conversations.map(conv => (
                <div key={conv.id} onClick={() => openConversation(conv)}
                  className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selected?.id === conv.id ? 'bg-violet-50' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                      {conv.other_initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.other_name}</p>
                        {conv.unread > 0 && (
                          <span className="w-4 h-4 bg-violet-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">{conv.unread}</span>
                        )}
                      </div>
                      {conv.campaign_title && <p className="text-xs text-violet-600 truncate">{conv.campaign_title}</p>}
                      {conv.last_message && <p className="text-xs text-gray-400 truncate">{conv.last_message}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat area */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-medium">
                  {selected.other_initials}
                </div>
                <div>
                  <p className="font-medium text-sm">{selected.other_name}</p>
                  {selected.campaign_title && <p className="text-xs text-violet-600">{selected.campaign_title}</p>}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(msg => {
                  const isMe = msg.sender_id === userId
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                        {msg.content}
                        <div className={`text-xs mt-0.5 ${isMe ? 'text-violet-200' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Write a message..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
                />
                <button onClick={sendMessage} disabled={sending || !newMsg.trim()}
                  className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-40">
                  Send
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
