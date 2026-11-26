/* Between Us — arcade: pet mini-games, weekly top score + prize, pet shop */

const STAGE_X = [1, 1.15, 1.3];           /* coin bonus per growth stage */
const GAMES = {
  hop:  {n: 'קפצון', e: '🚦', d: 'קופצים קדימה בין כבישים, נהרות ובולי עץ. כל שורה היא נקודה.', how: 'הקישו כדי לקפוץ קדימה, החליקו לצדדים או אחורה. אפשר גם עם החצים.'},
  rain: {n: 'גשם לבבות', e: '💗', d: 'תופסים לבבות שנופלים מהשמיים ומתחמקים מלבבות שבורים.', how: 'גררו את האצבע ימינה ושמאלה. ❤️ נקודה, 💖 שלוש, 💔 מוריד לב.'}
};
const PRIZES = ['עיסוי של 15 דקות', 'ארוחת בוקר במיטה', 'בחירת הסרט הבא', 'ערב בלי כלים', 'דייט לבחירת המנצח/ת', 'גלידה עליי', 'יום בלי לקום ראשון'];
const SHOP = {
  food: [
    {id: 'apple',  e: '🍎', n: 'תפוח',            g: 3,  p: 25},
    {id: 'cookie', e: '🍪', n: 'עוגייה',           g: 6,  p: 45},
    {id: 'cake',   e: '🍰', n: 'עוגת חגיגה',       g: 12, p: 80},
    {id: 'potion', e: '🧪', n: 'שיקוי גדילה',      g: 25, p: 150}
  ],
  acc: [
    {id: 'bow',     e: '🎀', n: 'פפיון',        p: 50,  s: 'head', min: 0},
    {id: 'flower',  e: '🌸', n: 'פרח',          p: 50,  s: 'head', min: 0},
    {id: 'heart',   e: '💗', n: 'לב מרחף',      p: 70,  s: 'side', min: 0},
    {id: 'scarf',   e: '🧣', n: 'צעיף',         p: 90,  s: 'neck', min: 1},
    {id: 'cap',     e: '🧢', n: 'כובע מצחייה',  p: 90,  s: 'head', min: 1},
    {id: 'glasses', e: '🕶️', n: 'משקפי שמש',   p: 110, s: 'eyes', min: 1},
    {id: 'tophat',  e: '🎩', n: 'מגבעת',        p: 160, s: 'head', min: 2},
    {id: 'crown',   e: '👑', n: 'כתר',          p: 300, s: 'head', min: 2}
  ],
  bg: [
    {id: 'sunset', e: '🌅', n: 'שקיעה',   c: ['#ff9a62', '#c2185b'], p: 120},
    {id: 'forest', e: '🌲', n: 'יער',     c: ['#3fae6a', '#145a3a'], p: 120},
    {id: 'sea',    e: '🌊', n: 'ים',      c: ['#4fc3f7', '#1a4fa0'], p: 120},
    {id: 'candy',  e: '🍭', n: 'ממתקים',  c: ['#ffb3d9', '#9b5cff'], p: 150},
    {id: 'space',  e: '🌌', n: 'חלל',     c: ['#3a2a7a', '#0b0820'], p: 150}
  ],
  boost: [
    {id: 'shield', e: '🛡️', n: 'מגן',      d: 'קפצון: מציל פעם אחת ממכונית או מהמים', p: 40},
    {id: 'magnet', e: '🧲', n: 'מגנט',     d: 'גשם לבבות: תפיסה רחבה יותר לכל הסיבוב', p: 40},
    {id: 'life',   e: '💞', n: 'לב נוסף',  d: 'גשם לבבות: מתחילים עם 4 לבבות במקום 3', p: 35}
  ]
};
const ACC = Object.fromEntries(SHOP.acc.map(a => [a.id, a]));
const BGS = Object.fromEntries(SHOP.bg.map(b => [b.id, b]));
const SHOP_TABS = [['food', 'אוכל וגדילה'], ['acc', 'אביזרים'], ['bg', 'רקעים'], ['boost', 'שדרוגים למשחק']];

/* ───────── state ───────── */
function arc() {
  if (!S.arc) S.arc = {coins: 0, earned: 0, inv: {}, eq: {}, bg: {}, boost: {}, best: {}, rec: {}, seen: {}};
  const A = S.arc; ['inv', 'eq', 'bg', 'boost', 'best', 'rec', 'seen'].forEach(k => { if (!A[k] || typeof A[k] !== 'object') A[k] = {}; });
  A.coins = Math.max(0, Math.floor(+A.coins || 0));
  [0, 1].forEach(i => { const r = A.rec[i] = A.rec[i] || {}; r.w = r.w || {}; r.done = r.done || {}; r.prize = r.prize || ''; r.ts = +r.ts || 0; });
  return A;
}
const arcPet = () => { const P = petState(); return P.pets.find(p => p.id === P.active) || P.pets[0] || null; };
const myRec = () => arc().rec[meSlot()];
const ptRec = () => arc().rec[1 - meSlot()];
const wkTot = (r, wk) => { const w = (r && r.w && r.w[wk]) || {}; return (w.hop || 0) + (w.rain || 0); };
const prevWk = () => weekKey(new Date(Date.now() - 7 * 864e5));
const prizeOf = i => arc().rec[i].prize || 'פרס לבחירת המנצח/ת';
function wkWinner(wk) { const a = wkTot(arc().rec[0], wk), b = wkTot(arc().rec[1], wk); if (!a && !b) return null; if (a === b) return 'tie'; return a > b ? 0 : 1; }
function wkLeft() {
  const t = new Date(weekKey() + 'T00:00:00'); t.setDate(t.getDate() + 7); const ms = Math.max(0, t - Date.now());
  const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5);
  return d ? `${d} ימים ו-${h} שעות` : `${h} שעות`;
}
function winsCount() {
  const A = arc(), cw = weekKey(), wks = new Set([...Object.keys(A.rec[0].w), ...Object.keys(A.rec[1].w)]); const n = [0, 0];
  wks.forEach(k => { if (k >= cw) return; const w = wkWinner(k); if (w === 0 || w === 1) n[w]++; }); return n;
}
const ownedN = () => Object.keys(arc().inv).length;

/* growth helpers used by the pet screen */
function petSprite(p, size = 120, cls = '') {
  const eq = arc().eq[p.id] || {}; const st = petStage(p);
  const parts = Object.entries(eq).map(([s, id]) => ACC[id] ? `<span class="acc acc-${s}">${ACC[id].e}</span>` : '').join('');
  return `<span class="petw ${cls}" style="font-size:${size}px">${sprite(p.sp, size)}${parts}${st === 0 ? '<span class="acc acc-baby">🍼</span>' : ''}</span>`;
}
const petBg = p => { const b = BGS[arc().bg[p.id]]; return b ? b.c : null; };
function petGrow(p, n) {
  const b = petStage(p); p.care = Math.max(0, p.care + n); const a = petStage(p); save();
  if (a > b) setTimeout(() => { toast(`<b>${esc(p.name || SP[p.sp].n)} גדל!</b><br><span class="mut sm">שלב חדש: ${STAGE_E[a]} ${STAGES[a][1]}</span>`, 'ach', 'heart'); confetti(); sfx('ach'); }, 350);
}
function petLinks() {
  return `<div class="grid2 mt"><button class="btn" data-go="arcade">🎮 משחקים</button><button class="btn soft" data-go="shop">🛍️ חנות · 🪙 ${arc().coins}</button></div>`;
}

