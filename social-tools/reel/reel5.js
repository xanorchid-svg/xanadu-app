// Xanadu Reel 4 "Some places call you back" — deterministic motion graphics rendered frame by frame.
// node reel.js [fps] [only-frame-seconds...]  → frames/f_00001.jpg …
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const IG = '/home/claude/ig';
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const DURATION = 21.0;
// background scenes [start, end, image|null]
const SCENES = [[0, 22, null]];
// text cards: start, end, lines [[delay, html, cls]]
const CARDS = [
  [0.25, 2.55, [[0, 'Why I\'m building', 'xl'], [0.55, '<em>Xanadu.</em>', 'xl']]],
  [2.70, 5.25, [[0, 'I kept meeting incredible', 'l'], [0.7, 'spaces and guides.', 'l']]],
  [5.40, 7.85, [[0, 'And people searching', 'l'], [0.7, 'for <em>exactly them.</em>', 'l']]],
  [8.00, 10.25, [[0, 'They couldn\'t', 'xl'], [0.6, '<em>find each other.</em>', 'xl']]],
  [10.40, 13.45, [[0, 'So I\'m building a network', 'l'], [0.75, 'that matches people', 'l'], [1.45, '<em>to a way of living.</em>', 'l']]],
  [13.60, 16.30, [[0, 'Starting in Nosara.', 'l'], [0.8, '<em>I\'ll be there in November.</em>', 'l']]],
];
const BRAND = [-10, -9];
const END = 16.45;

const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-500-normal.woff2', 500)}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--gold:#D2B488;--gold-pale:#E6CDA6;
--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:var(--navy);-webkit-font-smoothing:antialiased}
.layer{position:absolute;inset:0;overflow:hidden}
.bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}
.veil{position:absolute;inset:0;background:
  radial-gradient(95% 42% at 50% 44%,rgba(16,27,44,.68),rgba(16,27,44,.30) 65%,rgba(16,27,44,.08)),
  linear-gradient(180deg,rgba(16,27,44,.45) 0%,rgba(16,27,44,0) 22%,rgba(16,27,44,0) 72%,rgba(16,27,44,.6) 100%)}
.sky{background:
  radial-gradient(60% 35% at 20% 15%,rgba(143,155,230,.25),transparent 70%),
  radial-gradient(55% 30% at 85% 35%,rgba(181,139,224,.2),transparent 70%),
  radial-gradient(70% 35% at 50% 100%,rgba(111,183,191,.18),transparent 70%),var(--navy)}
