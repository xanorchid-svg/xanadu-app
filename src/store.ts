import { useCallback, useEffect, useState } from 'react'

/**
 * Local profile storage.
 * Until Supabase accounts are connected, profile edits are saved on this device (localStorage),
 * so they survive refreshes and closing the app. Swap these hooks for Supabase calls later.
 */

export type SeekerProfile = {
  name: string
  photo: string
  region: string
  prefs: string[]
  notify: boolean
}

export type SpaceProfile = {
  name: string
  town: string
  about: string
  practices: string[]
  photos: string[]
  sleeps: string
  rooms: string
  mats: string
  kitchen: string
  gettingHere: string
}

export type Training = { title: string; school: string; year: string }
export type Reference = { name: string; contact: string }

export type FacilitatorProfile = {
  name: string
  photo: string
  town: string
  practices: string[]
  languages: string
  about: string
  trainings: Training[]
  references: Reference[]
  insurance: string
}

export const EMPTY_SEEKER: SeekerProfile = { name: '', photo: '', region: 'Costa Rica', prefs: [], notify: true }
export const EMPTY_SPACE: SpaceProfile = { name: '', town: '', about: '', practices: [], photos: [], sleeps: '', rooms: '', mats: '', kitchen: '', gettingHere: '' }
export const EMPTY_FACILITATOR: FacilitatorProfile = { name: '', photo: '', town: '', practices: [], languages: '', about: '', trainings: [], references: [], insurance: '' }

const listeners = new Map<string, Set<() => void>>()

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

/** Returns false if the device ran out of storage (usually too many large photos). */
function write<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    listeners.get(key)?.forEach((fn) => fn())
    return true
  } catch {
    return false
  }
}

function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))
  useEffect(() => {
    const fn = () => setValue(read(key, fallback))
    if (!listeners.has(key)) listeners.set(key, new Set())
    listeners.get(key)!.add(fn)
    return () => { listeners.get(key)!.delete(fn) }
    // fallback is a constant per key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const save = useCallback((next: T) => {
    const ok = write(key, next)
    if (ok) setValue(next)
    return ok
  }, [key])
  return [value, save] as const
}

export const useSeekerProfile = () => useStored<SeekerProfile>('xa-seeker', EMPTY_SEEKER)
export const useSpaceProfile = () => useStored<SpaceProfile>('xa-space', EMPTY_SPACE)
export const useFacilitatorProfile = () => useStored<FacilitatorProfile>('xa-facilitator', EMPTY_FACILITATOR)

/** Shrinks a chosen photo (max 1000px, JPEG) so it stays light on the phone, and returns it as a data URL. */
export function photoFromFile(file: File, max = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file could not be read as a photo.')) }
    img.src = url
  })
}
