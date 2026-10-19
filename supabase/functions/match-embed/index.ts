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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return json({ error: 'Please sign in again.' }, 401)

  const { data: profile } = await admin.from('profiles').select('role, seeking, prefs, lifestyle').eq('id', user.id).single()
  if (!profile) return json({ error: 'Profile not found.' }, 404)

  const rows: { kind: string; ref_id: string; owner_id: string; keywords: string[]; embedding: string | null; updated_at: string }[] = []
  const now = new Date().toISOString()
  const add = async (kind: string, refId: string, text: string, tags: string[] = []) => {
    const clean = text.trim()
    const keywords = [...new Set([...keywordsOf(clean), ...tags])]
    rows.push({ kind, ref_id: refId, owner_id: user.id, keywords, embedding: clean ? await embed(clean) : null, updated_at: now })
  }

  if (profile.role === 'seeker') {
    const prefs: string[] = profile.prefs ?? []
    const life: string[] = profile.lifestyle ?? []
    await add('seeker', user.id, [profile.seeking, prefs.length ? `Interested in ${prefs.join(', ')}.` : '', life.length ? `Wants: ${life.join(', ')}.` : ''].join(' '), [...prefs, ...life])
  } else if (profile.role === 'container') {
    const { data: space } = await admin.from('spaces').select('*').eq('owner_id', user.id).maybeSingle()
    if (space) {
      await add('space', space.id, [space.name, [space.town, space.region, space.country].filter(Boolean).join(', '), space.about, (space.practices ?? []).join(', '), space.kitchen, space.getting_here,
        space.volunteer_exchange ? `Volunteer work exchange available. ${space.volunteer_details}` : '', (space.lifestyle ?? []).join(', ')].join('. '),
        [...(space.practices ?? []), ...(space.lifestyle ?? []), ...(space.volunteer_exchange ? ['Volunteer exchange'] : [])])
    }
    const { data: offerings } = await admin.from('offerings').select('id, title, format, practices, description').eq('owner_id', user.id)
    for (const o of offerings ?? []) {
      await add('offering', o.id, [o.title, o.format, (o.practices ?? []).join(', '), o.description, space ? [space.town, space.region, space.country].filter(Boolean).join(', ') : '', space ? (space.lifestyle ?? []).join(', ') : ''].join('. '), [...(o.practices ?? []), ...(space?.lifestyle ?? [])])
    }
  }

  if (rows.length) {
    const { error } = await admin.from('match_vectors').upsert(rows, { onConflict: 'kind,ref_id' })
    if (error) return json({ error: error.message }, 500)
  }
  return json({ keywords: rows.find((r) => r.kind === 'seeker')?.keywords ?? [], updated: rows.length })
})
