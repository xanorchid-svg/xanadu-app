module.exports = ({ MARK, F }) => ({
  pv: [
    { photo: 'img-ai/s02-1.jpg', cls: 'bottom', html: `<div class="eyebrow">What is Xanadu</div><h1>A network for<br><em>awakening places.</em></h1>` },
    { photo: 'img-ai/meditate.jpg', cls: 'bottom', html: `<div class="time">6:00</div><h1>Practice as<br><em>the light comes up.</em></h1>` },
    { cls: 'center', html: `<div class="star">✦</div><h1 class="m">The ✦ on a profile<br><em>means we've met them.</em></h1>` },
    { ivory: true, cls: 'q', nofoot: true, html: `<div class="qm">“</div><div class="qt">Adopt the pace of nature: <em>her secret is patience.</em></div><div class="qa">Ralph Waldo Emerson</div><img class="mk" src="${F('logo-static-lit.png')}">` },
  ],
});
