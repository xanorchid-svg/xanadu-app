// match-embed: reads what a member wrote about themselves (or their space and offerings),
// turns it into an AI "meaning" vector with Supabase's built-in gte-small model, and picks out keywords.
// Seekers are then matched to spaces and offerings by the my_matches() database function.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

declare const Supabase: { ai: { Session: new (m: string) => { run: (t: string, o: object) => Promise<number[]> } } }
const model = new Supabase.ai.Session('gte-small')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// keyword → words and phrases that mean it
const VOCAB: Record<string, string[]> = {
  'Volunteer exchange': ['volunteer', 'work exchange', 'work-exchange', 'workaway', 'work trade', 'worktrade', 'exchange for', 'in exchange', 'help out', 'karma yoga', 'seva', 'worldpackers', 'wwoof'],
  Yoga: ['yoga', 'asana', 'vinyasa', 'hatha', 'yin', 'kundalini', 'ashtanga'],
  'Yoga teacher training': ['teacher training', 'ytt', '200 hour', '200-hour', '300 hour', '300-hour', 'become a teacher', 'certification', 'certified'],
  Breathwork: ['breathwork', 'breath work', 'pranayama', 'breathing', 'wim hof', 'holotropic'],
  Meditation: ['meditation', 'meditate', 'mindfulness', 'vipassana', 'silent', 'silence', 'stillness'],
  Sound: ['sound bath', 'sound healing', 'sound journey', 'singing bowl', 'gong', 'sound'],
  'Ecstatic dance': ['ecstatic dance', 'dance', 'movement', 'conscious dance'],
  Kirtan: ['kirtan', 'chanting', 'mantra', 'singing'],
  Permaculture: ['permaculture', 'farm', 'farming', 'garden', 'gardening', 'regenerative', 'agriculture', 'land', 'growing food', 'eco', 'sustainable', 'sustainability'],
  'Plant medicine': ['plant medicine', 'ayahuasca', 'huachuma', 'san pedro', 'kambo', 'psilocybin', 'mushroom ceremony', 'cacao ceremony', 'sacred plant', 'curandero', 'shaman', 'shamanic'],
  Residencies: ['residency', 'residencies', 'artist residency', 'writer residency', 'creative residency', 'artist in residence', 'fellowship', 'studio time'],
  'Recovery programs': ['recovery program', 'in recovery', 'sober', 'sobriety', 'addiction', '12 step', '12-step', 'twelve step', 'rehab', 'alcohol-free', 'substance-free'],
  "Women's retreats": ["women's", 'womens', 'women', 'sisterhood', 'feminine', 'female'],
  "Men's retreats": ["men's", 'mens ', 'brotherhood', 'masculine'],
  Surf: ['surf', 'surfing', 'waves'],
  Ocean: ['ocean', 'sea', 'coast', 'island'],
  Beach: ['beach', 'beachfront', 'sand', 'seaside'],
  Jungle: ['jungle', 'rainforest', 'tropical', 'wildlife', 'waterfall'],
  Mountains: ['mountain', 'mountains', 'alpine', 'hiking', 'peaks', 'andes', 'rockies'],
  Desert: ['desert', 'canyon', 'joshua tree', 'sedona', 'dunes'],
  Forest: ['forest', 'woods', 'woodland', 'trees'],
  City: ['city', 'urban', 'downtown', 'buenos aires', 'lisbon'],
  Town: ['small town', 'village', 'town'],
  Countryside: ['countryside', 'rural', 'farmland', 'off-grid', 'off grid', 'quiet land'],
  'Work remotely': ['remote work', 'work remotely', 'working remotely', 'digital nomad', 'laptop', 'wifi', 'wi-fi', 'coworking', 'co-working'],
  Healing: ['healing', 'heal', 'grief', 'trauma', 'burnout', 'reset', 'recover', 'rest'],
  Wellness: ['wellness', 'detox', 'cleanse', 'nutrition', 'fasting', 'health', 'ayurveda', 'massage', 'spa'],
  Community: ['community', 'connection', 'connect', 'like-minded', 'friends', 'tribe', 'belonging'],
  'Personal growth': ['growth', 'purpose', 'transformation', 'transform', 'clarity', 'self-discovery', 'awakening', 'spiritual', 'spirituality', 'journal'],
  'Plant-based food': ['plant-based', 'plant based', 'vegan', 'vegetarian', 'organic', 'cooking', 'cacao'],
  'Long stay': ['month', 'months', 'long stay', 'long-term', 'longer stay', 'season', 'live there'],
  Budget: ['budget', 'affordable', 'cheap', 'low cost', 'low-cost', 'free'],
  Solo: ['solo', 'alone', 'by myself', 'on my own'],
  Couples: ['couple', 'couples', 'partner', 'my boyfriend', 'my girlfriend', 'my husband', 'my wife'],
  // destinations
  'Costa Rica': ['costa rica', 'nosara', 'santa teresa', 'puerto viejo', 'uvita', 'guanacaste', 'pura vida'],
  Bali: ['bali', 'ubud', 'canggu', 'uluwatu', 'indonesia'],
  Peru: ['peru', 'sacred valley', 'cusco', 'cuzco', 'machu picchu', 'pisac'],
  'Buenos Aires': ['buenos aires', 'argentina', 'patagonia'],
  Portugal: ['portugal', 'lisbon', 'lisboa', 'algarve', 'sintra', 'madeira', 'ericeira'],
  Colorado: ['colorado', 'boulder', 'denver', 'rocky mountains', 'rockies'],
  California: ['california', 'big sur', 'ojai', 'joshua tree', 'san diego', 'los angeles', 'bay area'],
  Mexico: ['mexico', 'tulum', 'oaxaca', 'baja'],
}

