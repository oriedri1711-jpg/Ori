/* Between Us — core: utils, storage, text, progress, shell */
const {CATS, CARDS, WHO_FUN} = window.BU;
const CARD = Object.fromEntries(CARDS.map(c => [c.id, c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic = (n, cls = '') => `<svg class="i ${cls}"><use href="#i-${n}"/></svg>`;
const rnd = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const dayKey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const weekKey = (d = new Date()) => { const t = new Date(d); t.setHours(0,0,0,0); t.setDate(t.getDate() - t.getDay()); return dayKey(t); };
const hashStr = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const seeded = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const pickSeeded = (arr, n, seed) => { const r = seeded(seed); const a = arr.slice(); const out = []; while (a.length && out.length < n) out.push(a.splice(Math.floor(r() * a.length), 1)[0]); return out; };
const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = s => { if (!s) return ''; const d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('he-IL', {day:'numeric', month:'long', year:'numeric'}); };

/* ───────── modes ───────── */
const MODES = {
  know:{n:'בואו להכיר מחדש', s:'שאלות שלא שאלתם אף פעם', g:['#7b5cff','#b46bff'], rules:'בכל תור אחד עונה והשני מקשיב. אפשר להחליף ולענות גם על אותה שאלה. אין תשובות נכונות, רק סקרנות.'},
  tod:{n:'אמת או חובה זוגי', s:'מצחיק, רומנטי, נועז', g:['#ff5c8a','#ff8c5a'], rules:'בכל תור בוחרים אמת או חובה. כל קלף אפשר להחליף או לדלג עליו בלי שום עונש.'},
  guess:{n:'כמה אתה באמת מכיר אותי?', s:'משחק ניחושים זוגי', g:['#1fb5a5','#5b7cff'], rules:'אחד עונה בסתר, השני מנחש. אחרי החשיפה מחליטים יחד אם זה היה בול, קרוב או פספוס, ומדברים על זה.'},
  deep:{n:'חיבור רגשי', s:'שיחה בטוחה ועמוקה', g:['#3d3fa8','#8b5cd6'], rules:'מקשיבים עד הסוף, בלי לתקן ובלי לשפוט. מותר לענות קצר, ומותר לדלג. זה משחק, לא טיפול.'},
  flirt:{n:'פלרטוט ומשיכה', s:'להחזיר את הניצוץ', g:['#ff3d7f','#b0125a'], rules:'שאלות, מחמאות, מבטים ומשימות קרבה. משימות מגע מופיעות רק לפי רמת המגע שבחרתם.'},
  adult:{n:'אינטימיות 18+', s:'נעול, מבוסס הסכמה', g:['#8a1238','#2a0a20'], rules:'כל קלף נחשף רק אחרי ששניכם אמרתם כן. אפשר לדלג, להוריד רמה או לעצור בכל רגע, בלי הסברים ובלי עונש. כן קודם לא אומר כן עכשיו.'},
  who:{n:'מי מאיתנו?', s:'מהיר, מצחיק, חושפני', g:['#ffb03a','#ff5f3a'], rules:'כל אחד בוחר בסתר מי מכם מתאים למשפט. ההתאמה מקבלת נקודות, אי ההסכמה מקבלת משימה מצחיקה.'},
  date:{n:'הדייט שלנו', s:'ערב שלם, שלב אחרי שלב', g:['#e2557c','#7e3fb0'], rules:'בונים דייט לפי זמן, מקום, תקציב ומצב רוח, ועוברים בו שלב אחרי שלב: מפתיחה ועד רגע סיום.'},
  dil:{n:'דילמות זוגיות', s:'מה הייתם בוחרים?', g:['#00a3c4','#6a5cff'], rules:'כל אחד בוחר בסתר. אחרי החשיפה מגלים אם אתם על אותו גל, ומדברים על הסיבות.'},
  mem:{n:'הזיכרונות שלנו', s:'חידון על הסיפור שלכם', g:['#d19a5b','#8a4f44'], rules:'הקלפים נבנים מהזיכרונות שהוספתם. ככל שתוסיפו יותר, המשחק יהיה אישי יותר.'},
  mix:{n:'סבב הפתעה', s:'קלפים מכל העולמות', g:['#ff9b3a','#e0457b'], rules:'המשחק בוחר באקראי מתוך הקטגוריות והסגנון שבחרתם. כל קלף הוא הפתעה.'}
};
const MODE_EXTRA = {mis:{g:['#3fbf7f','#23848c']}, sur:{g:['#ffd36b','#ff9b3a']}, end:{g:['#ff5c8a','#6a2bb0']}, gold:{g:['#ffcf5a','#e07b20']}, saved:{g:['#5c6bff','#c2185b']}, cat:{g:['#7b5cff','#ff5c8a']}};
const modeG = m => (MODES[m] || MODE_EXTRA[m] || MODES.mix).g;
const gstyle = m => { const g = modeG(m); return `--g1:${g[0]};--g2:${g[1]}`; };

const VIBES = {light:'קליל', funny:'מצחיק', romantic:'רומנטי', deep:'עמוק', emotional:'רגשי', flirty:'פלרטטני', bold:'נועז', intimate:'אינטימי', mix:'מעורב'};
const DURS = [[5,'5 דק׳'],[15,'15 דק׳'],[30,'30 דק׳'],[45,'45 דק׳'],[60,'שעה'],[0,'ללא הגבלה']];
const TOUCH = ['ללא מגע','מגע עדין','מגע רומנטי','מגע אינטימי'];
const BOUNDS = {kiss:'נשיקות', photo:'משימות צילום', past:'שאלות על קשרים קודמים', family:'משפחה והורות', body:'שאלות על הגוף והמראה', food:'משימות עם אוכל', out:'משימות מחוץ לבית', phone:'אתגרים בלי טלפון'};
const RELS = ['בתחילת הדרך','בזוגיות','גרים יחד','מאורסים','נשואים','בקשר מרחוק','לא רוצים להגדיר'];
const ADULT_LV = ['','רומנטית וחושנית','נועזת ופלרטטנית','אינטימית','נועזת במיוחד'];
const RANKS = [[0,'ניצוץ'],[120,'משיכה'],[300,'להבה'],[600,'קרבה'],[1000,'שותפות'],[1600,'בית'],[2500,'נשמות תאומות'],[4000,'אגדה זוגית']];
const MEM_T = {met:'היום שנפגשנו', first_date:'הדייט הראשון', first_kiss:'הנשיקה הראשונה', joke:'בדיחה פנימית', funny:'רגע מצחיק', trip:'טיול', song:'שיר שלנו', gift:'מתנה', milestone:'אירוע משמעותי', overcome:'רגע של התגברות', dream:'חלום משותף', keep:'משהו לזכור', game:'מהמשחק', letter:'מכתב לעתיד'};
const MEM_I = {met:'spark', first_date:'cal', first_kiss:'heart', joke:'smile', funny:'smile', trip:'target', song:'music', gift:'gift', milestone:'star', overcome:'shield', dream:'moon', keep:'bm', game:'cards', letter:'note'};

/* ───────── state ───────── */
const KEY = 'betweenUs.v1', PKEY = 'betweenUs.photos';
const DEF = () => ({v:1, onboard:false,
  couple:{name:'', p:[{name:'',g:'m'},{name:'',g:'f'}], rel:'', since:'', created:Date.now()},
  set:{vibe:'mix', dur:30, touch:2, fav:[], hide:[], bounds:{kiss:1,photo:1,past:1,family:1,body:1,food:1,out:1,phone:1}, limits:['',''],
       adult:{on:false, max:1, ok:[[0,0],[0,0]]}, reveal:'special', sound:true, haptic:true, ui:'dark', motion:true, hideAdult:false, pin:'', discreet:false, cloud:true, play:'one', pushNote:true},
  prog:{pts:0, st:{cards:0,ans:0,tasks:0,comps:0,games:0,mins:0,dates:0,mems:0,mis:0,bull:0,match:0,surprise:0,myst:0,nophone:0,deep:0,remote:0,longest:0,modes:[]}, ach:{}, seen:{}, days:[], claimed:{}},
  fav:[], saved:[], notes:{}, react:{}, reported:{}, mem:[], misLog:[], journal:[], cur:null, daily:{}, ev:[], last:null, pet:null, room:null, roomAuth:false});
let S;
function deepMerge(base, add) { for (const k in base) { if (add[k] === undefined) add[k] = base[k]; else if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && add[k] && typeof add[k] === 'object') deepMerge(base[k], add[k]); } return add; }
function load() { let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} S = deepMerge(DEF(), raw || {}); }
let photos = {}; try { photos = JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) {}
let saveT = 0, storeOK = true;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); storeOK = true; } catch (e) { storeOK = false; } cloudSave(); }, 250); }
function savePhotos() { try { localStorage.setItem(PKEY, JSON.stringify(photos)); return true; } catch (e) { toast('אין מספיק מקום לתמונה הזאת במכשיר', 'info'); return false; } }

