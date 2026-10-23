import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// A short content hash per social post folder. Image URLs carry ?v=<hash>, so they can be
// cached for a long time and still refresh the moment a post is re-rendered.
function socialVersions() {
  const root = join(__dirname, 'public', 'social')
  const out: Record<string, string> = {}
  for (const id of readdirSync(root)) {
    const dir = join(root, id)
    if (!statSync(dir).isDirectory()) continue
    const h = createHash('sha1')
    const walk = (d: string) => readdirSync(d).sort().forEach((f) => {
      const p = join(d, f)
      if (statSync(p).isDirectory()) walk(p); else h.update(f).update(readFileSync(p))
    })
    walk(dir)
    out[id] = h.digest('hex').slice(0, 8)
  }
  return out
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { __SOCIAL_V__: JSON.stringify(socialVersions()) },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
          ],
        },
      },
    },
  },
})
