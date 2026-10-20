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