/* ───────── cloud backup (private, per Claude account) ───────── */
const CLOUD = {db:null, ref:null, state:'checking', ts:0};
let cloudT = 0;
async function cloudInit() {
  try {
    if (!window.claude || !window.claude.use) { CLOUD.state = 'off'; return; }
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) { CLOUD.state = 'off'; return; }
    const id = await user.id(); if (!id) { CLOUD.state = 'off'; return; }
    CLOUD.db = db; CLOUD.ref = db.doc('data/users/' + id + '/state');
    const snap = await Promise.race([CLOUD.ref.get(), new Promise((_, r) => setTimeout(() => r('t'), 10000))]);
    CLOUD.state = 'on';
    if (snap && snap.exists) { const d = snap.data(); CLOUD.ts = d.ts || 0; CLOUD.remote = d.json; if (!S.onboard && d.json) { try { S = deepMerge(DEF(), JSON.parse(d.json)); save(); toast('ההתקדמות שלכם שוחזרה מהגיבוי', 'info'); route(); } catch (e) {} } }
  } catch (e) { CLOUD.state = 'off'; }
  if (cur().name === 'settings' || cur().name === 'privacy') render();
}
function cloudSave() {
  if (!CLOUD.ref || !S.set.cloud || CLOUD.state !== 'on') return;
  clearTimeout(cloudT);
  cloudT = setTimeout(async () => { try { const ts = Date.now(); await CLOUD.ref.set({json: JSON.stringify(S), ts}); CLOUD.ts = ts; } catch (e) { CLOUD.state = 'err'; } }, 5000);
}

