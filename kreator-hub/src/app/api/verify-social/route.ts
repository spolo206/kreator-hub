import { NextRequest, NextResponse } from 'next/server'

function parseNum(str: string): number {
  if (!str) return 0
  const s = str.trim().replace(/,/g, '')
  if (/[Mm]$/.test(s)) return Math.round(parseFloat(s) * 1_000_000)
  if (/[Kk]$/.test(s)) return Math.round(parseFloat(s) * 1_000)
  return parseInt(s) || 0
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
}

async function scrapeInstagram(url: string) {
  try {
    const username = url.match(/instagram\.com\/([^/?#]+)/)?.[1]?.replace('@','')
    if (!username) return null

    // Try multiple approaches
    const attempts = [
      `https://www.instagram.com/${username}/`,
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    ]

    for (const attempt of attempts) {
      try {
        const res = await fetch(attempt, {
          headers: {
            ...HEADERS,
            ...(attempt.includes('api') ? { 'X-IG-App-ID': '936619743392459' } : {}),
          },
          signal: AbortSignal.timeout(8000),
        })
        if (!res.ok) continue
        const text = await res.text()

        // Try JSON API response
        try {
          const json = JSON.parse(text)
          const user = json?.data?.user
          if (user) {
            return {
              platform: 'instagram',
              username: user.username || username,
              followers: user.edge_followed_by?.count || 0,
              verified: true,
              profile_url: url,
            }
          }
        } catch {}

        // Try HTML scraping patterns
        const patterns = [
          /"edge_followed_by":\{"count":(\d+)\}/,
          /"follower_count":(\d+)/,
          /(\d+(?:\.\d+)?[KkMm]?)\s*[Ff]ollowers/,
          /"followers":"?(\d+)"?/,
        ]
        for (const p of patterns) {
          const m = text.match(p)
          if (m) {
            return {
              platform: 'instagram',
              username,
              followers: parseNum(m[1]),
              verified: true,
              profile_url: url,
            }
          }
        }

        // Account exists even if we can't get followers
        if (text.includes(username) || text.includes('instagram')) {
          return { platform: 'instagram', username, followers: 0, verified: true, profile_url: url, note: 'manual' }
        }
      } catch {}
    }
    return null
  } catch { return null }
}

async function scrapeTikTok(url: string) {
  try {
    const username = url.match(/tiktok\.com\/@?([^/?#]+)/)?.[1]?.replace('@','')
    if (!username) return null

    const res = await fetch(`https://www.tiktok.com/@${username}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const text = await res.text()

    const patterns = [
      /"followerCount":(\d+)/,
      /"fans":(\d+)/,
      /(\d+(?:\.\d+)?[KkMm]?)\s*[Ff]ollowers/,
      /"followers":"?(\d+)"?/,
    ]

    for (const p of patterns) {
      const m = text.match(p)
      if (m) {
        return { platform: 'tiktok', username, followers: parseNum(m[1]), verified: true, profile_url: url }
      }
    }

    if (text.includes(username)) {
      return { platform: 'tiktok', username, followers: 0, verified: true, profile_url: url, note: 'manual' }
    }
    return null
  } catch { return null }
}

async function getYouTube(url: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    const handle = url.match(/@([^/?#]+)/)?.[1]
    const channelId = url.match(/channel\/([^/?#]+)/)?.[1]

    if (apiKey) {
      let cid = channelId
      if (!cid && handle) {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${apiKey}`)
        const d = await r.json()
        cid = d.items?.[0]?.id?.channelId
      }
      if (cid) {
        const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${cid}&key=${apiKey}`)
        const d = await r.json()
        const ch = d.items?.[0]
        if (ch) return { platform: 'youtube', username: ch.snippet?.title || handle || '', followers: parseInt(ch.statistics?.subscriberCount || '0'), verified: true, profile_url: url }
      }
    }

    // Fallback: scrape page
    const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null
    const text = await res.text()
    const m = text.match(/"subscriberCountText":"([^"]+)"/) || text.match(/(\d+(?:\.\d+)?[KkMm]?)\s*subscribers/i)
    const followers = m ? parseNum(m[1].replace(' subscribers','').trim()) : 0
    return { platform: 'youtube', username: handle || '', followers, verified: true, profile_url: url }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const n = url.toLowerCase()
  let result = null

  if (n.includes('youtube.com') || n.includes('youtu.be')) result = await getYouTube(url)
  else if (n.includes('instagram.com')) result = await scrapeInstagram(url)
  else if (n.includes('tiktok.com')) result = await scrapeTikTok(url)

  if (!result) return NextResponse.json({ error: 'No se pudo verificar el perfil. Comprueba la URL.' }, { status: 422 })
  return NextResponse.json(result)
}
