import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { useAuth } from './auth'

/**
 * AI matching. After a Seeker describes what they're looking for (or a host updates their space or offerings),
 * the match-embed function reads the words, picks out keywords and stores a "meaning" vector.
 * my_matches() then ranks approved spaces and live offerings for the Seeker.
 */

export type Match = { kind: 'space' | 'offering'; id: string; title: string; town: string; photo_url: string; matched: string[]; score: number }

/** Re-reads the member's words for matching. Never blocks the app: failures are quiet. */
export async function refreshMatches(): Promise<string[] | null> {
  try {
    const { data, error } = await supabase.functions.invoke('match-embed', { body: {} })
    if (error) return null
    return (data?.keywords as string[]) ?? []
  } catch { return null }
}

/** Keywords Xanadu picked up from the Seeker's own words. */
export function useMyKeywords() {
  const { session } = useAuth()
  const [keywords, setKeywords] = useState<string[]>([])
  useEffect(() => {
    if (!session) return
    supabase.from('match_vectors').select('keywords').eq('kind', 'seeker').eq('ref_id', session.user.id).maybeSingle()
      .then(({ data }) => setKeywords((data?.keywords as string[]) ?? []))
  }, [session])
  return [keywords, setKeywords] as const
}

export function useMatches(count = 6) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const { data } = await supabase.rpc('my_matches', { match_count: count })
    setMatches((data as Match[]) ?? [])
    setLoading(false)
  }, [count])
  useEffect(() => { reload() }, [reload])
  return { matches, loading, reload }
}