/* ───────── gendered text ───────── */
function fmt(t, who = 0) {
  const P = PP(), me = P[who] || P[0], pa = P[1 - who] || P[1];
  const pick = (g, a, b) => g === 'f' ? b : g === 'm' ? a : (a === b ? a : a + '/' + b);
  return String(t)
    .replace(/\[([^\]|]*)\|([^\]]*)\]/g, (_, a, b) => pick(me.g, a, b))
    .replace(/\{([^}|]*)\|([^}]*)\}/g, (_, a, b) => pick(pa.g, a, b))
    .replace(/\{n\}/g, me.name || 'את/ה').replace(/\{p\}/g, pa.name || 'בן/בת הזוג');
}
const PP = () => (typeof R !== 'undefined' && R.live && !R.host && R.names) || (S.room && !S.room.host && S.room.names) || S.couple.p;
const gw = (i, m, f) => { const g = (((PP())[i]) || {}).g; return g === 'f' ? f : g === 'm' ? m : m + '/' + f; };
const nm = i => ((PP())[i] || {}).name || (i ? 'שחקן/ית 2' : 'שחקן/ית 1');

/* ───────── progress ───────── */
const rankOf = pts => { let i = 0; RANKS.forEach((r, k) => { if (pts >= r[0]) i = k; }); return i; };
const goldOpen = () => rankOf(S.prog.pts) >= 2;
function logEv(t, n = 1) { S.ev.push({t, ts: Date.now(), n}); if (S.ev.length > 800) S.ev = S.ev.slice(-800); }
function markDay() { const d = dayKey(); if (!S.prog.days.includes(d)) { S.prog.days.push(d); if (typeof streakCheck === 'function') streakCheck(); } }
function addPts(n, silent) {
  if (!n) return; const before = rankOf(S.prog.pts); S.prog.pts += n;
  if (!silent) floatPts('+' + n);
  const after = rankOf(S.prog.pts);
  if (after > before) setTimeout(() => { confetti(); toast(`עליתם דרגה: ${RANKS[after][1]}!` + (after === 2 ? ' אוסף הזהב נפתח.' : ''), 'rank'); sfx('ach'); }, 700);
  save();
}
const ACH = [
  ['first_game','הסיבוב הראשון','שיחקתם משחק ראשון',st=>st.games>=1,'play'],
  ['first_date','הדייט הראשון במשחק','השלמתם דייט שלם',st=>st.dates>=1,'cal'],
  ['q10','10 שאלות שנענו','התחלתם לדבר באמת',st=>st.ans>=10,'smile'],
  ['q50','50 שאלות','שיחה שלא נגמרת',st=>st.ans>=50,'smile'],
  ['q150','150 שאלות','אתם יודעים הכל. כמעט.',st=>st.ans>=150,'book'],
  ['t5','5 משימות משותפות','עשיתם, לא רק דיברתם',st=>st.tasks>=5,'check'],
  ['t25','צוות מנצח','25 משימות משותפות',st=>st.tasks>=25,'trophy'],
  ['c10','10 מחמאות','מישהו פה מרגיש אהוב',st=>st.comps>=10,'heart'],
  ['hour','משחק של שעה','שעה שלמה רק שלכם',st=>st.longest>=60,'clock'],
  ['m300','חמש שעות ביחד','מצטבר במשחק',st=>st.mins>=300,'clock'],
  ['mem1','זיכרון ראשון','יצרתם זיכרון משותף',st=>st.mems>=1,'album'],
  ['mem10','אלבום זוגי','10 זיכרונות שמורים',st=>st.mems>=10,'album'],
  ['bull','קוראים מחשבות','ניחוש בול ראשון',st=>st.bull>=1,'target'],
  ['bull10','טלפתיה זוגית','10 ניחושים בול',st=>st.bull>=10,'target'],
  ['surprise','גילוי מפתיע','גיליתם תשובה שלא ציפיתם לה',st=>st.surprise>=1,'spark'],
  ['match10','על אותו גל','10 התאמות בבחירות',st=>st.match>=10,'wifi'],
  ['nophone','דייט בלי טלפונים','השלמתם אתגר בלי מסכים',st=>st.nophone>=1,'phone'],
  ['mis5','משימות מחוץ למשחק','5 משימות זוגיות בחיים',st=>st.mis>=5,'target'],
  ['mis30','שגרה של אהבה','30 משימות זוגיות',st=>st.mis>=30,'fire'],
  ['deep10','צוללים לעומק','10 שאלות עמוקות במיוחד',st=>st.deep>=10,'moon'],
  ['myst','קלף מסתורי','מצאתם קלף הפתעה',st=>st.myst>=1,'dice'],
  ['remote','קרובים גם מרחוק','שיחקתם בשני טלפונים',st=>st.remote>=1,'wifi'],
  ['modes6','מגלי עולמות','שיחקתם 6 מצבים שונים',st=>(st.modes||[]).length>=6,'cards'],
  ['cat','השלמת קטגוריה','ראיתם את כל הקלפים בקטגוריה',()=>catDone()>0,'star'],
  ['days7','שבעה ערבים','שיחקתם בשבעה ימים שונים',()=>S.prog.days.length>=7,'cal'],
  ['fav10','אספנים','10 קלפים במועדפים',()=>S.fav.length>=10,'heart'],
  ['journal','פרק ביומן','שמרתם משחק ביומן הזוגי',()=>S.journal.length>=1,'book'],
  ['goldp','אוסף הזהב','פתחתם את קלפי הזהב',()=>goldOpen(),'star'],
  ['streak3','שלושה ימים ברצף','חזרתם שלושה ימים',()=>(S.prog.best||0)>=3,'fire'],
  ['streak7','שבוע של אש','רצף של שבעה ימים',()=>(S.prog.best||0)>=7,'fire'],
  ['streak30','חודש של אהבה','רצף של 30 ימים',()=>(S.prog.best||0)>=30,'fire'],
  ['hatch','בקיעה ראשונה','החיה הראשונה שלכם בקעה',st=>(st.hatched||0)>=1,'gift'],
  ['rarepet','מגלי נדירים','מצאתם חיה Rare או נדירה יותר',()=>S.pet&&Object.keys(S.pet.dex||{}).some(k=>['rare','epic','legendary','lovers'].includes(SP[k].r)),'star'],
  ['loverspet','Lovers','מצאתם זוג נאהבים',()=>S.pet&&Object.keys(S.pet.dex||{}).some(k=>SP[k].r==='lovers'),'heart']
];
function catDone() { let n = 0; for (const c in CATS) { const ids = CARDS.filter(x => x.c === c); if (ids.length >= 3 && ids.every(x => S.prog.seen[x.id])) n++; } return n; }
let newAch = [];
function checkAch() {
  const st = S.prog.st; const got = [];
  ACH.forEach(a => { if (!S.prog.ach[a[0]] && a[3](st)) { S.prog.ach[a[0]] = Date.now(); got.push(a); } });
  got.forEach((a, i) => setTimeout(() => { toast(`<b>הישג חדש: ${a[1]}</b><br><span class="mut sm">${a[2]}</span>`, 'ach', a[4]); confetti(); sfx('ach'); }, 500 + i * 1600));
  if (got.length) { newAch.push(...got.map(a => a[0])); addPts(got.length * 20, true); save(); }
  return got;
}

