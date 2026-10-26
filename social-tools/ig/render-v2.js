// Xanadu v2 ("quiet photo") renderer, Oct 26, 2026.
// Inspired by @nexus.villages: a beautiful photo, one flat overlay (no gradients anywhere),
// small centered type, a thin arrow; inside slides are calm solid panels with left-aligned text.
// Xanadu spin: Cormorant + Manrope, the nucleus mark, navy / ivory / gold, italic accents in solid gold.
// Usage: node render-v2.js [id-prefix]  → out-v2/<id>/<id>-NN.png at 2160x2700 (publish-v2.py makes 1080x1350 JPGs)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const F = (p) => 'file://' + path.resolve(__dirname, p);
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F('node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const DATA = (f) => 'data:image/png;base64,' + fs.readFileSync(path.resolve(__dirname, f)).toString('base64');
const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2', 400)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2', 400, 'italic')}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-300-normal.woff2', 300)}
${font('Manrope', 'manrope/files/manrope-latin-400-normal.woff2', 400)}
${font('Manrope', 'manrope/files/manrope-latin-500-normal.woff2', 500)}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--paper:#F2ECE1;--ink:#F3ECDF;--muted:#C9CFD8;--gold:#D2B488;--gold-pale:#E6CDA6;--gold-deep:#9A7B4F;--navy-soft:#3A4558}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:var(--navy);-webkit-font-smoothing:antialiased}
.s{position:relative;width:1080px;height:1350px;overflow:hidden;color:var(--ink)}
.s.light{color:var(--navy)}
.photo{position:absolute;inset:0;background-size:cover;background-position:center}
.veil{position:absolute;inset:0}
.solid{position:absolute;inset:0;background:var(--navy)}
.light .solid{background:var(--paper)}
.c{position:absolute;inset:0;display:flex;flex-direction:column}
/* covers: centered, small, airy */
.cover:not(.light) .c,.photoText .c,.end.ph .c{text-shadow:0 2px 26px rgba(16,27,44,.55)}
.cover .c{align-items:center;justify-content:center;text-align:center;padding:0 130px}
.mark{width:46px;height:56px;background:currentColor;-webkit-mask:url('${DATA('logo-nucleus.png')}') center/contain no-repeat;mask:url('${DATA('logo-nucleus.png')}') center/contain no-repeat;margin:0 auto 44px;opacity:.95}
.eb{font-family:Manrope;font-weight:500;font-size:19px;letter-spacing:.34em;text-transform:uppercase;padding-left:.34em;margin-bottom:34px;opacity:.9}
.cover .eb{padding-left:.34em}
.text .eb,.photoText .eb{padding-left:0}
h1{font-family:Cormorant;font-weight:400;font-size:84px;line-height:1.1;letter-spacing:-.005em}
h1.hl{font-size:100px;line-height:1.04}
h1.hs{font-size:70px}
em{font-style:italic;color:var(--gold-pale)}
.light em{color:#7A5E36}
.sub{font-family:Manrope;font-weight:300;font-size:28px;line-height:1.55;margin-top:30px;opacity:.88}
.arrow{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);width:76px;height:20px}
.arrow.r{left:auto;right:96px;transform:none;bottom:86px;width:60px}
.arrow path{fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
.text .arrow.r path,.photoText .arrow.r path{stroke:var(--gold)}
.light .arrow.r path{stroke:var(--gold-deep)}
/* inside slides: left aligned, like a page of a book */
.text .c,.photoText .c{justify-content:center;padding:0 120px 40px}
.text .eb,.photoText .eb{color:var(--gold);font-size:20px;letter-spacing:.3em;margin-bottom:46px}
.light .eb{color:var(--gold-deep)}
.text h1,.photoText h1{font-size:72px;line-height:1.16}
.text p.b,.photoText p.b{font-family:Manrope;font-weight:300;font-size:31px;line-height:1.6;margin-top:36px;max-width:780px;color:var(--muted)}
.light p.b{color:var(--navy-soft)}
.tags{display:flex;flex-wrap:wrap;gap:14px;margin-top:44px}
.tag{font-family:Manrope;font-weight:400;font-size:26px;border:1px solid currentColor;border-radius:999px;padding:12px 28px;opacity:.85}
.num{font-family:Cormorant;font-style:italic;font-size:40px;color:var(--gold);margin-bottom:18px}
.light .num{color:var(--gold-deep)}
.big{font-family:Cormorant;font-weight:400;font-size:220px;line-height:.9;color:var(--gold-pale)}
.cite{font-family:Manrope;font-weight:400;font-size:20px;letter-spacing:.06em;margin-top:34px;opacity:.6}
/* end slide */
.end .c{align-items:center;justify-content:center;text-align:center;padding:0 140px}
.line{width:64px;height:1px;background:var(--gold);margin:46px auto 0}
.light .line{background:var(--gold-deep)}
.cta{font-family:Manrope;font-weight:500;font-size:21px;letter-spacing:.3em;text-transform:uppercase;padding-left:.3em;margin-top:34px;color:var(--gold-pale)}
.light .cta{color:var(--gold-deep)}
.wm{width:300px;height:57px;background:currentColor;-webkit-mask:url('${DATA('logo-wordmark.png')}') center/contain no-repeat;mask:url('${DATA('logo-wordmark.png')}') center/contain no-repeat;margin:22px auto 0;opacity:.9}
/* stacked halves (do both) */
.half{position:absolute;left:0;right:0;height:675px;overflow:hidden}
.half.t{top:0}.half.b{bottom:0}
.half .photo{inset:0}
.half .veil{background:rgba(16,27,44,.22)}
.half .cap{position:absolute;left:0;right:0;bottom:56px;text-align:center;font-family:Cormorant;font-style:italic;font-size:66px;color:var(--ivory)}
.seam{position:absolute;left:0;right:0;top:674px;height:2px;background:var(--ivory);opacity:.9}
.amp{position:absolute;left:50%;top:675px;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;background:var(--ivory);color:var(--navy);font-family:Cormorant;font-style:italic;font-size:44px;display:flex;align-items:center;justify-content:center;padding-bottom:6px}
`;

const VEIL = { photo: 'rgba(16,27,44,.34)', navy: 'rgba(16,27,44,.60)', ivory: 'rgba(246,241,232,.62)', dusk: 'rgba(16,27,44,.46)', inside: 'rgba(16,27,44,.54)', soft: 'rgba(16,27,44,.18)' };
const ARROW = (cls = '') => `<svg class="arrow ${cls}" viewBox="0 0 76 20"><path d="M1 10H74M65 2l9 8-9 8"/></svg>`;
const bgPhoto = (s, veil) => `<div class="photo" style="background-image:url('${F(s.photo)}');${s.pos ? 'background-position:' + s.pos : ''}"></div><div class="veil" style="background:${veil}"></div>`;

function slide(s, i, n) {
  const last = i === n - 1;
  if (s.kind === 'cover') {
    const light = s.tone === 'ivory';
    return `<div class="s cover ${light ? 'light' : ''}">${bgPhoto(s, s.veil || VEIL[s.tone || 'photo'])}<div class="c">
      ${s.mark === false ? '' : '<div class="mark"></div>'}${s.eb ? `<div class="eb">${s.eb}</div>` : ''}<h1 class="${s.size ? 'h' + s.size : ''}">${s.h}</h1>${s.sub ? `<p class="sub">${s.sub}</p>` : ''}</div>
      ${n > 1 && s.arrow !== false ? ARROW() : ''}</div>`;
  }
  if (s.kind === 'halves') {
    return `<div class="s">${['t', 'b'].map((k, j) => { const [img, pos, cap] = j ? s.b : s.a; return `<div class="half ${k}"><div class="photo" style="background-image:url('${F(img)}');background-position:${pos}"></div><div class="veil"></div><div class="cap">${cap}</div></div>`; }).join('')}<div class="seam"></div><div class="amp">&amp;</div></div>`;
  }
  if (s.kind === 'end') {
    const light = s.bg === 'ivory';
    const back = s.photo ? bgPhoto(s, VEIL[light ? 'ivory' : 'navy']) : '<div class="solid"></div>';
    return `<div class="s end ${light ? 'light' : ''} ${s.photo ? 'ph' : ''}">${back}<div class="c"><div class="mark"></div><h1 class="hs">${s.h}</h1>${s.sub ? `<p class="sub">${s.sub}</p>` : ''}<div class="line"></div><div class="cta">${s.cta}</div></div></div>`;
  }
  // text (solid panel) or photoText (photo with a flat veil), left aligned
  const light = s.bg === 'ivory';
  const back = s.kind === 'photoText' ? bgPhoto(s, VEIL.inside) : '<div class="solid"></div>';
  return `<div class="s ${s.kind} ${light ? 'light' : ''}">${back}<div class="c">${s.eb ? `<div class="eb">${s.eb}</div>` : ''}${s.pre || ''}<h1>${s.h}</h1>${s.b ? `<p class="b">${s.b}</p>` : ''}${s.after || ''}</div>${last ? '' : ARROW('r')}</div>`;
}

const html = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${slide(s, i, n)}</body></html>`;
const POSTS = require(process.env.POSTS || './posts-v2.js');

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch({ executablePath: '' + (process.env.CHROME || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome') + '' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const [id, slides] of Object.entries(POSTS)) {
    if (only && !id.startsWith(only)) continue;
    const dir = path.join(__dirname, 'out-v2', id);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < slides.length; i++) {
      const tmp = path.join(__dirname, '_v2.html');
      fs.writeFileSync(tmp, html(slides[i], i, slides.length));
      await page.goto('file://' + tmp, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(dir, `${id}-${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log('rendered', id, slides.length);
  }
  await browser.close();
})();