/* every task point also earns coins */
{ const _pf = petFeed; petFeed = function (n, silent) { _pf(n, silent); if (n) { const A = arc(); A.coins = Math.max(0, A.coins + n * 5); save(); } }; }

function arcEarn(raw) { const p = arcPet(); const m = p ? STAGE_X[petStage(p)] : 1; const n = Math.round(raw * m); const A = arc(); A.coins += n; A.earned = (A.earned || 0) + n; save(); return n; }

/* ───────── sync with the partner (live room + offline mailbox) ───────── */
function arcFields() {
  const r = myRec(); const pick = o => { const x = {}; Object.keys(o).sort().slice(-8).forEach(k => x[k] = o[k]); return x; };
  return {s: meSlot(), w: pick(r.w), prize: r.prize, done: pick(r.done), ts: r.ts};
}
function arcPush(note) { try { ansSync(); } catch (e) {} if (typeof relayPost === 'function') relayPost('arc', arcFields(), note || undefined); }
function arcMerge(x) {
  if (!x || typeof x !== 'object') return; const pt = 1 - meSlot(); if (x.s !== undefined && x.s !== pt) return;
  const A = arc(), c0 = A.rec[pt]; if ((+x.ts || 0) <= c0.ts) return;
  const okK = k => /^\d{4}-\d{2}-\d{2}$/.test(k), n = v => Math.max(0, Math.min(99999, Math.floor(+v || 0)));
  const wk = weekKey(), before = wkTot(c0, wk), w = Object.assign({}, c0.w), done = Object.assign({}, c0.done);
  if (x.w && typeof x.w === 'object') Object.keys(x.w).filter(okK).forEach(k => { const v = x.w[k] || {}, o = w[k] || {}; w[k] = {hop: Math.max(n(v.hop), o.hop || 0), rain: Math.max(n(v.rain), o.rain || 0)}; });
  if (x.done && typeof x.done === 'object') Object.keys(x.done).filter(okK).forEach(k => { done[k] = +x.done[k] || Date.now(); });
  Object.keys(w).sort().slice(0, -26).forEach(k => delete w[k]);
  A.rec[pt] = {w, done, prize: String(x.prize || '').slice(0, 80), ts: +x.ts};
  save();
  const after = wkTot(A.rec[pt], wk), mine = wkTot(myRec(), wk);
  if (after > before && after > mine && before <= mine && petState().pets.length) toast(`🏆 <b>${esc(nm(pt))} ${gw(pt, 'עקף', 'עקפה')} אותך בטופ סקור השבועי</b><br><span class="mut sm">${after} מול ${mine}. יש לך עד סוף השבוע לענות</span>`, 'info');
  if (['arcade', 'home', 'shop'].includes(cur().name) && !$('.sheet') && !GM && !(document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName))) render();
}
if (typeof loveFields === 'function') { const _lf = loveFields; loveFields = function () { return Object.assign(_lf(), {ar: arcFields()}); }; }
if (typeof loveLobby === 'function') { const _ll = loveLobby; loveLobby = function (p) { _ll(p); if (p && p.ar) arcMerge(p.ar); }; }

function arcScore(g, sc) {
  const A = arc(), r = myRec(), wk = weekKey(), me = meSlot();
  const newBest = sc > (A.best[g] || 0); A.best[g] = Math.max(A.best[g] || 0, sc);
  r.w[wk] = r.w[wk] || {}; let wkBest = false;
  if (sc > (r.w[wk][g] || 0)) {
    const was = wkTot(r, wk), pt = wkTot(ptRec(), wk); r.w[wk][g] = sc; r.ts = Date.now(); wkBest = true;
    Object.keys(r.w).sort().slice(0, -26).forEach(k => delete r.w[k]);
    const now = wkTot(r, wk);
    arcPush(now > pt && was <= pt && pt > 0 ? `🏆 ${nm(me)} ${gw(me, 'עקף', 'עקפה')} אותך בטופ סקור השבועי (${now} מול ${pt})` : '');
  }
  save(); return {newBest, wkBest};
}

/* once a week: announce last week's winner */
function arcWeekCheck() {
  if (!S.room || !petState().pets.length) return; const A = arc(), pw = prevWk();
  if (A.seen[pw]) return; const w = wkWinner(pw); A.seen[pw] = 1; save(); if (w === null) return;
  const me = meSlot();
  if (w === 'tie') return toast('🤝 <b>תיקו בטופ סקור של השבוע שעבר!</b><br><span class="mut sm">שבוע חדש התחיל, השיאים התאפסו</span>', 'info');
  toast(w === me ? `🏆 <b>${gw(me, 'ניצחת', 'ניצחת')} בשבוע שעבר!</b><br><span class="mut sm">הפרס מ${esc(nm(1 - me))}: ${esc(prizeOf(1 - me))}</span>` : `🏆 <b>${esc(nm(w))} ${gw(w, 'ניצח', 'ניצחה')} בשבוע שעבר</b><br><span class="mut sm">הפרס ש${gw(me, 'אתה נותן', 'את נותנת')}: ${esc(prizeOf(me))}</span>`, 'ach', 'trophy');
  if (w === me) confetti();
}
setTimeout(() => { try { arcWeekCheck(); } catch (e) {} }, 4000);
setInterval(() => { try { arcWeekCheck(); } catch (e) {} }, 6e4);

/* ───────── screens ───────── */
function arcBoard(compact) {
  const A = arc(), me = meSlot(), pt = 1 - me, wk = weekKey(), sc = [wkTot(A.rec[0], wk), wkTot(A.rec[1], wk)];
  const rows = [me, pt].sort((a, b) => sc[b] - sc[a]).map((i, k) => { const w = A.rec[i].w[wk] || {}; const lead = sc[i] > sc[1 - i];
    return `<div class="lbr ${lead ? 'lead' : ''}"><span class="lbm">${lead ? '👑' : k + 1}</span><span class="sp"><b>${esc(nm(i))}</b>${i === me ? ' <span class="xs mut">(את/ה)</span>' : ''}${compact ? '' : `<div class="xs mut">קפצון ${w.hop || 0} · לבבות ${w.rain || 0}</div>`}</span><b class="lbs">${sc[i]}</b></div>`; }).join('');
  const st = sc[me] > sc[pt] ? `${gw(me, 'אתה מוביל', 'את מובילה')}! אם זה יישאר ככה, ${esc(nm(pt))} ${gw(pt, 'נותן', 'נותנת')} לך: <b>${esc(prizeOf(pt))}</b>`
    : sc[pt] > sc[me] ? `${esc(nm(pt))} ${gw(pt, 'מוביל', 'מובילה')}. אם זה יישאר ככה, ${gw(me, 'אתה נותן', 'את נותנת')}: <b>${esc(prizeOf(me))}</b>`
    : sc[me] ? 'תיקו! מי ישבור אותו קודם?' : `עוד אין תוצאות השבוע. מי שמנצח מקבל פרס מבן/בת הזוג.`;
  return `<div class="row sp"><b>🏆 טופ סקור השבוע</b><span class="xs mut">נגמר בעוד ${wkLeft()}</span></div><div class="lb mt">${rows}</div><p class="sm mt">${st}</p>`;
}
function arcadeHome() {
  if (!petState().pets.length) return '';
  return `<button class="tile tap mb" style="width:100%;text-align:start;display:block" data-go="arcade">${arcBoard(true)}<div class="xs mut mt">🎮 קפצון · 💗 גשם לבבות · 🪙 ${arc().coins} מטבעות</div></button>`;
}