/* ───────── weekly challenges & missions ───────── */
const WEEKLY = [
  ['games3','שחקו 3 משחקים השבוע','game',3],['mis4','השלימו 4 משימות זוגיות','mis',4],['mem2','הוסיפו 2 זיכרונות','mem',2],
  ['comp8','8 מחמאות במשחק','comp',8],['date1','דייט אחד מהמשחק','date',1],['deep5','5 שאלות עמוקות','deep',5],
  ['guess6','6 סבבי ניחוש','guess',6],['ans25','ענו על 25 שאלות','ans',25],['task8','8 משימות במשחק','task',8]
];
const weekChallenges = () => pickSeeded(WEEKLY, 3, hashStr(weekKey()));
function weekCount(metric) { const ws = new Date(weekKey()).getTime(); return S.ev.filter(e => e.t === metric && e.ts >= ws).reduce((s, e) => s + (e.n || 1), 0); }
const missionsAll = k => CARDS.filter(c => c.c === k && allowedTags(c));
const todayMissions = () => pickSeeded(missionsAll('mdaily'), 3, hashStr(dayKey()));
const weekMission = () => pickSeeded(missionsAll('mweek'), 1, hashStr(weekKey() + 'w'))[0];
const misDone = (id, period) => S.misLog.some(l => l.id === id && l.p === period);

