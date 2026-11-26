/* Between Us — game engine, date builder, end screen, two-phone sync, boot */
const APP_URL = 'https://claude.ai/artifact/7ihNdmUzyRpwBiKYD2noRf';
let G = null;
const R = {cap:'checking', room:null, named:null, lobby:false, code:'', host:false, live:false, me:0, peerName:'', names:null, acts:[], actN:0, lastN:0, ver:0, seenVer:-1, stPrev:null, finalized:{}};

/* ───────── deck building ───────── */
const VIBE_SEL = {
  light: c => (c.m === 'know' && c.d === 1) || c.m === 'who' || ['dlfun','dlhyp','light'].includes(c.c),
  funny: c => c.m === 'who' || ['tfun','temb','dfun','dimit','ftask','dlfun'].includes(c.c),
  romantic: c => ['fcomp','from','fimag','us','trom','drom','dlrom','rom','comp','love'].includes(c.c),
  deep: c => (c.m === 'know' && c.d >= 2) || c.m === 'deep' || c.c === 'dlhard',
  emotional: c => c.m === 'deep' || ['change','self','fear'].includes(c.c),
  flirty: c => c.m === 'flirt' || ['tflirt','dflirt'].includes(c.c),
  bold: c => ['tbold','tflirt','dflirt'].includes(c.c) || c.m === 'flirt' || (c.m === 'adult' && c.d <= 2),
  intimate: c => c.m === 'adult' || c.c === 'fclose',
  mix: c => ['know','tod','deep','flirt','who','dil','guess'].includes(c.m) && c.d <= 2
};
function orderDeck(list, favBoost) {
  const sc = c => (S.prog.seen[c.id] || 0) * 10 + (isAnswered(c.id) ? 100 : 0) + Math.random() * 6 - (favBoost && S.set.fav.includes(c.c) ? 4 : 0);
  return list.map(c => [sc(c), c]).sort((a, b) => a[0] - b[0]).map(x => x[1].id);
}
function buildDeck(mode, o) {
  let list = [];
  if (mode === 'mix') { const sel = VIBE_SEL[o.vibe] || VIBE_SEL.mix; list = CARDS.filter(c => sel(c) && allowed(c, {level: S.set.adult.max}) && (c.m !== 'adult' || ['bold','intimate'].includes(o.vibe))); if (!list.length) list = CARDS.filter(c => VIBE_SEL.mix(c) && allowed(c)); return orderDeck(list, true); }
  if (mode === 'cat') list = CARDS.filter(c => c.c === o.cat && allowed(c, {ignoreHide: true}));
  else if (mode === 'saved') list = (o.ids || []).map(id => CARD[id]).filter(c => c && allowed(c, {ignoreHide: true, level: 4}));
  else if (mode === 'adult') { list = CARDS.filter(c => c.m === 'adult' && allowed(c, {level: o.level})); return list.map(c => [(c.d === o.level ? 0 : 5) + Math.random() * 4 + (S.prog.seen[c.id] || 0) * 2, c]).sort((a, b) => a[0] - b[0]).map(x => x[1].id); }
  else if (mode === 'mem') { const syn = memSynth(); const st = CARDS.filter(c => c.m === 'mem' && allowed(c)); o.synth = Object.fromEntries(syn.map(s => [s.id, s])); const a = shuffle(syn.map(s => s.id)), b = orderDeck(st); const out = []; while (a.length || b.length) { if (a.length) out.push(a.shift()); if (b.length && (out.length % 2 || !a.length)) out.push(b.shift()); } return out; }
  else list = CARDS.filter(c => c.m === mode && allowed(c));
  return orderDeck(list);
}
const clean = s => String(s || '').replace(/[\[\]{}|]/g, '');
function memSynth() {
  return shuffle(S.mem).slice(0, 12).map(m => {
    const T = clean(m.title), name = MEM_T[m.type] || 'זיכרון';
    let t;
    if (['met','first_date','first_kiss'].includes(m.type)) t = m.date ? `מי זוכר מתי היה ${name}? נחשו יום, חודש ושנה, ורק אז חשפו.` : `ספרו יחד את הסיפור של ${name}. כל אחד מוסיף פרט אחד שהשני שכח.`;
    else if (m.type === 'joke') t = `בדיחה פנימית: "${T}". מי מסביר ראשון מאיפה היא הגיעה?`;
    else if (m.type === 'song') t = `איזה שיר שמרתם בזיכרון "${T}"? מי מזמזם אותו ראשון?`;
    else if (m.type === 'trip') t = `טיול: "${T}". מה הדבר הראשון שאתם זוכרים משם? כל אחד בתורו.`;
    else if (m.type === 'gift') t = `מתנה: "${T}". מי נתן, באיזו הזדמנות, ומה הייתה התגובה?`;
    else if (photos[m.id]) t = `בזיכרון "${T}" יש תמונה. תארו אותה בפרטים לפני שחושפים.`;
    else if (m.date) t = `"${T}": מי זוכר מתי זה היה, ומה קרה באותו יום?`;
    else t = `השלימו את הסיפור: "${T}". מה עוד קרה שם?`;
    return {id: 'syn-' + m.id, m: 'mem', k: 'm', c: 'mq', d: 1, t, tags: [], tl: 0, rv: {title: m.title, date: m.date, text: (m.text || '').slice(0, 400), song: m.song, mid: m.id}};
  });
}
const getCard = id => (G && G.synth && G.synth[id]) || CARD[id] || anyCard(id) || (G && G.cardObj && G.cardObj.id === id ? G.cardObj : null);

/* ───────── start / draw ───────── */
function startGame(mode, o = {}) {
  if (R.live && !R.host) { toast('המשחק נבחר בטלפון שיצר את החדר, והוא יופיע כאן אוטומטית'); return; }
  const title = o.title || (MODES[mode] ? MODES[mode].n : 'משחק');
  const turn = o.start === 0 || o.start === 1 ? o.start : Math.round(Math.random());
  G = {id: uid(), mode, title, cat: o.cat, vibe: o.vibe || S.set.vibe, level: o.level || 1, deck: [], pos: 0, card: null, synth: {}, turn, phase: 'idle',
       pick: [null, null], txt: ['', ''], con: [0, 0], both: false, judged: null, fun: '', st: {cards:0, ans:0, tasks:0, skips:0, pts:0, bull:0, match:0, comps:0},
       start: Date.now(), dur: o.dur ?? S.set.dur, hl: [], saved: [], dbl: false, sinceSur: 0, unl: false, timeAsked: false, date: o.date || null, endCard: null, remote: R.live, veil: false, nophone: !!o.nophone};
  const opts = {...o}; if (mode !== 'tod' && mode !== 'date') G.deck = buildDeck(mode, opts); G.synth = opts.synth || {};
  if (genModesFor(G).length) G.deck = G.deck.filter(id => !isAnswered(id));
  if (mode !== 'tod' && mode !== 'date' && !G.deck.length) G.deck = moreIds(G, 8);
  genModesFor(G).forEach(m => genFill(m, 'click'));
  if (mode !== 'tod' && mode !== 'date' && !G.deck.length) { G = null; toast(mode === 'saved' ? 'אין קלפים בחפיסה הזאת' : 'אין קלפים שמתאימים להגדרות ולגבולות שלכם כאן. נסו לשנות אותם.', 'err'); return; }
  if (!S.prog.st.modes.includes(mode)) S.prog.st.modes.push(mode);
  markDay(); closeSheet(); stack = [{name:'home'}, {name:'game'}];
  draw(true);
}
function placeOK(c, d) { if (c.tags.includes('out') && d.place !== 'out') return false; if (c.tags.includes('home') && d.place !== 'home') return false; if (c.tags.includes('cost') && d.budget === 'free') return false; return true; }
function draw(first) {
  G.pick = [null, null]; G.txt = ['', '']; G.ga = ['', '']; G.con = [0, 0]; G.both = false; G.judged = null; G.fun = ''; G.special = '';
  if (!first && !G.noFlip) G.turn = 1 - G.turn; G.noFlip = false;
  const mins = (Date.now() - G.start) / 60000;
  if (G.dur && mins >= G.dur && !G.timeAsked && G.mode !== 'date') { G.timeAsked = true; G.phase = 'time'; G.card = null; return commit(); }
  if (G.mode === 'tod') { G.phase = 'choose'; G.card = null; return commit(); }
  let id = null;
  if (G.mode === 'date') {
    const d = G.date; if (d.i >= d.stages.length) return toFinal();
    const stage = d.stages[d.i]; let pool = CARDS.filter(c => c.c === stage && allowed(c, {ignoreHide: true}) && placeOK(c, d) && !d.used.includes(c.id));
    if (!pool.length) pool = CARDS.filter(c => c.c === stage && allowedTags(c));
    const c = pool.sort((a, b) => (S.prog.seen[a.id] || 0) - (S.prog.seen[b.id] || 0) + Math.random() - .5)[0]; id = c.id; d.used.push(id);
  } else {
    G.sinceSur++;
    if (G.st.cards >= 7 && !G.unl) { G.unl = true; const pool = goldOpen() ? CARDS.filter(c => c.m === 'gold' && allowed(c)) : CARDS.filter(c => c.m === 'sur' && allowed(c)); if (pool.length) { id = rnd(pool).id; G.special = goldOpen() ? 'gold' : 'unlock'; } }
    if (!id && G.st.cards >= 3 && G.sinceSur >= 4 && Math.random() < .14 && !['saved','cat'].includes(G.mode)) { const pool = CARDS.filter(c => c.m === 'sur' && allowed(c)); if (pool.length) { id = rnd(pool).id; G.special = 'mystery'; G.sinceSur = 0; } }
    if (!id) { if (G.pos >= G.deck.length) G.deck.push(...moreIds(G, 8)); if (G.pos >= G.deck.length) return toFinal(); id = G.deck[G.pos++]; }
  }
  setCard(id);
  commit();
}
function setCard(id) {
  const c = getCard(id); G.card = id; G.cardObj = CARD[id] ? null : c;
  const special = G.special || c.m === 'adult' || c.m === 'gold' || c.d === 3;
  G.veil = S.set.reveal === 'all' || (S.set.reveal === 'special' && !!special);
  if (c.m === 'adult') { G.phase = 'consent'; G.veil = false; }
  else if (c.k === 'g') G.phase = 'secret';
  else if (c.k === 'w' || c.k === 'd') G.phase = G.remote ? 'pick' : 'pick0';
  else G.phase = 'show';
  S.prog.seen[id] = (S.prog.seen[id] || 0) + 1; S.prog.st.cards++; G.st.cards++;
  if (G.special === 'mystery' || G.special === 'unlock') S.prog.st.myst++;
  if (c.tags.includes('double')) G.dblNext = true;
}
function toFinal() { const pool = CARDS.filter(c => c.m === 'end' && allowed(c)); G.endCard = rnd(pool).id; G.card = null; G.phase = 'final'; commit(); }

