# Social tools (Instagram/Facebook renderers)

Source for every slide, reel and cover on the console Instagram page. Scripts use absolute paths, so restore them into place first:

```bash
cp -r social-tools/ig /home/claude/ig && (cd /home/claude/ig && npm ci)   # playwright + @fontsource fonts
cp -r social-tools/reel /home/claude/reel
cp -r social-tools/vreel /home/claude/vreel
```

- `ig/render.js` + `ig/posts.js`: carousels and single posts, 1080×1350 (`node render.js <id-prefix>`; output in `ig/out/<id>/`). Source photos go in `ig/img/`.
- `reel/*.js`: motion-graphic reels over stills (reel5c.js is the clean template), plus `grid.js` (profile-grid preview).
- `vreel/vreel.js` + `reels.js`: reels over real stock footage. Clips go in `vreel/clips/<id>.mp4` (1080×1920).
- `vreel/cover.js`: text covers. `vreel/both/both.js`: "do both" split carousel.
- Chromium: `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. Video encoding: ffmpeg.

Source images and clips are NOT in git (too big). Re-download them from Canva: images and clips are pages in holder design `DAHYegA5SMA`, so export a page as PNG or MP4 and download it from export-download.canva.com. Asset ids are in the project docs `claude/SOCIAL-RENDERER.md` and `claude/SOCIAL-STATUS.md`.

## Upscaled AI photos, rainbow iridescent type (Oct 22, 2026, night)
- **Type style: the original rainbow iridescent gradient (Xan's choice, keep it).** A softer "Pearl" style was tried and rejected; it and the other alternatives are in `ig/themes/` (preview with `THEME=themes/x.css POSTS=./posts-preview.js OUT=/tmp/pv node render.js pv`).
- **Photos are AI**, upscaled 2× with Real-ESRGAN x2plus (1136×1408 → 2272×2816). Originals are pages in Canva holder design DAHYegA5SMA (posts 2–3: pages 2–12; batch 2: 13–28; quiz/bags: 42–46; rest corner and forest: 51–52; do-both: 77–86). `ig/upscale.py` is the upscaler. Run it in a GitHub Action on a temp branch (install torch and torchvision both from the CPU index); PyTorch can't be installed in the workspace. Upscaled files go in `ig/img-ai/`, and do-both ones in `vreel/both/img2/<name>.jpg`.
- Renders run at 2×, and `ig/publish.py <ids…>` writes 1080×1350 JPGs at q95. The stock-photo experiment (Unsplash) is in git history; source list in `ig/stock-photos.json`.

## Reel videos are not hosted on the console (Oct 22, 2026)
To save Vercel bandwidth, `reel.mp4` files were removed from `console/public/social/`. The console shows only the reel cover (`01.jpg`). The videos live in Metricool (its own copies) and on Xan's Mac (Movies → Xanadu Reels), and git history has them before commit "Console: remove reel videos". When you make a new reel, render it outside `console/public` (the reel scripts default there, so move or delete the mp4 before committing). If Metricool needs a public URL to upload it, use a temporary host, not the console.

## New look, v2 "quiet photo" (Oct 26, 2026)
A second version of the next 20 posts (Oct 26 – Dec 9), modeled on @nexus.villages: a photo on every cover with one flat overlay, small centered Cormorant type with a solid-gold italic accent, the nucleus mark, a thin arrow; inside slides are calm navy or ivory panels (or a photo with a flat overlay) with left-aligned text. **No gradients anywhere.** The current look is untouched.
- Content: `ig/posts-v2.js`. Renderer: `ig/render-v2.js` (`node render-v2.js [id]`, set `CHROME=` if Chromium lives elsewhere). Publish: `python3 social-tools/ig/publish-v2.py [ids…]` → `console/public/social-v2/<id>/`.
- Photos: the upscaled AI photos are on the git branch **`tmp-upscale`** in `tmp-up/out/` (don't delete that branch; copy them into `ig/img-ai/`). Five new v2 covers (`v2-circle`, `v2-trail`, `v2-porch`, `v2-hammock`, `v2-veranda`) are pages 93–97 of Canva design DAHYegA5SMA; `v2-reel28` is the first frame of reel 28.
- Console: the Instagram page has a **Look** switch (Current / New look v2). `console/src/social/posts.ts` → `V2_SLIDES`, `asV2`. Metricool drafts still point at the current look.