/* ───────── filtering ───────── */
function allowedTags(c) {
  const b = S.set.bounds;
  for (const t of c.tags) { if (b[t] === 0) return false; }
  if (c.tl > S.set.touch) return false;
  return true;
}
function allowed(c, o = {}) {
  if (S.reported[c.id]) return false;
  if (!o.ignoreHide && S.set.hide.includes(c.c)) return false;
  if (!allowedTags(c)) return false;
  if (c.m === 'adult' && (!S.set.adult.on || c.d > (o.level || S.set.adult.max))) return false;
  if (c.m === 'gold' && !goldOpen()) return false;
  return true;
}

/* ───────── sound & haptics ───────── */
let AC = null;
function sfx(kind) {
  if (!S.set.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const notes = {tap:[[660,.04]], flip:[[420,.05],[620,.06]], ok:[[523,.08],[784,.12]], ach:[[523,.09],[659,.09],[784,.09],[1046,.18]], skip:[[300,.07]], reveal:[[392,.07],[523,.07],[659,.14]]}[kind] || [[500,.05]];
    let t = AC.currentTime;
    notes.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d + .08); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .1); t += d * .9; });
  } catch (e) {}
}
const buzz = (ms = 12) => { if (S.set.haptic && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} };

/* ───────── fx ───────── */
function confetti(n = 70) {
  if (!S.set.motion) return;
  const w = document.createElement('div'); w.className = 'conf';
  const cols = ['#ff5c8a','#ffc46b','#b46bff','#46d39a','#fff','#ff8c5a'];
  for (let i = 0; i < n; i++) { const p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = rnd(cols); p.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px'); p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); p.style.animationDelay = Math.random() * .35 + 's'; w.appendChild(p); }
  document.body.appendChild(w); setTimeout(() => w.remove(), 2600);
}
function floatPts(t) { const e = document.createElement('div'); e.className = 'plus'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 1200); }
let toastT = 0;
function toast(html, kind = 'info', icon) {
  $$('.toast').forEach(t => t.remove());
  const e = document.createElement('div'); e.className = 'toast'; e.setAttribute('role', 'status');
  const iconHtml = kind === 'ach' || kind === 'rank' ? `<div class="badge" style="width:44px;height:44px;border-radius:14px">${ic(icon || 'trophy')}</div>` : `<div class="ico">${ic(kind === 'err' ? 'info' : 'spark')}</div>`;
  e.innerHTML = iconHtml + `<div class="sp">${html}</div>`;
  e.onclick = () => e.remove();
  document.body.appendChild(e); clearTimeout(toastT); toastT = setTimeout(() => e.remove(), kind === 'ach' ? 3400 : 2600);
}