// whole words only (plus simple endings), so "sea" doesn't fire on "season" or "town" on "downtown"
const esc = (w: string) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const PATTERNS = Object.entries(VOCAB).map(([k, words]) => [k, new RegExp(`(^|[^a-z])(${words.map(esc).join('|')})(s|es|ed|ing)?([^a-z]|$)`)] as const)
function keywordsOf(text: string): string[] {
  const t = text.toLowerCase()
  return PATTERNS.filter(([, re]) => re.test(t)).map(([k]) => k)
}

const embed = async (text: string) => JSON.stringify(await model.run(text.slice(0, 4000), { mean_pool: true, normalize: true }))

// way-of-living tags an experience carries (kept the same as public.offering_tags in the database)
const days = (a?: string | null, b?: string | null) => (a ? Math.round((new Date((b || a) + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000) + 1 : 0)
function offeringTags(o: { format: string; start_date: string | null; end_date: string | null; volunteer_exchange: boolean }) {
  const n = days(o.start_date, o.end_date)
  return [
    o.format === 'Drop-in' ? 'A class or session' : '',
    o.volunteer_exchange ? 'Volunteer exchange' : '',
    n >= 2 && n <= 3 ? 'A weekend' : n >= 4 && n <= 21 ? '1–3 weeks' : n >= 22 && n <= 60 ? 'A month or more' : n > 60 ? 'A season' : '',
  ].filter(Boolean)
}

// what an experience takes from its space: landscapes and remote work, not the space's stay lengths
const STAYS = ['A class or session', 'Weekly or monthly sessions', 'A weekend', '1–3 weeks', 'A month or more', 'A season', 'Community living']
const placeTags = (life: string[] | null | undefined) => (life ?? []).filter((x) => !STAYS.includes(x))

type Row = { kind: string; ref_id: string; owner_id: string; keywords: string[]; embedding: string | null; updated_at: string }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const body = await req.json().catch(() => ({})) as { queued?: string }

  const rows: Row[] = []
  const now = new Date().toISOString()
  const add = async (ownerId: string, kind: string, refId: string, text: string, tags: string[] = []) => {
    const clean = text.trim()
    const keywords = [...new Set([...keywordsOf(clean), ...tags])]
    rows.push({ kind, ref_id: refId, owner_id: ownerId, keywords, embedding: clean ? await embed(clean) : null, updated_at: now })
  }

  // a host's space, and every offering they created or that's held at their space (each with its own space and Facilitator)
  const host = async (ownerId: string) => {
    const { data: space } = await admin.from('spaces').select('*').eq('owner_id', ownerId).maybeSingle()
    const placeOf = (sp: { town?: string; region?: string; country?: string } | null) => (sp ? [sp.town, sp.region, sp.country].filter(Boolean).join(', ') : '')
    if (space) {
      await add(ownerId, 'space', space.id, [space.name, placeOf(space), space.about, (space.practices ?? []).join(', '), space.kitchen, space.getting_here,
        space.volunteer_exchange ? `Volunteer work exchange available. ${space.volunteer_details}` : '', (space.lifestyle ?? []).join(', ')].join('. '),
        [...(space.practices ?? []), ...(space.lifestyle ?? []), ...(space.volunteer_exchange ? ['Volunteer exchange'] : [])])
    }
    const cols = 'id, owner_id, title, format, practices, description, start_date, end_date, volunteer_exchange, volunteer_details, space_id, facilitator_id, venue_name, venue_place'
    const { data: own } = await admin.from('offerings').select(cols).eq('owner_id', ownerId)
    const { data: atSpace } = space ? await admin.from('offerings').select(cols).eq('space_id', space.id).neq('owner_id', ownerId) : { data: [] }
    for (const o of [...(own ?? []), ...(atSpace ?? [])]) {
      const sp = o.space_id ? (o.space_id === space?.id ? space : (await admin.from('spaces').select('*').eq('id', o.space_id).maybeSingle()).data) : null
      const guide = o.facilitator_id ? (await admin.from('profiles').select('name, practices, about').eq('id', o.facilitator_id).maybeSingle()).data : null
      const tags = offeringTags(o)
      await add(o.owner_id, 'offering', o.id, [o.title, o.format === 'Drop-in' ? 'A class or session' : o.format, (o.practices ?? []).join(', '), o.description,
        o.volunteer_exchange ? `Volunteer work exchange. ${o.volunteer_details}` : '', tags.join(', '),
        sp ? placeOf(sp) : [o.venue_name, o.venue_place].filter(Boolean).join(', '), placeTags(sp?.lifestyle).join(', '),
        guide ? `Led by ${guide.name}. ${(guide.practices ?? []).join(', ')}. ${guide.about ?? ''}` : ''].join('. '),
        [...(o.practices ?? []), ...placeTags(sp?.lifestyle), ...tags])
    }
  }

  if (body.queued) {
    // called by the database after a space or offering changed: only act on owners it queued
    const { data: q } = await admin.from('match_queue').delete().eq('owner_id', body.queued).select('owner_id')
    if (!q?.length) return json({ updated: 0 })
    await host(body.queued)
  } else {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: 'Please sign in again.' }, 401)
    const { data: profile } = await admin.from('profiles').select('role, seeking, prefs, lifestyle, container_status, facilitator_status').eq('id', user.id).single()
    if (!profile) return json({ error: 'Profile not found.' }, 404)

    // everyone can be a Seeker; hosts' own things are re-read whichever hat they're wearing
    const prefs: string[] = profile.prefs ?? []
    const life: string[] = profile.lifestyle ?? []
    await add(user.id, 'seeker', user.id, [profile.seeking, prefs.length ? `Interested in ${prefs.join(', ')}.` : '', life.length ? `Wants: ${life.join(', ')}.` : ''].join(' '), [...prefs, ...life])
    if (profile.container_status || profile.facilitator_status) await host(user.id)
  }

  if (rows.length) {
    const { error } = await admin.from('match_vectors').upsert(rows, { onConflict: 'kind,ref_id' })
    if (error) return json({ error: error.message }, 500)
  }
  return json({ keywords: rows.find((r) => r.kind === 'seeker')?.keywords ?? [], updated: rows.length })
})
