// "btw, it's cool to do both" carousel, 1080x1350, Xanadu version of the split-screen trend.
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const IG = '/home/claude/ig';
const FR = path.join(__dirname, 'fr');
const OUT = '/home/claude/xanadu-app/console/public/social/26-do-both';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;
const PAIRS = [
  [['4956_4', '50% 50%', 'work hard'], ['1214_4', '50% 50%', 'log off at sunset']],
  [['1220_7', '45% 50%', 'surf at sunrise'], ['1197_4', '50% 50%', 'do absolutely nothing']],
  [['1224_4', '50% 50%', 'meet everyone'], ['43785_4', '50% 50%', 'spend a day alone']],
  [['1166_7', '100% 50%', 'move your body'], ['32633_1', '40% 50%', 'rest without guilt']],
  [['43270_4', '50% 40%', 'plan every detail'], ['51505_4', '50% 50%', 'let the place change the plan']],
];
const css = `${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#101B2C;-webkit-font-smoothing:antialiased;position:relative}
.half{position:absolute;top:0;bottom:0;width:540px;overflow:hidden}.half img{width:100%;height:100%;object-fit:cover}
.l{left:0}.r{right:0}
.half::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(16,27,44,0) 55%,rgba(16,27,44,.55))}
.cap{position:absolute;left:30px;right:30px;bottom:96px;text-align:center;font-family:Cormorant;font-style:italic;font-weight:500;font-size:62px;line-height:1.02;color:#F6F1E8;z-index:2;text-shadow:0 3px 22px rgba(16,27,44,.7)}
.seam{position:absolute;left:539px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A);z-index:3}
.amp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:76px;height:76px;border-radius:50%;background:#101B2C;border:2px solid #D2B488;color:#E6CDA6;font-family:Cormorant;font-style:italic;font-size:46px;display:flex;align-items:center;justify-content:center;z-index:4;padding-bottom:6px}
.tag{position:absolute;top:44px;left:0;right:0;text-align:center;font-family:Manrope;font-weight:600;font-size:22px;letter-spacing:.38em;padding-left:.38em;color:#E6CDA6;z-index:4;text-shadow:0 2px 14px rgba(16,27,44,.8)}
.cover img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.cover::after{content:'';position:absolute;inset:0;background:radial-gradient(90% 40% at 50% 36%,rgba(16,27,44,.5),rgba(16,27,44,0) 75%),linear-gradient(180deg,rgba(16,27,44,.2),rgba(16,27,44,0) 30%,rgba(16,27,44,0) 70%,rgba(16,27,44,.4))}
.ct{position:absolute;left:60px;right:60px;top:300px;text-align:center;z-index:2;color:#F6F1E8}
.btw{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.32em;padding-left:.32em;color:#E6CDA6;text-shadow:0 2px 16px rgba(16,27,44,.8)}
.big{font-family:Cormorant;font-weight:500;font-size:118px;line-height:1;margin-top:26px;text-shadow:0 4px 30px rgba(16,27,44,.6)}
em{font-style:italic;background:linear-gradient(115deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 4px 20px rgba(16,27,44,.6))}
.swipe{position:absolute;bottom:60px;left:0;right:0;text-align:center;font-family:Manrope;font-weight:600;font-size:24px;letter-spacing:.3em;padding-left:.3em;color:#F6F1E8;opacity:.85;z-index:2;text-shadow:0 2px 12px rgba(16,27,44,.8)}
.ivc{position:absolute;inset:0;background:#F6F1E8;color:#101B2C;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}.btw2{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.32em;padding-left:.32em;color:#B8955F}.big2{font-family:Cormorant;font-weight:500;font-size:150px;line-height:1;margin-top:34px}em.d{background:linear-gradient(115deg,#6E9550,#3F8E97,#6470C8,#9065C0,#C46A9F,#C79A5E);-webkit-background-clip:text;filter:none}.sw2{margin-top:90px;font-family:Manrope;font-weight:600;font-size:24px;letter-spacing:.3em;padding-left:.3em;opacity:.5}
.end{background:radial-gradient(60% 35% at 20% 18%,rgba(143,155,230,.28),transparent 70%),radial-gradient(70% 35% at 60% 95%,rgba(111,183,191,.2),transparent 70%),#101B2C;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#F6F1E8;height:100%}
.mark{position:relative;width:420px;aspect-ratio:900/518}.mark img{position:absolute;inset:0;width:100%;height:100%}
.e1{font-family:Cormorant;font-weight:500;font-size:84px;line-height:1.05;margin-top:40px}
.rule{width:140px;height:2px;margin:46px 0 34px;background:linear-gradient(115deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A)}
.cta{font-family:Manrope;font-weight:600;font-size:28px;letter-spacing:.28em;padding-left:.28em;text-transform:uppercase;color:#D2B488}`;
const slides = [];
slides.push(`<div class="ivc"><div class="btw2">btw,</div><div class="big2">it’s cool<br>to do <em class="d">both.</em></div><div class="sw2">swipe →</div></div>`);
PAIRS.forEach(([a, b], i) => slides.push(
  `<div class="half l"><img src="${F(FR + '/' + a[0] + '.jpg')}" style="object-position:${a[1]}"><div class="cap">${a[2]}</div></div>`
  + `<div class="half r"><img src="${F(FR + '/' + b[0] + '.jpg')}" style="object-position:${b[1]}"><div class="cap">${b[2]}</div></div>`
  + `<div class="seam"></div><div class="amp">&amp;</div>`));
slides.push(`<div class="end"><div class="mark"><img src="${F(IG + '/logo-orbit-outer-lit.png')}"><img src="${F(IG + '/logo-orbit-inner-lit.png')}"><img src="${F(IG + '/logo-static-lit.png')}"></div>
<div class="e1">A week, a month,<br>a season.</div><div class="e1"><em>Or all three.</em></div><div class="rule"></div><div class="cta">Join the waitlist · link in bio</div></div>`);
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (let i = 0; i < slides.length; i++) {
    const f = path.join(__dirname, 's.html');
    fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${slides[i]}</body></html>`);
    await p.goto(F(f), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(OUT, String(i + 1).padStart(2, '0') + '.jpg'), type: 'jpeg', quality: 90 });
  }
  await b.close();
  console.log(slides.length, 'slides');
})();
