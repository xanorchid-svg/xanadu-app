// Video reels: real footage background + Xanadu text overlay (same look as reel5c/reel10).
// usage: node vreel.js <reelId> [preview seconds...]
const { chromium } = require('/home/claude/ig/node_modules/playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const IG = '/home/claude/ig';
const CLIPS = path.join(__dirname, 'clips');
const F = (p) => 'file://' + p;
const font = (fam, file, w, style = 'normal') =>
  `@font-face{font-family:'${fam}';src:url('${F(IG + '/node_modules/@fontsource/' + file)}') format('woff2');font-weight:${w};font-style:${style}}`;

const REELS = require('./reels.js');
const id = process.argv[2];
const R = REELS[id];
if (!R) { console.error('unknown reel', id, Object.keys(REELS)); process.exit(1); }
// scenes: [clip, clipOffset, dur, chip, lines[[delay, html, cls]]]
let t = 0;
const SCENES = R.scenes.map((s) => { const o = [t, t + s[2], s[0], s[1], s[3], s[4]]; t += s[2]; return o; });
const END = t;
const ENDLEN = 3.2;
const DURATION = END + ENDLEN;

const CSS = `
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2', 500)}
${font('Cormorant', 'cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2', 500, 'italic')}
${font('Manrope', 'manrope/files/manrope-latin-600-normal.woff2', 600)}
:root{--navy:#101B2C;--ivory:#F6F1E8;--gold:#D2B488;
--iri:linear-gradient(115deg,#9DBB7A 0%,#6FB7BF 18%,#8F9BE6 36%,#B58BE0 54%,#E09AC4 72%,#E8BF8A 88%,#9DBB7A 100%)}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent}
body{width:1080px;height:1920px;overflow:hidden;-webkit-font-smoothing:antialiased}
body.solid{background:#556}
.layer{position:absolute;inset:0;overflow:hidden}
.veil{position:absolute;inset:0;background:
  radial-gradient(100% 34% at 50% 38%,rgba(16,27,44,.58),rgba(16,27,44,.2) 70%,rgba(16,27,44,0)),
  linear-gradient(180deg,rgba(16,27,44,.3),transparent 18%,transparent 72%,rgba(16,27,44,.45))}
.txt{position:absolute;left:50px;right:50px;top:500px;display:flex;flex-direction:column;align-items:center;text-align:center}
.chip{font-family:Manrope;font-weight:600;font-size:34px;letter-spacing:.42em;text-transform:uppercase;color:#E6CDA6;padding-left:.42em;text-shadow:0 2px 18px rgba(16,27,44,.85)}
.crule{width:120px;height:2px;background:var(--iri);margin:26px 0 40px}
.line{font-family:Cormorant;font-weight:500;color:var(--ivory);line-height:1.02;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(16,27,44,.75)}
.line.xl{font-size:150px}.line.l{font-size:112px}.line.m{font-size:84px}.line.s{font-size:64px;margin-top:26px}
.line em{font-style:italic;background:var(--iri);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 20px rgba(16,27,44,.7))}
.flash{position:absolute;inset:0;background:#F6F1E8;opacity:0}
.sky{background:radial-gradient(60% 35% at 20% 18%,rgba(143,155,230,.3),transparent 70%),radial-gradient(55% 30% at 85% 38%,rgba(181,139,224,.24),transparent 70%),radial-gradient(70% 35% at 50% 100%,rgba(111,183,191,.2),transparent 70%),var(--navy)}
.mark{position:relative;width:600px;aspect-ratio:900/518}
.mark img{position:absolute;inset:0;width:100%;height:100%}
.cta{font-family:Manrope;font-weight:600;font-size:36px;letter-spacing:.3em;text-transform:uppercase;color:var(--gold);margin-top:60px}
.rule{width:160px;height:3px;background:var(--iri);margin-top:50px}
`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>
<div id="root"></div><div class="flash" id="flash"></div>
<script>
const SCENES=${JSON.stringify(SCENES)}, END=${END}, IG=${JSON.stringify(IG)}, ENDLINES=${JSON.stringify(R.end)};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eo=(x)=>1-Math.pow(1-clamp(x),3);
const back=(x)=>{x=clamp(x);const c=1.9;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)};
const root=document.getElementById('root');
SCENES.forEach((s,i)=>{const d=document.createElement('div');d.className='layer sc';d.id='s'+i;
  let h='<div class="veil"></div><div class="txt">';
  if(s[4]){h+='<div class="chip">'+s[4]+'</div><div class="crule"></div>'}
  h+=s[5].map(l=>'<div class="line '+l[2]+'">'+l[1]+'</div>').join('')+'</div>';d.innerHTML=h;root.appendChild(d)});
const e=document.createElement('div');e.className='layer sky';e.id='end';
e.innerHTML='<div class="txt" style="top:480px"><div class="mark"><img class="o" src="file://'+IG+'/logo-orbit-outer-lit.png"><img class="i" src="file://'+IG+'/logo-orbit-inner-lit.png"><img class="m" src="file://'+IG+'/logo-static-lit.png"></div>'
 +ENDLINES.map((l,j)=>'<div class="line l"'+(j==0?' style="margin-top:40px"':'')+'>'+l+'</div>').join('')+'<div class="rule"></div><div class="cta">Join the waitlist · link in bio</div></div>';