/* ───────── scoring ───────── */
function award(n) { if (G.dbl) { n *= 2; G.dbl = false; } G.st.pts += n; addPts(n); }
function creditQ(c) { G.st.ans++; S.prog.st.ans++; logEv('ans'); if (c.d === 3 || c.m === 'deep') { S.prog.st.deep++; logEv('deep'); } if (c.tags.includes('comp')) { G.st.comps++; S.prog.st.comps++; logEv('comp'); } }
function creditT(c) { petFeed(1); G.st.tasks++; S.prog.st.tasks++; logEv('task'); if (c.tags.includes('comp')) { G.st.comps++; S.prog.st.comps++; logEv('comp'); } if (c.tags.includes('phone')) S.prog.st.nophone++; }

/* ───────── actions (local, or routed through host when connected) ───────── */
function act(type, data = {}) {
  if (R.live && !R.host) { R.actN++; R.acts = [...R.acts, {n: R.actN, type, data}].slice(-6); R.named && R.named.presence({acts: R.acts}).catch(() => {}); sfx('tap'); return; }
  apply(type, data, R.live ? 0 : null);
}
function apply(type, d, from) {
  if (!G) return; const c = G.card ? getCard(G.card) : null;
  const P = v => (from === 1 ? 1 : from === 0 && R.live ? 0 : v);
  if (NOTIFY[type] && from !== null) { G.last = {by: from, t: type, k: d.k || '', v: d.v ? 1 : 0, n: ((G.last && G.last.n) || 0) + 1}; if (from === 1) partnerNote(G.last); }
  switch (type) {
    case 'unveil': G.veil = false; sfx('reveal'); break;
    case 'tod': { const k = d.k; const pool = CARDS.filter(x => x.m === 'tod' && x.k === k && allowed(x)).concat(todExtra(k)); if (!pool.length) { toast('אין קלפים מתאימים'); break; } const id = orderDeck(pool)[0]; G.todk = k; setCard(id); sfx('flip'); break; }
    case 'done': {
      if (!c) break; if (needsText(c) && !(G.ga && G.ga[0] && G.ga[1])) { if (from !== 1) toast('כל אחד כותב תשובה לפני שממשיכים'); break; } recordFromG(G); if (c.m === 'adult') { award(5); c.k === 't' ? creditT(c) : creditQ(c); }
      else if (c.k === 'q' || c.k === 'tr') { creditQ(c); award(c.d === 3 ? 15 : 10); if (G.both) award(5); }
      else { creditT(c); award(15); confetti(36); }
      sfx('ok'); if (G.dblNext) { G.dbl = true; G.dblNext = false; } return next('out');
    }
    case 'gans': { const p = P(d.p); if (!G.ga) G.ga = ['', '']; G.ga[p] = String(d.v || '').trim().slice(0, 300); if (G.ga[0] && G.ga[1]) { sfx('reveal'); recordFromG(G); } break; }
    case 'both': G.both = true; G.turn = 1 - G.turn; G.noFlip = true; break;
    case 'skip': G.st.skips++; if (c && c.m === 'adult') award(5); sfx('skip'); return next('skip');
    case 'secret': G.txt[0] = String(d.v || '').slice(0, 140); G.phase = G.remote ? 'guess' : 'gpass'; break;
    case 'gpass': G.phase = 'guess'; break;
    case 'guess': G.txt[1] = String(d.v || '').slice(0, 140); G.phase = 'reveal'; sfx('reveal');
      if (c.o) { const ok = G.txt[0] === G.txt[1]; G.judged = ok ? 'bull' : 'miss'; scoreGuess(G.judged); } logEv('guess'); break;
    case 'judge': if (G.judged) break; G.judged = d.r; scoreGuess(d.r); break;
    case 'pick': { const p = P(d.p); G.pick[p] = d.v; if (!G.remote && G.phase === 'pick0') { G.phase = 'pass1'; break; } if (!G.remote && G.phase === 'pick1') { G.phase = 'reveal'; } if (G.remote && G.pick[0] !== null && G.pick[1] !== null) G.phase = 'reveal'; if (G.phase === 'reveal') scorePick(c); break; }
    case 'pass1': G.phase = 'pick1'; break;
    case 'consent': { const p = P(d.p); G.con[p] = d.v ? 1 : 0; if (G.con[0] && G.con[1]) { G.phase = 'show'; G.veil = true; sfx('reveal'); } break; }
    case 'memrev': G.phase = 'reveal'; sfx('reveal'); break;
    case 'memok': award(d.ok ? 10 : 3); creditQ(c); return next('out');
    case 'next': if (G.dblNext) { G.dbl = true; G.dblNext = false; } return next('out');
    case 'more': G.dur = d.min ? Math.ceil((Date.now() - G.start) / 60000) + d.min : 0; G.timeAsked = false; draw(true); return;
    case 'end': return toFinal();
    case 'finish': return finishGame();
  }
  commit();
}
const NOTIFY = {gans:1, secret:1, guess:1, pick:1, consent:1, done:1, judge:1, memok:1, tod:1, skip:1, both:1};
function partnerNote(l) {
  if (!l || !R.live) return; const i = R.host ? 1 : 0; const n = esc(nm(i)); const w = (m, f) => gw(i, m, f);
  const msg = {gans: l.v ? `${n} ${w('כתב','כתבה')} תשובה` : '', secret: `${n} ${w('ענה','ענתה')} בסתר. תורך לנחש!`, guess: `${n} ${w('ניחש','ניחשה')}! בואו נחשוף`, pick: `${n} ${w('בחר','בחרה')}${G && G.phase === 'pick' ? '. עכשיו תורך' : ''}`,
    consent: l.v ? `${n} ${w('בעניין','בעניין')}` : `${n} ${w('ביטל','ביטלה')} את ההסכמה`, done: `${n} ${w('סימן','סימנה')} שעניתם`, judge: `${n} ${w('קבע','קבעה')} את התוצאה`, memok: `${n} ${w('סימן','סימנה')} את הזיכרון`,
    tod: `${n} ${w('בחר','בחרה')} ${l.k === 'da' ? 'חובה' : 'אמת'}`, skip: `${n} ${w('דילג','דילגה')} לקלף הבא`, both: `${n} ${w('ביקש','ביקשה')} שגם השני יענה`}[l.t];
  if (!msg) return; toast(`<b>${msg}</b>`, 'info'); buzz(60); sfx('ok');
  if (document.hidden) { document.title = '• ' + nm(i) + ' ענה/תה | Between Us'; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) document.title = 'Between Us'; });
function scoreGuess(r) { const n = {bull: 20, close: 10, miss: 4}[r]; award(n); if (r === 'bull') { G.st.bull++; S.prog.st.bull++; confetti(); sfx('ach'); } if (r === 'miss') S.prog.st.surprise++; G.st.ans++; S.prog.st.ans++; }
function scorePick(c) { const m = G.pick[0] === G.pick[1]; if (m) { G.st.match++; S.prog.st.match++; award(c.k === 'w' ? 10 : 8); confetti(40); sfx('ach'); } else { award(4); if (c.k === 'w') G.fun = rnd(WHO_FUN); sfx('reveal'); } }
function next(anim) {
  const el = $('.card'); const doIt = () => { if (G.mode === 'date' && G.date) G.date.i++; draw(); };
  if (el && S.set.motion) { el.classList.remove('in'); el.classList.add(anim === 'skip' ? 'skip' : 'out'); setTimeout(doIt, 280); } else doIt();
}
function commit() {
  if (!G) return; recordFromG(G); checkAch(); S.cur = G.remote ? null : G; save();
  if (R.live && R.host) publish();
  if (cur().name === 'game') render(); else go('game');
}
function finishGame() {
  if (!G) return; const mins = Math.round((Date.now() - G.start) / 60000);
  const st = S.prog.st; st.games++; st.mins += mins; st.longest = Math.max(st.longest, mins); logEv('game');
  if (G.remote) st.remote++;
  if (G.mode === 'date') { st.dates++; logEv('date'); if (G.nophone) st.nophone++; }
  G.mins = mins; G.phase = 'done'; G.newAch = checkAch().map(a => a[0]);
  S.last = {mode: G.mode, title: G.title, ts: Date.now(), cards: G.st.cards, pts: G.st.pts, cat: G.cat, vibe: G.vibe, level: G.level};
  S.cur = null; save(); R.finalized[G.id] = 1;
  if (R.live && R.host) publish();
  stack = [{name:'home'}, {name:'end'}]; render(); confetti(90); sfx('ach');
}

