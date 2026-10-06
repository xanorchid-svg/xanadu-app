// delete-account: permanently deletes the signed-in member's account (App Store guideline 5.1.1(v)).
// Removes their uploaded photos, then the auth user. Every table row (profile, space, offerings,
// messages, saved items, connections, chats…) is removed by ON DELETE CASCADE.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405)

  // who is asking: verified from their own sign-in token
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) return reply({ error: 'Please sign in again.' }, 401)

  const body = await req.json().catch(() => ({}))
  if (body?.confirm !== 'DELETE') return reply({ error: 'Confirmation missing.' }, 400)

  // photos live in photos/<user id>/…
  for (let round = 0; round < 20; round++) {
    const { data: files } = await admin.storage.from('photos').list(user.id, { limit: 100 })
    if (!files?.length) break
    await admin.storage.from('photos').remove(files.map((f) => `${user.id}/${f.name}`))
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return reply({ error: "We couldn't delete your account. Please try again or write to networkxanadu@gmail.com." }, 500)
  return reply({ deleted: true })
})
