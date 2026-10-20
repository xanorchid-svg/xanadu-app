// Xanadu Reel 5 (v2) "You've done a retreat. You've BARELY done a season." — fast, text-only, on brand.
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const IG = '/home/claude/ig';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const DURATION = 14.5;
// scenes: [start, end, img, chip, lines[[delay, html, cls]]]
const SCENES = [
  [0.00, 2.60, 'img/jump.png', null, [[-0.4, "You've done a retreat.", 'm'], [1.05, "You've <b>BARELY</b> done", 'm'], [1.25, '<em>a season.</em>', 'xl']]],
  [2.60, 4.80, 'img/sleep.png', 'Week 1', [[0.15, 'You sleep.', 'xl'], [0.55, '<em>Properly.</em>', 'xl']]],
  [4.80, 7.00, 'img/phone.png', 'Week 2', [[0.15, 'Your phone', 'xl'], [0.55, '<em>forgets you.</em>', 'xl']]],
  [7.00, 9.20, 'img/surfcoach.png', 'Week 3', [[0.15, 'The surf coach', 'l'], [0.55, '<em>knows your name.</em>', 'l']]],
  [9.20, 11.40, 'img/dinner.png', 'Week 4', [[0.15, "You're", 'xl'], [0.45, '<em>not leaving.</em>', 'xl']]],
];
const END = 11.40;

const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
${font('Manrope', 'manrope/files/manrope-latin-500-normal.woff2', 500)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--gold:#D2B488;
--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:var(--navy);-webkit-font-smoothing:antialiased}
.layer{position:absolute;inset:0;overflow:hidden}
.sc img.bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}
.veil{position:absolute;inset:0;background:
  radial-gradient(100% 38% at 50% 40%,rgba(16,27,44,.66),rgba(16,27,44,.25) 70%,rgba(16,27,44,.05)),
  linear-gradient(180deg,rgba(16,27,44,.35),transparent 20%,transparent 70%,rgba(16,27,44,.55))}
.txt{position:absolute;left:50px;right:50px;top:520px;display:flex;flex-direction:column;align-items:center;text-align:center}
.chip{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.3em;text-transform:uppercase;color:var(--ivory);
  padding:16px 34px 16px 44px;border-radius:999px;background:rgba(16,27,44,.55);position:relative;margin-bottom:40px}