/* ───────── game screen ───────── */
const canAct = p => !R.live || R.me === p;
const nmG = i => esc(nm(i));
function cardShell(c, inner, cls = 'in') {
  const m = c.m === 'sur' ? 'sur' : c.m;
  const dots = c.m === 'adult' ? `<span class="pill">רמה ${c.d}</span>` : `<span class="dots" aria-label="עומק ${c.d}">${[1,2,3].map(i => `<i class="${i <= c.d ? 'f' : ''}"></i>`).join('')}</span>`;
  const sp = G.special === 'gold' ? '<span class="pill gold" style="color:#3a1a00">קלף זהב נפתח</span>' : G.special === 'mystery' ? `<span class="pill">${ic('dice')}קלף מסתורי</span>` : G.special === 'unlock' ? `<span class="pill">${ic('star')}קלף בונוס נפתח</span>` : '';
  const stage = G.mode === 'date' && G.date ? `<span class="pill">שלב ${G.date.i + 1} מתוך ${G.date.stages.length}</span>` : '';
  const veil = G.veil ? `<div class="veil" data-act="g_unveil" role="button" aria-label="חשיפת הקלף"><div><svg class="ring" viewBox="0 0 200 200" style="color:#fff"><use href="#rings"/></svg><div class="disp" style="font-size:22px">${G.special === 'mystery' ? 'קלף מסתורי' : G.special === 'gold' ? 'קלף זהב' : 'הקישו לחשיפה'}</div><div class="sm" style="opacity:.85;margin-top:4px">${CATS[c.c].n}</div></div></div>` : '';
  return `<div class="stage"><div class="deckshadow b"></div><div class="deckshadow"></div><article class="card ${cls}" style="${gstyle(G.special === 'gold' ? 'gold' : m)}" aria-live="polite">${veil}
   <svg class="pat" viewBox="0 0 200 200" style="color:#fff"><use href="#rings"/></svg>
   <div class="hd"><span class="pill">${CATS[c.c] ? CATS[c.c].n : ''}</span>${c.gen === 'ai' ? `<span class="pill">${ic('star')}נכתב ע״י Claude</span>` : ''}${answeredPill(c)}${dots}${sp}${stage}${G.dbl ? '<span class="pill">נקודות כפולות</span>' : ''}</div>${inner}</article></div>`;
}
const turnLbl = (i, t) => `<div class="turn"><span class="pill" style="background:rgba(255,255,255,.25)">${nmG(i)}</span>${t}</div>`;
const waitFor = i => `<p class="mut" style="text-align:center;margin-top:10px">${ic('clock')} מחכים ל${nmG(i)}...</p>`;
function toolsHtml(c) {
  if (!c || c.id.startsWith('syn-')) return '';
  const fav = S.fav.includes(c.id), sv = S.saved.includes(c.id), rc = S.react[c.id], nt = S.notes[c.id];
  return `<div class="tools"><button class="ib ${fav ? 'on' : ''}" data-act="g_fav" aria-label="מועדפים" aria-pressed="${fav}">${ic('heart')}</button><button class="ib ${sv ? 'on' : ''}" data-act="g_save" aria-label="שמירה לפעם הבאה" aria-pressed="${sv}">${ic('bm')}</button><button class="ib ${rc ? 'on' : ''}" data-act="g_react" aria-label="תגובה">${rc ? `<span style="font-size:20px">${rc}</span>` : ic('smile')}</button><button class="ib ${nt ? 'on' : ''}" data-act="g_note" aria-label="הערה">${ic('note')}</button><button class="ib" data-act="g_report" aria-label="דיווח על תוכן לא מתאים">${ic('flag')}</button></div>`;
}
SCREENS.game = () => {
  if (!G) { setTimeout(() => go('home'), 0); return ''; }
  const c = G.card ? getCard(G.card) : null; const el = Math.floor((Date.now() - G.start) / 1000);
  const top = `<div class="gtop"><button class="ib" data-act="g_pause" aria-label="תפריט משחק">${ic('pause')}</button><div class="prog"><b style="color:var(--ink);font-weight:500">${esc(G.title)}</b><span><span id="gtime">${tfmt(el)}</span>${G.dur ? ` / ${G.dur} דק׳` : ''} · ${G.st.cards} קלפים${R.live ? ` · ${ic('wifi')} ${esc(R.peerName || 'מחובר')}` : ''}</span></div><div class="score">${ic('star')}<span>${G.st.pts}</span></div></div>`;
  let main = '', below = '';
  const T = G.turn, O = 1 - T;
  if (G.phase === 'time') {
    main = `<div class="stage"><article class="card in" style="${gstyle('end')}"><div class="body" style="text-align:center"><svg viewBox="0 0 24 24" style="width:70px;height:70px;margin:0 auto 12px;stroke:#fff;fill:none;stroke-width:1.6"><use href="#i-clock"/></svg><div class="txt">הזמן שהגדרתם נגמר</div><p style="opacity:.9;margin-top:8px">איך ממשיכים? אין תשובה לא נכונה.</p></div></article></div>`;
    below = `<div class="col"><button class="btn wide" data-act="g_more" data-m="5">עוד 5 דקות</button><button class="btn soft wide" data-act="g_more" data-m="15">עוד רבע שעה</button><button class="btn soft wide" data-act="g_end">${ic('heart')}לקלף הסיום</button></div>`;
  } else if (G.phase === 'choose') {
    main = `<div class="stage"><article class="card in" style="${gstyle('tod')}"><svg class="pat" viewBox="0 0 200 200" style="color:#fff"><use href="#rings"/></svg><div class="body" style="text-align:center">${turnLbl(T, gw(T, 'בוחר', 'בוחרת'))}<div class="txt" style="font-size:34px">אמת או חובה?</div><p style="opacity:.9;margin-top:10px">${G.st.cards ? `סבב ${G.st.cards + 1}` : 'הסבב הראשון'}. כל קלף אפשר להחליף.</p></div></article></div>`;
    below = canAct(T) ? `<div class="grid2"><button class="btn" data-act="g_tod" data-k="tr" style="min-height:70px;font-size:20px">אמת</button><button class="btn" data-act="g_tod" data-k="da" style="min-height:70px;font-size:20px;background:linear-gradient(135deg,#ff8c5a,#e0457b)">חובה</button></div><button class="btn ghost wide mt" data-act="g_tod" data-k="${Math.random() < .5 ? 'tr' : 'da'}">${ic('dice')}שהמשחק יבחר</button>` : waitFor(T);
  } else if (G.phase === 'final') {
    const e = CARD[G.endCard];
    main = cardShell(e, `<div class="body">${turnLbl(T, 'קלף הסיום')}<div class="txt">${esc(fmt(e.t, T))}</div></div>`);
    below = `<button class="btn wide" data-act="g_finish">${ic('trophy')}לסיכום המשחק</button>`;
  } else if (c) {
    const txt = esc(fmt(c.t, T));
    if (G.phase === 'consent') {
      main = cardShell(c, `<div class="body" style="text-align:center"><svg viewBox="0 0 24 24" style="width:60px;height:60px;margin:0 auto 10px;stroke:#fff;fill:none;stroke-width:1.6"><use href="#i-shield"/></svg><div class="txt" style="font-size:23px">קלף ${c.k === 't' ? 'משימה' : 'שאלה'} ברמה ${c.d}: ${CATS[c.c].n}</div><p style="opacity:.9;margin-top:8px">הקלף ייחשף רק אם שניכם בעניין. אפשר לומר לא, בלי הסברים.</p>
        <div class="consent">${[0,1].map(i => `<button class="${G.con[i] ? 'on' : ''}" data-act="g_con" data-p="${i}" ${canAct(i) ? '' : 'disabled'} aria-pressed="${!!G.con[i]}">${G.con[i] ? ic('check') + ' ' : ''}${nmG(i)}: בעניין</button>`).join('')}</div></div>`);
      below = `<button class="btn soft wide" data-act="g_skip">לא הפעם, הבא</button>`;
    } else if (c.k === 'q' || c.k === 'tr' || c.k === 't' || c.k === 'da') {
      const isT = c.k === 't' || c.k === 'da';
      main = cardShell(c, `<div class="body">${turnLbl(T, G.both ? 'עכשיו תורך לענות על אותה שאלה' : isT ? 'המשימה שלך' : 'השאלה אליך')}<div class="txt">${txt}</div></div>${c.tags.some(t => /^t\d|kiss/.test(t)) ? `<div class="ft xs" style="opacity:.85">${ic('shield')} רק אם שניכם רוצים. דילוג תמיד בסדר.</div>` : ''}`);
      const ready = !needsText(c) || (G.ga[0] && G.ga[1]) || !R.live;
      below = `${gameAnsHtml(c)}<div class="acts"><button class="btn soft" data-act="g_skip" aria-label="דילוג">${ic('skip')}דלג</button><button class="btn" data-act="g_done" ${ready ? '' : 'disabled'}>${ic('check')}${isT ? 'בוצע!' : needsText(c) ? (R.live && !ready ? 'מחכים לשניכם' : 'שמרנו, הבא') : 'ענינו'}</button></div>${!isT && !G.both && c.m !== 'adult' && !needsText(c) ? `<button class="btn ghost wide" data-act="g_both">גם ${nmG(O)} עונה על זה</button>` : ''}${G.mode === 'tod' ? `<button class="btn ghost wide" data-act="g_swap">החלפת קלף</button>` : ''}`;
    } else if (c.k === 'g') {
      const q = esc(fmt(c.t, T));
      if (G.phase === 'secret') {
        main = cardShell(c, `<div class="body">${turnLbl(T, 'עונה בסתר')}<div class="txt">${q}</div>${canAct(T) ? (c.o ? `<div class="opts">${c.o.map(o => `<button class="opt" data-act="g_secret" data-v="${esc(fmt(o, T))}">${esc(fmt(o, T))}</button>`).join('')}</div>` : `<input class="inp mt" id="gin" maxlength="140" placeholder="התשובה האמיתית שלך" autocomplete="off"><button class="btn wide mt" style="background:#fff;color:#1b5e8a" data-act="g_secret_t">שמרתי בסוד</button>`) : ''}</div>${!R.live ? `<div class="ft xs" style="opacity:.85">${ic('eyeoff')} ${nmG(O)}, בלי להציץ!</div>` : ''}`);
        below = canAct(T) ? '' : waitFor(T);
      } else if (G.phase === 'gpass') {
        main = `<div class="stage"><article class="card in" style="${gstyle('guess')}"><div class="body" style="text-align:center">${ic('phone')}<div class="txt">העבירו את הטלפון ל${nmG(O)}</div><p style="opacity:.9;margin-top:8px">התשובה של ${nmG(T)} נשמרה בסוד.</p></div></article></div>`;
        below = `<button class="btn wide" data-act="g_gpass">אני ${nmG(O)}, ${gw(O, 'מוכן', 'מוכנה')} לנחש</button>`;
      } else if (G.phase === 'guess') {
        main = cardShell(c, `<div class="body">${turnLbl(O, `${gw(O, 'מנחש', 'מנחשת')} מה ${nmG(T)} ${gw(T, 'ענה', 'ענתה')}`)}<div class="sm" style="opacity:.85">השאלה של ${nmG(T)}:</div><div class="txt">${q}</div>${canAct(O) ? (c.o ? `<div class="opts">${c.o.map(o => `<button class="opt" data-act="g_guess" data-v="${esc(fmt(o, T))}">${esc(fmt(o, T))}</button>`).join('')}</div>` : `<input class="inp mt" id="gin" maxlength="140" placeholder="הניחוש שלך" autocomplete="off"><button class="btn wide mt" style="background:#fff;color:#1b5e8a" data-act="g_guess_t">חשפו!</button>`) : ''}</div>`);
        below = canAct(O) ? '' : waitFor(O);
      } else {
        const res = {bull: 'בול! קוראים מחשבות', close: 'קרוב, כמעט', miss: 'הפתעה! בואו נדבר על זה'}[G.judged];
        main = cardShell(c, `<div class="body"><div class="txt" style="font-size:20px">${q}</div><div class="reveal"><div class="rv"><b>${nmG(T)} ${gw(T, 'ענה', 'ענתה')}</b><span>${esc(G.txt[0]) || '—'}</span></div><div class="rv"><b>${nmG(O)} ${gw(O, 'ניחש', 'ניחשה')}</b><span>${esc(G.txt[1]) || '—'}</span></div></div>${G.judged ? `<div class="match">${res}</div>` : `<p class="sm" style="margin-top:12px;opacity:.9">${nmG(T)} ${gw(T, 'מחליט', 'מחליטה')}: כמה קרוב זה היה?</p>`}</div>`, '');
        below = G.judged ? `<button class="btn wide" data-act="g_next">הקלף הבא</button>` : (canAct(T) ? `<div class="grid2" style="grid-template-columns:repeat(3,minmax(0,1fr))"><button class="btn ok sm" data-act="g_judge" data-r="bull">בול</button><button class="btn sm" data-act="g_judge" data-r="close">קרוב</button><button class="btn soft sm" data-act="g_judge" data-r="miss">פספוס</button></div>` : waitFor(T));
      }
    } else if (c.k === 'w' || c.k === 'd') {
      const opts = c.k === 'w' ? [nm(0), nm(1)] : c.o; const tx = esc(c.k === 'w' ? c.t : c.t);
      const optBtns = p => `<div class="opts">${opts.map((o, i) => `<button class="opt ${G.pick[p] === i ? 'on' : ''}" data-act="g_pick" data-p="${p}" data-v="${i}">${esc(o)}</button>`).join('')}</div>`;
      if (G.phase === 'pick0' || G.phase === 'pick1') { const p = G.phase === 'pick0' ? T : O; main = cardShell(c, `<div class="body">${turnLbl(p, gw(p, 'בוחר', 'בוחרת') + ' בסתר')}<div class="txt">${tx}</div>${optBtns(p)}</div>`); }
      else if (G.phase === 'pass1') { main = `<div class="stage"><article class="card in" style="${gstyle(c.m)}"><div class="body" style="text-align:center">${ic('phone')}<div class="txt">העבירו ל${nmG(O)}</div><p style="opacity:.9;margin-top:8px">הבחירה של ${nmG(T)} נשמרה בסוד.</p></div></article></div>`; below = `<button class="btn wide" data-act="g_pass1">אני ${nmG(O)}, לבחירה</button>`; }
      else if (G.phase === 'pick') { const me = R.me; main = cardShell(c, `<div class="body">${turnLbl(me, gw(me, 'בוחר', 'בוחרת') + ' בסתר')}<div class="txt">${tx}</div>${G.pick[me] === null ? optBtns(me) : `<p class="mt" style="opacity:.9">${ic('check')} בחרת. מחכים ל${nmG(1 - me)}...</p>`}</div>`); }
      else { const m = G.pick[0] === G.pick[1];
        main = cardShell(c, `<div class="body"><div class="txt" style="font-size:21px">${tx}</div><div class="reveal">${[0,1].map(i => `<div class="rv"><b>${nmG(i)} ${gw(i, 'בחר', 'בחרה')}</b><span>${esc(opts[G.pick[i]] ?? '—')}</span></div>`).join('')}</div><div class="match">${m ? 'על אותו גל!' : c.k === 'w' ? 'לא הסכמתם!' : 'דעות שונות. למה?'}</div>${!m && G.fun ? `<p class="sm" style="margin-top:8px;opacity:.95;text-align:center">${esc(G.fun)}</p>` : ''}</div>`, '');
        below = `<button class="btn wide" data-act="g_next">הקלף הבא</button>`; }
    } else if (c.k === 'm') {
      const rv = c.rv || {}; const ph = rv.mid && photos[rv.mid];
      main = cardShell(c, `<div class="body"><div class="turn">${ic('album')} מהזיכרונות שלכם</div><div class="txt">${esc(c.t)}</div>${G.phase === 'reveal' ? `<div class="rv mt" style="text-align:start"><b>${esc(rv.title)}${rv.date ? ' · ' + fmtDate(rv.date) : ''}</b>${rv.text ? `<p class="sm" style="margin-top:6px">${esc(rv.text)}</p>` : ''}${rv.song ? `<p class="sm">${ic('music')} ${esc(rv.song)}</p>` : ''}${ph ? `<img src="${ph}" alt="" style="width:100%;border-radius:14px;margin-top:8px;max-height:200px;object-fit:cover">` : ''}</div>` : ''}</div>`);
      below = G.phase === 'reveal' ? `<div class="acts" style="grid-template-columns:1fr 1fr"><button class="btn soft" data-act="g_memok" data-ok="0">צריך לרענן</button><button class="btn" data-act="g_memok" data-ok="1">זכרנו!</button></div>` : `<div class="acts"><button class="btn soft" data-act="g_skip">${ic('skip')}דלג</button><button class="btn" data-act="g_memrev">${ic('eye')}חשפו את הזיכרון</button></div>`;
    }
    if (G.phase !== 'consent') below += toolsHtml(c);
  }
  const stop = G.mode === 'adult' || (c && c.m === 'adult') ? `<button class="stop" data-act="g_stop">${ic('pause')}עצרו</button>` : '';
  return `<div class="scr">${top}${main}${below}</div>${stop}`;
};
const tfmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
let gTimer = 0;
SCREENS.game_mount = () => { clearInterval(gTimer); gTimer = setInterval(() => { const e = $('#gtime'); if (!e || !G) return clearInterval(gTimer); e.textContent = tfmt(Math.floor((Date.now() - G.start) / 1000)); }, 1000); const i = $('#gin'); if (i) i.onkeydown = e => { if (e.key === 'Enter') $('[data-act^="g_secret_t"],[data-act^="g_guess_t"]').click(); }; };

