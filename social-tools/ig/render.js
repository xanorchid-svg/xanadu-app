// Renders Xanadu Instagram posts (1080x1350) to PNG.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const F = (p) => 'file://' + path.resolve(__dirname, p);
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F('node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-300-normal.woff2', 300)}
${font('Manrope', 'manrope/files/manrope-latin-500-normal.woff2', 500)}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--ink:#F3ECDF;--muted:#C4CBD7;--gold:#D2B488;--gold-pale:#E6CDA6;
--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:var(--navy);color:var(--ink);font-family:Manrope;-webkit-font-smoothing:antialiased}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:0 110px}
.sky{position:absolute;inset:0;z-index:0;
 background:
  radial-gradient(60% 45% at 18% 12%, rgba(143,155,230,.22), transparent 70%),
  radial-gradient(55% 40% at 88% 30%, rgba(181,139,224,.18), transparent 70%),
  radial-gradient(70% 45% at 50% 105%, rgba(111,183,191,.16), transparent 70%),
  var(--navy)}
.stars{position:absolute;inset:0;z-index:0;background-image:
 radial-gradient(1.6px 1.6px at 12% 18%,rgba(255,255,255,.7),transparent),
 radial-gradient(1.2px 1.2px at 32% 8%,rgba(255,255,255,.55),transparent),
 radial-gradient(1.4px 1.4px at 71% 14%,rgba(255,255,255,.6),transparent),
 radial-gradient(1px 1px at 86% 41%,rgba(255,255,255,.5),transparent),
 radial-gradient(1.3px 1.3px at 9% 63%,rgba(255,255,255,.45),transparent),
 radial-gradient(1px 1px at 56% 27%,rgba(255,255,255,.5),transparent),
 radial-gradient(1.5px 1.5px at 93% 76%,rgba(255,255,255,.5),transparent),
 radial-gradient(1px 1px at 41% 88%,rgba(255,255,255,.4),transparent),
 radial-gradient(1.2px 1.2px at 22% 92%,rgba(255,255,255,.4),transparent),
 radial-gradient(1px 1px at 64% 58%,rgba(255,255,255,.35),transparent)}
