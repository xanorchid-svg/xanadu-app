import { useState } from 'react'
import { useToast } from '../parts'
import { Card, PageTitle } from '../ui'

const GUIDE = 'https://claude.ai/artifact/MnGPUC9GLR8eYSc1NouiKB'

type Swatch = { name: string; hex: string; use: string; dark?: boolean }
const CORE: Swatch[] = [
  { name: 'Navy', hex: '#101B2C', use: 'The ground. Backgrounds, navy grid tiles.', dark: true },
  { name: 'Deep navy', hex: '#0C1522', use: 'Deepest ground, bottom of photo shades.', dark: true },
  { name: 'Star gold', hex: '#B89567', use: 'The star, small marks and rules.' },
  { name: 'Soft gold', hex: '#D2B488', use: 'Eyebrows, links and labels on navy.' },
  { name: 'Pale gold', hex: '#E6CDA6', use: 'Call-to-action lines, tag borders.' },
  { name: 'Ivory', hex: '#F6F1E8', use: 'Light text and white grid tiles. Never pure white.' },
]
const SUPPORT: Swatch[] = [
  { name: 'Plum', hex: '#2A1F39', use: 'Photo placeholders, depth.', dark: true },
  { name: 'Slate', hex: '#49536F', use: 'Muted text on ivory.', dark: true },
  { name: 'Sage', hex: '#494E38', use: 'Earthy, nature-led pieces.', dark: true },
  { name: 'Mist teal', hex: '#6A838A', use: 'Calm accents.', dark: true },
]
const IRI: Swatch[] = [
  { name: 'Sage', hex: '#9DBB7A', use: '' }, { name: 'Teal', hex: '#6FB7BF', use: '' },
  { name: 'Periwinkle', hex: '#8F9BE6', use: '' }, { name: 'Violet', hex: '#B58BE0', use: '' },
  { name: 'Rose', hex: '#E09AC4', use: '' }, { name: 'Gold', hex: '#E8BF8A', use: '' },
]
const LAND: Swatch[] = [
  { name: 'Beach', hex: '#E6CDA6', use: '' }, { name: 'Ocean', hex: '#7FB3C2', use: '' }, { name: 'Jungle', hex: '#86A06A', use: '' },
  { name: 'Mountains', hex: '#8C95C9', use: '' }, { name: 'Desert', hex: '#D9A67E', use: '' }, { name: 'Forest', hex: '#6E9A7E', use: '' },
  { name: 'Countryside', hex: '#B7B470', use: '' }, { name: 'Town', hex: '#C8A0C4', use: '' }, { name: 'City', hex: '#A58BD6', use: '' },
]

type Logo = { file: string; name: string; use: string; light: boolean }
const LOGOS: Logo[] = [
  { file: 'xanadu-logo.png', name: 'Full lockup', use: 'Ivory pages, white tiles, documents', light: true },
  { file: 'logo-emblem-light.png', name: 'Emblem for dark', use: 'Navy grounds and dark photos', light: false },
  { file: 'xanadu-mark.png', name: 'Emblem, large', use: 'Profile picture, hero moments', light: true },
  { file: 'logo-static.png', name: 'Emblem, small', use: 'Inline on light grounds', light: true },
  { file: 'logo-wordmark.png', name: 'Wordmark + subline', use: 'Headers and footers on light', light: true },
  { file: 'logo-wordmark-dark.png', name: 'Wordmark only', use: 'Tight spaces; invert to ivory on navy', light: true },
  { file: 'icon-512.png', name: 'App icon', use: 'App Store, home screen', light: true },
]

const IRI_CSS = 'linear-gradient(115deg, #9DBB7A 0%, #6FB7BF 18%, #8F9BE6 36%, #B58BE0 54%, #E09AC4 72%, #E8BF8A 88%, #9DBB7A 100%)'
const PEARL_CSS = 'linear-gradient(115deg, #EDD8B4 0%, #CFE6DA 20%, #CBD0F3 40%, #E3CAEE 60%, #F1CCDA 80%, #EDD8B4 100%)'

function H({ children }: { children: string }) {
  return <h2 className="mb-3 mt-10 text-[11.5px] font-semibold uppercase tracking-[.18em] text-faint first:mt-0">{children}</h2>
}