ACT.g_unveil = () => act('unveil');
ACT.g_tod = a => act('tod', {k: a.dataset.k});
ACT.g_done = () => { const c = G && G.card && getCard(G.card); if (c && needsText(c)) { if (!R.live) { const v = [0, 1].map(i => (G.ga[i] || ($('#ga' + i) && $('#ga' + i).value) || '').trim()); if (!v[0] || !v[1]) return toast(`כל אחד כותב תשובה. חסרה תשובה של ${esc(nm(v[0] ? 1 : 0))}`); G.ga = v; } else if (!(G.ga[0] && G.ga[1])) return toast('מחכים ששניכם תשמרו תשובה'); } act('done'); };
ACT.gadraft = a => { GDRAFT[gameAnsKey(G) + a.dataset.p] = a.value; };
ACT.g_anssave = a => { const p = +a.dataset.p; const v = (($('#ga' + p) || {}).value || '').trim(); if (!v) return toast('כתבו כמה מילים'); act('gans', {p, v}); };
ACT.g_ansed = a => { const p = +a.dataset.p; GDRAFT[gameAnsKey(G) + p] = G.ga[p]; act('gans', {p, v: ''}); };
ACT.g_prevans = () => G && G.card && prevAnsSheet(G.card);
ACT.g_both = () => act('both');
ACT.g_skip = () => act('skip');
ACT.g_swap = () => { G.st.skips++; act('tod', {k: G.todk || 'tr'}); };
ACT.g_secret = a => act('secret', {v: a.dataset.v});
ACT.g_secret_t = () => { const v = $('#gin').value.trim(); if (!v) return toast('כתבו תשובה קצרה'); act('secret', {v}); };
ACT.g_gpass = () => act('gpass');
ACT.g_guess = a => act('guess', {v: a.dataset.v});
ACT.g_guess_t = () => { const v = $('#gin').value.trim(); if (!v) return toast('כתבו ניחוש'); act('guess', {v}); };
ACT.g_judge = a => act('judge', {r: a.dataset.r});
ACT.g_pick = a => { if (!canAct(+a.dataset.p) && R.live) return; act('pick', {p: +a.dataset.p, v: +a.dataset.v}); };
ACT.g_pass1 = () => act('pass1');
ACT.g_con = a => act('consent', {p: +a.dataset.p, v: G.con[+a.dataset.p] ? 0 : 1});
ACT.g_memrev = () => act('memrev');
ACT.g_memok = a => act('memok', {ok: a.dataset.ok === '1'});
ACT.g_next = () => act('next');
ACT.g_more = a => act('more', {min: +a.dataset.m});
ACT.g_end = () => act('end');
ACT.g_finish = () => act('finish');
ACT.g_fav = () => { const id = G.card; const i = S.fav.indexOf(id); if (i >= 0) S.fav.splice(i, 1); else { S.fav.push(id); if (!G.hl.includes(id)) G.hl.push(id); sfx('ok'); } save(); checkAch(); render(); };
ACT.g_save = () => { const id = G.card; const i = S.saved.indexOf(id); if (i >= 0) S.saved.splice(i, 1); else { S.saved.push(id); G.saved.push(id); toast('נשמר לפעם הבאה'); } save(); render(); };
ACT.g_react = () => { const id = G.card; sheet(`<h3>איך הקלף הזה הרגיש?</h3><div class="row mt" style="justify-content:space-between">${['😂','❤️','😮','🔥','🥹','🤔'].map(e => `<button class="ib" style="width:52px;height:52px;font-size:26px" data-e="${e}" aria-label="${e}">${e}</button>`).join('')}</div>${S.react[id] ? `<button class="btn ghost wide mt" data-e="">הסרת תגובה</button>` : ''}`, b => b.addEventListener('click', e => { const t = e.target.closest('[data-e]'); if (!t) return; if (t.dataset.e) { S.react[id] = t.dataset.e; if (!G.hl.includes(id)) G.hl.push(id); } else delete S.react[id]; save(); closeSheet(); render(); })); };
ACT.g_note = () => { const id = G.card; sheet(`<h3>הערה לקלף</h3><p class="sm mut">משהו שתרצו לזכור מהשיחה הזאת. נשמר רק אצלכם.</p><textarea class="inp mt" id="nt" maxlength="500">${esc(S.notes[id] || '')}</textarea><button class="btn wide mt" id="nts">שמירה</button>`, b => { $('#nts', b).onclick = () => { const v = $('#nt', b).value.trim(); if (v) { S.notes[id] = v; if (!G.hl.includes(id)) G.hl.push(id); } else delete S.notes[id]; save(); closeSheet(); render(); toast('ההערה נשמרה'); }; }); };
ACT.g_report = () => { const id = G.card; sheet(`<h3>דיווח על הקלף</h3><p class="sm mut">הקלף יוסר מהחפיסה שלכם. אפשר להחזיר אותו ממסך המועדפים.</p><div class="col mt">${['לא מתאים לנו','פוגעני או לא נעים','ניסוח לא ברור','כבר שיחקנו בו יותר מדי'].map(r => `<button class="btn soft wide" data-r="${r}">${r}</button>`).join('')}</div>`, b => b.addEventListener('click', e => { const t = e.target.closest('[data-r]'); if (!t) return; S.reported[id] = {r: t.dataset.r, ts: Date.now()}; save(); closeSheet(); toast('תודה. הקלף לא יופיע שוב.'); act('skip'); })); };
ACT.g_pause = () => {
  const isAdult = G.mode === 'adult';
  sheet(`<h2>${esc(G.title)}</h2><p class="mut sm">${G.st.cards} קלפים · ${G.st.pts} נקודות · ${tfmt(Math.floor((Date.now() - G.start) / 1000))}</p>
  <div class="col mt"><button class="btn wide" data-close>${ic('play')}המשך</button>
  <button class="btn soft wide" id="pz_set">${ic('shield')}התאמה וגבולות</button>
  ${isAdult && G.level > 1 ? `<button class="btn soft wide" id="pz_down">הורדה לרמה ${G.level - 1}</button>` : ''}
  <button class="btn soft wide" id="pz_end">${ic('heart')}סיום עם קלף סיום</button>
  ${R.live ? '' : `<button class="btn ghost wide" id="pz_exit">יציאה (אפשר להמשיך אחר כך)</button>`}</div>`, b => {
    $('#pz_end', b).onclick = () => { closeSheet(); act('end'); };
    const ex = $('#pz_exit', b); if (ex) ex.onclick = () => { closeSheet(); S.cur = G; save(); G = null; stack = [{name:'home'}]; render(); };
    const dn = $('#pz_down', b); if (dn) dn.onclick = () => { closeSheet(); lowerLevel(); };
    $('#pz_set', b).onclick = () => quickBounds();
  });
};
function quickBounds() {
  sheet(`<h2>התאמה תוך כדי משחק</h2><label class="f">רמת מגע</label><div class="seg" id="qt">${TOUCH.map((t, i) => `<button class="${S.set.touch === i ? 'on' : ''}" data-v="${i}">${t}</button>`).join('')}</div>
  <div class="list mt">${Object.entries(BOUNDS).map(([k, l]) => `<div class="li"><span class="sp">${l}</span><button class="sw ${S.set.bounds[k] ? 'on' : ''}" data-b="${k}" role="switch" aria-checked="${!!S.set.bounds[k]}" aria-label="${l}"></button></div>`).join('')}</div>
  ${G.card && CARD[G.card] ? `<button class="btn soft wide mt" id="qhide">הסתרת הקטגוריה "${CATS[CARD[G.card].c].n}"</button>` : ''}
  <button class="btn wide mt" id="qok">החלה והמשך</button>`, b => {
    $('#qt', b).onclick = e => { const t = e.target.closest('[data-v]'); if (!t) return; S.set.touch = +t.dataset.v; $$('#qt button', b).forEach(x => x.classList.toggle('on', x === t)); };
    $$('[data-b]', b).forEach(x => x.onclick = () => { const k = x.dataset.b; S.set.bounds[k] = S.set.bounds[k] ? 0 : 1; x.classList.toggle('on'); });
    const h = $('#qhide', b); if (h) h.onclick = () => { const c = CARD[G.card].c; if (!S.set.hide.includes(c)) S.set.hide.push(c); toast('הקטגוריה הוסתרה'); h.disabled = true; };
    $('#qok', b).onclick = () => { save(); closeSheet(); if (G.mode !== 'tod' && G.mode !== 'date' && !['saved'].includes(G.mode)) { const rest = G.deck.slice(G.pos).filter(id => { const c = getCard(id); return c && (id.startsWith('syn-') || allowed(c, {ignoreHide: G.mode === 'cat', level: G.level})); }); G.deck = G.deck.slice(0, G.pos).concat(rest); } const c = G.card && CARD[G.card]; if (c && !allowed(c, {ignoreHide: G.mode === 'cat', level: G.level})) act('skip'); else commit(); };
  });
}
function lowerLevel() { G.level = Math.max(1, G.level - 1); const rest = G.deck.slice(G.pos).filter(id => CARD[id].d <= G.level); G.deck = G.deck.slice(0, G.pos).concat(rest); toast(`ממשיכים ברמה ${G.level}`); if (G.card && CARD[G.card].d > G.level) act('skip'); else commit(); }
ACT.g_stop = () => sheet(`<h2>עצרנו. הכל בסדר.</h2><p class="mut mt">אין צורך להסביר. מה מרגיש נכון עכשיו?</p><div class="col mt2">
  <button class="btn soft wide" data-close>הכל טוב, ממשיכים</button>
  <button class="btn soft wide" id="st_skip">לדלג על הקלף הזה</button>
  ${G.level > 1 ? `<button class="btn soft wide" id="st_down">להוריד רמה</button>` : ''}
  <button class="btn soft wide" id="st_soft">לעבור למשהו רך: פלרטוט עדין</button>
  <button class="btn wide" id="st_end">לסיים להערב</button></div>`, b => {
    $('#st_skip', b).onclick = () => { closeSheet(); act('skip'); };
    const d = $('#st_down', b); if (d) d.onclick = () => { closeSheet(); lowerLevel(); };
    $('#st_soft', b).onclick = () => { closeSheet(); if (R.live && !R.host) return toast('החלפת משחק נעשית בטלפון שיצר את החדר'); startGame('flirt', {dur: G.dur, start: G.turn}); };
    $('#st_end', b).onclick = () => { closeSheet(); act('end'); };
  });
