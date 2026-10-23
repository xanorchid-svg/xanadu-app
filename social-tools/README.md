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

## Pearl style + upscaled AI photos (Oct 22, 2026, evening)
- **Type style is "Pearl"**: one soft mother-of-pearl gradient on italic words, hairline rules, champagne eyebrows. It's baked into `ig/render.js` (`--iri` is now the pearl gradient; the old rainbow is kept as `--iri-old`) and `vreel/both/both.js`. Alternatives Xan saw: `ig/themes/quiet.css` (no gradient) and `ig/themes/golden.css`. Preview any theme with `THEME=themes/x.css POSTS=./posts-preview.js OUT=/tmp/pv node render.js pv`.
- **Photos are AI again**, upscaled 2× with Real-ESRGAN x2plus (1136×1408 → 2272×2816). Originals are pages in Canva holder design DAHYegA5SMA (posts 2–3: pages 2–12; batch 2: 13–28; quiz/bags: 42–46; rest corner and forest: 51–52; do-both: 77–86). `ig/upscale.py` is the upscaler. PyTorch can't be installed in the workspace, so run it in a GitHub Action (torch and torchvision both from the CPU index) on a temp branch that commits results back. Put upscaled files in `ig/img-ai/` and do-both ones in `vreel/both/img2/<name>.jpg`.
- Renders run at 2×, and `ig/publish.py <ids…>` writes 1080×1350 JPGs at q95. The stock-photo experiment (Unsplash) is in git history; source list in `ig/stock-photos.json`.
