// Xanadu reel "Three ways in" — triangle motion graphic: Seekers · Containers · Facilitators, Xanadu at the center.
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const IG = '/home/claude/ig';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const DURATION = 23.0;
// vertices (1080x1920 frame)
const V = { S: [540, 300], C: [170, 960], F: [910, 960] };
const CEN = [540, 740];
// role panels: [start, end, key, label, headline, lookingFor]
const ROLES = [
  [2.6, 7.2, 'S', 'Seekers', 'You come<br><em>to stay.</em>', 'Travelers, remote workers, students of practice.', 'A place and people that fit<br>how they want to live.'],
  [7.2, 11.8, 'C', 'Containers', 'The places that<br><em>hold the stay.</em>', 'Retreat centers, eco-lodges, studios, land.', 'Guests and guides aligned<br>with what they hold.'],
  [11.8, 16.4, 'F', 'Facilitators', 'The guides who<br><em>hold the room.</em>', 'Teachers, breathworkers,<br>sound and movement guides.', 'The right room, and the right people in it.'],
];
const TOGETHER = [16.4, 19.6];
const END = 19.6;

const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-400-normal.woff2', 400)}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--gold:#D2B488;--muted:#C4CBD7;
--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:var(--navy);-webkit-font-smoothing:antialiased}
.sky{position:absolute;inset:0;background:radial-gradient(60% 30% at 20% 12%,rgba(143,155,230,.26),transparent 70%),radial-gradient(55% 28% at 85% 40%,rgba(181,139,224,.2),transparent 70%),radial-gradient(70% 30% at 50% 100%,rgba(111,183,191,.2),transparent 70%),var(--navy)}
.star{position:absolute;border-radius:50%;background:#fff}
svg{position:absolute;inset:0}
.mark{position:absolute;width:460px;aspect-ratio:900/518;left:${CEN[0] - 230}px;top:${CEN[1] - 132}px}
.mark img{position:absolute;inset:0;width:100%;height:100%}
.vlab{position:absolute;transform:translate(-50%,0);font-family:Manrope;font-weight:600;font-size:30px;letter-spacing:.34em;padding-left:.34em;text-transform:uppercase;color:var(--ivory);white-space:nowrap;text-shadow:0 2px 16px rgba(16,27,44,.9)}
.panel{position:absolute;left:70px;right:70px;top:1110px;text-align:center}
.head{font-family:Cormorant;font-weight:500;font-size:112px;line-height:1.02;color:var(--ivory)}
.head em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent}
.lf{font-family:Manrope;font-weight:600;font-size:24px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin-top:44px}
.lfa{font-family:Cormorant;font-style:italic;font-size:62px;line-height:1.12;color:var(--ivory);margin-top:14px}
.look{font-family:Manrope;font-weight:400;font-size:36px;line-height:1.5;color:var(--muted);margin:38px auto 0;max-width:860px}
.eyebrow{font-family:Manrope;font-weight:600;font-size:28px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin-bottom:30px}
.hook{position:absolute;left:60px;right:60px;top:1180px;text-align:center}
.cta{font-family:Manrope;font-weight:600;font-size:30px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);line-height:1.9;margin-top:46px}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div class="sky" id="sky"></div>
<svg width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="iri" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9DBB7A"/><stop offset=".2" stop-color="#6FB7BF"/><stop offset=".4" stop-color="#8F9BE6"/>
      <stop offset=".6" stop-color="#B58BE0"/><stop offset=".8" stop-color="#E09AC4"/><stop offset="1" stop-color="#E8BF8A"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <path id="tri" d="M${V.S} L${V.F} L${V.C} Z" fill="none" stroke="url(#iri)" stroke-width="3" stroke-linejoin="round"/>
  <g id="spokes" stroke="url(#iri)" stroke-width="2" opacity="0">
    <line x1="${V.S[0]}" y1="${V.S[1]}" x2="${CEN[0]}" y2="${CEN[1]}"/>
    <line x1="${V.C[0]}" y1="${V.C[1]}" x2="${CEN[0]}" y2="${CEN[1]}"/>
    <line x1="${V.F[0]}" y1="${V.F[1]}" x2="${CEN[0]}" y2="${CEN[1]}"/>
  </g>
  <g id="parts"></g>
  <g id="nodes">
    <circle id="nS" cx="${V.S[0]}" cy="${V.S[1]}" r="18" fill="#101B2C" stroke="url(#iri)" stroke-width="4"/>
    <circle id="nC" cx="${V.C[0]}" cy="${V.C[1]}" r="18" fill="#101B2C" stroke="url(#iri)" stroke-width="4"/>
    <circle id="nF" cx="${V.F[0]}" cy="${V.F[1]}" r="18" fill="#101B2C" stroke="url(#iri)" stroke-width="4"/>
  </g>