/* ───────── sheets ───────── */
function sheet(html, onMount) {
  closeSheet();
  const s = document.createElement('div'); s.className = 'scrim'; s.onclick = closeSheet;
  const b = document.createElement('div'); b.className = 'sheet'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-modal', 'true');
  b.innerHTML = '<div class="grab"></div>' + html;
  document.body.append(s, b);
  b.addEventListener('click', e => { const a = e.target.closest('[data-close]'); if (a) closeSheet(); });
  onMount && onMount(b);
  const f = b.querySelector('input,textarea'); if (f && !f.dataset.nofocus) setTimeout(() => f.focus(), 300);
  return b;
}
function closeSheet() { $$('.scrim,.sheet').forEach(e => e.remove()); }
function confirmSheet(title, text, yes, fn, danger) {
  sheet(`<h2>${title}</h2><p class="mut mt">${text}</p><div class="col mt2"><button class="btn wide ${danger ? '' : ''}" id="cy">${yes}</button><button class="btn soft wide" data-close>ביטול</button></div>`, b => { $('#cy', b).onclick = () => { closeSheet(); fn(); }; });
}
async function copyText(t) { try { await navigator.clipboard.writeText(t); toast('הועתק'); } catch (e) { sheet(`<h3>העתיקו ידנית</h3><textarea class="inp mt" readonly data-nofocus="1">${esc(t)}</textarea><button class="btn soft wide mt" data-close>סגירה</button>`); } }

/* ───────── router ───────── */
let stack = [{name:'home'}];
const cur = () => stack[stack.length - 1];
const NAV = [['home','בית','home'],['modes','משחקים','cards'],['missions','משימות','target'],['memories','זיכרונות','album'],['profile','אנחנו','user']];
function go(name, params = {}, replace) { closeSheet(); if (NAV.some(n => n[0] === name)) stack = [{name, ...params}]; else if (replace) stack[stack.length - 1] = {name, ...params}; else stack.push({name, ...params}); sfx('tap'); render(); window.scrollTo(0, 0); }
function back() { closeSheet(); if (stack.length > 1) stack.pop(); else stack = [{name:'home'}]; render(); window.scrollTo(0, 0); }
const SCREENS = {};
const NONAV = new Set(['game','end','onboard','splash','datebuild','adultgate','remote','lock','gate']);
function render() {
  const app = $('#app'); const c = cur();
  applyUI();
  if (!S.onboard && c.name !== 'onboard') { stack = [{name:'splash'}]; }
  else if (S.onboard && !S.roomAuth && cur().name !== 'gate') { stack = [{name:'gate'}]; }
  const name = cur().name; const fn = SCREENS[name] || SCREENS.home;
  const hideNav = NONAV.has(name);
  app.className = hideNav ? 'nonav' : '';
  const ae = document.activeElement; const keep = ae && ae.id && /^(TEXTAREA|INPUT)$/.test(ae.tagName) && app.contains(ae) ? [ae.id, ae.selectionStart, ae.selectionEnd] : null;
  app.innerHTML = fn(cur()) + (hideNav ? '' : navHtml(name));
  if (keep) { const n = document.getElementById(keep[0]); if (n) { try { n.focus({preventScroll: true}); n.setSelectionRange(keep[1], keep[2]); } catch (e) {} } }
  (SCREENS[name + '_mount'] || (() => {}))(cur());
}
function navHtml(active) {
  const root = stack[0].name;
  return `<nav class="nav" aria-label="ניווט ראשי">${NAV.map(n => `<button data-go="${n[0]}" class="${root === n[0] ? 'on' : ''}" aria-current="${root === n[0] ? 'page' : 'false'}">${ic(n[2])}<span>${n[1]}</span></button>`).join('')}</nav>`;
}
const topbar = (title, right = '') => `<header class="top"><button class="ib" data-act="back" aria-label="חזרה">${ic('back')}</button><h2>${title}</h2>${right}</header>`;
function applyUI() {
  const r = document.documentElement;
  const ui = S.set.ui === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : S.set.ui;
  r.dataset.ui = ui; r.classList.toggle('nomotion', !S.set.motion);
}
/* event delegation: handlers registered by screens */
const ACT = {};
function onClick(e) {
  const g = e.target.closest('[data-go]'); if (g) { const p = g.dataset.p ? JSON.parse(g.dataset.p) : {}; go(g.dataset.go, p); return; }
  const a = e.target.closest('[data-act]'); if (a && ACT[a.dataset.act]) { buzz(8); ACT[a.dataset.act](a, e); }
}
function onInput(e) { const a = e.target.closest('[data-in]'); if (a && ACT[a.dataset.in]) ACT[a.dataset.in](a, e); }
function onChange(e) { const a = e.target.closest('[data-ch]'); if (a && ACT[a.dataset.ch]) ACT[a.dataset.ch](a, e); }
document.addEventListener('click', onClick);
document.addEventListener('input', onInput);
document.addEventListener('change', onChange);
ACT.back = () => back();