SCREENS.arcade = () => {
  const P = petState(), A = arc(), p = arcPet(), me = meSlot();
  const coin = `<button class="pill coin" data-go="shop" aria-label="חנות">🪙 ${A.coins}</button>`;
  if (!p) return `<div class="scr">${topbar('משחקים לחיה', coin)}<div class="tile" style="text-align:center;padding:26px">${P.egg ? eggSvg(90, P.egg.egg / P.egg.need) : ''}<h3 class="mt">המשחקים נפתחים אחרי שהביצה בוקעת</h3><p class="sm mut mt">מי שיבקע מהביצה יהיה הדמות שמשחקת. משימות זוגיות מחממות את הביצה הכי מהר.</p><button class="btn mt" data-go="pet">לביצה שלנו</button></div></div>`;
  const st = petStage(p), pw = prevWk(), win = wkWinner(pw), done = A.rec[0].done[pw] || A.rec[1].done[pw], wins = winsCount();
  const last = win === 0 || win === 1 ? (done ? `<div class="note mt">✅ הפרס של השבוע שעבר כבר ${win === me ? 'התקבל' : 'ניתן'}: ${esc(prizeOf(1 - win))}</div>`
    : `<div class="tile mt prize"><div class="row"><span style="font-size:30px">🎁</span><div class="sp"><b>${esc(nm(win))} ${gw(win, 'ניצח', 'ניצחה')} בשבוע שעבר</b><div class="xs mut">${wkTot(A.rec[win], pw)} מול ${wkTot(A.rec[1 - win], pw)}</div></div></div>
       <p class="mt">${win === me ? `הפרס שמגיע לך מ${esc(nm(1 - me))}` : `הפרס ש${gw(me, 'אתה נותן', 'את נותנת')} ל${esc(nm(win))}`}: <b>${esc(prizeOf(1 - win))}</b></p>
       <button class="btn sm mt" data-act="arcpaid" data-w="${pw}">${win === me ? 'קיבלתי את הפרס ✓' : 'נתתי את הפרס ✓'}</button></div>`) : '';
  const games = Object.entries(GAMES).map(([k, g]) => { const w = (myRec().w[weekKey()] || {})[k] || 0;
    return `<button class="tile tap gcard" data-act="play" data-g="${k}"><span class="ge">${g.e}</span><span class="sp" style="text-align:start"><b>${g.n}</b><span class="xs mut" style="display:block">${g.d}</span><span class="xs" style="display:block;margin-top:4px">השבוע: <b>${w}</b> · השיא שלך: ${A.best[k] || 0}</span></span><span class="gplay">${ic('play')}</span></button>`; }).join('');
  const boosts = SHOP.boost.filter(b => A.boost[b.id] > 0).map(b => `<span class="pill">${b.e} ×${A.boost[b.id]}</span>`).join('');
  return `<div class="scr">${topbar('משחקים לחיה', coin)}
  <div class="tile row"><span style="width:64px;text-align:center">${petSprite(p, 46, 'bob')}</span><div class="sp"><b>${esc(p.name || SP[p.sp].n)} יוצא לשחק</b><div class="xs mut">${STAGE_E[st]} ${STAGES[st][1]} · בונוס מטבעות ×${STAGE_X[st]}</div></div>${P.pets.length > 1 ? `<button class="chip" data-go="pet">החלפה</button>` : ''}</div>
  ${last}
  <div class="tile mt">${arcBoard(false)}<div class="row wrap mt" style="gap:8px"><button class="btn sm soft" data-act="arcprize">🎁 הפרס שלי: ${esc(myRec().prize || 'עוד לא נבחר')}</button></div>
   ${wins[0] + wins[1] ? `<p class="xs mut mt">ניצחונות עד היום: ${esc(nm(me))} ${wins[me]} · ${esc(nm(1 - me))} ${wins[1 - me]}</p>` : ''}</div>
  <div class="sec"><h3>המשחקים</h3>${boosts ? `<span class="row" style="gap:6px">${boosts}</span>` : ''}</div>
  <div class="col" style="gap:10px">${games}</div>
  <p class="xs mut mt">הניקוד השבועי = השיא שלך השבוע בקפצון + השיא שלך השבוע בגשם לבבות. השיאים מתאפסים כל יום ראשון. כל משחק נותן מטבעות לחנות, וחיה גדולה יותר מקבלת יותר.</p>
  <button class="btn wide soft mt" data-go="shop">🛍️ לחנות של ${esc(p.name || SP[p.sp].n)}</button></div>`;
};