ACT.resume = () => { if (!S.cur) return; G = S.cur; stack = [{name:'home'}, {name:'game'}]; render(); };
ACT.replay = () => { const l = S.last; if (!l) return; if (l.mode === 'date') return go('datebuild'); if (l.mode === 'adult' && !S.set.adult.on) return go('adultgate'); pregame(l.mode, l.cat ? {cat: l.cat, title: l.title} : {}); };

/* ───────── end screen ───────── */
SCREENS.end = () => {
  if (!G) { setTimeout(() => go('home'), 0); return ''; }
  const e = G.endCard && CARD[G.endCard]; const hl = G.hl.filter(id => getCard(id));
  const sugg = ['know','who','deep','flirt','guess','dil','date','tod'].filter(m => m !== G.mode).sort(() => Math.random() - .5)[0];
  const achs = (G.newAch || []).map(id => ACH.find(a => a[0] === id)).filter(Boolean);
  return `<div class="scr" style="padding-top:calc(18px + var(--safe-t))">
  <div class="hero" style="text-align:center;min-height:0">${ringsArt('art')}<div class="sm" style="position:relative;opacity:.9">${esc(G.title)}</div><h1 style="max-width:none;font-size:36px;margin-top:6px">איזה ${new Date().getHours() >= 17 || new Date().getHours() < 5 ? 'ערב' : 'משחק'}!</h1><p style="position:relative;margin-top:6px;opacity:.9">${G.mins || 0} דקות של ${esc(nm(0))} ו${esc(nm(1))}</p></div>
  <div class="stats mt">${[[G.st.cards,'קלפים'],[G.st.tasks,'משימות'],[G.st.ans,'תשובות'],[G.st.pts,'נקודות'],[G.st.bull + G.st.match,'התאמות'],[G.st.skips,'דילוגים']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  ${achs.length ? `<div class="sec"><h3>הישגים חדשים</h3></div><div class="col">${achs.map(a => `<div class="tile row"><span class="badge" style="width:48px;height:48px;border-radius:16px">${ic(a[4])}</span><div><b>${a[1]}</b><div class="sm mut">${a[2]}</div></div></div>`).join('')}</div>` : ''}
  ${hl.length ? `<div class="sec"><h3>רגעים מעניינים</h3></div><div class="col">${hl.map(id => { const c = getCard(id); return `<div class="tile" style="${gstyle(c.m)}"><div class="row"><i style="width:8px;height:8px;border-radius:50%;background:var(--g1)"></i><span class="xs mut sp">${CATS[c.c].n}</span>${S.react[id] ? `<span style="font-size:20px">${S.react[id]}</span>` : ''}${S.fav.includes(id) ? ic('heart') : ''}</div><div class="mt" style="margin-top:6px">${esc(fmt(c.t, 0))}</div>${S.notes[id] ? `<div class="note sm mt">${esc(S.notes[id])}</div>` : ''}</div>`; }).join('')}</div>` : ''}
  ${G.saved.length ? `<div class="sec"><h3>שמרתם לפעם הבאה</h3><button data-go="favorites" data-p='{"tab":"saved"}'>לרשימה</button></div><div class="col">${G.saved.filter(id => CARD[id]).map(id => `<div class="tile sm">${esc(fmt(CARD[id].t, 0))}</div>`).join('')}</div>` : ''}
  ${e ? `<div class="sec"><h3>קלף הסיום שלכם</h3></div><div class="card" style="${gstyle('end')};min-height:0"><div class="body" style="padding:6px 0"><div class="txt" style="font-size:22px">${esc(fmt(e.t, G.turn))}</div></div></div>` : ''}
  <div class="sec"><h3>היומן הזוגי</h3></div>
  ${G.journaled ? `<div class="tile row">${ic('check')}<span>נשמר ביומן. אפשר למצוא אותו בפרופיל הזוגי.</span></div>` : `<div class="tile"><input class="inp" id="jt" maxlength="60" placeholder="שם לערב הזה (למשל: הערב של הצחוקים)"><textarea class="inp mt" id="jn" maxlength="400" placeholder="משהו שתרצו לזכור מהמשחק"></textarea><div class="row mt" style="gap:8px"><button class="btn sp" data-act="jsave">${ic('book')}שמירה ביומן</button><button class="btn soft" data-act="jmem" title="גם כזיכרון">${ic('album')}+ זיכרון</button></div></div>`}
  <div class="sec"><h3>מה בפעם הבאה?</h3></div>
  <button class="mode big" style="${gstyle(sugg)};width:100%" data-act="mode" data-m="${sugg}">${modeArt(sugg)}<h3>${MODES[sugg].n}</h3><p>${MODES[sugg].s}</p></button>
  <div class="col mt2"><button class="btn wide" data-act="again">${ic('play')}עוד סיבוב</button><button class="btn soft wide" data-act="tohome">${ic('home')}למסך הבית</button></div></div>`;
};
ACT.jsave = (a, ev, asMem) => {
  const t = ($('#jt') || {}).value || '', n = ($('#jn') || {}).value || '';
  S.journal.push({id: uid(), ts: Date.now(), title: t.trim() || G.title, note: n.trim(), mode: G.mode, cards: G.st.cards, tasks: G.st.tasks, pts: G.st.pts, hl: G.hl.filter(id => CARD[id]).slice(0, 12)});
  if (asMem) { S.mem.push({id: uid(), type: 'game', title: t.trim() || G.title, date: dayKey(), text: n.trim(), song: '', ts: Date.now()}); S.prog.st.mems++; logEv('mem'); addPts(15); }
  G.journaled = true; save(); checkAch(); sfx('ok'); render(); toast(asMem ? 'נשמר ביומן ובזיכרונות' : 'נשמר ביומן');
};
ACT.jmem = (a, e) => ACT.jsave(a, e, true);
ACT.again = () => { const l = S.last; if (!l) return go('modes'); if (l.mode === 'date') return go('datebuild'); if (l.mode === 'saved') return go('favorites'); startGame(l.mode, {cat: l.cat, title: l.title, vibe: l.vibe, level: l.level, dur: S.set.dur, start: 'r'}); };
ACT.tohome = () => { G = null; stack = [{name:'home'}]; render(); };