export default function Brand() {
  const toast = useToast()
  const [copied, setCopied] = useState<string | null>(null)
  async function copy(text: string, label = text) {
    try { await navigator.clipboard.writeText(text); setCopied(text); toast.show(`Copied ${label}`) }
    catch { toast.show('Could not copy') }
  }
  const Chip = ({ s, big = false }: { s: Swatch; big?: boolean }) => (
    <button onClick={() => copy(s.hex, `${s.name} ${s.hex}`)} className="group text-left">
      <div className={`${big ? 'h-24' : 'h-16'} rounded-xl ring-1 ring-line transition group-hover:ring-gold-soft`} style={{ background: s.hex }} />
      <p className="mt-2 text-[13.5px] font-semibold text-text">{s.name}</p>
      <p className="font-mono text-[12px] text-subtle">{copied === s.hex ? 'Copied' : s.hex}</p>
      {s.use && <p className="mt-0.5 text-[12px] leading-snug text-faint">{s.use}</p>}
    </button>
  )

  return (
    <div className="xa-page">
      <PageTitle eyebrow="Brand" title={<>Look and <span className="text-iri italic">feel</span></>}>
        <a href={GUIDE} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center rounded-full bg-surface-2 px-5 text-[14px] font-semibold text-text no-underline ring-1 ring-line-2 hover:bg-surface">Full brand guide</a>
      </PageTitle>
      <p className="-mt-2 mb-8 max-w-2xl text-[14.5px] leading-relaxed text-subtle">
        Navy is the ground. Gold is the star. Iridescence is the light. Calm, spacious and unhurried, with one touch of wonder per piece. Tap any color to copy it.
      </p>

      <H>Logos</H>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {LOGOS.map((l) => (
          <Card key={l.file} className="overflow-hidden">
            <div className={`grid h-36 place-items-center p-5 ${l.light ? 'bg-ivory' : 'bg-navy'}`}>
              <img src={`/brand/${l.file}`} alt={l.name} className="max-h-full max-w-full object-contain" />
            </div>
            <div className="p-3.5">
              <p className="text-[13.5px] font-semibold text-text">{l.name}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-faint">{l.use}</p>
              <a href={`/brand/${l.file}`} download className="mt-2 inline-block text-[12.5px] font-semibold">Download PNG</a>
            </div>
          </Card>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-subtle">
        <li>Give the emblem clear space at least the height of its star. Minimum 32px tall on screen.</li>
        <li>Never recolor, stretch or add effects. The iridescence is already in the artwork.</li>
        <li>On navy, use the emblem for dark, or invert the wordmark to ivory.</li>
      </ul>

      <H>Core colors</H>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">{CORE.map((s) => <Chip key={s.hex} s={s} big />)}</div>
      <p className="mt-4 text-[13px] text-subtle">Roughly 70% navy or ivory, 20% photography, 10% gold and iridescence. Instagram grid: white, photo, navy, photo.</p>

      <H>Supporting tones</H>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{SUPPORT.map((s) => <Chip key={s.hex} s={s} />)}</div>

      <H>Iridescence</H>
      <Card className="p-5">
        <div className="h-20 rounded-xl" style={{ background: IRI_CSS }} />
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">{IRI.map((s) => <Chip key={s.hex} s={s} />)}</div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => copy(IRI_CSS, 'iridescent gradient CSS')} className="h-9 rounded-full bg-surface-2 px-4 text-[13px] font-semibold text-text ring-1 ring-line-2">Copy gradient CSS</button>
          <button onClick={() => copy(PEARL_CSS, 'pearl gradient CSS')} className="h-9 rounded-full px-4 text-[13px] font-semibold text-navy" style={{ background: PEARL_CSS }}>Copy pearl CSS</button>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-subtle">
          Saturated for one key word, short rules and hairlines. Pearl for primary buttons with navy text. One iridescent element per screen or slide.
        </p>
      </Card>

      <H>Typography</H>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-[11.5px] font-semibold uppercase tracking-[.18em] text-gold-soft">Headlines · Cormorant Garamond 500</p>
          <p className="mt-3 font-display text-[44px] leading-[1.02] text-ink">Xanadu begins <em className="text-iri">with you.</em></p>
          <p className="mt-3 text-[13px] text-faint">Sentence case, two beats, the second in italic. Also for quotes and reel text.</p>
        </Card>
        <Card className="p-6">
          <p className="text-[11.5px] font-semibold uppercase tracking-[.18em] text-gold-soft">Everything else · Manrope 300–700</p>
          <p className="mt-3 text-[16px] leading-relaxed text-muted">You design the stay. We match you. A week, a month, a season, wherever you feel most alive.</p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[.32em] text-gold-soft">A network for awakening places</p>
          <p className="mt-3 text-[13px] text-faint">Body, captions, buttons. Eyebrows in uppercase, spaced 0.32em.</p>
        </Card>
      </div>

      <H>Landscape colors</H>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">{LAND.map((s) => <Chip key={s.name} s={s} />)}</div>
      <p className="mt-3 text-[13px] text-subtle">For landscape tags and map pins only.</p>

      <H>Voice in one breath</H>
      <Card className="p-6">
        <p className="font-display text-[24px] leading-snug text-ink">Authentic, warm, slightly mystical, powerful yet elegant. We don't sell. We invite.</p>
        <div className="mt-5 grid gap-5 text-[13.5px] leading-relaxed sm:grid-cols-2">
          <div>
            <p className="mb-1.5 font-semibold text-gold-pale">We say</p>
            <p className="text-subtle">way of living · stay · season · land · the circle · founding · welcome · belong · aligned · personally reviewed · Seekers, Containers, Facilitators</p>
          </div>
          <div>
            <p className="mb-1.5 font-semibold text-rose">We avoid</p>
            <p className="text-subtle">revolutionary · unlock · platform · users · wisdom keepers · high vibration · heal · guaranteed · verified safe · exclamation marks in headlines</p>
          </div>
        </div>
      </Card>
      {toast.node}
    </div>
  )
}
