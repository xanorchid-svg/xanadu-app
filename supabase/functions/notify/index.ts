// notify: sends Xanadu's emails (through Resend) and phone notifications (web push).
//
// The database calls it with one of:
//   { id }    an email_queue row: a welcome email, or a notification email (kind "n:<notification id>")
//   { push }  a notification id: push it to the member's phones and browsers
//   { invite } a venue_invites row: a Facilitator invited the venue of their experience to Xanadu
//   { waitlist } a waitlist row: someone joined from the website without an account (welcome email, once)
//   { init }  make sure the web-push keys exist (they're created once and kept in public.push_config)
// It only ever sends things that are already queued or recorded, and each only once,
// so calling it from anywhere else can't send anything new or twice.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY  required, from resend.com → API Keys (sending access)
//   EMAIL_FROM      optional, defaults to "Xanadu <hello@dreamxanadu.com>" (the domain must be verified in Resend)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const APP = 'https://app.dreamxanadu.com'
const REPLY_TO = 'networkxanadu@gmail.com'
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

type Email = { subject: string; preheader: string; heading: string; paragraphs: string[]; button: { label: string; url: string }; signoff: string; footer?: string }
type Notification = { id: string; user_id: string; kind: string; title: string; body: string; link: string; pushed_at: string | null }

/** Emails for notifications: approvals, decisions, team replies, new messages, Community requests, new matches. */
function composeNotification(n: Notification): Email {
  const url = `${APP}${n.link.startsWith('/') ? n.link : `/${n.link}`}`
  const isMessage = n.kind === 'message' || n.kind === 'team_message'
  // approval: a real welcome, with the first steps for their side of Xanadu
  if (n.kind === 'approved') {
    const container = n.link.startsWith('/container')
    return {
      subject: n.title,
      preheader: container ? 'Your space is part of the network. Here are your first steps.' : 'You’re a founding Facilitator. Here are your first steps.',
      heading: 'Welcome to Xanadu ✦',
      // the team's welcome message (from the console template) already names the first steps
      paragraphs: [
        n.body || (container
          ? 'You’ve been personally reviewed and welcomed into Xanadu. Post your first offering, make your space page shine, and say hello to the Facilitators who write to you.'
          : 'You’ve been personally reviewed and welcomed into Xanadu. Find your space, complete your profile, and find your people in Community.'),
        `Your ${container ? 'Container' : 'Facilitator'} side of Xanadu is open now.`,
      ],
      button: { label: container ? 'Enter your space' : 'Find your space', url },
      signoff: 'We’re so glad you’re here. Questions? Just reply to this email.',
    }
  }
  const label: Record<string, string> = {
    changes: 'Update my application', declined: 'Read our note', offering_live: 'See it live',
    offering_changes: 'Edit your experience', offering_linked: 'See the experience', offering_left: 'Open the experience', team_message: 'Reply', message: 'Reply', community_request: 'See the request',
    community_accepted: 'Say hello', match: n.link.startsWith('/experience') ? 'See the experience' : 'See the place',
  }
  return {
    subject: n.title,
    preheader: n.body.slice(0, 120),
    heading: n.title,
    paragraphs: n.body ? [isMessage ? `“${n.body.length > 600 ? `${n.body.slice(0, 600)}…` : n.body}”` : n.body] : [],
    button: { label: label[n.kind] ?? 'Open Xanadu', url },
    signoff: isMessage ? 'Reply in the Xanadu app so your conversation stays in one place.' : 'Questions? Just reply to this email.',
    footer: n.kind === 'message' ? 'Turn message emails off any time in Xanadu → Notifications.'
      : n.kind === 'match' ? 'Turn match emails off any time in Xanadu → Notifications.' : undefined,
  }
}

const first = (name: string | null | undefined) => (name ?? '').trim().split(/\s+/)[0] || ''
const hi = (name: string) => (name ? `Welcome, ${name}.` : 'Welcome.')