/* ───────── date builder ───────── */
const DB = {len: 30, place: 'home', budget: 'free', mood: 'quiet', energy: 'mid', nophone: true};
const DATE_IDEAS = {
  'home-free': ['פיקניק על השטיח בסלון, עם נרות ושמיכה','ערב "מסעדה בבית": תפריט מודפס ושירות מלא','סרט מהשנה שבה נפגשתם, עם פופקורן ביתי'],
  'home-mid': ['ערב סושי שאתם מגלגלים לבד','טעימות יין או גבינות מהמכולת','ערב ספא ביתי עם מסכות ונרות'],
  'home-high': ['שף פרטי או ארוחת גורמה במשלוח','קופסת חוויה מפתיעה שנפתחת יחד','ערב קולנוע ביתי עם מקרן שכור'],
  'out-free': ['שקיעה על חוף או גג, עם תרמוס','הליכה לילית בשכונה שלא הכרתם','ספסל, גלידה וכל השאלות שבעולם'],
  'out-mid': ['בר קטן עם מוזיקה חיה','סדנת בישול או קרמיקה לשניים','שוק אוכל בערב, טועמים מכל דוכן'],
  'out-high': ['מסעדת שף שחלמתם עליה','לילה בצימר או במלון בוטיק','הופעה או הצגה, ואחר כך קינוח מאוחר']
};
function dateStages(d) {
  const L = {15: ['open','light','comp','rom','close'], 30: ['open','light','ftask','comp','deepq','rom','close'], 60: ['open','light','ftask','comp','game','creat','deepq','rom','close'], 180: ['open','light','ftask','comp','game','creat','light','deepq','game','rom','deepq','rom','close']}[d.len].slice();
  if (d.mood === 'quiet') { const i = L.indexOf('ftask'); if (i > 0) L[i] = 'light'; } else { const i = L.indexOf('deepq'); if (i > 0 && d.len >= 60) L[i] = 'game'; }
  if (d.energy === 'low') { const i = L.indexOf('game'); if (i > 0) L[i] = 'comp'; }
  return L;
}
SCREENS.datebuild = () => {
  const d = DB; const st = dateStages(d); const ideas = DATE_IDEAS[d.place + '-' + (d.budget === 'free' ? 'free' : d.budget)] || [];
  const s = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${d[k] === v ? 'on' : ''}" data-act="dbset" data-k="${k}" data-v='${JSON.stringify(v)}'>${l}</button>`).join('')}</div>`;
  return `<div class="scr">${topbar('הדייט שלנו')}
  <p class="mut">בונים ערב שלם, שלב אחרי שלב. בחרו מה מתאים לכם הערב.</p>
  <label class="f">כמה זמן?</label>${s('len', [[15,'15 דק׳'],[30,'30 דק׳'],[60,'שעה'],[180,'ערב שלם']])}
  <label class="f">איפה?</label>${s('place', [['home','בבית'],['out','בחוץ']])}
  <label class="f">תקציב</label>${s('budget', [['free','חינם'],['mid','בינוני'],['high','מפנק']])}
  <label class="f">מצב רוח</label>${s('mood', [['quiet','שקט ואינטימי'],['active','פעיל ושובב']])}
  <label class="f">אנרגיה</label>${s('energy', [['low','נמוכה'],['mid','רגילה'],['high','גבוהה']])}
  <label class="f">רמת מגע</label>${seg('set.touch', TOUCH.map((t, i) => [i, t]), S.set.touch)}
  <div class="list mt"><div class="li"><div class="sp"><div>דייט בלי טלפונים</div><div class="xs mut">הטלפון רק בשביל המשחק</div></div><button class="sw ${d.nophone ? 'on' : ''}" role="switch" aria-checked="${d.nophone}" data-act="dbset" data-k="nophone" data-v="${!d.nophone}" aria-label="דייט בלי טלפונים"></button></div></div>
  ${ideas.length ? `<div class="sec"><h3>רעיון למסגרת</h3><button data-act="dbidea">רעיון אחר</button></div><div class="tile row" style="${gstyle('date')};background:linear-gradient(140deg,var(--g1),var(--g2));color:#fff;border:0">${ic('spark')}<span class="disp" style="font-size:18px">${ideas[(DB.idea || 0) % ideas.length]}</span></div>` : ''}
  <div class="sec"><h3>מסלול הדייט</h3><span class="xs mut">${st.length} שלבים</span></div>
  <div class="tl col" style="gap:8px">${st.map((k, i) => `<div class="row tile" style="padding:10px 14px"><span class="disp" style="width:24px;color:var(--rose)">${i + 1}</span><span class="sp">${CATS[k].n}</span><span class="xs mut">~${Math.max(2, Math.round(d.len / st.length))} דק׳</span></div>`).join('')}</div>
  <button class="btn wide mt2" data-act="dbgo">${ic('heart')}יוצאים לדייט</button></div>`;
};
ACT.dbset = a => { DB[a.dataset.k] = JSON.parse(a.dataset.v); render(); };
ACT.dbidea = () => { DB.idea = (DB.idea || 0) + 1; render(); };
ACT.dbgo = () => startGame('date', {title: 'הדייט שלנו', dur: 0, start: 'r', nophone: DB.nophone, date: {stages: dateStages(DB), i: 0, place: DB.place, budget: DB.budget, used: []}});

