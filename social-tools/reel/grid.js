// Renders an Instagram-profile style preview of the planned grid (newest first).
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const C = '/home/claude/xanadu-app/console/public/social';
const IG = '/home/claude/ig';
// newest first: [folder, isReel, date]
const ORDER = [
  ['07-reviewed', 0, 'Dec 21'],
  ['25-your-sign', 1, 'Dec 16'],
  ['21-not-in-a-hurry', 0, 'Dec 14'],
  ['15-grows-together', 1, 'Dec 11'],
  ['12-signs', 0, 'Dec 9'],
  ['11-which-stay', 0, 'Dec 7'],
  ['24-cost-nothing', 1, 'Dec 4'],
  ['06-a-day', 0, 'Dec 2'],
  ['19-deliberately', 0, 'Nov 30'],
  ['23-day-1-vs-day-30', 1, 'Nov 27'],
  ['13-week-vs-season', 0, 'Nov 25'],
  ['26-do-both', 0, 'Nov 23'],
  ['18-morning-light', 0, 'Nov 20'],
  ['08-who', 0, 'Nov 18'],
  ['14-three-ways-in', 1, 'Nov 16'],
  ['03-why-join', 0, 'Nov 13'],
  ['17-rest-is-rhythm', 0, 'Nov 11'],
  ['10-just-one-week', 1, 'Nov 9'],
  ['20-two-hours', 0, 'Nov 6'],
  ['05-a-season', 1, 'Nov 4'],
  ['16-pace-of-nature', 0, 'Nov 2'],
  ['04-some-places', 1, 'Oct 30'],
  ['09-circle', 0, 'Oct 28'],
  ['02-what-is-xanadu', 0, 'Oct 26'],
  ['22-unpopular-opinion', 1, 'Oct 23'],
  ['01-begins', 0, 'Oct 21'],
];
const tiles = ORDER.map(([f, reel, d]) => `<div class="t"><img src="file://${C}/${f}/01.jpg">${reel ? '<span class="ri">▶</span>' : (fs.readdirSync(`${C}/${f}`).filter(x => x.endsWith('.jpg')).length > 1 ? '<span class="ri">❐</span>' : '')}<span class="d">${d}</span></div>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(file://${IG}/node_modules/@fontsource/manrope/files/manrope-latin-500-normal.woff2)}
@font-face{font-family:Manrope;font-weight:700;src:url(file://${IG}/node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff2)}
*{margin:0;padding:0;box-sizing:border-box}body{width:430px;background:#fff;font-family:Manrope,system-ui;color:#111}
.top{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 6px;font-weight:700;font-size:20px}
.hd{display:flex;align-items:center;gap:22px;padding:8px 16px}
.av{width:86px;height:86px;border-radius:50%;background:#101B2C;display:flex;align-items:center;justify-content:center;outline:2px solid #ddd;outline-offset:3px}
.av img{width:74px}
.st{display:flex;gap:22px;text-align:center;font-size:13px}.st b{display:block;font-size:17px}
.bio{padding:8px 16px 4px;font-size:13.5px;line-height:1.45}.bio b{font-weight:700}
.btns{display:flex;gap:6px;padding:10px 16px}.btns div{flex:1;background:#efefef;border-radius:8px;text-align:center;padding:7px;font-size:13px;font-weight:700}
.hl{display:flex;gap:16px;padding:8px 16px 12px}.h{text-align:center;font-size:11.5px}.h div{width:62px;height:62px;border-radius:50%;background:#101B2C;border:2px solid #ddd;margin-bottom:5px;display:flex;align-items:center;justify-content:center;color:#E6CDA6;font-size:20px}
.tabs{display:flex;border-top:1px solid #eee}.tabs div{flex:1;text-align:center;padding:10px;font-size:15px;color:#999}.tabs div:first-child{color:#111;border-bottom:1.5px solid #111}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}
.t{position:relative;aspect-ratio:3/4;overflow:hidden;background:#101B2C}.t img{width:100%;height:100%;object-fit:cover}
.ri{position:absolute;top:6px;right:8px;color:#fff;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.d{position:absolute;left:6px;bottom:5px;color:#fff;font-size:10.5px;font-weight:700;background:rgba(16,27,44,.55);padding:1px 6px;border-radius:6px}
</style></head><body>
<div class="top"><span>dreamxanadu</span><span>☰</span></div>
<div class="hd"><div class="av"><img src="file://${IG}/logo-static-lit.png"></div>
<div class="st"><div><b>26</b>posts</div><div><b>—</b>followers</div><div><b>—</b>following</div></div></div>
<div class="bio"><b>Xanadu · Retreats &amp; Guides</b><br>A network for awakening places ✦<br>Founding circle forming in Nosara, Costa Rica<br>Spaces &amp; guides: apply · Seekers: join the waitlist</div>
<div class="btns"><div>Follow</div><div>Message</div></div>
<div class="hl"><div class="h"><div>✦</div>About</div><div class="h"><div>✎</div>Apply</div><div class="h"><div>☼</div>Nosara</div><div class="h"><div>⌂</div>Building it</div></div>
<div class="tabs"><div>▦</div><div>▶</div><div>☺</div></div>
<div class="g">${tiles}</div></body></html>`;
(async () => {
  fs.writeFileSync(path.join(__dirname, 'grid.html'), html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2.5 });
  await p.goto('file://' + path.join(__dirname, 'grid.html'), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: '/tmp/claude-0/-home-claude/4a73604e-e7e3-512d-a470-293214d99b5b/scratchpad/xanadu-profile-grid.png', fullPage: true });
  await b.close();
})();