let SHOPTAB = 'food';
SCREENS.shop = () => {
  const A = arc(), p = arcPet();
  const coin = `<span class="pill coin">🪙 ${A.coins}</span>`;
  if (!p) return `<div class="scr">${topbar('החנות', coin)}<div class="tile" style="text-align:center;padding:26px"><h3>החנות נפתחת אחרי שהביצה בוקעת</h3><p class="sm mut mt">בינתיים כל משימה כבר צוברת לכם מטבעות.</p><button class="btn mt" data-go="pet">לביצה שלנו</button></div></div>`;
  const st = petStage(p), nx = STAGES[st + 1], bg = petBg(p) || RAR[SP[p.sp].r].c, eq = A.eq[p.id] || {};
  const head = `<div class="hab" style="--h1:${bg[0]};--h2:${bg[1]};padding:16px"><div class="stars"></div><div style="position:relative">${petSprite(p, 84 + st * 16, 'bob')}</div>
    <div class="disp" style="position:relative;font-size:20px;margin-top:6px">${esc(p.name || SP[p.sp].n)} · ${STAGE_E[st]} ${STAGES[st][1]}</div>
    ${nx ? `<div class="bar mt" style="background:rgba(255,255,255,.2);position:relative"><i style="width:${(p.care - STAGES[st][0]) / (nx[0] - STAGES[st][0]) * 100}%;background:#fff"></i></div><div class="xs mt" style="position:relative;opacity:.9">עוד ${nx[0] - p.care} טיפוח עד ${STAGE_E[st + 1]} ${nx[1]}</div>` : '<div class="xs mt" style="position:relative">הגיע לשלב הגבוה ביותר!</div>'}</div>`;
  const tabs = `<div class="chips mt">${SHOP_TABS.map(([k, n]) => `<button class="chip ${SHOPTAB === k ? 'on' : ''}" data-act="shoptab" data-k="${k}">${n}</button>`).join('')}</div>`;
  const price = it => `<span class="pr ${A.coins < it.p ? 'no' : ''}">🪙 ${it.p}</span>`;
  let items;
  if (SHOPTAB === 'food') items = SHOP.food.map(it => `<button class="shopi" data-act="buy" data-k="food" data-id="${it.id}"><span class="se">${it.e}</span><b>${it.n}</b><span class="xs mut">+${it.g} טיפוח</span>${price(it)}</button>`).join('');
  else if (SHOPTAB === 'acc') items = SHOP.acc.map(it => { const own = A.inv[it.id], on = eq[it.s] === it.id, lock = it.min > st;
    return `<button class="shopi ${on ? 'on' : ''} ${lock && !own ? 'lock' : ''}" data-act="${own ? 'wear' : 'buy'}" data-k="acc" data-id="${it.id}"><span class="se">${it.e}</span><b>${it.n}</b>${lock ? `<span class="xs mut">${ic('lock')} משלב ${STAGES[it.min][1]}</span>` : own ? `<span class="xs ${on ? '' : 'mut'}">${on ? 'לבוש עכשיו · להסרה' : 'שלכם · ללבוש'}</span>` : price(it)}</button>`; }).join('');
  else if (SHOPTAB === 'bg') items = [`<button class="shopi ${!A.bg[p.id] ? 'on' : ''}" data-act="wearbg" data-id=""><span class="se">✨</span><b>הרקע המקורי</b><span class="xs mut">לפי נדירות החיה</span></button>`].concat(SHOP.bg.map(it => { const own = A.inv['bg_' + it.id], on = A.bg[p.id] === it.id;
    return `<button class="shopi ${on ? 'on' : ''}" data-act="${own ? 'wearbg' : 'buy'}" data-k="bg" data-id="${it.id}"><span class="se" style="background:linear-gradient(160deg,${it.c[0]},${it.c[1]});border-radius:14px;width:56px;height:56px;display:grid;place-items:center;font-size:28px">${it.e}</span><b>${it.n}</b>${own ? `<span class="xs ${on ? '' : 'mut'}">${on ? 'פעיל' : 'שלכם · להפעלה'}</span>` : price(it)}</button>`; })).join('');
  else items = SHOP.boost.map(it => `<button class="shopi" data-act="buy" data-k="boost" data-id="${it.id}"><span class="se">${it.e}</span><b>${it.n}${A.boost[it.id] ? ` ×${A.boost[it.id]}` : ''}</b><span class="xs mut">${it.d}</span>${price(it)}</button>`).join('');
  return `<div class="scr">${topbar('החנות של החיה', coin)}${head}${tabs}<div class="shopg mt">${items}</div>
  <div class="note info mt">🪙 איך מרוויחים מטבעות? כל נקודת טיפוח ממשימות נותנת 5, וכל משחק נותן לפי הניקוד. בשלב ילד מקבלים ×1.15 ובשלב נער ×1.3.</div>
  <button class="btn wide mt" data-go="arcade">🎮 לשחק ולהרוויח</button></div>`;
};

/* ───────── actions ───────── */
ACT.shoptab = a => { SHOPTAB = a.dataset.k; render(); };
ACT.buy = a => {
  const A = arc(), p = arcPet(); if (!p) return; const k = a.dataset.k, it = SHOP[k].find(x => x.id === a.dataset.id); if (!it) return;
  if (k === 'acc' && it.min > petStage(p)) return toast(`${it.e} ${it.n} נפתח כשהחיה מגיעה לשלב ${STAGES[it.min][1]}`);
  if (A.coins < it.p) { sfx('skip'); return toast(`חסרים לכם ${it.p - A.coins} מטבעות. משחק אחד או שתיים ואתם שם 🎮`); }
  A.coins -= it.p; sfx('ok'); buzz(20);
  if (k === 'food') { petGrow(p, it.g); toast(`${it.e} ${it.n} ל${esc(p.name || SP[p.sp].n)}: +${it.g} טיפוח`); const el = $('.hab .pet'); if (el) el.animate([{transform: 'scale(1)'}, {transform: 'scale(1.2)'}, {transform: 'scale(1)'}], 400); }
  else if (k === 'acc') { A.inv[it.id] = Date.now(); (A.eq[p.id] = A.eq[p.id] || {})[it.s] = it.id; toast(`${it.e} ${it.n} נקנה ונלבש!`); }
  else if (k === 'bg') { A.inv['bg_' + it.id] = Date.now(); A.bg[p.id] = it.id; toast(`${it.e} רקע ${it.n} הופעל`); }
  else { A.boost[it.id] = (A.boost[it.id] || 0) + 1; toast(`${it.e} ${it.n} נוסף. הוא יופעל אוטומטית בסיבוב הבא`); }
  save(); render();
};
ACT.wear = a => { const A = arc(), p = arcPet(), it = ACC[a.dataset.id]; if (!p || !it) return; if (it.min > petStage(p)) return toast(`נפתח בשלב ${STAGES[it.min][1]}`);
  const e = A.eq[p.id] = A.eq[p.id] || {}; if (e[it.s] === it.id) delete e[it.s]; else e[it.s] = it.id; sfx('tap'); save(); render(); };
ACT.wearbg = a => { const A = arc(), p = arcPet(); if (!p) return; if (a.dataset.id) A.bg[p.id] = a.dataset.id; else delete A.bg[p.id]; sfx('tap'); save(); render(); };
ACT.arcprize = () => {
  const me = meSlot(), r = myRec();
  sheet(`<h3>🎁 הפרס ש${gw(me, 'אני נותן', 'אני נותנת')} אם ${gw(me, 'אפסיד', 'אפסיד')}</h3><p class="sm mut mt">מי שמסיים את השבוע עם הניקוד הגבוה יותר מקבל את הפרס מבן/בת הזוג. ${esc(nm(1 - me))} ${gw(1 - me, 'רואה', 'רואה')} מה ${gw(me, 'בחרת', 'בחרת')}.</p>
    <div class="chips mt">${PRIZES.map(x => `<button class="chip ${r.prize === x ? 'on' : ''}" data-pz="${esc(x)}">${esc(x)}</button>`).join('')}</div>
    <label class="f" for="pzi">או משהו משלכם</label><input id="pzi" class="inp" maxlength="80" data-nofocus="1" value="${esc(r.prize)}" placeholder="למשל: אני מבשל/ת ארוחת ערב"><button class="btn wide mt" id="pzs">שמירה</button>`, b => {
    b.addEventListener('click', ev => { const c = ev.target.closest('[data-pz]'); if (!c) return; $('#pzi', b).value = c.dataset.pz; $$('[data-pz]', b).forEach(x => x.classList.toggle('on', x === c)); });
    $('#pzs', b).onclick = () => { const v = $('#pzi', b).value.trim().slice(0, 80); if (v === r.prize) return closeSheet(); r.prize = v; r.ts = Date.now(); save();
      arcPush(v ? `🎁 ${nm(me)} ${gw(me, 'בחר', 'בחרה')} פרס לטופ סקור השבועי: ${v}` : ''); closeSheet(); render(); toast('הפרס נשמר ונשלח'); };
  });
};
ACT.arcpaid = a => { const r = myRec(); r.done[a.dataset.w] = Date.now(); r.ts = Date.now(); save(); arcPush(); confetti(); sfx('ach'); render(); };
ACT.play = a => gameOpen(a.dataset.g);