/* ───────── two phones / remote (Claude room presence) ───────── */
async function remoteInit() {
  try {
    if (!window.claude || !window.claude.use) { R.cap = 'off'; return; }
    const room = await window.claude.use('room');
    R.room = room; R.cap = room ? 'on' : 'off';
    if (room) { try { room.onPeers(ansLobby); } catch (e) {} }
    if (room && S.room && S.room.code && S.onboard && S.roomAuth) joinRoom(S.room.code, S.room.host);
  } catch (e) { R.cap = 'off'; }
  if (['remote','infra'].includes(cur().name)) render();
}
const genCode = () => Array.from({length: 6}, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
async function joinRoom(code, host) {
  if (!R.room) return toast('החיבור בין טלפונים לא זמין בתצוגה הזאת', 'err');
  leaveRoom(true);
  S.room = {...(S.room && S.room.code === code ? S.room : {}), code, host}; save();
  R.code = code; R.host = host; R.me = host ? 0 : 1; R.acts = []; R.actN = 0; R.lastN = 0; R.seenVer = -1; R.ver = 0; R.joining = true; render();
  try { R.named = await R.room.join('bu-' + code); R.lobby = false; }
  catch (e) { R.named = R.room; R.lobby = true; }
  R.joining = false;
  const me = S.couple.p[0];
  R.named.presence({app: 'bu', code, role: host ? 'host' : 'guest', name: me.name || 'שחקן', acts: [], st: null, names: host ? S.couple.p.map(p => ({name: p.name, g: p.g})) : null}).catch(() => {});
  R.unsub = R.named.onPeers(onPeers, () => { R.live = false; render(); });
  ansSync();
  render();
}
function leaveRoom(silent) {
  try { R.unsub && R.unsub(); } catch (e) {}
  try { if (R.named && !R.lobby) R.named.leave(); else if (R.named) R.named.presence({app: null, code: null, role: null, st: null, acts: null}); } catch (e) {}
  if (!silent) { S.room = null; save(); try { R.room && R.room.presence({dans: null}); } catch (e) {} }
  const was = R.live; Object.assign(R, {named: null, code: '', live: false, peerName: '', names: null, unsub: null});
  if (G && G.remote) { G.remote = false; }
  if (!silent && was) toast('יצאתם מהחדר המשותף');
}
function onPeers(ch) {
  const twin = ch.peers.find(p => !p.isMe && p.presence && p.presence.app === 'bu' && p.presence.code === R.code && p.presence.role === (R.host ? 'host' : 'guest'));
  const meP = ch.peers.find(p => p.isMe);
  if (twin && meP && String(meP.peer) > String(twin.peer) && !R.flip) { R.flip = 1; setTimeout(() => { R.flip = 0; }, 4000); S.room.host = !R.host; save(); joinRoom(R.code, !R.host); return; }
  const partner = ch.peers.find(p => !p.isMe && p.presence && p.presence.app === 'bu' && p.presence.code === R.code && p.presence.role === (R.host ? 'guest' : 'host'));
  const wasLive = R.live;
  R.live = !!partner;
  if (cur().name === 'remote') { clearTimeout(R.rt); R.rt = setTimeout(() => cur().name === 'remote' && render(), 120); }
  if (!partner) { if (wasLive) { toast('בן/בת הזוג התנתק/ה. אפשר להמשיך על טלפון אחד.', 'err'); if (G) G.remote = false; render(); } return; }
  R.peerName = String(partner.presence.name || '').slice(0, 18);
  const pd = partner.presence.daily; if (pd && pd.d === dayKey() && pd.ts !== R.peerDaily) { if (R.peerDaily !== undefined) { toast(`<b>${esc(R.peerName)} ${gw(R.host ? 1 : 0, 'ענה', 'ענתה')} על קלף היום</b><br><span class="mut sm">ואתם?</span>`); buzz(60); } R.peerDaily = pd.ts; }
  if (typeof ANS_OPEN !== 'undefined' && ANS_OPEN && !wasLive) ANS_OPEN.redraw();
  if (!wasLive) { sfx('ach'); toast(`מחוברים ל${esc(R.peerName)}!`); if (R.host) { S.prog.st.remote = Math.max(S.prog.st.remote, 0); publish(); } render(); }
  if (R.host) {
    const acts = Array.isArray(partner.presence.acts) ? partner.presence.acts : [];
    acts.filter(a => a && a.n > R.lastN).sort((a, b) => a.n - b.n).forEach(a => { R.lastN = a.n; if (G && typeof a.type === 'string') { const d = a.data && typeof a.data === 'object' ? a.data : {}; if (['pick','consent'].includes(a.type)) d.p = 1; apply(a.type, d, 1); } });
  } else {
    const p = partner.presence; if (Array.isArray(p.names)) { R.names = p.names.slice(0, 2).map(x => ({name: String(x.name || '').slice(0, 18), g: ['m','f','x'].includes(x.g) ? x.g : 'x'})); if (S.room && JSON.stringify(S.room.names) !== JSON.stringify(R.names)) { S.room.names = R.names; save(); } }
    if (p.ver !== undefined && p.ver !== R.seenVer) { R.seenVer = p.ver; guestState(p.st); }
  }
}
function compactG() {
  if (!G) return null; const o = {...G}; delete o.deck; o.hl = o.hl.slice(-20); o.saved = []; o.synth = G.cardObj ? {[G.cardObj.id]: G.cardObj} : {};
  if (o.cardObj && o.cardObj.rv) o.cardObj = {...o.cardObj, rv: {...o.cardObj.rv, mid: null}};
  return o;
}
function publish() { if (!R.named || !R.host) return; R.ver++; const st = compactG(); if (st) st.remote = true; R.named.presence({ver: R.ver, st, names: S.couple.p.map(p => ({name: p.name, g: p.g}))}).catch(e => { if (st) { st.hl = []; st.cardObj = null; R.named.presence({ver: R.ver, st}).catch(() => {}); } }); }
function guestState(st) {
  if (!st) { if (G && G.remote && cur().name === 'game') { G = null; go('remote'); } return; }
  const prev = G && G.id === st.id ? G.st : {cards:0, ans:0, tasks:0, comps:0, bull:0, match:0, pts:0};
  const savedLocal = G && G.id === st.id ? G.saved : [];
  const prevN = G && G.last ? G.last.n : 0;
  G = st; G.remote = true; G.saved = savedLocal || []; G.deck = []; if (!G.ga) G.ga = ['', '']; try { recordFromG(G); } catch (e) {}
  if (st.last && st.last.by === 0 && st.last.n !== prevN && st.last.n !== R.noteN) { R.noteN = st.last.n; setTimeout(() => partnerNote(st.last), 50); }
  const d = k => Math.max(0, (st.st[k] || 0) - (prev[k] || 0));
  S.prog.st.cards += d('cards'); S.prog.st.ans += d('ans'); S.prog.st.tasks += d('tasks'); S.prog.st.comps += d('comps'); S.prog.st.bull += d('bull'); S.prog.st.match += d('match');
  if (d('pts')) addPts(d('pts'), true);
  if (d('tasks')) petFeed(d('tasks'), true);
  if (G.card && !G.card.startsWith('syn-')) S.prog.seen[G.card] = Math.max(1, S.prog.seen[G.card] || 0);
  if (st.phase === 'done') {
    if (!R.finalized[st.id]) { R.finalized[st.id] = 1; const mins = st.mins || Math.round((Date.now() - st.start) / 60000); S.prog.st.games++; S.prog.st.mins += mins; S.prog.st.remote++; logEv('game'); markDay(); G.newAch = checkAch().map(a => a[0]); S.last = {mode: st.mode, title: st.title, ts: Date.now(), cards: st.st.cards, pts: st.st.pts}; save(); stack = [{name:'home'}, {name:'end'}]; render(); confetti(); }
    return;
  }
  save();
  if (cur().name === 'game') render(); else { stack = [{name:'home'}, {name:'game'}]; render(); sfx('flip'); }
}
SCREENS.remote = c => {
  const link = R.code && APP_URL && !window.BU_STANDALONE ? APP_URL + '#join-' + R.code : '';
  const capPill = `<span class="status ${R.cap === 'on' ? 'ok' : R.cap === 'checking' ? 'wait' : 'no'}"><i></i>${{on: 'החיבור זמין', checking: 'בודק חיבור...', off: 'לא זמין בתצוגה הזאת'}[R.cap]}</span>`;
  let body = '';
  if (R.cap !== 'on') body = `<div class="tile"><b>איך זה עובד</b><p class="sm mut mt">כדי ששני טלפונים יתחברו, שניכם צריכים לפתוח את Between Us דרך Claude, כשאתם מחוברים לחשבון. אם האפליקציה נפתחה בתצוגה אחרת, החיבור לא יהיה זמין, ואפשר להמשיך לשחק על טלפון אחד.</p></div><button class="btn wide mt" data-go="home">משחק על טלפון אחד</button>`;
  else if (!R.code && S.room) body = `<div class="tile" style="text-align:center"><span class="status wait"><i></i>מתחברים לחדר "${esc(S.room.rname || '')}"...</span></div><button class="btn soft wide mt" data-act="rretry">ניסיון חוזר</button>`;
  else if (!R.code) body = `<div class="hero" style="min-height:0">${ringsArt('art')}<h1 style="font-size:28px">משחקים ביחד, כל אחד מהטלפון שלו</h1><p style="position:relative;opacity:.9;margin-top:8px;max-width:80%">תשובות סודיות נשארות בסוד באמת, וגם מרחוק מרגישים יחד.</p></div>
    <button class="btn wide mt" data-act="rcreate">${ic('plus')}יצירת חדר משחק</button>
    <div class="tile mt"><label class="f" for="rc" style="margin-top:0">יש לכם קוד מבן/בת הזוג?</label><div class="row"><input id="rc" class="inp" style="direction:ltr;text-align:center;letter-spacing:.2em;font-family:Fredoka;font-size:22px" maxlength="6" placeholder="abc123" value="${esc(c.code || R.pending || '')}" autocomplete="off" autocapitalize="off"><button class="btn" data-act="rjoin">הצטרפות</button></div></div>
    <div class="note info mt">${ic('info')} בן/בת הזוג צריכים גישה לאפליקציה: שתפו אותה מכפתור השיתוף של Claude (הזמנה לפי אימייל), ושניכם צריכים להיות מחוברים לחשבון Claude.</div>`;
  else body = `<div class="tile" style="text-align:center"><div class="sm mut">החדר שלכם</div><div class="disp mt" style="font-size:30px">${esc((S.room && S.room.rname) || R.code)}</div><div class="xs dim" style="direction:ltr">${esc(R.code)}</div>${R.host && link ? `<div id="qr" aria-label="קוד QR להצטרפות"></div><button class="btn soft sm" data-act="rcopy" style="margin:0 auto">${ic('link')}העתקת קישור הצטרפות</button>` : R.host ? `<button class="btn soft sm mt" data-act="rcopycode" style="margin-inline:auto">${ic('copy')}העתקת הקוד</button>` : ''}
    <div class="mt"><span class="status ${R.live ? 'ok' : 'wait'}"><i></i>${R.joining ? 'מתחברים...' : R.live ? `מחוברים ל${esc(R.peerName)}` : R.host ? 'מחכים שבן/בת הזוג יצטרפו...' : 'מתחברים לחדר...'}</span></div></div>
    ${R.live && R.host ? `<button class="btn wide mt" data-go="modes">${ic('play')}בחירת משחק</button><p class="xs mut mt" style="text-align:center">כל משחק שתתחילו יופיע בשני הטלפונים. כל טלפון מציג רק את מה שמיועד לבעליו.</p>` : ''}
    ${R.live && !R.host ? `<div class="tile mt" style="text-align:center">${ic('clock')}<p class="mt">המשחק שייבחר בטלפון השני יופיע כאן אוטומטית.</p></div>` : ''}
    ${G && G.remote && G.phase !== 'done' ? `<button class="btn wide mt" data-go="game">חזרה למשחק</button>` : ''}
    <div class="sec"><h3>מי בחדר עכשיו</h3><span class="sm mut">${roomPeople().length}/2</span></div>
    <div class="list">${roomPeople().map(p => `<div class="li"><span class="ico" style="background:${p.role === 'host' ? 'rgba(255,92,138,.2)' : 'rgba(120,140,255,.2)'}">${ic('user')}</span><span class="sp"><b>${esc(p.name)}</b>${p.me ? ' <span class="xs mut">(את/ה)</span>' : ''}<span class="xs mut" style="display:block">${p.role === 'host' ? 'יצר/ה את החדר' : 'הצטרף/ה לחדר'}</span></span><span class="status ${p.idle ? 'wait' : 'ok'}"><i></i>${p.idle ? 'לא פעיל/ה' : 'מחובר/ת'}</span></div>`).join('') || `<div class="li mut sm">מתחברים...</div>`}${roomPeople().length < 2 ? `<div class="li mut sm">${ic('clock')} מחכים לבן/בת הזוג. שלחו להם את שם החדר והסיסמה.</div>` : ''}</div>
    <button class="btn ghost wide mt" data-act="exitroom">יציאה מהחדר</button>`;
  return `<div class="scr">${topbar('שני טלפונים / מרחוק', capPill)}${body}
  <div class="sec"><h3>מה עובד</h3></div><div class="list">
   <div class="li"><span class="ico">${ic('check')}</span><span class="sp sm">סנכרון בזמן אמת: אותו קלף, ניחושים ובחירות סודיות, הסכמה מכל טלפון בנפרד.</span></div>
   <div class="li"><span class="ico">${ic('check')}</span><span class="sp sm">עובד גם מרחוק, בכל מקום, כל עוד שניכם מחוברים.</span></div>
   <div class="li"><span class="ico">${ic('info')}</span><span class="sp sm">ההתקדמות נשמרת בכל טלפון בנפרד. זיכרונות ותמונות לא עוברים בין הטלפונים.</span></div></div></div>`;
};
SCREENS.remote_mount = () => { const q = $('#qr'); const link = R.code && APP_URL ? APP_URL + '#join-' + R.code : ''; if (q && link && window.QRCode) try { new QRCode(q, {text: link, width: 170, height: 170, correctLevel: QRCode.CorrectLevel.M}); } catch (e) { q.remove(); } else if (q) q.remove(); };
ACT.rcreate = () => joinRoom(genCode(), true);
ACT.rjoin = () => { const v = ($('#rc').value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''); if (v.length !== 6) return toast('הקוד צריך להיות 6 תווים', 'err'); R.pending = ''; joinRoom(v, false); };
ACT.rleave = () => ACT.exitroom();
ACT.rretry = () => { if (S.room && R.room) joinRoom(S.room.code, S.room.host); else toast('החיבור החי לא זמין בתצוגה הזאת', 'err'); };
ACT.rcopy = () => copyText(APP_URL + '#join-' + R.code);
ACT.rcopycode = () => copyText(R.code);

/* ───────── boot ───────── */
window.buTick = () => {
  if (document.hidden) return;
  try { save(); ansSync(); } catch (e) {}
  const a = document.activeElement; if (a && /^(TEXTAREA|INPUT)$/.test(a.tagName)) return;
  if ($('.sheet')) return;
  if (typeof GM !== 'undefined' && GM) return;
  if (['home','missions','remote','profile','hints','cal','work','places','arcade'].includes(cur().name)) render();
};
function boot() {
  load();
  if (/^#join-[a-z0-9]{6}$/.test(location.hash)) R.pending = location.hash.slice(6);
  stack = S.onboard ? [{name:'home'}] : [{name:'splash'}];
  if (S.onboard && R.pending) stack.push({name:'remote', code: R.pending});
  if (S.onboard) markDay();
  render();
  if (S.set.pin) pinPad('הקלידו את הקוד', v => String(hashStr('bu' + v)) === S.set.pin ? true : false, true);
  document.addEventListener('visibilitychange', () => { if (document.hidden && S.set.discreet && !$('.discreet')) { const d = document.createElement('div'); d.className = 'discreet'; d.innerHTML = `<div><svg width="80" height="80" style="color:var(--rose)"><use href="#rings"/></svg><p class="mt mut">הקישו כדי לחזור</p></div>`; d.onclick = () => { d.remove(); if (S.set.pin) pinPad('הקלידו את הקוד', v => String(hashStr('bu' + v)) === S.set.pin, true); }; document.body.appendChild(d); } });
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => S.set.ui === 'auto' && applyUI());
  cloudInit(); remoteInit();
}
boot();
