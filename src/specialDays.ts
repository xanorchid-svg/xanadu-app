/**
 * Special days for the Calendar: full and new moons (calculated), eclipses, solstices and equinoxes,
 * Costa Rica's holidays and the days the Nosara community celebrates. Dates are local to Costa Rica (UTC−6).
 */

export type SpecialDay = { date: string; label: string; icon: string; kind: 'moon' | 'sky' | 'holiday' | 'celebration' }

const iso = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`

/* ---------- moon phases (Meeus, Astronomical Algorithms ch. 49: accurate to a few minutes) ---------- */

const rad = (d: number) => (d * Math.PI) / 180
function phaseJDE(k: number, full: boolean) {
  const T = k / 1236.85
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4
  const E = 1 - 0.002516 * T - 0.0000074 * T * T
  const M = rad(2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3)
  const Mp = rad(201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4)
  const F = rad(160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4)
  const O = rad(124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3)
  const s = Math.sin
  jde += full
    ? -0.40614 * s(Mp) + 0.17302 * E * s(M) + 0.01614 * s(2 * Mp) + 0.01043 * s(2 * F) + 0.00734 * E * s(Mp - M) - 0.00515 * E * s(Mp + M)
      + 0.00209 * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp)
      + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O)
    : -0.4072 * s(Mp) + 0.17241 * E * s(M) + 0.01608 * s(2 * Mp) + 0.01039 * s(2 * F) + 0.00739 * E * s(Mp - M) - 0.00514 * E * s(Mp + M)
      + 0.00208 * E * E * s(2 * M) - 0.00111 * s(Mp - 2 * F) - 0.00057 * s(Mp + 2 * F) + 0.00056 * E * s(2 * Mp + M) - 0.00042 * s(3 * Mp)
      + 0.00042 * E * s(M + 2 * F) + 0.00038 * E * s(M - 2 * F) - 0.00024 * E * s(2 * Mp - M) - 0.00017 * s(O)
  return jde
}
/** Julian ephemeris day → the Costa Rica calendar date (ΔT of about a minute ignored). */
const crDate = (jde: number) => iso(new Date((jde - 2440587.5) * 86400000 - 6 * 3600000))

function moons(fromYear: number, toYear: number): SpecialDay[] {
  const out: SpecialDay[] = []
  const k0 = Math.floor((fromYear - 2000) * 12.3685) - 1
  const k1 = Math.ceil((toYear + 1 - 2000) * 12.3685) + 1
  for (let k = k0; k <= k1; k++) {
    out.push({ date: crDate(phaseJDE(k, false)), label: 'New moon', icon: '🌑', kind: 'moon' })
    out.push({ date: crDate(phaseJDE(k + 0.5, true)), label: 'Full moon', icon: '🌕', kind: 'moon' })
  }
  return out
}

/* ---------- the sky: eclipses (NASA/Espenak), solstices and equinoxes ---------- */

const SKY: SpecialDay[] = [
  { date: '2026-12-21', label: 'Solstice', icon: '☀️', kind: 'sky' },
  { date: '2027-02-06', label: 'Solar eclipse (annular)', icon: '🌘', kind: 'sky' },
  { date: '2027-02-20', label: 'Lunar eclipse (penumbral)', icon: '🌒', kind: 'sky' },
  { date: '2027-03-20', label: 'Equinox', icon: '⚖️', kind: 'sky' },
  { date: '2027-06-21', label: 'Solstice', icon: '☀️', kind: 'sky' },
  { date: '2027-07-18', label: 'Lunar eclipse (penumbral)', icon: '🌒', kind: 'sky' },
  { date: '2027-08-02', label: 'Total solar eclipse', icon: '🌘', kind: 'sky' },
  { date: '2027-08-17', label: 'Lunar eclipse (penumbral)', icon: '🌒', kind: 'sky' },
  { date: '2027-09-23', label: 'Equinox', icon: '⚖️', kind: 'sky' },
  { date: '2027-12-21', label: 'Solstice', icon: '☀️', kind: 'sky' },
]

/* ---------- Costa Rica's holidays, and the days the community celebrates ---------- */

const HOLIDAYS: SpecialDay[] = [
  // 2026
  { date: '2026-11-26', label: 'Thanksgiving', icon: '🍂', kind: 'celebration' },
  { date: '2026-12-01', label: 'Abolition of the Army (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2026-12-24', label: 'Christmas Eve', icon: '✨', kind: 'celebration' },
  { date: '2026-12-25', label: 'Christmas (holiday)', icon: '🎄', kind: 'holiday' },
  { date: '2026-12-31', label: 'New Year’s Eve', icon: '✨', kind: 'celebration' },
  // 2027
  { date: '2027-01-01', label: 'New Year’s Day (holiday)', icon: '🎉', kind: 'holiday' },
  { date: '2027-02-14', label: 'Valentine’s Day', icon: '♡', kind: 'celebration' },
  { date: '2027-03-08', label: 'International Women’s Day', icon: '♀', kind: 'celebration' },
  { date: '2027-03-25', label: 'Holy Thursday (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-03-26', label: 'Good Friday (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-03-28', label: 'Easter', icon: '🌷', kind: 'celebration' },
  { date: '2027-04-11', label: 'Juan Santamaría Day (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-04-22', label: 'Earth Day', icon: '🌎', kind: 'celebration' },
  { date: '2027-05-01', label: 'Labor Day (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-06-20', label: 'Father’s Day', icon: '♡', kind: 'celebration' },
  { date: '2027-07-25', label: 'Guanacaste Day (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-08-02', label: 'Virgen de los Ángeles (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-08-15', label: 'Mother’s Day (holiday)', icon: '♡', kind: 'holiday' },
  { date: '2027-09-15', label: 'Independence Day (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-10-31', label: 'Halloween', icon: '🎃', kind: 'celebration' },
  { date: '2027-11-02', label: 'Día de los Muertos', icon: '🕯️', kind: 'celebration' },
  { date: '2027-11-25', label: 'Thanksgiving', icon: '🍂', kind: 'celebration' },
  { date: '2027-12-01', label: 'Abolition of the Army (holiday)', icon: '🇨🇷', kind: 'holiday' },
  { date: '2027-12-24', label: 'Christmas Eve', icon: '✨', kind: 'celebration' },
  { date: '2027-12-25', label: 'Christmas (holiday)', icon: '🎄', kind: 'holiday' },
  { date: '2027-12-31', label: 'New Year’s Eve', icon: '✨', kind: 'celebration' },
]

let all: SpecialDay[] | null = null
function list() {
  if (!all) {
    const y = new Date().getFullYear()
    all = [...moons(y - 1, y + 1), ...SKY, ...HOLIDAYS].sort((a, b) => a.date.localeCompare(b.date))
  }
  return all
}

/** Special days from a to b (inclusive, YYYY-MM-DD). */
export const specialBetween = (a: string, b: string) => list().filter((d) => d.date >= a && d.date <= b)
/** Special days on one date. */
export const specialOn = (d: string) => list().filter((x) => x.date === d)