root.appendChild(e);
window.render=function(t){
  let flash=0;
  SCENES.forEach((s,i)=>{const el=document.getElementById('s'+i);const on=t>=s[0]&&t<s[1];el.style.display=on?'block':'none';if(!on)return;
    const u=t-s[0];if(i>0&&s[2]!==SCENES[i-1][2])flash=Math.max(flash,.3*(1-clamp(u/.12)));
    const chip=el.querySelector('.chip');if(chip){const p=eo(u/.35);chip.style.opacity=p;chip.style.letterSpacing=(.7-.28*p)+'em';el.querySelector('.crule').style.transform='scaleX('+eo((u-.08)/.4)+')'}
    const out=clamp((s[1]-t)/.18);
    [...el.querySelectorAll('.line')].forEach((ln,j)=>{const x=(u-s[5][j][0])/.45;const p=eo(x);ln.style.opacity=clamp(x*1.6)*out;ln.style.transform='translateY('+(46*(1-p))+'px)';ln.style.filter='blur('+(12*(1-p))+'px)'});
    if(chip)chip.style.opacity=eo(u/.35)*out});
  const en=document.getElementById('end');const eon=t>=END;en.style.display=eon?'block':'none';
  if(eon){const u=t-END;en.style.opacity=clamp(u/.25);const m=en.querySelector('.mark');
    const po=back(u/.6);m.querySelector('.o').style.transform='rotate('+(-120*(1-eo(u/.8))+u*5)+'deg) scale('+(.5+.5*po)+')';
    m.querySelector('.i').style.transform='rotate('+(90*(1-eo(u/.8))-u*7)+'deg) scale('+(.5+.5*po)+')';
    m.querySelector('.m').style.transform='scale('+(.4+.6*back((u-.15)/.5))+')';m.style.opacity=clamp(u/.25);
    [...en.querySelectorAll('.line')].forEach((ln,j)=>{const x=(u-.45-j*.35)/.45;const p=eo(x);ln.style.opacity=clamp(x*1.6);ln.style.transform='translateY('+(46*(1-p))+'px)';ln.style.filter='blur('+(12*(1-p))+'px)'});
    const r=en.querySelector('.rule'),c=en.querySelector('.cta');const pr=eo((u-1.5)/.5);r.style.opacity=pr;r.style.transform='scaleX('+pr+')';c.style.opacity=eo((u-1.7)/.5);c.style.transform='translateY('+(20*(1-eo((u-1.7)/.5)))+'px)'}
  document.getElementById('flash').style.opacity=flash;
};
</script></body></html>`;

(async () => {
  const fps = 30;
  const dir = path.join(__dirname, 'build', id);
  fs.mkdirSync(path.join(dir, 'ov'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'reel.html'), html);
  const preview = process.argv.slice(3).map(Number);

  // 1) background: trimmed clips concatenated + navy tail for the end card
  const bg = path.join(dir, 'bg.mp4');
  if (!fs.existsSync(bg)) {
    const ins = SCENES.map((s) => `-ss ${s[3]} -t ${(s[1] - s[0]).toFixed(3)} -i ${CLIPS}/${s[2]}.mp4`).join(' ');
    const n = SCENES.length;
    const filt = SCENES.map((s, i) => `[${i}:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${fps},setsar=1,format=yuv420p,trim=duration=${(s[1] - s[0]).toFixed(3)},setpts=PTS-STARTPTS[v${i}]`).join(';')
      + `;color=c=0x101B2C:s=1080x1920:r=${fps}:d=${ENDLEN}[tail];` + SCENES.map((_, i) => `[v${i}]`).join('') + `[tail]concat=n=${n + 1}:v=1:a=0[out]`;
    execSync(`ffmpeg -v error -y ${ins} -filter_complex "${filt}" -map "[out]" -c:v libx264 -crf 14 -preset fast ${bg}`, { stdio: 'inherit' });
  }

  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('PAGE ERROR', e.message));
  await page.goto('file://' + path.join(dir, 'reel.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const frames = preview.length ? preview.map((s) => Math.round(s * fps)) : [...Array(Math.round(DURATION * fps)).keys()];
  for (const f of frames) {
    await page.evaluate((t) => window.render(t), f / fps);
    await page.screenshot({ path: path.join(dir, 'ov', `o_${String(f).padStart(5, '0')}.png`), omitBackground: true });
  }
  await browser.close();

  if (preview.length) {
    for (const f of frames) {
      const p = String(f).padStart(5, '0');
      execSync(`ffmpeg -v error -y -ss ${(f / fps).toFixed(3)} -i ${bg} -i ${dir}/ov/o_${p}.png -filter_complex "[0:v][1:v]overlay" -frames:v 1 -update 1 ${dir}/prev_${p}.jpg`);
    }
    return;
  }
  const out = path.join(dir, 'reel.mp4');
  execSync(`ffmpeg -v error -y -i ${bg} -framerate ${fps} -i ${dir}/ov/o_%05d.png -f lavfi -i anullsrc=r=44100:cl=stereo -filter_complex "[0:v][1:v]overlay=shortest=1,format=yuv420p[v]" -map "[v]" -map 2:a -shortest -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 128k -movflags +faststart ${out}`, { stdio: 'inherit' });
  console.log('done', out, DURATION.toFixed(2) + 's');
})();
