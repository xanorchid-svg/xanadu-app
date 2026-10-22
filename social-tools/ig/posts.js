// Slide content for Xanadu posts. Images in img/ are licensed Unsplash stock photos (one per slide, never reused). The AI versions are in posts-ai.js.
module.exports = ({ MARK, F }) => {
  const cta = (t) => `<div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">${t}</p>`;
  return {
    // Post 1 · single image, logo-led (Xan's reference: emblem + wordmark over misty land and water)
    '01-begins': [
      { photo: 'img/s-01-1.jpg', pos: 'center 40%', shade: 'brand', cls: 'center', nofoot: true,
        html: `<div style="margin-top:-150px">${MARK()}<img class="wordmark" src="${F('logo-wordmark.png')}"></div>
               <h1 class="m" style="font-size:64px;margin-top:300px"><em>Xanadu begins with you.</em></h1>` },
    ],


    // Post 2 · What is Xanadu (rebuilt Oct 22 from the published slides, stock photos)
    '02-what-is-xanadu': [
      { photo: 'img/s-02-1.jpg', cls: 'bottom', html: `<div class="eyebrow">What is Xanadu</div><h1>A network for<br><em>awakening places.</em></h1>` },
      { photo: 'img/s-02-2.jpg', shade: 'top', cls: 'topal', html: `<div class="num">i.</div><h1 class="m">You design the stay.<br><em>We match you.</em></h1><div class="tags"><span class="tag">How long</span><span class="tag">How you spend your days</span><span class="tag">Where you feel alive</span></div><p class="body">A week, a month, a season. Tell us how you want to live, and we find the places that fit.</p>` },
      { photo: 'img/s-02-3.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Retreats &amp; classes</div><h1 class="m">Practice with guides<br>who <em>hold the room.</em></h1>` },
      { photo: 'img/s-02-4.jpg', pos: 'center 70%', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Trainings &amp; workshops</div><h1 class="m">Go deeper<br><em>in your practice.</em></h1>` },
      { photo: 'img/s-02-5.jpg', shade: 'strong', cls: 'bottom', html: `<div class="eyebrow">Volunteer &amp; work exchange</div><h1 class="m">Give your hands<br><em>to the land.</em></h1>` },
      { photo: 'img/s-02-6.jpg', shade: 'strong', cls: 'bottom', html: `<h1 class="m">Every place and guide,<br><em>personally reviewed ✦</em></h1><p class="body">Starting in Nosara, Costa Rica.</p>${cta('Join the waitlist · link in bio')}` },
    ],

    // Post 3 · Why join the founding circle (rebuilt Oct 22 from the published slides, stock photos)
    '03-why-join': [
      { photo: 'img/s-03-1.jpg', cls: 'bottom', html: `<div class="eyebrow">For spaces &amp; guides in Nosara</div><h1>Why join the<br><em>founding circle?</em></h1>` },
      { photo: 'img/s-03-2.jpg', shade: 'strong', cls: 'bottom', html: `<div class="num">i.</div><h1 class="m">Aligned guests,<br><em>matched to you.</em></h1><p class="body">Seekers and Facilitators looking for exactly what your place or practice holds.</p>` },
      { photo: 'img/s-03-3.jpg', shade: 'strong', cls: 'bottom', html: `<div class="num">ii.</div><h1 class="m">A personally<br><em>reviewed ✦ profile.</em></h1><p class="body">We meet every space and guide before they join, so guests arrive trusting you.</p>` },
      { photo: 'img/s-03-4.jpg', shade: 'strong', cls: 'bottom', html: `<div class="num">iii.</div><h1 class="m">Our storytelling,<br><em>behind you.</em></h1><p class="body">Spotlights here, on our website and at launch.</p>` },
      { photo: 'img/s-03-5.jpg', shade: 'top', cls: 'topal', html: `<h1 class="m">Free to join.<br><em>No commission.</em></h1><p class="body">And a voice in how Xanadu grows.<br>15 spaces · 15 guides · Nosara</p>${cta('Apply to the founding circle · link in bio')}` },
    ],

    // Post 6 · A day in a season-long stay (Seekers)
    '06-a-day': [
      { photo: 'img/s-06-1.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Long stays</div><h1 class="xl">A day in a<br><em>season-long stay.</em></h1>` },
      { photo: 'img/s-06-2.jpg', cls: 'bottom', html: `<div class="time">6:00</div><h1>Practice as<br><em>the light comes up.</em></h1>` },
      { photo: 'img/s-06-3.jpg', shade: 'strong', cls: 'bottom', html: `<div class="time">9:00</div><h1>Breakfast, then<br><em>a little work, or none.</em></h1>` },
      { photo: 'img/s-06-4.jpg', shade: 'top', cls: 'topal', html: `<div class="time">15:00</div><h1 class="xl"><em>The ocean.</em></h1>` },
      { photo: 'img/s-06-5.jpg', cls: 'bottom', html: `<div class="time">18:00</div><h1>Circle, or sound,<br><em>or nothing at all.</em></h1>` },
      { cls: 'center', html: `${MARK('s')}<h1 class="m" style="margin-top:40px">You design the stay.<br><em>We match you.</em></h1>${cta('Join the waitlist · link in bio')}` },
    ],

    // Post 7 · Every space is personally reviewed (Seekers, trust)
    '07-reviewed': [
      { photo: 'img/s-07-1.jpg', shade: 'even', cls: 'center', html: `<div class="eyebrow">Our promise</div><h1 class="xl">Every space is<br><em>personally reviewed ✦</em></h1>` },
      { photo: 'img/s-07-2.jpg', pos: 'center top', shade: 'strong', cls: 'bottom', html: `<div class="num">i.</div><h1>We meet every<br>space and guide<br><em>before they join.</em></h1>` },
      { photo: 'img/s-07-3.jpg', shade: 'strong', cls: 'bottom', html: `<div class="num">ii.</div><h1>We learn how<br><em>they hold people.</em></h1><p class="body">Who they're for, how they work, and what makes the place theirs.</p>` },
      { cls: 'center', html: `<div class="star">✦</div><h1 class="m">The ✦ on a profile<br><em>means we've met them.</em></h1>` },
      { photo: 'img/s-07-5.jpg', shade: 'top', cls: 'topal', html: `<h1 class="xl">Fewer places,<br><em>chosen well.</em></h1><p class="body">Starting in Nosara, Costa Rica.</p>${cta('Join the waitlist · link in bio')}` },
    ],

    // Post 8 · Who we're looking for (Containers & Facilitators)
    '08-who': [
      { photo: 'img/s-08-1.jpg', split: true, pos: 'center 30%', html: `<div class="eyebrow">For spaces &amp; guides in Nosara</div><h1 class="xl">Who we're<br><em>looking for.</em></h1>` },
      { photo: 'img/s-08-2.jpg', cls: 'bottom', html: `<div class="eyebrow">Spaces</div><h1>Retreat centers<br>&amp; <em>eco-lodges.</em></h1>` },
      { photo: 'img/s-08-3.jpg', shade: 'strong', cls: 'bottom', html: `<div class="eyebrow">Spaces</div><h1>Studios &amp;<br><em>open-air shalas.</em></h1>` },
      { photo: 'img/s-08-4.jpg', shade: 'strong', cls: 'bottom', html: `<div class="eyebrow">Spaces</div><h1>Land, farms<br>&amp; <em>gardens.</em></h1><p class="body">Places that welcome volunteers and long stays.</p>` },
      { photo: 'img/s-08-5.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Guides</div><h1>Teachers who<br><em>hold the room.</em></h1><p class="body">Yoga, breathwork, meditation, sound.</p>` },
      { photo: 'img/s-08-6.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Guides</div><h1>Surf, movement<br>&amp; <em>the outdoors.</em></h1>${cta('15 spaces · 15 guides · Apply · link in bio')}` },
    ],

    // Post 9 · The founding circle is forming (single, graphic tile for grid variety)
    '09-circle': [
      { cls: 'center', html: `<div class="ringwrap"><div class="ring"></div><div class="inner">${MARK('s').replace('class="mark s"', 'class="mark s" style="width:500px"')}</div></div>
        <h1 class="m">The founding circle<br><em>is forming in Nosara.</em></h1><p class="body" style="font-size:30px;letter-spacing:.18em;text-transform:uppercase;color:#D2B488;font-weight:500">15 spaces · 15 guides</p>` },
    ],

    // Post 11 · Quiz: which stay are you? (comments)
    '11-which-stay': [
      { photo: 'img/s-11-1.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">A little quiz</div><h1 class="xl">Which stay<br><em>are you?</em></h1><p class="body">Swipe, pick one, and tell us in the comments.</p>` },
      { photo: 'img/s-11-2.jpg', shade: 'strong', cls: 'bottom', html: `<div class="badge">A</div><div class="eyebrow">The sunrise shala</div><h1>Mats out<br><em>before the sun.</em></h1><p class="body">Daily practice, a teacher who knows you, slow afternoons.</p>` },
      { photo: 'img/s-11-3.jpg', pos: 'center top', shade: 'strong', cls: 'bottom', html: `<div class="badge">B</div><div class="eyebrow">The surf month</div><h1>Salt in your hair<br><em>for thirty days.</em></h1><p class="body">Morning sessions, a coach, a crew in the water.</p>` },
      { photo: 'img/s-11-4.jpg', shade: 'strong', cls: 'bottom', html: `<div class="badge">C</div><div class="eyebrow">The slow remote season</div><h1>Laptop open.<br><em>Hammock close.</em></h1><p class="body">Work your hours, then the jungle takes over.</p>` },
      { cls: 'center', html: `${MARK('s')}<h1 class="xl" style="margin-top:30px">A, B <em>or C?</em></h1><p class="body">Tell us in the comments. When the doors open, we'll match you.</p><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Join the waitlist · link in bio</p>` },
    ],

    // Post 12 · Signs you need a season (ivory, typographic, shares)
    '12-signs': [
      { ivory: true, cls: '', html: `<div class="eyebrow">A gentle diagnosis</div><h1 class="xl">Signs you need<br><em>a season,</em><br>not a vacation.</h1>` },
      { ivory: true, html: `<div class="bignum">01</div><h1>You come home from vacation <em>more tired than you left.</em></h1>` },
      { ivory: true, html: `<div class="bignum">02</div><h1>You “work from anywhere.” <em>Anywhere is your kitchen.</em></h1>` },
      { ivory: true, html: `<div class="bignum">03</div><h1>You’ve said “one day” <em>about the same place</em> for years.</h1>` },
      { ivory: true, html: `<div class="bignum">04</div><h1>Seven days <em>never feels like enough.</em></h1>` },
      { ivory: true, html: `<div class="bignum">05</div><h1>You want to <em>know a place,</em> not just see it.</h1>` },
      { ivory: true, cls: 'center', html: `<h1 class="m">A week is a vacation.<br><em>A season is a way of living.</em></h1><div class="rule"></div><p class="body" style="font-size:32px;margin-top:34px">Send this to the friend who needs one.<br>Join the waitlist · link in bio</p>` },
    ],

    // Post 13 · A week vs a season (saves)
    '13-week-vs-season': [
      { cls: 'q', nofoot: true, html: `<div class="eyebrow">Know the difference</div><div class="qt" style="font-size:130px">A week<br><em>vs a season.</em></div><div class="qrule"></div><div class="qa" style="margin-top:40px">Xanadu</div>` },
      { photo: 'img/s-13-2.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Swipe</div><h1 class="m">Pack for a week.<br><em>Or pack for a season.</em></h1>` },
      { cls: 'vs', html: `<div class="lab">A week</div><div class="a">You unpack.</div><div class="mid"></div><div class="lab">A season</div><div class="b">You unpack <em>once.</em></div>` },
      { cls: 'vs', html: `<div class="lab">A week</div><div class="a">You see the sights.</div><div class="mid"></div><div class="lab">A season</div><div class="b">You find <em>your café.</em></div>` },
      { cls: 'vs', html: `<div class="lab">A week</div><div class="a">You take a class.</div><div class="mid"></div><div class="lab">A season</div><div class="b">You build <em>a practice.</em></div>` },
      { cls: 'vs', html: `<div class="lab">A week</div><div class="a">You’re a guest.</div><div class="mid"></div><div class="lab">A season</div><div class="b">You’re <em>a neighbor.</em></div>` },
      { cls: 'center', html: `${MARK('s')}<h1 class="m" style="margin-top:30px">Stay a week, a month,<br><em>a season.</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Save this · Join the waitlist · link in bio</p>` },
    ],

    // ---- In-between carousels (posted manually, 6 p.m.), covers rotate white → image → navy ----
    // white
    '16-pace-of-nature': [
      { ivory: true, cls: 'q', nofoot: true, html: `<div class="qm">“</div><div class="qt">Adopt the pace of nature: <em>her secret is patience.</em></div><div class="qa">Ralph Waldo Emerson</div><img class="mk" src="${F('logo-static-lit.png')}">` },
      { ivory: true, html: `<div class="bignum">01</div><h1>Wake <em>with the light,</em> not the alarm.</h1>` },
      { ivory: true, html: `<div class="bignum">02</div><h1>Walk somewhere <em>with no destination.</em></h1>` },
      { ivory: true, html: `<div class="bignum">03</div><h1>Eat one meal a day <em>outside.</em></h1>` },
      { ivory: true, html: `<div class="bignum">04</div><h1>Leave one day a week <em>unplanned.</em></h1>` },
      { ivory: true, cls: 'center', html: `<h1 class="m">Nature doesn’t rush.<br><em>Neither do you.</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px">Save this for a slower week.</p>` },
    ],
    // image
    '17-rest-is-rhythm': [
      { ivory: true, cls: 'q', nofoot: true, html: `<div class="qt" style="font-size:92px">Rest is not a reward.<br><em>It’s part of the rhythm.</em></div><div class="qrule"></div><div class="qa" style="margin-top:40px">Xanadu</div><img class="mk" src="${F('logo-static-lit.png')}">` },
      { photo: 'img/s-17-2.jpg', shade: 'top', cls: 'topal', html: `<div class="eyebrow">Swipe</div><h1 class="m">Rest comes in<br><em>more than one shape.</em></h1>` },
      { html: `<div class="eyebrow">Rest comes in more than one shape</div><h1>Sleep.</h1><p class="body">The deep kind, with no alarm to cut it short.</p>` },
      { html: `<div class="eyebrow">Rest comes in more than one shape</div><h1><em>Stillness.</em></h1><p class="body">An hour with no screens and nothing to answer.</p>` },
      { html: `<div class="eyebrow">Rest comes in more than one shape</div><h1>Nature.</h1><p class="body">Trees, water, open sky. Your eyes looking far away for once.</p>` },
      { html: `<div class="eyebrow">Rest comes in more than one shape</div><h1><em>Play.</em></h1><p class="body">Something you do just because you love it.</p>` },
      { cls: 'center', html: `<h1 class="m">Which kind of rest<br><em>do you need this week?</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Tell us in the comments</p>` },
    ],
    // navy
    '21-not-in-a-hurry': [
      { cls: 'q', nofoot: true, html: `<div class="qt" style="font-size:104px">Not everything<br>worth finding<br><em>is found in a hurry.</em></div><div class="qrule"></div><div class="qa" style="margin-top:40px">Xanadu</div>` },
      { html: `<div class="eyebrow">Things you only find slowly</div><h1>The café where they know <em>your order.</em></h1>` },
      { html: `<div class="eyebrow">Things you only find slowly</div><h1>The trail <em>the locals use.</em></h1>` },
      { html: `<div class="eyebrow">Things you only find slowly</div><h1>The teacher who <em>remembers your name.</em></h1>` },
      { html: `<div class="eyebrow">Things you only find slowly</div><h1>The quiet hour <em>on the beach.</em></h1>` },
      { cls: 'center', html: `${MARK('s')}<h1 class="m" style="margin-top:30px">Stay long enough<br><em>to find them.</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Join the waitlist · link in bio</p>` },
    ],
    // white
    '18-morning-light': [
      { ivory: true, cls: 'q', nofoot: true, html: `<div class="qa" style="margin-top:0;margin-bottom:46px">A small ritual</div><div class="qt" style="font-size:100px">Step outside in the<br><em>first hour of your day.</em></div><div class="qs">Morning daylight helps set your body clock,<br>so you wake more alert and wind down<br>more easily at night.</div><img class="mk" src="${F('logo-static-lit.png')}">` },
      { ivory: true, html: `<div class="bignum">01</div><h1>Go outside <em>within an hour</em> of waking.</h1><p class="body">A balcony, a porch or the street all count.</p>` },
      { ivory: true, html: `<div class="bignum">02</div><h1>Leave <em>the phone inside.</em></h1><p class="body">Just you and the morning.</p>` },
      { ivory: true, html: `<div class="bignum">03</div><h1>Stay for <em>ten minutes.</em></h1><p class="body">Even on cloudy days, outdoor light is far brighter than indoor light.</p>` },
      { ivory: true, html: `<div class="bignum">04</div><h1>Notice <em>three things.</em></h1><p class="body">A sound, a color, the temperature of the air.</p>` },
      { ivory: true, cls: 'center', html: `<h1 class="m">Tomorrow morning,<br><em>try it once.</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px">Save this and send it to your morning person.</p>` },
    ],
    // image
    '19-deliberately': [
      { ivory: true, cls: 'q', nofoot: true, html: `<div class="qm">“</div><div class="qt">I went to the woods because I wished to <em>live deliberately.</em></div><div class="qa">Henry David Thoreau</div><img class="mk" src="${F('logo-static-lit.png')}">` },
      { photo: 'img/s-19-2.jpg', shade: 'strong', cls: 'bottom', html: `<div class="eyebrow">For a quiet evening</div><h1 class="m">Five questions for<br><em>living deliberately.</em></h1>` },
      { html: `<div class="eyebrow">Five questions for living deliberately</div><div class="num">i.</div><h1>What do I want <em>more of</em> this season?</h1>` },
      { html: `<div class="eyebrow">Five questions for living deliberately</div><div class="num">ii.</div><h1>What am I ready <em>to let go of?</em></h1>` },
      { html: `<div class="eyebrow">Five questions for living deliberately</div><div class="num">iii.</div><h1>Where do I feel <em>most alive?</em></h1>` },
      { html: `<div class="eyebrow">Five questions for living deliberately</div><div class="num">iv.</div><h1>Who do I spend time with <em>who brings me back to myself?</em></h1>` },
      { html: `<div class="eyebrow">Five questions for living deliberately</div><div class="num">v.</div><h1>What would a <em>slower month</em> make room for?</h1>` },
      { cls: 'center', html: `<h1 class="m">Save these for<br><em>a quiet evening.</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Which question stays with you?</p>` },
    ],
    // navy
    '20-two-hours': [
      { cls: 'q', nofoot: true, html: `<div class="big">120</div><div class="qa" style="margin-top:10px">minutes a week</div><div class="qt" style="font-size:72px;margin-top:50px">People who spent at least two hours a week in nature reported <em>better health and well-being.</em></div><div class="qs" style="font-size:22px">White et al., Scientific Reports, 2019</div>` },
      { html: `<div class="eyebrow">The study</div><h1>Nearly <em>20,000 people</em> in England.</h1><p class="body">Those who spent two hours or more a week in nature were more likely to report good health and well-being.</p>` },
      { html: `<div class="eyebrow">Good news</div><h1>It doesn’t have to be <em>all at once.</em></h1><p class="body">One long walk or a few short ones. The total is what mattered.</p>` },
      { html: `<div class="eyebrow">What counts</div><h1>A park. A beach. <em>A garden.</em></h1><p class="body">Green and open places close to home count too.</p>` },
      { html: `<div class="eyebrow">Make it easy</div><h1>About <em>17 minutes</em> a day.</h1><p class="body">That’s your two hours, spread across the week.</p>` },
      { cls: 'center', html: `${MARK('s')}<h1 class="m" style="margin-top:30px">How will you get<br><em>your two hours?</em></h1><div class="rule"></div><p class="body" style="font-size:30px;margin-top:34px;color:#E6CDA6">Tell us below</p>` },
    ],
  };
};
