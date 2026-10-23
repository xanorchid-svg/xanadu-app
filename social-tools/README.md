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