.star{position:absolute;border-radius:50%;background:#fff}
.glow{position:absolute;left:50%;top:44%;width:900px;height:900px;margin:-450px 0 0 -450px;border-radius:50%;
  background:radial-gradient(closest-side,rgba(143,155,230,.35),rgba(181,139,224,.14) 55%,transparent)}
.aur{position:absolute;width:1100px;height:1100px;border-radius:50%;filter:blur(90px);opacity:.24}
.a1{background:#8F9BE6;left:-420px;top:200px}.a2{background:#E09AC4;right:-460px;top:900px;opacity:.22}
.ghost{position:absolute;left:50%;top:44%;width:1500px;aspect-ratio:900/518;margin-left:-750px;transform:translateY(-50%);opacity:.22}
.ghost img{position:absolute;inset:0;width:100%;height:100%}
.card{position:absolute;left:50px;right:50px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding-bottom:140px}
.line{font-family:Cormorant;font-weight:500;color:var(--ivory);line-height:1.04;letter-spacing:-.01em;text-shadow:0 4px 34px rgba(16,27,44,.65);will-change:transform,opacity,filter}
.line.xl{font-size:138px}
.line.l{font-size:92px}
.w{display:inline-block}
.line em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 22px rgba(16,27,44,.6))}
.mark{position:relative;width:860px;aspect-ratio:900/518}
.mark img{position:absolute;inset:0;width:100%;height:100%}
.wordmark{width:840px;margin-top:20px;filter:brightness(0) invert(1)}
.cta{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.32em;text-transform:uppercase;color:var(--gold);margin-top:46px}
.rule{width:150px;height:3px;background:var(--iri);margin-top:54px}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div id="scenes"></div><div id="fx" class="layer"></div><div id="cards" class="layer"></div>
<script>
const SCENES=${JSON.stringify(SCENES)}, CARDS=${JSON.stringify(CARDS)}, BRAND=${JSON.stringify(BRAND)}, END=${END};
const IG=${JSON.stringify(IG)};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eo=(x)=>1-Math.pow(1-clamp(x),3);           // ease out cubic
const eio=(x)=>{x=clamp(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
// build scenes
const sc=document.getElementById('scenes');
SCENES.forEach((s,i)=>{const d=document.createElement('div');d.className='layer '+(s[2]?'bg':'sky');d.id='s'+i;
  if(s[2]){d.innerHTML='<img src="file://'+location.pathname.replace(/[^/]*$/,'')+s[2]+'"><div class="veil"></div>';}
  else{let st='';let seed=7+i*13;const r=()=>{seed=(seed*9301+49297)%233280;return seed/233280};
    for(let k=0;k<70;k++){const x=r()*100,y=r()*100,z=.6+r()*2.2,o=.25+r()*.6;st+='<div class="star" style="left:'+x+'%;top:'+y+'%;width:'+z+'px;height:'+z+'px;opacity:'+o+'" data-p="'+r()*6.28+'"></div>'}
    d.innerHTML=st+'<div class="glow"></div><div class="aur a1"></div><div class="aur a2"></div><div class="ghost"><img class="go" src="file://'+IG+'/logo-orbit-outer-lit.png"><img class="gi" src="file://'+IG+'/logo-orbit-inner-lit.png"></div>';}
  sc.appendChild(d)});
// brand + end card DOM
const mk=(cls,st)=>'<div class="mark '+cls+'" style="'+(st||'')+'"><img class="o" src="file://'+IG+'/logo-orbit-outer-lit.png"><img class="i" src="file://'+IG+'/logo-orbit-inner-lit.png"><img class="m" src="file://'+IG+'/logo-static-lit.png"></div>';
const cards=document.getElementById('cards');
CARDS.forEach((c,i)=>{const d=document.createElement('div');d.className='card';d.id='c'+i;
  const words=(h)=>{const out=[];h.replace(new RegExp('<em>(.*?)</'+'em>|([^<]+)','g'),(m,e,p)=>{(e||p).trim().split(/\\s+/).forEach(w=>{if(w)out.push('<span class="w">'+(e?'<em>'+w+'</em>':w)+'</span>')});return m});return out.join(' ')};
  d.innerHTML=c[2].map(l=>'<div class="line '+l[2]+'">'+words(l[1])+'</div>').join('');cards.appendChild(d)});
const b=document.createElement('div');b.className='card';b.id='brand';
b.innerHTML=mk('')+'<img class="wordmark" src="file://'+IG+'/logo-wordmark.png">';cards.appendChild(b);
const e=document.createElement('div');e.className='card';e.id='end';
e.innerHTML=mk('','width:520px')+'<div class="line l" style="margin-top:36px">Spaces &amp; guides:</div><div class="line l"><em>apply to the founding circle.</em></div><div class="cta">Link in bio</div><div class="line xl" style="margin-top:70px;font-style:italic">Xan ✦</div>';
cards.appendChild(e);

function lineIn(el,t){const p=eo(t/0.6);el.style.opacity=p;el.style.transform='translateY('+(36*(1-p))+'px)';el.style.filter='blur('+(14*(1-p))+'px)';}
window.render=function(t){
  // backgrounds: crossfade 0.4s, slow push-in
  SCENES.forEach((s,i)=>{const el=document.getElementById('s'+i);const fi=i===0?1:eio((t-(s[0]-.2))/.4);const fo=1-eio((t-(s[1]-.2))/.4);
    const o=clamp(Math.min(fi,fo));el.style.opacity=o;el.style.visibility=o>0?'visible':'hidden';
    const img=el.querySelector('img');if(img){const k=clamp((t-s[0]+.2)/(s[1]-s[0]+.4));img.style.transform='scale('+(1.04+0.10*k)+') translateY('+(-14*k)+'px)';}
    el.querySelectorAll('.star').forEach(st=>{st.style.transform='translateY('+(-t*6)+'px)';st.style.opacity=.25+.5*(.5+.5*Math.sin(t*1.7+ +st.dataset.p))});
    const g=el.querySelector('.glow');if(g){g.style.transform='scale('+(1+.06*Math.sin(t*1.3))+')'}const a1=el.querySelector('.a1');if(a1){a1.style.transform='translate('+(120*Math.sin(t*.35))+'px,'+(-90*t/10)+'px)';el.querySelector('.a2').style.transform='translate('+(-110*Math.sin(t*.3))+'px,'+(-60*Math.cos(t*.4))+'px)';el.querySelector('.go').style.transform='rotate('+(t*3)+'deg)';el.querySelector('.gi').style.transform='rotate('+(-t*4.5)+'deg)';el.querySelector('.ghost').style.opacity=t>END-.3?.22*(1-eo((t-END+.3)/.5)):.22}});
  // text cards
  CARDS.forEach((c,i)=>{const el=document.getElementById('c'+i);const on=t>=c[0]-.01&&t<c[1]+.3;el.style.display=on?'flex':'none';if(!on)return;
    const out=1-eo((t-(c[1]-.05))/.3);
    [...el.children].forEach((ln,j)=>{ln.style.opacity=out;[...ln.querySelectorAll('.w')].forEach((w,k)=>lineIn(w,t-c[0]-c[2][j][0]-k*0.11));});});
  // brand
  const br=document.getElementById('brand');const bon=t>=BRAND[0]-.01&&t<BRAND[1]+.35;br.style.display=bon?'flex':'none';
  if(bon){const u=t-BRAND[0];const out=1-eo((t-BRAND[1])/.35);const m=br.querySelector('.mark');
    const o=m.querySelector('.o'),i=m.querySelector('.i'),s=m.querySelector('.m');
    const po=eo(u/1.1),pi=eo((u-.25)/1.0),ps=eo((u-.55)/.9);
    o.style.opacity=po*out;o.style.transform='rotate('+(-28*(1-po))+'deg) scale('+(.82+.18*po)+')';
    i.style.opacity=pi*out;i.style.transform='rotate('+(22*(1-pi))+'deg) scale('+(.86+.14*pi)+')';
    s.style.opacity=ps*out;s.style.transform='scale('+(.9+.1*ps+.012*Math.sin(u*2))+')';
    const w=br.querySelector('.wordmark');const pw=eo((u-1.05)/.8);w.style.opacity=pw*out;w.style.transform='translateY('+(26*(1-pw))+'px)';w.style.filter='brightness(0) invert(1) blur('+(10*(1-pw))+'px)';}
  // end card
  const en=document.getElementById('end');const eon=t>=END-.01;en.style.display=eon?'flex':'none';
  if(eon){const u=t-END;const kids=[...en.children];const delays=[0,.3,.75,1.3,1.9];
    kids.forEach((k,j)=>{const p=eo((u-delays[j])/.7);k.style.opacity=p;k.style.transform='translateY('+(30*(1-p))+'px)'});
    const m=kids[0];m.querySelector('.o').style.transform='rotate('+(u*4)+'deg)';m.querySelector('.i').style.transform='rotate('+(-u*6)+'deg)';}
};
</script></body></html>`;

(async () => {
  const fps = +(process.argv[2] || 30);
  const only = process.argv.slice(3).map(Number);
  fs.writeFileSync(path.join(__dirname, 'reel5.html'), html);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'reel5.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  if (only.length) {
    for (const s of only) { await page.evaluate((t) => window.render(t), s); await page.screenshot({ path: path.join(__dirname, `r5still_${s}.jpg`), type: 'jpeg', quality: 85 }); }
  } else {
    fs.mkdirSync(path.join(__dirname, 'frames5'), { recursive: true });
    const n = Math.round(DURATION * fps);
    for (let f = 0; f < n; f++) {
      await page.evaluate((t) => window.render(t), f / fps);
      await page.screenshot({ path: path.join(__dirname, 'frames5', `f_${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
      if (f % 150 === 0) console.log('frame', f, '/', n);
    }
  }
  await browser.close();
})();
