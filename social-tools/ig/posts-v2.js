// Xanadu v2 ("quiet photo") slide content — the next 20 posts (Oct 26 – Dec 9, 2026).
// Same message and captions as the current version; new look (see render-v2.js). No gradients.
// Every cover is a photo. Tile tone keeps the grid rotation: ivory (white) → photo → navy → photo.
// Photos are the same AI images the current version uses, plus 5 new covers (v2-*.jpg, Canva DAHYegA5SMA pages 93–97).
// Reels 05, 10, 14, 23, 24 keep their current covers (their text is part of the footage). Reel 28 gets a v2 cover.
const I = (f) => 'img-ai/' + f + '.jpg';
const CTA_SEEK = 'Join the waitlist · link in bio';
const CTA_HOST = 'Apply · link in bio';

module.exports = {
  // Oct 26 · photo
  '02-what-is-xanadu': [
    { kind: 'cover', photo: I('s02-1'), eb: 'What is Xanadu', h: 'A network for<br><em>awakening places.</em>' },
    { kind: 'photoText', photo: I('s02-2'), eb: 'You design the stay', h: 'Tell us how you want<br>to live.<br><em>We find the places that fit.</em>', after: '<div class="tags"><span class="tag">How long</span><span class="tag">How you spend your days</span><span class="tag">Where you feel alive</span></div>' },
    { kind: 'photoText', photo: I('s02-3'), eb: 'Retreats & classes', h: 'Practice with guides<br>who <em>hold the room.</em>' },
    { kind: 'photoText', photo: I('s02-4'), eb: 'Trainings & workshops', h: 'Go deeper<br><em>in your practice.</em>' },
    { kind: 'photoText', photo: I('s02-5'), eb: 'Volunteer & work exchange', h: 'Give your hands<br><em>to the land.</em>' },
    { kind: 'end', photo: I('s02-6'), h: 'Every place and guide,<br><em>personally reviewed.</em>', sub: 'Starting in Nosara, Costa Rica.', cta: CTA_SEEK },
  ],

  // Oct 28 · navy
  '09-circle': [
    { kind: 'cover', tone: 'navy', photo: I('v2-circle'), eb: '15 spaces · 30 guides', h: 'The founding circle<br><em>is forming in Nosara.</em>' },
  ],

  // Oct 30 · photo (reel cover only)
  '28-your-xanadu': [
    { kind: 'cover', tone: 'dusk', photo: I('v2-reel28'), pos: 'center 30%', h: 'Your Xanadu<br><em>waits for you.</em>' },
  ],

  // Nov 2 · white
  '26-do-both': [
    { kind: 'cover', tone: 'bright', photo: I('v2-veranda'), eb: 'btw,', h: 'It’s cool<br>to do <em>both.</em>', size: 'l' },
    { kind: 'halves', a: [I('b-work'), '50% 45%', 'work hard'], b: [I('b-sunset'), '50% 55%', 'log off at sunset'] },
    { kind: 'halves', a: [I('b-surf'), '50% 55%', 'surf at sunrise'], b: [I('b-hammock'), '50% 55%', 'do absolutely nothing'] },
    { kind: 'halves', a: [I('b-table'), '50% 45%', 'meet everyone'], b: [I('b-alone'), '50% 55%', 'spend a day alone'] },
    { kind: 'halves', a: [I('b-yoga'), '50% 50%', 'move your body'], b: [I('b-daybed'), '50% 50%', 'rest without guilt'] },
    { kind: 'halves', a: [I('b-plan'), '50% 50%', 'plan every detail'], b: [I('b-road'), '50% 55%', 'let the place change the plan'] },
    { kind: 'end', bg: 'ivory', h: 'A week, a month, a season.<br><em>Or all three.</em>', cta: CTA_SEEK },
  ],

  // Nov 6 · navy
  '20-two-hours': [
    { kind: 'cover', tone: 'navy', photo: I('v2-trail'), eb: '120 minutes a week', h: 'Two hours in nature,<br><em>and how it adds up.</em>' },
    { kind: 'text', eb: 'The study', pre: '<div class="big">120</div>', h: 'minutes a week in nature.', b: 'People who spent at least two hours a week in nature reported better health and well-being.<br><span style="font-size:22px;opacity:.7">White et al., Scientific Reports, 2019</span>' },
    { kind: 'text', eb: 'Who they asked', h: 'Nearly <em>20,000 people</em><br>in England.', b: 'Those who spent two hours or more a week in nature were more likely to report good health and well-being.' },
    { kind: 'text', eb: 'Good news', h: 'It doesn’t have to be<br><em>all at once.</em>', b: 'One long walk or a few short ones. The total is what mattered.' },
    { kind: 'text', eb: 'What counts', h: 'A park. A beach.<br><em>A garden.</em>', b: 'Green and open places close to home count too.' },
    { kind: 'text', eb: 'Make it easy', h: 'About <em>17 minutes</em><br>a day.', b: 'That’s your two hours, spread across the week.' },
    { kind: 'end', h: 'How will you get<br><em>your two hours?</em>', cta: 'Tell us below' },
  ],

  // Nov 11 · white
  '17-rest-is-rhythm': [
    { kind: 'cover', tone: 'bright', photo: I('restcorner'), h: 'Rest is not a reward.<br><em>It’s part of the rhythm.</em>' },
    { kind: 'text', bg: 'ivory', eb: 'Rest comes in more than one shape', h: 'Sleep.', b: 'The deep kind, with no alarm to cut it short.' },
    { kind: 'text', bg: 'ivory', eb: 'Rest comes in more than one shape', h: '<em>Stillness.</em>', b: 'An hour with no screens and nothing to answer.' },
    { kind: 'text', bg: 'ivory', eb: 'Rest comes in more than one shape', h: 'Nature.', b: 'Trees, water, open sky. Your eyes looking far away for once.' },
    { kind: 'text', bg: 'ivory', eb: 'Rest comes in more than one shape', h: '<em>Play.</em>', b: 'Something you do just because you love it.' },
    { kind: 'end', bg: 'ivory', h: 'Which kind of rest<br><em>do you need this week?</em>', cta: 'Tell us in the comments' },
  ],

  // Nov 13 · photo
  '03-why-join': [
    { kind: 'cover', photo: I('s03-1'), eb: 'For spaces & guides in Nosara', h: 'Why join the<br><em>founding circle?</em>' },
    { kind: 'photoText', photo: I('s03-2'), pre: '<div class="num">i.</div>', h: 'Aligned guests,<br><em>matched to you.</em>', b: 'Seekers and Facilitators looking for exactly what your place or practice holds.' },
    { kind: 'photoText', photo: I('s03-3'), pre: '<div class="num">ii.</div>', h: 'A personally<br><em>reviewed profile.</em>', b: 'We meet every space and guide before they join, so guests arrive trusting you.' },
    { kind: 'photoText', photo: I('s03-4'), pre: '<div class="num">iii.</div>', h: 'Our storytelling,<br><em>behind you.</em>', b: 'Spotlights here, on our website and at launch.' },
    { kind: 'end', photo: I('s03-5'), h: 'Free to join.<br><em>No commission.</em>', sub: 'And a voice in how Xanadu grows.<br>15 spaces · 30 guides · Nosara', cta: 'Apply to the founding circle · link in bio' },
  ],

  // Nov 18 · photo
  '08-who': [
    { kind: 'cover', photo: I('aerial'), pos: 'center 30%', eb: 'For spaces & guides in Nosara', h: 'Who we’re<br><em>looking for.</em>' },
    { kind: 'photoText', photo: I('lodge'), eb: 'Spaces', h: 'Retreat centers<br>&amp; <em>eco-lodges.</em>' },
    { kind: 'photoText', photo: I('studio'), eb: 'Spaces', h: 'Studios &amp;<br><em>open-air shalas.</em>' },
    { kind: 'photoText', photo: I('farm'), eb: 'Spaces', h: 'Land, farms<br>&amp; <em>gardens.</em>', b: 'Places that welcome volunteers and long stays.' },
    { kind: 'photoText', photo: I('breathwork'), eb: 'Guides', h: 'Teachers who<br><em>hold the room.</em>', b: 'Yoga, breathwork, meditation, sound.' },
    { kind: 'end', photo: I('surflesson'), h: 'Surf, movement<br>&amp; <em>the outdoors.</em>', sub: '15 spaces · 30 guides', cta: CTA_HOST },
  ],

  // Nov 20 · white
  '18-morning-light': [
    { kind: 'cover', tone: 'bright', photo: I('v2-porch'), eb: 'A small ritual', h: 'Step outside in the<br><em>first hour of your day.</em>' },
    { kind: 'text', bg: 'ivory', eb: 'Why it works', h: 'Morning daylight helps<br><em>set your body clock.</em>', b: 'So you wake more alert and wind down more easily at night.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">01</div>', h: 'Go outside <em>within an hour</em><br>of waking.', b: 'A balcony, a porch or the street all count.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">02</div>', h: 'Leave <em>the phone inside.</em>', b: 'Just you and the morning.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">03</div>', h: 'Stay for <em>ten minutes.</em>', b: 'Even on cloudy days, outdoor light is far brighter than indoor light.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">04</div>', h: 'Notice <em>three things.</em>', b: 'A sound, a color, the temperature of the air.' },
    { kind: 'end', bg: 'ivory', h: 'Tomorrow morning,<br><em>try it once.</em>', cta: 'Save this · send it to your morning person' },
  ],

  // Nov 23 · photo
  '07-reviewed': [
    { kind: 'cover', photo: I('path'), eb: 'Our promise', h: 'Every space is<br><em>personally reviewed.</em>' },
    { kind: 'photoText', photo: I('veranda'), pos: 'center top', pre: '<div class="num">i.</div>', h: 'We meet every space<br>and guide <em>before they join.</em>' },
    { kind: 'photoText', photo: I('kitchen'), pre: '<div class="num">ii.</div>', h: 'We learn how<br><em>they hold people.</em>', b: 'Who they’re for, how they work, and what makes the place theirs.' },
    { kind: 'text', pre: '<div class="num">iii.</div>', h: 'The ✦ on a profile<br><em>means we’ve met them.</em>' },
    { kind: 'end', photo: I('chair'), h: 'Fewer places,<br><em>chosen well.</em>', sub: 'Starting in Nosara, Costa Rica.', cta: CTA_SEEK },
  ],

  // Nov 25 · navy
  '13-week-vs-season': [
    { kind: 'cover', tone: 'navy', photo: I('bags'), eb: 'Know the difference', h: 'A week<br><em>vs a season.</em>', size: 'l' },
    { kind: 'text', eb: 'A week', h: 'You unpack.', after: '<div class="eb" style="margin:70px 0 30px">A season</div><h1>You unpack <em>once.</em></h1>' },
    { kind: 'text', eb: 'A week', h: 'You see the sights.', after: '<div class="eb" style="margin:70px 0 30px">A season</div><h1>You find <em>your café.</em></h1>' },
    { kind: 'text', eb: 'A week', h: 'You take a class.', after: '<div class="eb" style="margin:70px 0 30px">A season</div><h1>You build <em>a practice.</em></h1>' },
    { kind: 'text', eb: 'A week', h: 'You’re a guest.', after: '<div class="eb" style="margin:70px 0 30px">A season</div><h1>You’re <em>a neighbor.</em></h1>' },
    { kind: 'end', h: 'Stay a week, a month,<br><em>a season.</em>', cta: 'Save this · ' + CTA_SEEK },
  ],

  // Nov 30 · white
  '19-deliberately': [
    { kind: 'cover', tone: 'bright', photo: I('forest'), eb: 'Henry David Thoreau', h: '“I went to the woods<br>because I wished to<br><em>live deliberately.</em>”' },
    { kind: 'text', bg: 'ivory', eb: 'For a quiet evening', h: 'Five questions for<br><em>living deliberately.</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">i.</div>', h: 'What do I want<br><em>more of</em> this season?' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">ii.</div>', h: 'What am I ready<br><em>to let go of?</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">iii.</div>', h: 'Where do I feel<br><em>most alive?</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">iv.</div>', h: 'Who brings me<br><em>back to myself?</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">v.</div>', h: 'What would a <em>slower month</em><br>make room for?' },
    { kind: 'end', bg: 'ivory', h: 'Save these for<br><em>a quiet evening.</em>', cta: 'Which question stays with you?' },
  ],

  // Dec 2 · photo
  '06-a-day': [
    { kind: 'cover', photo: I('casita'), eb: 'Long stays', h: 'A day in a<br><em>season-long stay.</em>' },
    { kind: 'photoText', photo: I('meditate'), eb: '6:00', h: 'Practice as<br><em>the light comes up.</em>' },
    { kind: 'photoText', photo: I('breakfast'), eb: '9:00', h: 'Breakfast, then<br><em>a little work, or none.</em>' },
    { kind: 'photoText', photo: I('surfers'), eb: '15:00', h: '<em>The ocean.</em>' },
    { kind: 'photoText', photo: I('candles'), eb: '18:00', h: 'Circle, or sound,<br><em>or nothing at all.</em>' },
    { kind: 'end', h: 'You design the stay.<br><em>We match you.</em>', cta: CTA_SEEK },
  ],

  // Dec 7 · photo
  '11-which-stay': [
    { kind: 'cover', photo: I('lookout'), eb: 'A little quiz', h: 'Which stay<br><em>are you?</em>' },
    { kind: 'photoText', photo: I('sunriseclass'), eb: 'A · The sunrise shala', h: 'Mats out<br><em>before the sun.</em>', b: 'Daily practice, a teacher who knows you, slow afternoons.' },
    { kind: 'photoText', photo: I('paddleout'), pos: 'center top', eb: 'B · The surf month', h: 'Salt in your hair<br><em>for thirty days.</em>', b: 'Morning sessions, a coach, a crew in the water.' },
    { kind: 'photoText', photo: I('cowork'), eb: 'C · The slow remote season', h: 'Laptop open.<br><em>Hammock close.</em>', b: 'Work your hours, then the jungle takes over.' },
    { kind: 'end', h: 'A, B <em>or C?</em>', sub: 'Tell us in the comments. When the doors open, we’ll match you.', cta: CTA_SEEK },
  ],

  // Dec 9 · white
  '12-signs': [
    { kind: 'cover', tone: 'bright', photo: I('v2-hammock'), eb: 'A gentle diagnosis', h: 'Signs you need<br><em>a season,</em><br>not a vacation.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">01</div>', h: 'You come home from vacation <em>more tired than you left.</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">02</div>', h: 'You “work from anywhere.”<br><em>Anywhere is your kitchen.</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">03</div>', h: 'You’ve said “one day”<br><em>about the same place</em><br>for years.' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">04</div>', h: 'Seven days<br><em>never feels like enough.</em>' },
    { kind: 'text', bg: 'ivory', pre: '<div class="num">05</div>', h: 'You want to <em>know a place,</em><br>not just see it.' },
    { kind: 'end', bg: 'ivory', h: 'A week is a vacation.<br><em>A season is a way of living.</em>', sub: 'Send this to the friend who needs one.', cta: CTA_SEEK },
  ],
};