.photo{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center}
.shade{position:absolute;inset:0;z-index:0;background:linear-gradient(180deg,rgba(16,27,44,.15) 0%,rgba(16,27,44,.35) 40%,rgba(16,27,44,.92) 78%,#101B2C 100%)}
.shade.strong{background:linear-gradient(180deg,rgba(16,27,44,.1) 0%,rgba(16,27,44,.5) 35%,rgba(16,27,44,.95) 62%,#101B2C 100%)}
.shade.soft{background:linear-gradient(180deg,rgba(16,27,44,0) 0%,rgba(16,27,44,0) 45%,rgba(16,27,44,.75) 75%,#101B2C 100%)}
.shade.top{background:linear-gradient(180deg,#101B2C 0%,rgba(16,27,44,.88) 30%,rgba(16,27,44,.25) 65%,rgba(16,27,44,.1) 100%)}
.shade.even{background:radial-gradient(75% 60% at 50% 50%,rgba(16,27,44,.62),rgba(16,27,44,.4) 70%,rgba(16,27,44,.55) 100%)}
.shade.brand{background:linear-gradient(180deg,rgba(16,27,44,.35) 0%,rgba(16,27,44,.18) 35%,rgba(16,27,44,.25) 60%,rgba(16,27,44,.7) 100%)}
.c{position:relative;z-index:1}
.bottom{justify-content:flex-end;padding-bottom:190px}
.topal{justify-content:flex-start;padding-top:170px}
.center{align-items:center;text-align:center}
.eyebrow{font-family:Manrope;font-weight:600;font-size:22px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin-bottom:38px}
h1{font-family:Cormorant;font-weight:500;font-size:104px;line-height:1.02;letter-spacing:-.01em;color:var(--ivory)}
h1.xl{font-size:128px}
h1.m{font-size:88px}
h1 em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
p.body{font-family:Manrope;font-weight:300;font-size:36px;line-height:1.5;color:var(--muted);margin-top:40px;max-width:820px}
.center p.body{margin-left:auto;margin-right:auto}
.rule{width:120px;height:2px;background:var(--iri);margin:46px 0 0}
.center .rule{margin:46px auto 0}
.tags{display:flex;flex-wrap:wrap;gap:18px;margin-top:52px}
.tag{font-family:Manrope;font-weight:500;font-size:30px;color:var(--ink);border:1.5px solid rgba(230,205,166,.45);border-radius:999px;padding:16px 34px}
.foot{position:absolute;left:110px;right:110px;bottom:72px;z-index:2;display:flex;justify-content:space-between;align-items:center;
 font-family:Manrope;font-weight:500;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:rgba(243,236,223,.7)}
.foot .n{letter-spacing:.15em}
.foot{text-shadow:0 1px 10px rgba(16,27,44,.85),0 0 2px rgba(16,27,44,.6)}
.num{font-family:Cormorant;font-style:italic;font-size:44px;color:var(--gold-pale);margin-bottom:22px}
.time{font-family:Manrope;font-weight:500;font-size:30px;letter-spacing:.24em;color:var(--gold-pale);margin-bottom:26px}
/* the full emblem: static mark + inner and outer orbits (all 900x518, stacked) */
.mark{position:relative;width:820px;aspect-ratio:900/518;margin:0 auto}
.mark img{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 18px rgba(16,27,44,.55))}
.mark.s{width:520px}
.wordmark{display:block;width:760px;margin:6px auto 0;filter:brightness(0) invert(1) drop-shadow(0 2px 14px rgba(16,27,44,.6));opacity:.96}
.star{font-family:Cormorant;font-size:220px;line-height:1;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:30px}
/* iridescent ring */
.ring{width:560px;height:560px;border-radius:50%;margin:0 auto 70px;background:conic-gradient(from 200deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A,#9DBB7A);
 -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 4px));
 position:relative;filter:drop-shadow(0 0 30px rgba(143,155,230,.45))}
.ringwrap{position:relative}
.ringwrap .inner img{filter:none}
.ringwrap .inner{position:absolute;left:50%;top:280px;transform:translate(-50%,-50%);width:500px}
/* split: photo on top, navy panel below */
.split .photo{bottom:auto;height:58%}
.split .fade{position:absolute;left:0;right:0;top:calc(58% - 160px);height:162px;z-index:0;background:linear-gradient(180deg,transparent,var(--navy))}
.split{justify-content:flex-end;padding-bottom:180px}

/* ivory theme (typographic posts, for grid contrast) */
.ivorybg{position:absolute;inset:0;z-index:0;background:radial-gradient(70% 50% at 85% 10%,rgba(181,139,224,.10),transparent 70%),radial-gradient(60% 45% at 10% 95%,rgba(111,183,191,.10),transparent 70%),#F6F1E8}
.iv h1{color:#101B2C}
.iv h1 em{background:linear-gradient(115deg,#4F7F3E 0%,#2F7F8A 22%,#4E5BC0 44%,#7F4FB8 64%,#B5528E 82%,#A87A35 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.iv .eyebrow{color:#A07A45}
.iv p.body{color:#4A5568}
.iv .foot{color:rgba(16,27,44,.55)}
.iv .rule{background:linear-gradient(90deg,#2F7F8A,#7F4FB8,#A87A35)}
.bignum{font-family:Manrope;font-weight:600;font-size:30px;letter-spacing:.3em;color:#A07A45;margin-bottom:34px}
/* quiz badge */
.badge{width:130px;height:130px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Cormorant;font-style:italic;font-size:84px;color:#F6F1E8;position:relative;margin-bottom:36px;background:rgba(16,27,44,.45)}
.badge:before{content:'';position:absolute;inset:0;border-radius:50%;padding:3px;background:var(--iri);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
/* week vs season */
.vs .lab{font-family:Manrope;font-weight:600;font-size:24px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin-bottom:22px}
.vs .a{font-family:Cormorant;font-size:84px;line-height:1.05;color:rgba(196,203,215,.62)}
.vs .b{font-family:Cormorant;font-size:112px;line-height:1.02;color:var(--ivory)}
.vs .b em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
.vs .mid{width:100%;height:2px;background:linear-gradient(90deg,transparent,rgba(210,180,136,.55),transparent);margin:80px 0}

/* quote / note posts */
.q{align-items:center;text-align:center;padding:0 130px}
.qm{font-family:Cormorant;font-style:italic;font-size:200px;line-height:.6;height:90px;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
.iv .qm{background:linear-gradient(115deg,#2F7F8A,#7F4FB8,#A87A35);-webkit-background-clip:text;background-clip:text}
.qt{font-family:Cormorant;font-weight:500;font-size:86px;line-height:1.12;color:var(--ivory);margin-top:30px}
.iv .qt{color:#101B2C}
.qt em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
.iv .qt em{background:linear-gradient(115deg,#4F7F3E 0%,#2F7F8A 22%,#4E5BC0 44%,#7F4FB8 64%,#B5528E 82%,#A87A35 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.qa{font-family:Manrope;font-weight:600;font-size:24px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin-top:60px}
.iv .qa{color:#A07A45}
.qrule{width:90px;height:2px;background:var(--iri);margin:56px auto 0}
.big{font-family:Cormorant;font-weight:500;font-size:230px;line-height:.95;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
.iv .big{background:linear-gradient(115deg,#2F7F8A,#4E5BC0,#7F4FB8,#A87A35);-webkit-background-clip:text;background-clip:text}
.qs{font-family:Manrope;font-weight:400;font-size:34px;line-height:1.55;color:#C4CBD7;margin-top:40px}
.iv .qs{color:#4A5568}
.src{font-family:Manrope;font-size:20px;letter-spacing:.06em;color:rgba(16,27,44,.45);margin-top:46px}
.mk{width:150px;margin:70px auto 0;opacity:.9}
`;

const MARK = (cls = '') => `<div class="mark ${cls}"><img src="${F('logo-orbit-outer-lit.png')}"><img src="${F('logo-orbit-inner-lit.png')}"><img src="${F('logo-static-lit.png')}"></div>`;

const bg = (s) => {
  if (s.ivory) return `<div class="ivorybg"></div>`;
  if (s.split) return `<div class="photo" style="background-image:url('${F(s.photo)}');${s.pos ? 'background-position:' + s.pos : ''}"></div><div class="fade"></div>`;
  return s.photo
    ? `<div class="photo" style="background-image:url('${F(s.photo)}');${s.pos ? 'background-position:' + s.pos : ''}"></div><div class="shade ${s.shade || ''}"></div>`
    : `<div class="sky"></div><div class="stars"></div>`;
};

const foot = (s, i, n) => s.nofoot ? '' :
  `<div class="foot"><span>Xanadu</span><span class="n">${n > 1 ? (i + 1) + ' / ' + n : '@dreamxanadu'}</span></div>`;

const html = (s, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}${THEME}</style></head><body>
<div class="slide ${s.split ? 'split' : ''} ${s.ivory ? 'iv' : ''} ${s.cls || ''}">${bg(s)}<div class="c">${s.html}</div>${foot(s, i, n)}</div></body></html>`;

const THEME = process.env.THEME ? fs.readFileSync(process.env.THEME, 'utf8') : '';
const POSTS = require(process.env.POSTS || './posts.js')({ MARK, F });

(async () => {
  const only = process.argv[2];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 }); // 2x supersample; publish.py downsamples to 1080x1350
  for (const [id, slides] of Object.entries(POSTS)) {
    if (only && !id.startsWith(only)) continue;
    const dir = path.join(process.env.OUT || path.join(__dirname, 'out'), id);
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < slides.length; i++) {
      const tmp = path.join(__dirname, '_slide.html'); fs.writeFileSync(tmp, html(slides[i], i, slides.length)); await page.goto('file://' + tmp, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(dir, `${id}-${String(i + 1).padStart(2, '0')}.png`) });
    }
    console.log('rendered', id, slides.length);
  }
  await browser.close();
})();
