// End-text overlay for reel 28 ("Your Xanadu waits for you."), drawn over Xan's last clip.
// Renders transparent 1080x1920 PNG frames at 30 fps for the clip window, composited with ffmpeg.
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const IG = '/home/claude/ig';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;
const DUR = +process.argv[2] || 4.03, FPS = 30, OUT = __dirname + '/ov';
fs.mkdirSync(OUT, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
:root{--navy:#101B2C;--ivory:#F6F1E8;--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent}
body{width:1080px;height:1920px;overflow:hidden;-webkit-font-smoothing:antialiased;position:relative}
.shade{position:absolute;left:0;right:0;top:0;height:1100px;background:linear-gradient(180deg,rgba(16,27,44,.62) 0%,rgba(16,27,44,.42) 45%,rgba(16,27,44,0) 100%)}
.txt{position:absolute;left:0;right:0;top:470px;text-align:center}
.line{font-family:Cormorant;font-weight:500;color:var(--ivory);font-size:132px;line-height:1.04;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(16,27,44,.75)}
.line em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 20px rgba(16,27,44,.7));padding:0 .06em}
</style></head><body><div class="shade"></div><div class="txt">
<div class="line">Your <em>Xanadu</em></div><div class="line">waits for you.</div></div>
<script>
const clamp=x=>Math.max(0,Math.min(1,x)),eo=x=>1-Math.pow(1-clamp(x),3);
window.draw=t=>{
  document.querySelector('.shade').style.opacity=eo((t-.1)/.8);
  [...document.querySelectorAll('.line')].forEach((ln,j)=>{const x=(t-.4-j*.45)/.6;const p=eo(x);
    ln.style.opacity=clamp(x*1.6);ln.style.transform='translateY('+(40*(1-p))+'px)';ln.style.filter='blur('+(12*(1-p))+'px)'});
};
</script></body></html>`;
(async () => {
  fs.writeFileSync(__dirname + '/ov.html', html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(F(__dirname + '/ov.html'));
  await page.evaluate(() => document.fonts.ready);
  const n = Math.ceil(DUR * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => draw(t), i / FPS);
    await page.screenshot({ path: `${OUT}/${String(i).padStart(4, '0')}.png`, omitBackground: true });
  }
  await b.close();
  console.log('frames', n);
})();