/* art helpers */
const ringsArt = (cls = 'art', color = 'rgba(255,255,255,.9)') => `<svg class="${cls}" viewBox="0 0 200 200" style="color:${color}"><use href="#rings"/></svg>`;
function modeArt(m) {
  const arts = {
    know:'<circle cx="60" cy="60" r="34" fill="rgba(255,255,255,.18)"/><text x="60" y="76" font-size="46" text-anchor="middle" fill="#fff" font-family="Fredoka" font-weight="700">?</text><circle cx="98" cy="30" r="12" fill="rgba(255,255,255,.3)"/>',
    tod:'<rect x="30" y="22" width="44" height="62" rx="9" fill="rgba(255,255,255,.25)" transform="rotate(-12 52 53)"/><rect x="56" y="26" width="44" height="62" rx="9" fill="rgba(255,255,255,.4)" transform="rotate(10 78 57)"/>',
    guess:'<circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="6"/><circle cx="60" cy="60" r="22" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="6"/><circle cx="60" cy="60" r="8" fill="#fff"/>',
    deep:'<path d="M20 70c14-14 26-14 40 0s26 14 40 0" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="6" stroke-linecap="round"/><path d="M20 90c14-14 26-14 40 0s26 14 40 0" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="6" stroke-linecap="round"/><circle cx="84" cy="34" r="14" fill="rgba(255,255,255,.35)"/>',
    flirt:'<path d="M60 96S22 74 22 48c0-14 18-22 38-4 20-18 38-10 38 4 0 26-38 48-38 48z" fill="rgba(255,255,255,.3)"/><path d="M84 30l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fff"/>',
    adult:'<circle cx="60" cy="58" r="34" fill="rgba(255,255,255,.12)"/><path d="M60 30c10 14 22 20 22 34a22 22 0 0 1-44 0c0-14 12-20 22-34z" fill="rgba(255,120,150,.7)"/>',
    who:'<circle cx="44" cy="52" r="20" fill="rgba(255,255,255,.35)"/><circle cx="80" cy="52" r="20" fill="rgba(255,255,255,.22)"/><path d="M40 94a24 18 0 0 1 48 0" fill="rgba(255,255,255,.3)"/>',
    date:'<path d="M36 28h48l-6 28a18 18 0 0 1-36 0z" fill="rgba(255,255,255,.3)"/><path d="M60 74v18M46 94h28" stroke="#fff" stroke-width="5" stroke-linecap="round"/>',
    dil:'<path d="M60 96V54M60 54L34 26M60 54l26-28" stroke="rgba(255,255,255,.6)" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="34" cy="26" r="9" fill="#fff"/><circle cx="86" cy="26" r="9" fill="rgba(255,255,255,.5)"/>',
    mem:'<rect x="26" y="30" width="54" height="54" rx="8" fill="rgba(255,255,255,.25)" transform="rotate(-8 53 57)"/><rect x="44" y="36" width="54" height="54" rx="8" fill="rgba(255,255,255,.4)" transform="rotate(8 71 63)"/>',
    mix:'<path d="M60 18l9 26 26 9-26 9-9 26-9-26-26-9 26-9z" fill="rgba(255,255,255,.45)"/><circle cx="96" cy="88" r="8" fill="#fff"/>'
  };
  return `<svg class="art" viewBox="0 0 120 120" aria-hidden="true">${arts[m] || arts.mix}</svg>`;
}