.chip:before{content:'';position:absolute;inset:0;border-radius:999px;padding:3px;background:var(--iri);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.dots{display:flex;gap:16px;margin-bottom:34px}
.dot{width:16px;height:16px;border-radius:50%;border:2px solid rgba(246,241,232,.7)}
.dot.on{background:var(--iri);border-color:transparent}
.line{font-family:Cormorant;font-weight:500;color:var(--ivory);line-height:1.02;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(16,27,44,.7)}
.line.xl{font-size:150px}.line.l{font-size:118px}.line.m{font-size:112px}
.w{display:inline-block;will-change:transform,opacity}
.line em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 20px rgba(16,27,44,.65))}
.line b{font-family:Manrope;font-weight:600;font-size:.62em;letter-spacing:.12em;vertical-align:.18em;color:var(--navy);background:var(--iri);padding:2px 18px 4px;border-radius:10px;margin:0 4px}
.flash{position:absolute;inset:0;background:#F6F1E8;opacity:0;pointer-events:none}
.sky{background:radial-gradient(60% 35% at 20% 18%,rgba(143,155,230,.3),transparent 70%),radial-gradient(55% 30% at 85% 38%,rgba(181,139,224,.24),transparent 70%),radial-gradient(70% 35% at 50% 100%,rgba(111,183,191,.2),transparent 70%),var(--navy)}
.mark{position:relative;width:600px;aspect-ratio:900/518}
.mark img{position:absolute;inset:0;width:100%;height:100%}
.cta{font-family:Manrope;font-weight:600;font-size:36px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-top:60px}
.rule{width:160px;height:3px;background:var(--iri);margin-top:50px}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div id="root"></div><div class="flash" id="flash"></div>
<script>
const SCENES=${JSON.stringify(SCENES)}, END=${END}, IG=${JSON.stringify(IG)};
const base=location.pathname.replace(/[^/]*$/,'');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eo=(x)=>1-Math.pow(1-clamp(x),3);
const back=(x)=>{x=clamp(x);const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const words=(h)=>{const out=[];h.replace(new RegExp('<em>(.*?)</'+'em>|<b>(.*?)</'+'b>|([^<]+)','g'),(m,e,b,p)=>{
  if(b){out.push('<span class="w"><b>'+b+'</b></span>');return m}
  (e||p).trim().split(new RegExp('\\\\s+')).forEach(w=>{if(w)out.push('<span class="w">'+(e?'<em>'+w+'</em>':w)+'</span>')});return m});return out.join(' ')};
const root=document.getElementById('root');
SCENES.forEach((s,i)=>{const d=document.createElement('div');d.className='layer sc';d.id='s'+i;
  let h='<img class="bg" src="file://'+base+s[2]+'"><div class="veil"></div><div class="txt">';
  if(s[3]){h+='<div class="chip">'+s[3]+'</div><div class="dots">'+[1,2,3,4].map(k=>'<div class="dot'+(k<=i?' on':'')+'"></div>').join('')+'</div>'}
  h+=s[4].map(l=>'<div class="line '+l[2]+'">'+words(l[1])+'</div>').join('')+'</div>';d.innerHTML=h;root.appendChild(d)});
const e=document.createElement('div');e.className='layer sky';e.id='end';
e.innerHTML='<div class="txt" style="top:480px"><div class="mark"><img class="o" src="file://'+IG+'/logo-orbit-outer-lit.png"><img class="i" src="file://'+IG+'/logo-orbit-inner-lit.png"><img class="m" src="file://'+IG+'/logo-static-lit.png"></div>'
 +'<div class="line l" style="margin-top:40px">'+words('Stays you design.')+'</div><div class="line l">'+words("<em>Places we've met ✦</em>")+'</div><div class="rule"></div><div class="cta">Join the waitlist · link in bio</div></div>';
root.appendChild(e);
window.render=function(t){
  let flash=0;
  SCENES.forEach((s,i)=>{const el=document.getElementById('s'+i);const on=t>=s[0]&&t<s[1];el.style.display=on?'block':'none';if(!on)return;
    const u=t-s[0];if(i>0)flash=Math.max(flash,.38*(1-clamp(u/.12)));
    el.querySelector('img.bg').style.transform='scale('+(1.18-.12*eo(u/.35)+.05*(u/(s[1]-s[0])))+')';
    const chip=el.querySelector('.chip');if(chip){const p=back(u/.35);chip.style.transform='scale('+(.6+.4*p)+')';chip.style.opacity=clamp(u/.15);
      el.querySelectorAll('.dot').forEach((d,k)=>{d.style.transform=k===i-1?'scale('+(1+.5*(1-eo((u-.2)/.4)))+')':'none'})}
    [...el.querySelectorAll('.line')].forEach((ln,j)=>{const d0=s[4][j][0];[...ln.querySelectorAll('.w')].forEach((w,k)=>{const x=(u-d0-k*.07)/.32;const p=back(x);
      w.style.opacity=clamp(x*3);w.style.transform='translateY('+(40*(1-eo(x)))+'px) scale('+(.7+.3*p)+')'})})});
  const en=document.getElementById('end');const eon=t>=END;en.style.display=eon?'block':'none';
  if(eon){const u=t-END;flash=Math.max(flash,.38*(1-clamp(u/.12)));const m=en.querySelector('.mark');
    const po=back(u/.6);m.querySelector('.o').style.transform='rotate('+(-120*(1-eo(u/.8))+u*5)+'deg) scale('+(.5+.5*po)+')';
    m.querySelector('.i').style.transform='rotate('+(90*(1-eo(u/.8))-u*7)+'deg) scale('+(.5+.5*po)+')';
    m.querySelector('.m').style.transform='scale('+(.4+.6*back((u-.15)/.5))+')';m.style.opacity=clamp(u/.25);
    const lines=[...en.querySelectorAll('.line')];lines.forEach((ln,j)=>[...ln.querySelectorAll('.w')].forEach((w,k)=>{const x=(u-.5-j*.45-k*.07)/.32;w.style.opacity=clamp(x*3);w.style.transform='translateY('+(40*(1-eo(x)))+'px) scale('+(.7+.3*back(x))+')'}));
    const r=en.querySelector('.rule'),c=en.querySelector('.cta');const pr=eo((u-1.5)/.5);r.style.opacity=pr;r.style.transform='scaleX('+pr+')';c.style.opacity=eo((u-1.7)/.5);c.style.transform='translateY('+(20*(1-eo((u-1.7)/.5)))+'px)'}
  document.getElementById('flash').style.opacity=flash;
};
</script></body></html>`;

(async () => {
  const fps = +(process.argv[2] || 30);
  const only = process.argv.slice(3).map(Number);
  fs.writeFileSync(path.join(__dirname, 'reel5b.html'), html);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(__dirname, 'reel5b.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (only.length) {
    for (const s of only) { await page.evaluate((t) => window.render(t), s); await page.screenshot({ path: path.join(__dirname, `r5b_${s}.jpg`), type: 'jpeg', quality: 85 }); }
  } else {
    fs.mkdirSync(path.join(__dirname, 'frames5b'), { recursive: true });
    const n = Math.round(DURATION * fps);
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => window.render(t), f / fps);
      await page.screenshot({ path: path.join(__dirname, 'frames5b', `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
  }
  await browser.close();
})();