function compose(kind: string, name: string, space: string): Email | null {
  switch (kind) {
    case 'welcome_seeker':
      return {
        subject: 'Thank you for joining the Xanadu waitlist',
        preheader: 'We’ll let you know as soon as we’re ready for you.',
        heading: hi(name),
        paragraphs: [
          'Thank you for joining the Xanadu waitlist. Your place is held.',
          'Right now we are gathering our founding circle of spaces and guides. We’ll notify you once we’re ready for you.',
          'Thank you for joining the Xanadu dream.',
        ],
        button: { label: 'Visit Xanadu', url: 'https://dreamxanadu.com' },
        signoff: 'Questions or ideas? Just reply to this email. We read every one.',
      }
    case 'application_container':
      return {
        subject: 'Thank you for applying to Xanadu',
        preheader: `We’ll notify you once we review ${space ? `${space}’s` : 'your'} application.`,
        heading: hi(name),
        paragraphs: [
          `Thank you for applying to join Xanadu as a founding Container. We’ve received ${space ? `${space}’s` : 'your'} application.`,
          'Every space on Xanadu is personally reviewed before it joins. We’ll notify you once we review your application.',
          'Thank you for joining the Xanadu dream.',
        ],
        button: { label: 'Visit Xanadu', url: 'https://dreamxanadu.com' }, // the app stays closed until launch
        signoff: 'Questions? Just reply to this email.',
      }
    case 'application_facilitator':
      return {
        subject: 'Thank you for applying to Xanadu',
        preheader: 'We’ll notify you once we review your application.',
        heading: hi(name),
        paragraphs: [
          'Thank you for applying to join Xanadu as a founding Facilitator. We’ve received your application.',
          'Every guide on Xanadu is personally reviewed before joining. We’ll notify you once we review your application.',
          'Thank you for joining the Xanadu dream.',
        ],
        button: { label: 'Visit Xanadu', url: 'https://dreamxanadu.com' }, // the app stays closed until launch
        signoff: 'Questions? Just reply to this email.',
      }
  }
  return null
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Email-client-safe HTML: tables, inline styles, no gradients or web fonts required. */
function html(e: Email) {
  const p = e.paragraphs.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#EDE6DA;">${esc(t)}</p>`).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${esc(e.subject)}</title></head>
<body style="margin:0;padding:0;background:#0C1522;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#0C1522;">${esc(e.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0C1522;"><tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
    <tr><td align="center" style="padding-bottom:28px;">
      <img src="${APP}/logo-emblem-light.png" width="48" height="67" alt="" style="display:block;border:0;margin:0 auto 14px;">
      <img src="${APP}/logo-xanadu-text.png" width="150" alt="XANADU" style="display:block;border:0;margin:0 auto;color:#F6F1E8;font-family:Georgia,serif;font-size:22px;letter-spacing:6px;">
    </td></tr>
    <tr><td style="background:#172234;border:1px solid #2E3B52;border-radius:20px;padding:36px 32px;font-family:Manrope,'Helvetica Neue',Arial,sans-serif;">
      <h1 style="margin:0 0 20px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:34px;line-height:1.15;color:#F3ECDF;">${esc(e.heading)}</h1>
      ${p}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;"><tr><td style="border-radius:999px;background:#E6CDA6;">
        <a href="${e.button.url}" style="display:inline-block;padding:14px 30px;font-family:Manrope,'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:700;color:#101B2C;text-decoration:none;border-radius:999px;">${esc(e.button.label)}</a>
      </td></tr></table>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#A9B4C6;">${esc(e.signoff)}</p>
      <p style="margin:16px 0 0;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:18px;color:#D2B488;">With love, the Xanadu team</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 8px 0;font-family:Manrope,'Helvetica Neue',Arial,sans-serif;font-size:12px;line-height:1.6;color:#7F8BA0;">
      Xanadu begins with you.<br>
      ${e.footer ? `${esc(e.footer)}<br>` : ''}${e.footer?.includes('suggested your space') ? '' : 'You’re receiving this because you joined Xanadu. · '}<a href="${APP}/privacy" style="color:#7F8BA0;">Privacy</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`
}

const text = (e: Email) => [e.heading, '', ...e.paragraphs.flatMap((t) => [t, '']), `${e.button.label}: ${e.button.url}`, '', e.signoff, '', 'With love, the Xanadu team', `${APP}/privacy`].join('\n')

/** The web-push keys, created the first time they're needed. */
async function vapid(admin: SupabaseClient) {
  const { data } = await admin.from('push_config').select('public_key, private_key').eq('id', 1).maybeSingle()
  if (data) return data
  const keys = webpush.generateVAPIDKeys()
  await admin.from('push_config').upsert({ id: 1, public_key: keys.publicKey, private_key: keys.privateKey }, { onConflict: 'id', ignoreDuplicates: true })
  const { data: again } = await admin.from('push_config').select('public_key, private_key').eq('id', 1).single()
  return again!
}

/** Push one notification to every phone/browser the member turned notifications on for. */
async function push(admin: SupabaseClient, id: string) {
  // claim it, so it's pushed once
  const { data: n } = await admin.from('notifications').update({ pushed_at: new Date().toISOString() })
    .eq('id', id).is('pushed_at', null).select('id, user_id, kind, title, body, link').maybeSingle()
  if (!n) return reply({ ok: true, skipped: 'already pushed' })
  const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', n.user_id)
  if (!subs?.length) return reply({ ok: true, skipped: 'no devices' })
  const keys = await vapid(admin)
  webpush.setVapidDetails('mailto:networkxanadu@gmail.com', keys.public_key, keys.private_key)
  const { count } = await admin.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', n.user_id).is('read_at', null)
  const payload = JSON.stringify({ title: n.title, body: n.body.slice(0, 180), url: n.link, tag: n.kind === 'message' ? n.link : n.id, badge: count ?? 0 })
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 })
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('id', s.id) // phone unsubscribed
    }
  }
  return reply({ ok: true, sent })
}

/** A Facilitator invited the place they're holding an experience at to join Xanadu as a Container. */
async function invite(admin: SupabaseClient, id: string) {
  const { data: inv } = await admin.from('venue_invites').update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'queued').select('id, email, venue_name, invited_by, offering_id').maybeSingle()
  if (!inv) return reply({ ok: true, skipped: 'not queued' })
  const fail = async (error: string) => { await admin.from('venue_invites').update({ status: 'failed', error, sent_at: null }).eq('id', id); return reply({ ok: false, error }, 500) }
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return fail('RESEND_API_KEY is not set')
  const { data: who } = await admin.from('profiles').select('name').eq('id', inv.invited_by).maybeSingle()
  const { data: off } = inv.offering_id ? await admin.from('offerings').select('title').eq('id', inv.offering_id).maybeSingle() : { data: null }
  const name = (who?.name ?? '').trim() || 'A Xanadu Facilitator'
  const venue = inv.venue_name?.trim()
  const e: Email = {
    subject: `${name} invited ${venue || 'you'} to Xanadu`,
    preheader: `${first(name) || name} is holding ${off?.title ? `“${off.title}”` : 'an experience'} with you and thought you belong on Xanadu.`,
    heading: `${first(name) || name} thinks ${venue || 'your space'} belongs on Xanadu`,
    paragraphs: [
      `${name} is a Facilitator on Xanadu${off?.title ? ` and is holding “${off.title}” at ${venue || 'your space'}` : ''}. They’d love for you to join as a founding Container.`,
      'Xanadu is a network of retreat spaces, guides and seekers. Spaces share their place and their offerings, from a single class to a season or community living, and Seekers who are aligned with them find them first.',
      'Every space is personally reviewed before it joins. Because you were referred by one of our Facilitators, we’ll know where you came from when you apply. It takes about ten minutes.',
    ],
    button: { label: 'Apply as a Container', url: `${APP}/?mode=signup&role=Container` },
    signoff: 'Questions? Just reply to this email and the Xanadu team will answer.',
    footer: `You’re receiving this one email because ${name} suggested your space. We won’t email you again unless you join.`,
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `xanadu-invite-${inv.id}` },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM') || 'Xanadu <hello@dreamxanadu.com>', to: [inv.email], reply_to: REPLY_TO,
      subject: e.subject, html: html(e), text: text(e), tags: [{ name: 'kind', value: 'venue_invite' }] }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) return fail(`Resend ${res.status}: ${out?.message ?? 'error'}`)
  await admin.from('venue_invites').update({ provider_id: out?.id ?? null, error: null }).eq('id', id)
  return reply({ ok: true })
}

/** Someone joined the waitlist on the website (no account yet): send them the welcome email once. */
async function waitlistWelcome(admin: SupabaseClient, id: string) {
  const { data: w } = await admin.from('waitlist').update({ welcome_sent_at: new Date().toISOString(), welcome_error: null })
    .eq('id', id).is('welcome_sent_at', null).select('id, name, email, role').maybeSingle()
  if (!w) return reply({ ok: true, skipped: 'already sent' })
  const fail = async (error: string) => { await admin.from('waitlist').update({ welcome_sent_at: null, welcome_error: error }).eq('id', id); return reply({ ok: false, error }, 500) }
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return fail('RESEND_API_KEY is not set')
  if (!w.email) return fail('no email address')
  const role = (w.role ?? 'seeker').toLowerCase()
  const kind = role === 'container' ? 'application_container' : role === 'facilitator' ? 'application_facilitator' : 'welcome_seeker'
  const email = compose(kind, first(w.name), '')!
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `xanadu-waitlist-${w.id}` },
    body: JSON.stringify({ from: Deno.env.get('EMAIL_FROM') || 'Xanadu <hello@dreamxanadu.com>', to: [w.email], reply_to: REPLY_TO,
      subject: email.subject, html: html(email), text: text(email), tags: [{ name: 'kind', value: 'waitlist_' + kind }] }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) return fail(`Resend ${res.status}: ${out?.message ?? 'error'}`)
  await admin.from('waitlist').update({ welcome_provider_id: out?.id ?? null }).eq('id', id)
  return reply({ ok: true })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405)
  const input = await req.json().catch(() => ({}))
  const uuid = (v: unknown) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

  if (input?.init) { await vapid(admin); return reply({ ok: true }) }
  if (uuid(input?.push)) return push(admin, input.push)
  if (uuid(input?.invite)) return invite(admin, input.invite)
  if (uuid(input?.waitlist)) return waitlistWelcome(admin, input.waitlist)

  const id = input?.id
  if (!uuid(id)) return reply({ error: 'Missing id' }, 400)

  // claim the queued row (so two calls can't both send it)
  const { data: job } = await admin.from('email_queue').update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'queued').select('id, user_id, kind').maybeSingle()
  if (!job) return reply({ ok: true, skipped: 'not queued' })

  const fail = async (error: string, status: 'failed' | 'skipped' = 'failed') => {
    await admin.from('email_queue').update({ status, error, sent_at: null }).eq('id', id)
    return reply({ ok: false, error }, status === 'failed' ? 500 : 200)
  }

  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return fail('RESEND_API_KEY is not set')

  const { data: u } = await admin.auth.admin.getUserById(job.user_id)
  const to = u?.user?.email
  if (!to) return fail('member has no email address', 'skipped')
  // joined the website waitlist first and already got this welcome: don't send it twice
  if (job.kind === 'welcome_seeker') {
    const { data: w } = await admin.from('waitlist').select('id').ilike('email', to).not('welcome_sent_at', 'is', null).limit(1).maybeSingle()
    if (w) return fail('already welcomed when they joined the waitlist on the website', 'skipped')
  }

  let email: Email | null
  if (job.kind.startsWith('n:')) {
    const { data: n } = await admin.from('notifications').select('id, user_id, kind, title, body, link, pushed_at').eq('id', job.kind.slice(2)).maybeSingle()
    if (!n) return fail('notification no longer exists', 'skipped')
    email = composeNotification(n as Notification)
  } else {
    const { data: profile } = await admin.from('profiles').select('name').eq('id', job.user_id).maybeSingle()
    const { data: space } = await admin.from('spaces').select('name').eq('owner_id', job.user_id).order('created_at').limit(1).maybeSingle()
    email = compose(job.kind, first(profile?.name), space?.name ?? '')
  }
  if (!email) return fail(`unknown email kind ${job.kind}`, 'skipped')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `xanadu-${job.id}` },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') || 'Xanadu <hello@dreamxanadu.com>',
      to: [to], reply_to: REPLY_TO,
      subject: email.subject, html: html(email), text: text(email),
      tags: [{ name: 'kind', value: job.kind.startsWith('n:') ? 'notification' : job.kind }],
    }),
  })
  const out = await res.json().catch(() => ({}))
  if (!res.ok) return fail(`Resend ${res.status}: ${out?.message ?? 'error'}`)
  await admin.from('email_queue').update({ provider_id: out?.id ?? null, error: null }).eq('id', id)
  return reply({ ok: true })
})