</svg>
<div class="mark" id="mark"><img class="o" src="file://${IG}/logo-orbit-outer-lit.png"><img class="i" src="file://${IG}/logo-orbit-inner-lit.png"><img class="m" src="file://${IG}/logo-static-lit.png"></div>
<div class="vlab" id="lS" style="left:${V.S[0]}px;top:${V.S[1] - 86}px">Seekers</div>
<div class="vlab" id="lC" style="left:${V.C[0] + 40}px;top:${V.C[1] + 44}px">Containers</div>
<div class="vlab" id="lF" style="left:${V.F[0] - 40}px;top:${V.F[1] + 44}px">Facilitators</div>
<div class="hook" id="hook"><div class="head">Three ways<br><em>into Xanadu.</em></div></div>
<div id="panels"></div>
<div class="panel" id="together"><div class="head">Xanadu brings<br><em>them together.</em></div><div class="look">Every place and guide, personally reviewed ✦</div></div>
<div class="panel" id="end" style="top:1120px"><div class="head">Which one<br><em>are you?</em></div><div class="cta">Seekers · join the waitlist<br>Spaces &amp; guides · apply<br>link in bio</div></div>
<script>
const V=${JSON.stringify(V)}, CEN=${JSON.stringify(CEN)}, ROLES=${JSON.stringify(ROLES)}, TOGETHER=${JSON.stringify(TOGETHER)}, END=${END};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eo=(x)=>1-Math.pow(1-clamp(x),3);
const sky=document.getElementById('sky');let seed=11;const r=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
for(let k=0;k<80;k++){const d=document.createElement('div');d.className='star';const z=.6+r()*2;d.style.cssText='left:'+r()*100+'%;top:'+r()*100+'%;width:'+z+'px;height:'+z+'px';d.dataset.p=r()*6.28;sky.appendChild(d)}
const panels=document.getElementById('panels');
ROLES.forEach((ro,i)=>{const d=document.createElement('div');d.className='panel';d.id='p'+i;d.innerHTML='<div class="eyebrow">'+ro[3]+'</div><div class="head">'+ro[4]+'</div><div class="look" style="margin-top:26px">'+ro[5]+'</div><div class="lf">Looking for</div><div class="lfa">'+ro[6]+'</div>';panels.appendChild(d)});
const tri=document.getElementById('tri');const L=tri.getTotalLength();tri.style.strokeDasharray=L;
// particles that travel from each vertex to the center during "together"
const parts=document.getElementById('parts');const P=[];
['S','C','F'].forEach(k=>{for(let j=0;j<5;j++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',5);c.setAttribute('fill','#F6F1E8');parts.appendChild(c);P.push([k,j/5,c])}});
function fade(el,t0,t1,t,dur=.45){const i=eo((t-t0)/dur),o=1-eo((t-(t1-.3))/.3);const v=clamp(Math.min(i,o));el.style.opacity=v;el.style.transform='translateY('+(36*(1-i))+'px)';el.style.filter='blur('+(10*(1-i))+'px)';el.style.display=v>0?'block':'none'}
window.render=function(t){
  document.querySelectorAll('.star').forEach(s=>s.style.opacity=.25+.45*(.5+.5*Math.sin(t*1.6+ +s.dataset.p)));
  // triangle draws in 0–1.8s
  tri.style.strokeDashoffset=L*(1-eo(t/1.8));
  // nodes + labels
  const active=ROLES.find(ro=>t>=ro[0]&&t<ro[1]);const all=t>=TOGETHER[0];
  ['S','C','F'].forEach((k,i)=>{const n=document.getElementById('n'+k),l=document.getElementById('l'+k);
    const appear=eo((t-.5-i*.35)/.5);const on=all||(active&&active[2]===k);const dim=(!all&&active&&!on)?.35:1;
    const pulse=on?1+.18*Math.max(0,Math.sin((t-(active?active[0]:TOGETHER[0]))*5)):1;
    n.setAttribute('r',18*appear*pulse);n.style.opacity=appear*dim;n.style.filter=on?'url(#glow)':'none';
    l.style.opacity=appear*dim;l.style.color=on?'#E6CDA6':'#F6F1E8'});
  // center emblem
  const m=document.getElementById('mark');const pm=eo((t-.9)/.8);m.style.opacity=pm*(all?1:.85);
  const g=all?1+.06*eo((t-TOGETHER[0])/.6):1;m.style.transform='scale('+((.6+.4*pm)*g)+')';
  m.querySelector('.o').style.transform='rotate('+(t*4)+'deg)';m.querySelector('.i').style.transform='rotate('+(-t*6)+'deg)';
  // spokes + particles in the "together" beat
  const sp=document.getElementById('spokes');sp.style.opacity=all?.55*eo((t-TOGETHER[0])/.5):0;
  P.forEach(([k,ph,c])=>{if(!all){c.setAttribute('opacity',0);return}const u=((t-TOGETHER[0])*.6+ph)%1;const a=V[k];
    c.setAttribute('cx',a[0]+(CEN[0]-a[0])*u);c.setAttribute('cy',a[1]+(CEN[1]-a[1])*u);c.setAttribute('opacity',(1-u)*eo((t-TOGETHER[0])/.4))});
  // text
  fade(document.getElementById('hook'),-1,2.6,t);
  ROLES.forEach((ro,i)=>{const el=document.getElementById('p'+i);fade(el,ro[0],ro[1],t);const lf=el.querySelectorAll('.lf,.lfa');const q=eo((t-ro[0]-1.2)/.5);lf.forEach(x=>{x.style.opacity=q;x.style.transform='translateY('+(24*(1-q))+'px)'})});
  fade(document.getElementById('together'),TOGETHER[0],TOGETHER[1],t);
  fade(document.getElementById('end'),END,99,t);
};
</script></body></html>`;

(async () => {
  const fps = +(process.argv[2] || 30);
  const only = process.argv.slice(3).map(Number);
  fs.writeFileSync(path.join(__dirname, 'reel14.html'), html);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(__dirname, 'reel14.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (only.length) {
    for (const s of only) { await page.evaluate((t) => window.render(t), s); await page.screenshot({ path: path.join(__dirname, `r14_${s}.jpg`), type: 'jpeg', quality: 85 }); }
  } else {
    fs.mkdirSync(path.join(__dirname, 'frames14'), { recursive: true });
    const n = Math.round(DURATION * fps);
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => window.render(t), f / fps);
      await page.screenshot({ path: path.join(__dirname, 'frames14', `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    }
  }
  await browser.close();
})();