/* ───────── game shell ───────── */
let GM = null;
const EMO_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function gameFit(cv) { const r = cv.parentElement.getBoundingClientRect(); const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.max(1, Math.round(r.width * d)); cv.height = Math.max(1, Math.round(r.height * d)); return {W: r.width, H: r.height, d}; }
function rrect(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function drawCoin(c, x, y, r, t) { const sx = Math.abs(Math.cos(t * 3)) * .6 + .4; c.save(); c.translate(x, y); c.scale(sx, 1); c.fillStyle = '#e8a10c'; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(0, 0, r * .78, 0, 7); c.fill(); c.fillStyle = '#e8a10c'; c.font = `bold ${r}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♥', 0, r * .06); c.restore(); }
function drawEmoji(c, e, x, y, size, flip) { c.save(); c.translate(x, y); if (flip) c.scale(-1, 1); c.fillStyle = '#000'; c.globalAlpha = 1; c.font = `${size}px ${EMO_FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const w = c.measureText(e).width; if (w > size * 1.15) { const k = size * 1.15 / w; c.scale(k, k); } c.fillText(e, 0, 0); c.restore(); }
function petHead(p) { const e = arc().eq[p.id] || {}; return ACC[e.head] ? ACC[e.head].e : ''; }

function gameOpen(kind) {
  const p = arcPet(); if (!p || !GAMES[kind]) return toast('קודם צריך שתבקע חיה');
  if (GM) gameClose(true); closeSheet();
  const ov = document.createElement('div'); ov.id = 'arcade'; ov.setAttribute('dir', 'ltr');
  ov.innerHTML = `<div class="gtop"><button class="gx" id="gx" aria-label="סגירה">✕</button><div class="ghud"><b id="gsc">0</b><span id="gco">🪙 0</span><span id="gex"></span></div><button class="gx" id="gpz" aria-label="השהיה">❚❚</button></div>
    <div class="gcvw"><canvas id="gcv"></canvas><div class="gmsg" id="gmsg" dir="rtl"></div></div>
    ${kind === 'hop' ? '<div class="gpad"><button data-d="l" aria-label="שמאלה">◀</button><button data-d="d" aria-label="אחורה">▼</button><button data-d="u" class="gup" aria-label="קדימה">▲</button><button data-d="r" aria-label="ימינה">▶</button></div>' : '<div class="ghint" dir="rtl">גררו ימינה ושמאלה · ❤️ +1 · 💖 +3 · 💔 מוריד לב</div>'}`;
  document.body.appendChild(ov); document.body.classList.add('gaming');
  GM = {kind, ov, paused: false, raf: 0};
  $('#gx', ov).onclick = () => gameClose();
  $('#gpz', ov).onclick = () => gamePause(!GM.paused);
  ov.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b && GM && GM.eng && GM.eng.move) { GM.eng.move(b.dataset.d); gameBegin(); } });
  GM.key = e => {
    if (!GM || !GM.eng) return; const k = e.key, m = {ArrowUp: 'u', w: 'u', ArrowDown: 'd', s: 'd', ArrowLeft: 'l', a: 'l', ArrowRight: 'r', d: 'r'}[k];
    if (k === 'Escape') return gameClose();
    if (!m) { if ((k === ' ' || k === 'Enter') && GM.eng.E.over && e.type === 'keydown') gameRun(); return; }
    e.preventDefault(); if (GM.eng.key) GM.eng.key(m, e.type === 'keydown'); else if (e.type === 'keydown') GM.eng.move(m); if (e.type === 'keydown') gameBegin();
  };
  window.addEventListener('keydown', GM.key); window.addEventListener('keyup', GM.key);
  GM.vis = () => { if (document.hidden && GM && GM.eng && GM.eng.E.started && !GM.eng.E.over) gamePause(true); };
  document.addEventListener('visibilitychange', GM.vis);
  GM.rs = () => GM && GM.eng && GM.eng.resize(); window.addEventListener('resize', GM.rs);
  gameRun();
}
function gameClose(silent) {
  if (!GM) return; cancelAnimationFrame(GM.raf); window.removeEventListener('keydown', GM.key); window.removeEventListener('keyup', GM.key); document.removeEventListener('visibilitychange', GM.vis); window.removeEventListener('resize', GM.rs);
  if (GM.eng && GM.eng.E.started && !GM.eng.E.paid) gameFinish(true);
  GM.ov.remove(); document.body.classList.remove('gaming'); GM = null; if (!silent) render();
}
function gamePause(on) {
  if (!GM || !GM.eng || GM.eng.E.over) return; GM.paused = on; const m = $('#gmsg', GM.ov);
  if (on) { m.innerHTML = `<div class="gbox"><h2>הפסקה</h2><button class="btn wide mt" id="gres">המשך</button><button class="btn soft wide mt" id="gq">יציאה</button></div>`; m.classList.add('on'); $('#gres', m).onclick = () => gamePause(false); $('#gq', m).onclick = () => gameClose(); }
  else { m.classList.remove('on'); m.innerHTML = ''; GM.last = performance.now(); }
}
function gameBegin() { if (!GM || !GM.eng || GM.eng.E.started || GM.eng.E.over) return; GM.eng.E.started = true; const m = $('#gmsg', GM.ov); m.classList.remove('on'); m.innerHTML = ''; }
function gameRun() {
  if (!GM) return; cancelAnimationFrame(GM.raf);
  const A = arc(), p = arcPet(), cv = $('#gcv', GM.ov), m = $('#gmsg', GM.ov), o = {e: SP[p.sp].e, hat: petHead(p), st: petStage(p)};
  const used = [];
  if (GM.kind === 'hop') { o.shield = A.boost.shield > 0 ? 1 : 0; if (o.shield) { A.boost.shield--; used.push('🛡️ מגן פעיל'); } }
  else { o.magnet = A.boost.magnet > 0; if (o.magnet) { A.boost.magnet--; used.push('🧲 מגנט פעיל'); } o.lives = 3; if (A.boost.life > 0) { A.boost.life--; o.lives = 4; used.push('💞 לב נוסף'); } }
  if (used.length) save();
  o.onOver = () => setTimeout(gameOver, 650);
  GM.paused = false; GM.eng = GM.kind === 'hop' ? hopEngine(cv, o) : rainEngine(cv, o);
  const g = GAMES[GM.kind];
  m.innerHTML = `<div class="gbox"><div style="font-size:56px;line-height:1">${o.hat ? `<div style="font-size:28px;margin-bottom:-14px">${o.hat}</div>` : ''}${SP[p.sp].e}</div><h2 class="mt">${g.n}</h2><p class="sm mt" style="opacity:.85">${g.how}</p>${used.length ? `<p class="sm mt"><b>${used.join(' · ')}</b></p>` : ''}<button class="btn wide mt" id="gst">${ic('play')}התחלה</button><p class="xs mt" style="opacity:.7">השיא השבועי שלך: ${(myRec().w[weekKey()] || {})[GM.kind] || 0}</p></div>`;
  m.classList.add('on'); $('#gst', m).onclick = e => { e.stopPropagation(); gameBegin(); };
  GM.last = performance.now();
  const loop = now => {
    if (!GM) return; const dt = Math.min(.05, Math.max(0, (now - GM.last) / 1000)); GM.last = now; const E = GM.eng.E;
    if (!GM.paused && !E.over) GM.eng.step(dt);
    GM.eng.draw(); $('#gsc', GM.ov).textContent = E.score; $('#gco', GM.ov).textContent = '🪙 ' + E.coins;
    $('#gex', GM.ov).textContent = GM.kind === 'hop' ? (E.shield ? '🛡️' : '') : '❤️'.repeat(Math.max(0, E.lives)) + (o.magnet ? ' 🧲' : '');
    GM.raf = requestAnimationFrame(loop);
  };
  GM.raf = requestAnimationFrame(loop);
}
function gameFinish(quiet) {
  const E = GM.eng.E; if (E.paid) return E.paid; E.over = true;
  const raw = GM.kind === 'hop' ? E.coins * 2 + Math.floor(E.score / 3) : E.coins * 2 + Math.floor(E.score / 4);
  const got = arcEarn(raw), r = arcScore(GM.kind, E.score); E.paid = {got, ...r};
  if (!quiet && r.newBest && E.score > 0) { confetti(); sfx('ach'); }
  return E.paid;
}
function gameOver() {
  if (!GM) return; const E = GM.eng.E, res = gameFinish(), me = meSlot(), wk = weekKey(), a = wkTot(myRec(), wk), b = wkTot(ptRec(), wk);
  const why = {car: 'אופס, מכונית! 🚗', splash: 'פלאש! נפלת למים 💦', swept: 'הנהר סחף אותך 🌊', behind: 'נשארת מאחור ⏳', lives: 'נגמרו הלבבות 💔'}[E.why] || 'סוף המשחק';
  const m = $('#gmsg', GM.ov);
  m.innerHTML = `<div class="gbox"><div class="sm" style="opacity:.85">${why}</div><div class="gbig">${E.score}</div>
    ${res.newBest && E.score ? '<div class="gtag">🏅 שיא אישי חדש!</div>' : res.wkBest && E.score ? '<div class="gtag">⭐ שיא שבועי חדש!</div>' : ''}
    <p class="sm mt">+${res.got} 🪙 מטבעות · יש לך ${arc().coins}</p>
    <div class="gvs mt"><span>${esc(nm(me))}<b>${a}</b></span><i>מול</i><span>${esc(nm(1 - me))}<b>${b}</b></span></div>
    <p class="xs mt" style="opacity:.8">${a > b ? `${gw(me, 'אתה מוביל', 'את מובילה')} השבוע 👑` : a < b ? `עוד ${b - a + 1} נקודות כדי לעקוף את ${esc(nm(1 - me))}` : 'תיקו השבוע'}</p>
    <button class="btn wide mt" id="gag">${ic('play')}עוד סיבוב</button><button class="btn soft wide mt" id="gdn">סיום</button></div>`;
  m.classList.add('on'); $('#gag', m).onclick = () => gameRun(); $('#gdn', m).onclick = () => gameClose();
  buzz(60);
}

