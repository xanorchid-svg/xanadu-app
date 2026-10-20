// Text covers (1080x1920, content kept inside the 3:4 grid crop) for video reels.
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const path = require('path');
const IG = '/home/claude/ig';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;
const COVERS = {
  '22-unpopular-opinion': { theme: 'iv', chip: 'Unpopular opinion', l1: 'You can’t really rest', l2: '<em>in 7 days.</em>' },
  '24-cost-nothing': { theme: 'nv', chip: 'On a season-long stay', l1: 'Things that cost', l2: '<em>nothing.</em>' },
};
const css = `${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;-webkit-font-smoothing:antialiased}
.iv{background:#F6F1E8;color:#101B2C}.nv{background:radial-gradient(60% 35% at 20% 30%,rgba(143,155,230,.25),transparent 70%),radial-gradient(70% 35% at 70% 75%,rgba(111,183,191,.18),transparent 70%),#101B2C;color:#F6F1E8}
.chip{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.42em;padding-left:.42em;text-transform:uppercase;color:#B8955F}
.nv .chip{color:#E6CDA6}
.rule{width:120px;height:2px;margin:30px 0 46px;background:linear-gradient(115deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A)}
.l1{font-family:Cormorant;font-weight:500;font-size:104px;line-height:1.05}
.l2{font-family:Cormorant;font-weight:500;font-size:170px;line-height:1.05}
em{font-style:italic;background:linear-gradient(115deg,#6E9550,#3F8E97,#6470C8,#9065C0,#C46A9F,#C79A5E);-webkit-background-clip:text;color:transparent}
.nv em{background:linear-gradient(115deg,#9DBB7A,#6FB7BF,#8F9BE6,#B58BE0,#E09AC4,#E8BF8A);-webkit-background-clip:text}
.play{margin-top:70px;font-family:Manrope;font-weight:600;font-size:28px;letter-spacing:.3em;text-transform:uppercase;opacity:.55}`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [id, c] of Object.entries(COVERS)) {
    require('fs').writeFileSync(path.join(__dirname,'cover.html'),`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body class="${c.theme}"><div class="chip">${c.chip}</div><div class="rule"></div><div class="l1">${c.l1}</div><div class="l2">${c.l2}</div><div class="play">▶ Watch</div></body></html>`);
    await p.goto('file://'+path.join(__dirname,'cover.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(__dirname, 'build', id, 'cover.jpg'), type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