/* ───────── קפצון: an original lane-hopping game ───────── */
const CARC = ['#ff5c8a', '#ffb347', '#4fa3ff', '#46d39a', '#b46bff', '#ffd34d'];
function hopEngine(cv, o) {
  const ctx = cv.getContext('2d'), COLS = 9, L = COLS + 10;
  let W, H, cs, dpr;
  const lanes = [], NEG = {t: 'grass', blk: new Set([...Array(COLS).keys()]), coin: -1};
  const P = {x: 4, y: 0, sx: 4, sy: 0, tx: 4, ty: 0, t: 1, face: -1};
  const E = {score: 0, coins: 0, over: false, why: '', started: false, shield: o.shield || 0, cam: -1.6, inv: 0, queue: null, fx: [], safe: {x: 4, y: 0}, time: 0};
  function resize() { const f = gameFit(cv); W = f.W; H = f.H; dpr = f.d; cs = W / COLS; }
  resize();
  function grass(y, dens) {
    const blk = new Set(); if (y > 0) for (let c = 0; c < COLS; c++) if (Math.random() < dens) blk.add(c);
    if (y < 3) blk.delete(4); while (blk.size > 4) blk.delete(rnd([...blk]));
    let coin = -1; if (y > 2 && Math.random() < .35) { const f = [...Array(COLS).keys()].filter(c => !blk.has(c)); coin = rnd(f); }
    return {t: 'grass', blk, coin, run: 1};
  }
  function mk(y) {
    if (y < 3) return grass(y, y ? .15 : 0);
    const d = Math.min(1, y / 160), pv = lanes[y - 1]; let t;
    if (pv.t !== 'grass' && pv.run < 2 + Math.floor(d * 3) && Math.random() < .6) t = pv.t;
    else if (pv.t !== 'grass') t = 'grass'; else t = Math.random() < .55 ? 'road' : 'river';
    if (t === 'grass') return grass(y, .1 + d * .15);
    const run = pv.t === t ? pv.run + 1 : 1, off = Math.random() * L, items = [];
    if (t === 'road') {
      const dir = Math.random() < .5 ? 1 : -1, sp = 1.1 + Math.random() * 1.2 + d * 2.4, n = 3 + (Math.random() < .25 + d * .5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const w = Math.random() < .25 ? 2.1 : 1.25; items.push({x: (off + i * L / n) % L - 5, w, c: rnd(CARC)}); }
      return {t, dir, sp, items, run, coin: Math.random() < .12 ? Math.floor(Math.random() * COLS) : -1};
    }
    const dir = pv.t === 'river' ? -pv.dir : (Math.random() < .5 ? 1 : -1), sp = .8 + Math.random() * .9 + d * 1.3;
    for (let i = 0; i < 4; i++) items.push({x: (off + i * L / 4) % L - 5, w: 2.4 + Math.random() * 1.6 - d * .6});
    return {t, dir, sp, items, run, coin: -1};
  }
  const lane = y => { if (y < 0) return NEG; while (lanes.length <= y) lanes.push(mk(lanes.length)); return lanes[y]; };
  const rx = () => P.sx + (P.tx - P.sx) * P.t, ry = () => P.sy + (P.ty - P.sy) * P.t;
  const onLog = (l, x) => l.items.some(it => x + .5 > it.x + .08 && x + .5 < it.x + it.w - .08);
  function burst(x, y, col, n = 14) { for (let i = 0; i < n; i++) E.fx.push({x, y, vx: (Math.random() - .5) * 6, vy: Math.random() * 6, life: .7, col}); }
  function die(why) {
    if (E.over) return;
    if (E.shield > 0 && why !== 'behind') {
      E.shield--; E.inv = 1.6; P.x = P.sx = P.tx = E.safe.x; P.y = P.sy = P.ty = E.safe.y; P.t = 1; E.queue = null;
      if (E.cam > E.safe.y - 1.2) E.cam = E.safe.y - 1.6; burst(E.safe.x + .5, E.safe.y + .5, '#4fa3ff'); buzz(40); return;
    }
    E.over = true; E.why = why; burst(rx() + .5, ry() + .5, why === 'car' ? '#ff5c8a' : '#bfe6ff', 24); buzz(120); o.onOver && o.onOver();
  }
  function move(d) {
    if (E.over) return; if (P.t < 1) { E.queue = d; return; }
    const dx = d === 'l' ? -1 : d === 'r' ? 1 : 0, dy = d === 'u' ? 1 : d === 'd' ? -1 : 0;
    const cl = lane(P.y), ny = P.y + dy, tl = lane(ny);
    let nx = dy ? Math.round(P.x) : P.x + dx; if (tl.t !== 'river') nx = Math.round(nx);
    if (nx < 0 || nx > COLS - 1) { if (cl.t !== 'river' || !dy) return; nx = Math.max(0, Math.min(COLS - 1, nx)); }
    if (tl.t === 'grass' && tl.blk.has(Math.round(nx))) return;
    P.sx = P.x; P.sy = P.y; P.tx = nx; P.ty = ny; P.x = nx; P.y = ny; P.t = 0; if (dx) P.face = dx; buzz(6);
  }
  function land() {
    const l = lane(P.y);
    if (l.t !== 'river') { P.x = P.tx = P.sx = Math.round(P.x); if (l.t === 'grass') E.safe = {x: P.x, y: P.y}; }
    if (l.t !== 'river' && l.coin === Math.round(P.x)) { l.coin = -1; E.coins++; E.fx.push({x: P.x + .5, y: P.y + .8, vx: 0, vy: -2, life: .8, txt: '+🪙'}); }
    if (P.y > E.score) E.score = P.y;
    if (l.t === 'river' && !onLog(l, P.x)) return die('splash');
    if (E.queue) { const q = E.queue; E.queue = null; move(q); }
  }
  function step(dt) {
    E.time += dt; if (E.inv > 0) E.inv -= dt;
    const y1 = Math.ceil(E.cam + H / cs) + 2;
    for (let y = Math.max(0, Math.floor(E.cam) - 2); y <= y1; y++) { const l = lane(y); if (l.items) l.items.forEach(it => { it.x += l.dir * l.sp * dt; if (it.x >= COLS + 5) it.x -= L; else if (it.x < -5) it.x += L; }); }
    if (P.t < 1) { P.t = Math.min(1, P.t + dt / .12); if (P.t >= 1) land(); }
    if (E.over) return;
    if (P.t >= 1) { const l = lane(P.y); if (l.t === 'river') { P.x += l.dir * l.sp * dt; P.sx = P.tx = P.x; if (!onLog(l, P.x)) return die('splash'); if (P.x < -.45 || P.x > COLS - .55) return die('swept'); } }
    const cl = lane(P.t < .5 ? P.sy : P.ty), px = rx();
    if (cl.t === 'road' && E.inv <= 0) for (const it of cl.items) if (px + .8 > it.x && px + .2 < it.x + it.w) return die('car');
    if (E.started) { const tgt = P.y - 2.4; if (tgt > E.cam) E.cam += (tgt - E.cam) * Math.min(1, dt * 5); E.cam += dt * (.14 + Math.min(.45, E.score / 280)); }
    if (P.y + .7 < E.cam && E.inv <= 0) die('behind');
  }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const sy = r => H - (r - E.cam + 1) * cs, y0 = Math.floor(E.cam) - 1, y1 = Math.ceil(E.cam + H / cs) + 1;
    for (let y = y0; y <= y1; y++) {
      const l = lane(y), top = sy(y);
      if (l.t === 'grass') {
        ctx.fillStyle = (y & 1) ? '#8fd16a' : '#84c75f'; ctx.fillRect(0, top, W, cs + 1);
        if ((y * 7) % 5 === 1) { ctx.fillStyle = '#ffffffaa'; for (let c = 0; c < COLS; c += 3) { ctx.beginPath(); ctx.arc((c + .25 + (y % 3) * .2) * cs, top + cs * .75, cs * .05, 0, 7); ctx.fill(); } }
        l.blk.forEach(c => { const x = c * cs; ctx.fillStyle = '#7a4a24'; ctx.fillRect(x + cs * .43, top + cs * .55, cs * .14, cs * .32); ctx.fillStyle = '#2f8a3e'; ctx.beginPath(); ctx.arc(x + cs * .5, top + cs * .42, cs * .34, 0, 7); ctx.fill(); ctx.fillStyle = '#3fae52'; ctx.beginPath(); ctx.arc(x + cs * .42, top + cs * .34, cs * .2, 0, 7); ctx.fill(); });
        if (l.coin >= 0) drawCoin(ctx, (l.coin + .5) * cs, top + cs * .5, cs * .22, E.time);
      } else if (l.t === 'road') {
        ctx.fillStyle = '#4f5563'; ctx.fillRect(0, top, W, cs + 1);
        const up = lane(y + 1); if (up.t === 'road') { ctx.strokeStyle = '#ffffff66'; ctx.lineWidth = 2; ctx.setLineDash([cs * .4, cs * .35]); ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(W, top); ctx.stroke(); ctx.setLineDash([]); }
        else { ctx.fillStyle = '#3c414d'; ctx.fillRect(0, top, W, 3); }
        if (l.coin >= 0) drawCoin(ctx, (l.coin + .5) * cs, top + cs * .5, cs * .2, E.time);
        l.items.forEach(it => { const x = it.x * cs, w = it.w * cs, cy = top + cs * .14, h = cs * .72;
          ctx.fillStyle = 'rgba(0,0,0,.25)'; rrect(ctx, x + 3, cy + 5, w, h, cs * .18); ctx.fill();
          ctx.fillStyle = it.c; rrect(ctx, x, cy, w, h, cs * .18); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.75)'; const wx = l.dir > 0 ? x + w - cs * .42 : x + cs * .14; rrect(ctx, wx, cy + h * .18, cs * .28, h * .64, 4); ctx.fill();
          if (it.w > 2) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(l.dir > 0 ? x + cs * .1 : x + cs * .6, cy + h * .15, w - cs * .8, h * .7); }
          ctx.fillStyle = '#fff6b0'; const hx = l.dir > 0 ? x + w - 4 : x; ctx.fillRect(hx, cy + h * .12, 4, h * .16); ctx.fillRect(hx, cy + h * .72, 4, h * .16); });
      } else {
        ctx.fillStyle = '#4aa8ff'; ctx.fillRect(0, top, W, cs + 1);
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { const wx = ((E.time * l.dir * 18 + i * W / 3 + y * 37) % W + W) % W; ctx.beginPath(); ctx.moveTo(wx, top + cs * (.3 + i * .2)); ctx.quadraticCurveTo(wx + cs * .3, top + cs * (.22 + i * .2), wx + cs * .6, top + cs * (.3 + i * .2)); ctx.stroke(); }
        l.items.forEach(it => { const x = it.x * cs, w = it.w * cs, cy = top + cs * .16, h = cs * .68;
          ctx.fillStyle = '#7b4a22'; rrect(ctx, x, cy, w, h, h / 2); ctx.fill(); ctx.fillStyle = '#9c6230'; rrect(ctx, x + 3, cy + 3, w - 6, h * .45, h / 3); ctx.fill();
          ctx.fillStyle = '#c99260'; ctx.beginPath(); ctx.ellipse(x + h * .3, cy + h / 2, h * .16, h * .32, 0, 0, 7); ctx.fill(); });
      }
    }
    const X = (rx() + .5) * cs, hop = Math.sin(P.t * Math.PI) * .35, Y = sy(ry()) + cs * .5 - hop * cs;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(X, sy(ry()) + cs * .82, cs * .28 * (1 - hop * .4), cs * .1, 0, 0, 7); ctx.fill();
    if (!(E.inv > 0 && Math.floor(E.time * 12) % 2) && !(E.over && E.why === 'splash')) {
      const sz = cs * (.72 + o.st * .06); drawEmoji(ctx, o.e, X, Y, sz, P.face > 0);
      if (o.hat) drawEmoji(ctx, o.hat, X, Y - sz * .55, sz * .5, false);
      if (E.inv > 0) { ctx.strokeStyle = '#7fd3ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X, Y, sz * .62, 0, 7); ctx.stroke(); }
    }
    E.fx = E.fx.filter(f => (f.life -= 1 / 60) > 0);
    E.fx.forEach(f => { f.x += f.vx / 60; f.y += f.vy / 60; f.vy -= 12 / 60; const fx = f.x * cs, fy = sy(f.y) ;
      if (f.txt) { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.font = `bold ${cs * .4}px ${EMO_FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(f.txt, fx, fy); ctx.globalAlpha = 1; }
      else { ctx.fillStyle = f.col; ctx.globalAlpha = Math.min(1, f.life * 2); ctx.beginPath(); ctx.arc(fx, fy, cs * .08, 0, 7); ctx.fill(); ctx.globalAlpha = 1; } });
  }
  let t0 = null;
  cv.style.touchAction = 'none';
  cv.onpointerdown = e => { t0 = {x: e.clientX, y: e.clientY}; };
  cv.onpointerup = e => { if (!t0) return; const dx = e.clientX - t0.x, dy = e.clientY - t0.y; t0 = null;
    const d = Math.hypot(dx, dy) < 22 ? 'u' : Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy < 0 ? 'u' : 'd'); move(d); gameBegin(); };
  return {E, step, draw, move, resize, _P: P, _lane: lane};
}

/* ───────── גשם לבבות ───────── */
function rainEngine(cv, o) {
  const ctx = cv.getContext('2d'); let W, H, dpr;
  const E = {score: 0, coins: 0, over: false, why: '', started: false, lives: o.lives || 3, time: 0, items: [], next: .5, fx: [], inv: 0};
  const P = {x: .5, tx: .5}, K = {l: false, r: false}, R = o.magnet ? .15 : .095;
  function resize() { const f = gameFit(cv); W = f.W; H = f.H; dpr = f.d; }
  resize();
  const kinds = [['heart', '❤️', 1], ['big', '💖', 3], ['coin', '', 0], ['bad', '💔', 0]];
  function spawn(diff) {
    const r = Math.random(), bad = .14 + diff * .16;
    const k = r < bad ? 'bad' : r < bad + .09 ? 'big' : r < bad + .2 ? 'coin' : 'heart';
    E.items.push({k, x: .07 + Math.random() * .86, y: -.05, v: .26 + diff * .34 + Math.random() * .1, r: Math.random() * 6});
  }
  function step(dt) {
    if (!E.started) return; E.time += dt; if (E.inv > 0) E.inv -= dt; const diff = Math.min(1, E.time / 80);
    if (K.l) P.tx -= dt * 1.2; if (K.r) P.tx += dt * 1.2; P.tx = Math.max(.06, Math.min(.94, P.tx));
    P.x += (P.tx - P.x) * Math.min(1, dt * 14);
    E.next -= dt; if (E.next <= 0) { E.next = .8 - diff * .48 + Math.random() * .22; spawn(diff); if (diff > .5 && Math.random() < diff * .4) spawn(diff); }
    const pyT = .84, pyB = .95;
    E.items = E.items.filter(it => { it.y += it.v * dt;
      if (it.y > pyT && it.y < pyB && Math.abs(it.x - P.x) < R) {
        if (it.k === 'bad') { if (E.inv <= 0) { E.lives--; E.inv = .9; buzz(80); fx(it, '💥'); if (E.lives <= 0) { E.over = true; E.why = 'lives'; o.onOver && o.onOver(); } } return false; }
        if (it.k === 'coin') { E.coins++; fx(it, '+🪙'); } else { const n = it.k === 'big' ? 3 : 1; E.score += n; fx(it, '+' + n); }
        buzz(8); return false;
      }
      return it.y < 1.08; });
  }
  function fx(it, txt) { E.fx.push({x: it.x, y: it.y, life: .7, txt}); }
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1240'); g.addColorStop(.6, '#7a2a7a'); g.addColorStop(1, '#ff7aa8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 4; i++) { const cx = ((i * .31 + E.time * .015 * (i + 1)) % 1.3 - .15) * W, cy = (.08 + i * .07) * H; ctx.beginPath(); ctx.ellipse(cx, cy, W * .14, H * .025, 0, 0, 7); ctx.ellipse(cx + W * .07, cy - H * .015, W * .08, H * .025, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, H * .95, W, H * .05);
    const sz = Math.min(W * .1, 54);
    E.items.forEach(it => { const x = it.x * W, y = it.y * H; if (it.k === 'coin') drawCoin(ctx, x, y, sz * .38, E.time + it.r); else drawEmoji(ctx, kinds.find(k => k[0] === it.k)[1], x, y, sz * (it.k === 'big' ? .95 : .8), false); });
    const X = P.x * W, Y = H * .895, ps = Math.min(W * .15, 76) * (1 + o.st * .07);
    if (o.magnet) { ctx.fillStyle = 'rgba(127,211,255,.18)'; ctx.beginPath(); ctx.ellipse(X, Y, R * W, ps * .5, 0, 0, 7); ctx.fill(); }
    if (!(E.inv > 0 && Math.floor(E.time * 12) % 2)) { drawEmoji(ctx, o.e, X, Y, ps, P.tx > P.x + .01); if (o.hat) drawEmoji(ctx, o.hat, X, Y - ps * .55, ps * .5, false); }
    E.fx = E.fx.filter(f => (f.life -= 1 / 60) > 0);
    E.fx.forEach(f => { ctx.globalAlpha = Math.min(1, f.life * 2); ctx.font = `bold ${sz * .55}px ${EMO_FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(f.txt, f.x * W, (f.y - (.7 - f.life) * .12) * H); ctx.globalAlpha = 1; });
  }
  cv.style.touchAction = 'none';
  const pt = e => { const r = cv.getBoundingClientRect(); P.tx = Math.max(.06, Math.min(.94, (e.clientX - r.left) / r.width)); };
  cv.onpointerdown = e => { pt(e); gameBegin(); }; cv.onpointermove = e => { if (e.pointerType !== 'mouse' || e.buttons) pt(e); };
  return {E, step, draw, resize, move: d => { if (d === 'l') P.tx -= .12; if (d === 'r') P.tx += .12; }, key: (d, down) => { if (d === 'l') K.l = down; if (d === 'r') K.r = down; }};
}
