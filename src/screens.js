/* Between Us — screens */
const getP = p => p.split('.').reduce((o, k) => o?.[k], S);
const setP = (p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = v; };
const sw = (k, label, sub = '') => `<div class="li"><div class="sp"><div>${label}</div>${sub ? `<div class="xs mut">${sub}</div>` : ''}</div><button class="sw ${getP(k) ? 'on' : ''}" role="switch" aria-checked="${!!getP(k)}" aria-label="${esc(label)}" data-act="tog" data-k="${k}"></button></div>`;
const seg = (k, opts, cur, act = 'seg') => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-act="${act}" data-k="${k}" data-v='${JSON.stringify(v)}'>${l}</button>`).join('')}</div>`;
ACT.tog = a => { const k = a.dataset.k; setP(k, getP(k) ? (typeof getP(k) === 'number' ? 0 : false) : (k.startsWith('set.bounds') ? 1 : true)); save(); render(); };
ACT.seg = a => { setP(a.dataset.k, JSON.parse(a.dataset.v)); save(); render(); };
const linkRow = (go, icon, label, sub = '', p) => `<button class="li" style="width:100%;text-align:start" data-go="${go}" ${p ? `data-p='${JSON.stringify(p)}'` : ''}><span class="ico">${ic(icon)}</span><span class="sp"><span style="display:block">${label}</span>${sub ? `<span class="xs mut">${sub}</span>` : ''}</span>${ic('fwd', 'dim')}</button>`;

/* ───────── splash & onboarding ───────── */
SCREENS.splash = () => `<div class="splash">
  <svg class="logo" viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="lg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff5c8a"/><stop offset="1" stop-color="#b46bff"/></linearGradient></defs>
  <circle cx="100" cy="100" r="96" fill="url(#lg)" opacity=".14"/><g class="r1" style="color:#ff5c8a"><circle cx="80" cy="100" r="52" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="290 40"/></g><g class="r2" style="color:#c9a0ff"><circle cx="120" cy="100" r="52" fill="none" stroke="currentColor" stroke-width="9" stroke-dasharray="250 70"/></g>
  <path d="M100 84c-6-10-22-8-22 4 0 10 22 24 22 24s22-14 22-24c0-12-16-14-22-4z" fill="#fff"/></svg>
  <div><h1 style="font-size:46px">Between Us</h1><p class="disp mut" style="font-size:20px;margin-top:6px">המשחק שמקרב בינינו</p></div>
  <div class="col" style="text-align:start;width:100%;max-width:340px;gap:10px">
   ${[['cards','יותר מ-500 קלפים ב-10 מצבי משחק'],['heart','מצחיק, רומנטי, עמוק, ולפעמים נועז'],['shield','גבולות, הסכמה ודילוג חופשי בכל רגע'],['album','זיכרונות, דייטים, משימות והישגים זוגיים']].map(([i, t]) => `<div class="row"><span class="ico" style="width:36px;height:36px;border-radius:12px;display:grid;place-items:center;background:var(--sur2)">${ic(i)}</span><span>${t}</span></div>`).join('')}
  </div>
  <button class="btn wide" style="max-width:360px" data-go="onboard" data-p='{"step":0}'>בואו נתחיל</button>
  <p class="xs dim">הכל נשמר אצלכם במכשיר. בלי פרסומות ובלי חשבון.</p></div>`;

const OB = {};
SCREENS.onboard = c => {
  const st = c.step || 0; const P = S.couple.p;
  const steps = `<div class="steps">${[0,1,2,3,4].map(i => `<i class="${i <= st ? 'f' : ''}"></i>`).join('')}</div>`;
  const gseg = i => seg(`couple.p.${i}.g`, [['m','זכר'],['f','נקבה'],['x','לא משנה לי']], P[i].g);
  let body = '';
  if (st === 0) body = `<h1>מי משחק הערב?</h1><p class="mut mt">השמות והלשון ישמשו כדי שכל קלף ידבר אליכם נכון.</p>
    <label class="f" for="n0">השם או הכינוי שלך</label><input id="n0" class="inp" maxlength="18" value="${esc(P[0].name)}" data-in="obname" data-i="0" placeholder="למשל: נועה">
    <div class="mt">${gseg(0)}</div>
    <label class="f" for="n1">השם או הכינוי של בן/בת הזוג</label><input id="n1" class="inp" maxlength="18" value="${esc(P[1].name)}" data-in="obname" data-i="1" placeholder="למשל: דניאל">
    <div class="mt">${gseg(1)}</div>`;
  if (st === 1) body = `<h1>קצת עליכם</h1><p class="mut mt">הכל אופציונלי. אפשר לדלג ולהשלים אחר כך.</p>
    <label class="f">מה אתם?</label><div class="seg">${RELS.map(r => `<button class="${S.couple.rel === r ? 'on' : ''}" data-act="seg" data-k="couple.rel" data-v='${JSON.stringify(r)}'>${r}</button>`).join('')}</div>
    <label class="f" for="since">מתי התחלתם?</label><input id="since" type="date" class="inp" value="${esc(S.couple.since)}" data-ch="since">
    <label class="f" for="cn">שם זוגי (אם יש)</label><input id="cn" class="inp" maxlength="24" value="${esc(S.couple.name)}" data-in="cname" placeholder="למשל: הצוות הכי טוב">`;
  if (st === 2) body = `<h1>איך תשחקו?</h1><p class="mut mt">אפשר להחליף בכל רגע.</p><div class="col mt">
    ${[['one','phone','על טלפון אחד','מעבירים את הטלפון ביניכם. עובד תמיד, גם בלי אינטרנט.'],['two','wifi','בשני טלפונים, באותו חדר','כל אחד עונה בסתר על הטלפון שלו. דורש ששניכם תפתחו את האפליקציה דרך Claude.'],['remote','link','מרחוק','משחקים יחד גם כשאתם לא באותו מקום, בשיחת וידאו או טלפון.']].map(([v, i, t, s]) => `<button class="tile tap" style="text-align:start;display:flex;gap:12px;align-items:center;${S.set.play === v ? 'border-color:var(--rose);background:rgba(255,92,138,.1)' : ''}" data-act="seg" data-k="set.play" data-v='"${v}"'><span class="ib" style="pointer-events:none">${ic(i)}</span><span><b>${t}</b><br><span class="sm mut">${s}</span></span></button>`).join('')}</div>`;
  if (st === 3) body = `<h1>מה מתאים לכם?</h1><p class="mut mt">ברירת המחדל לסבב מהיר. כל משחק אפשר להתאים מחדש.</p>
    <label class="f">סגנון</label><div class="row wrap">${Object.entries(VIBES).filter(([k]) => k !== 'intimate').map(([k, l]) => `<button class="chip ${S.set.vibe === k ? 'on' : ''}" data-act="seg" data-k="set.vibe" data-v='"${k}"'>${l}</button>`).join('')}</div>
    <label class="f">משך משחק רגיל</label>${seg('set.dur', DURS, S.set.dur)}
    <label class="f">רמת מגע במשימות</label>${seg('set.touch', TOUCH.map((t, i) => [i, t]), S.set.touch)}`;
  if (st === 4) body = `<h1>הגבולות שלכם</h1><p class="mut mt">כבו כל דבר שלא מתאים לכם. הקלפים האלה פשוט לא יופיעו.</p>
    <div class="list mt">${Object.entries(BOUNDS).map(([k, l]) => sw('set.bounds.' + k, l)).join('')}</div>
    <div class="note mt">${ic('lock')} מצב האינטימיות למבוגרים נעול. אפשר לפתוח אותו רק כששניכם מאשרים, דרך מסך הגבולות.</div>`;
  const can = st !== 0 || (P[0].name.trim() && P[1].name.trim());
  return `<div class="scr" style="padding-top:calc(18px + var(--safe-t))">${steps}${body}
  <div class="col mt2"><button class="btn wide" data-act="obnext" ${can ? '' : 'disabled'} id="obn">${st === 4 ? 'יוצאים לדרך' : 'המשך'}</button>${st ? `<button class="btn ghost wide" data-act="obprev">חזרה</button>` : ''}</div></div>`;
};
ACT.obname = a => { S.couple.p[+a.dataset.i].name = a.value.trim().slice(0, 18); save(); const b = $('#obn'); if (b) b.disabled = !(S.couple.p[0].name && S.couple.p[1].name); };
ACT.cname = a => { S.couple.name = a.value.slice(0, 24); save(); };
ACT.since = a => { S.couple.since = a.value; save(); };
ACT.obnext = () => { const c = cur(); if ((c.step || 0) < 4) { c.step = (c.step || 0) + 1; render(); window.scrollTo(0, 0); return; }
  S.onboard = true; save(); stack = [{name:'home'}]; render(); confetti(); sfx('ach');
  if (S.set.play !== 'one') setTimeout(() => sheet(`<h2>לחבר את הטלפון השני?</h2><p class="mut mt">צרו חדר משחק עם קוד, קישור או QR, ובן/בת הזוג מצטרפים מהטלפון שלהם.</p><div class="col mt2"><button class="btn wide" data-go="remote">לחיבור הטלפון השני</button><button class="btn soft wide" data-close>אחר כך</button></div>`), 600); };
ACT.obprev = () => { cur().step = Math.max(0, (cur().step || 0) - 1); render(); };

/* ───────── home ───────── */
function rankRing(size = 64) {
  const pts = S.prog.pts, r = rankOf(pts), lo = RANKS[r][0], hi = RANKS[r + 1] ? RANKS[r + 1][0] : lo + 1000; const f = Math.min(1, (pts - lo) / (hi - lo));
  const C = 2 * Math.PI * 26;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="דרגה ${RANKS[r][1]}"><circle cx="32" cy="32" r="26" fill="none" stroke="var(--sur2)" stroke-width="6"/><circle cx="32" cy="32" r="26" fill="none" stroke="url(#rg)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - f)}" transform="rotate(-90 32 32)"/><defs><linearGradient id="rg"><stop offset="0" stop-color="#ff5c8a"/><stop offset="1" stop-color="#ffc46b"/></linearGradient></defs><text x="32" y="38" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="17" fill="var(--ink)">${r + 1}</text></svg>`;
}
function dailyCard() {
  const d = dayKey(); if (!S.daily[d]) { const pool = CARDS.filter(c => ['know','deep','flirt'].includes(c.m) && c.k === 'q' && allowed(c)); const pk = pickSeeded(pool, 1, hashStr(d + 'daily'))[0]; S.daily = {[d]: {id: pk ? pk.id : null, open: false, done: false}}; }
  return S.daily[d];
}
SCREENS.home = () => {
  const h = new Date().getHours(); const greet = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב';
  const dc = dailyCard(); const dcard = dc.id && CARD[dc.id];
  const r = rankOf(S.prog.pts); const achN = Object.keys(S.prog.ach).length;
  const tm = todayMissions(); const done = tm.filter(m => misDone(m.id, dayKey())).length;
  const modeKeys = Object.keys(MODES).filter(m => m !== 'mix' && !(m === 'adult' && S.set.hideAdult));
  const favCats = S.set.fav.length ? S.set.fav : ['us','dream','tfun','love','fq','wus','dlrom'];
  const last = S.last;
  return `<div class="scr">
  <header class="top" style="background:none;backdrop-filter:none"><div class="row sp" data-go="achievements" style="cursor:pointer">${rankRing(54)}<div><div class="sm mut">${greet}</div><div class="disp" style="font-size:21px">${esc(nm(0))} ו${esc(nm(1))}</div></div></div><button class="ib" data-go="settings" aria-label="הגדרות">${ic('gear')}</button></header>
  ${R.live ? `<button class="tile tap row" style="width:100%;margin-bottom:12px;padding:10px 14px" data-go="remote"><span class="status ok"><i></i>אונליין</span><span class="sp sm" style="text-align:start">מחוברים ל${esc(R.peerName)}</span>${ic('fwd','dim')}</button>` : S.room ? `<button class="tile tap row" style="width:100%;margin-bottom:12px;padding:10px 14px" data-go="remote"><span class="status wait"><i></i>${R.cap === 'on' ? 'מחכים' : 'בחדר'}</span><span class="sp sm" style="text-align:start">חדר "${esc(S.room.rname || S.room.code)}". ${R.cap === 'on' ? 'עוד לא כולם מחוברים' : 'החיבור החי לא זמין בתצוגה הזאת'}</span>${ic('fwd','dim')}</button>` : ''}
  ${loveHome()}<div class="grid2 mb">${workHome(true)}${placesHome()}</div>
  <div class="grid2 mb">
   <button class="tile tap" style="text-align:start" data-go="pet"><div class="row xs mut">${ic('gift')}החיה שלנו</div><div class="mt">${petMini()}</div></button>
   <div class="tile"><div class="row xs mut">${ic('fire')}רצף ימים</div><div class="disp" style="font-size:40px;margin-top:4px;color:${streakInfo().n ? 'var(--warn)' : 'var(--ink)'}">${streakInfo().n}</div><div class="xs mut mb">${streakInfo().today ? 'כבר כאן היום' : streakInfo().n ? 'היכנסו היום כדי להמשיך' : 'מתחילים רצף היום'} · שיא ${S.prog.best || 0}</div>${weekDots()}</div>
  </div>
  <section class="hero">${ringsArt('art')}
    <div class="row wrap" style="gap:6px;position:relative"><span class="pill">${ic('spark')}${VIBES[S.set.vibe]}</span><span class="pill">${ic('clock')}${DURS.find(d => d[0] === S.set.dur)[1]}</span><span class="pill">${TOUCH[S.set.touch]}</span></div>
    <h1 class="mt">המשחק של הערב מחכה לכם</h1>
    <p style="position:relative;opacity:.9;margin-top:8px;max-width:75%">קלפים מכל העולמות, מותאמים לסגנון ולגבולות שלכם.</p>
    <div class="col" style="position:relative;margin-top:18px;gap:10px">
      <button class="btn wide" style="background:#fff;color:#a0124a" data-act="quick">${ic('play')}התחילו לשחק</button>
      ${S.cur ? `<button class="btn wide" style="background:rgba(255,255,255,.18);box-shadow:none" data-act="resume">המשיכו את ${esc(S.cur.title)}</button>` : ''}
    </div></section>

  <div class="sec"><h3>קלף היום</h3><span class="xs mut">אחד חדש בכל יום</span></div>
  ${dcard ? `<button class="tile tap" style="width:100%;text-align:start;${gstyle(dcard.m)};background:linear-gradient(150deg,var(--g1),var(--g2));color:#fff;border:0;min-height:120px;position:relative;overflow:hidden" data-act="daily">
     ${dc.open ? `<div class="xs" style="opacity:.85">${CATS[dcard.c].n} · שניכם עונים</div><div class="disp" style="font-size:21px;margin-top:8px;line-height:1.3">${esc(fmt(dcard.t, myIdx() ?? 0))}</div>${dc.done ? `<div class="pill mt">${ic('check')}שניכם עניתם היום</div>` : (() => { const s = ansStatus(dc.id, dayKey()); return `<div class="pill mt">${!S.room ? 'עונים כששני הטלפונים מחוברים' : s.n === 1 ? 'תשובה אחת מתוך שתיים' : 'הקישו כדי לענות'} · +15 כששניכם עונים</div>`; })()}`
     : `<div class="row"><svg width="56" height="56" style="color:#fff"><use href="#rings"/></svg><div><div class="disp" style="font-size:20px">יש לכם קלף סגור</div><div class="sm" style="opacity:.85">הקישו כדי לחשוף</div></div></div>`}
  </button>` : ''}

  <div class="sec"><h3>מצבי משחק</h3><button data-go="modes">הכל</button></div>
  <div class="grid2">${modeKeys.map(m => modeTile(m)).join('')}</div>
  <button class="tile tap mt" style="width:100%;display:flex;align-items:center;gap:12px;text-align:start" data-act="surprise"><span class="badge gold" style="width:48px;height:48px;border-radius:16px">${ic('dice')}</span><span class="sp"><b>סבב הפתעה</b><br><span class="sm mut">המשחק בוחר באקראי מהקטגוריות שלכם</span></span>${ic('fwd','dim')}</button>

  <div class="sec"><h3>קטגוריות</h3><button data-go="categories">כל הקטגוריות</button></div>
  <div class="chips">${favCats.filter(c => CATS[c] && (CATS[c].m !== 'adult' || S.set.adult.on)).map(c => `<button class="chip" data-act="playcat" data-c="${c}">${S.set.fav.includes(c) ? ic('star') : ''}${CATS[c].n}</button>`).join('')}<button class="chip" data-go="categories">${ic('plus')}עוד</button></div>

  ${last ? `<div class="sec"><h3>המשחק האחרון</h3></div><div class="tile row" style="${gstyle(last.mode)}"><span class="badge" style="background:linear-gradient(145deg,var(--g1),var(--g2));color:#fff;width:52px;height:52px;border-radius:16px">${ic('cards')}</span><div class="sp"><b>${esc(last.title)}</b><div class="sm mut">${fmtDate(last.ts)} · ${last.cards} קלפים · ${last.pts} נקודות</div></div><button class="btn sm" data-act="replay">שוב</button></div>` : ''}

  <div class="sec"><h3>משימות היום</h3><button data-go="missions">${done}/3</button></div>
  <div class="col" style="gap:10px">${tm.map(m => misRow(m, dayKey(), 25)).join('')}</div>

  <div class="grid2 mt2">
   <button class="tile tap" style="text-align:start" data-go="achievements"><div class="row">${ic('trophy')}<b>הישגים</b></div><div class="disp mt" style="font-size:28px">${achN}<span class="sm mut"> / ${ACH.length}</span></div><div class="bar mt"><i style="width:${achN / ACH.length * 100}%"></i></div><div class="xs mut mt">דרגה: ${RANKS[r][1]} · ${S.prog.pts} נק׳</div></button>
   <button class="tile tap" style="text-align:start" data-go="memories"><div class="row">${ic('album')}<b>הזיכרונות שלנו</b></div><div class="disp mt" style="font-size:28px">${S.mem.length}</div><div class="xs mut">${S.couple.since ? `${daysTogether()} ימים ביחד` : 'האלבום הפרטי שלכם'}</div></button>
  </div>
  <div class="list mt">${linkRow('remote', 'wifi', 'משחק בשני טלפונים או מרחוק', 'קוד, קישור או QR')}${linkRow('bounds', 'shield', 'רמת אינטימיות וגבולות', `${TOUCH[S.set.touch]} · 18+ ${S.set.adult.on ? 'פתוח' : 'נעול'}`)}${linkRow('missions', 'note', 'התשובות שלכם', 'כל התשובות מהמשחקים, מהמשימות ומקלפי היום', {tab:'hist'})}${linkRow('favorites', 'heart', 'מועדפים ושמורים', `${S.fav.length} מועדפים · ${S.saved.length} שמורים`)}</div>
  </div>`;
};
function modeTile(m) {
  const M = MODES[m]; const locked = m === 'adult' && !S.set.adult.on;
  return `<button class="mode" style="${gstyle(m)}" data-act="mode" data-m="${m}">${modeArt(m)}${locked ? `<span class="lock pill">${ic('lock')}נעול</span>` : ''}<h3>${M.n}</h3><p>${M.s}</p></button>`;
}
const daysTogether = () => Math.max(0, Math.floor((Date.now() - new Date(S.couple.since).getTime()) / 864e5));
ACT.daily = () => { const d = S.daily[dayKey()]; if (!d) return; if (!d.open) { d.open = true; sfx('flip'); save(); render(); return; } answerSheet(d.id, dayKey(), 15, 'daily'); };
ACT.dailyOld = () => { const d = S.daily[dayKey()]; if (!d) return; if (!d.done) { d.done = true; petFeed(1); if (R.named) R.named.presence({daily: {d: dayKey(), ts: Date.now()}}).catch(() => {}); S.prog.seen[d.id] = (S.prog.seen[d.id] || 0) + 1; S.prog.st.ans++; logEv('ans'); markDay(); addPts(15); checkAch(); sfx('ok'); render(); } };

/* missions row (shared) */
function misRow(m, period, pts) {
  const s = ansStatus(m.id, period); const on = s.ok || misDone(m.id, period);
  const lbl = on ? 'שניכם עניתם' : !S.room ? 'חברו את בן/בת הזוג כדי לענות' : s.n === 1 ? `${esc(nm(s.e.t[0] ? 0 : 1))} ${gw(s.e.t[0] ? 0 : 1, 'ענה', 'ענתה')}, מחכים לתשובה השנייה` : 'הקישו כדי לכתוב תשובה';
  return `<button class="mis" data-act="mis" data-id="${m.id}" data-per="${period}" data-pts="${pts}" aria-label="${esc(lbl)}"><span class="chk ${on ? 'on' : ''}" style="${!on && s.n === 1 ? 'border-color:var(--warn);color:var(--warn);font-size:12px;font-weight:700' : ''}">${on ? ic('check') : s.n === 1 ? '1/2' : ''}</span><span class="sp"><span style="${on ? 'opacity:.65' : ''}">${esc(fmt(m.t, myIdx() ?? 0))}</span><span class="xs mut" style="display:block;margin-top:4px">${CATS[m.c].n} · +${pts} · ${lbl}</span></span></button>`;
}
ACT.mis = a => { answerSheet(a.dataset.id, a.dataset.per, +a.dataset.pts, 'mis'); };
ACT.misOld = a => {
  const {id, per} = a.dataset, pts = +a.dataset.pts; const i = S.misLog.findIndex(l => l.id === id && l.p === per);
  if (i >= 0) { S.misLog.splice(i, 1); petFeed(-2, true); S.prog.st.mis = Math.max(0, S.prog.st.mis - 1); S.prog.pts = Math.max(0, S.prog.pts - pts); toast('סימון בוטל'); }
  else { S.misLog.push({id, p: per, ts: Date.now()}); S.prog.st.mis++; petFeed(2); logEv('mis'); if (CARD[id].tags.includes('phone')) S.prog.st.nophone++; if (CARD[id].tags.includes('comp')) S.prog.st.comps++; markDay(); addPts(pts); confetti(40); sfx('ok'); checkAch(); }
  save(); render();
};

/* ───────── modes & pre-game ───────── */
SCREENS.modes = () => `<div class="scr">${topbar('משחקים', `<button class="ib" data-go="categories" aria-label="קטגוריות">${ic('cards')}</button>`)}
  <p class="mut mb">בחרו עולם. לכל מצב יש חוקים, קלפים וקצב משלו.</p>
  <div class="col">${Object.keys(MODES).filter(m => !(m === 'adult' && S.set.hideAdult)).map(m => { const n = m === 'mix' ? '' : CARDS.filter(c => c.m === m && allowed(c)).length; const locked = m === 'adult' && !S.set.adult.on; return `<button class="mode big" style="${gstyle(m)}" data-act="mode" data-m="${m}">${modeArt(m)}${locked ? `<span class="lock pill">${ic('lock')}נעול</span>` : ''}<h3 style="font-size:21px">${MODES[m].n}</h3><p>${MODES[m].s}${GEN_MODES.includes(m) || m === 'mix' ? ' · קלפים בלי סוף' : n ? ` · ${n} קלפים` : ''}${(() => { const k = modeStock(m).answered; return k ? ` · ${ic('check')} ${k} עניתם` : ''; })()}</p></button>`; }).join('')}</div>
  <div class="list mt">${linkRow('categories', 'cards', 'משחק לפי קטגוריה')}${linkRow('favorites', 'heart', 'לשחק מהמועדפים')}${linkRow('missions', 'target', 'משימות זוגיות מחוץ למשחק')}</div></div>`;
const PG = {dur: null, start: 'r', level: 1, vibe: null};
ACT.mode = a => {
  const m = a.dataset.m;
  if (m === 'adult' && !S.set.adult.on) return go('adultgate');
  if (m === 'date') return go('datebuild');
  pregame(m);
};
function pregame(m, extra = {}) {
  PG.dur = S.set.dur; PG.start = 'r'; PG.level = Math.min(PG.level || 1, S.set.adult.max); PG.vibe = S.set.vibe; PG.m = m; PG.extra = extra;
  const draw = b => {
    const M = MODES[m] || {n: extra.title || 'משחק', rules: 'שחקו בקצב שלכם. כל קלף אפשר לדלג.'};
    b.innerHTML = `<div class="grab"></div><div class="row"><span class="badge" style="${gstyle(m)};background:linear-gradient(145deg,var(--g1),var(--g2));color:#fff;width:52px;height:52px;border-radius:16px">${ic(m === 'adult' ? 'fire' : 'cards')}</span><h2 class="sp">${extra.title || M.n}</h2></div>
    <p class="mut mt">${M.rules}</p>
    ${m === 'mix' ? `<label class="f">סגנון הסבב</label><div class="row wrap">${Object.entries(VIBES).filter(([k]) => !(['intimate'].includes(k) && !S.set.adult.on)).map(([k, l]) => `<button class="chip ${PG.vibe === k ? 'on' : ''}" data-pg="vibe" data-v='"${k}"'>${l}</button>`).join('')}</div>` : ''}
    ${m === 'adult' ? `<label class="f">רמה (עד הרמה שהגדרתם)</label><div class="seg">${[1,2,3,4].filter(l => l <= S.set.adult.max).map(l => `<button class="${PG.level === l ? 'on' : ''}" data-pg="level" data-v="${l}">${l} · ${ADULT_LV[l]}</button>`).join('')}</div>` : ''}
    <label class="f">משך המשחק</label><div class="seg">${DURS.map(([v, l]) => `<button class="${PG.dur === v ? 'on' : ''}" data-pg="dur" data-v="${v}">${l}</button>`).join('')}</div>
    <label class="f">מי מתחיל?</label><div class="seg">${[['r','הגרלה'],[0, esc(nm(0))],[1, esc(nm(1))]].map(([v, l]) => `<button class="${PG.start === v ? 'on' : ''}" data-pg="start" data-v='${JSON.stringify(v)}'>${l}</button>`).join('')}</div>
    ${(S.set.limits[0] || S.set.limits[1]) ? `<div class="note info mt">${ic('shield')} תזכורת לגבולות: ${[0,1].filter(i => S.set.limits[i]).map(i => `<b>${esc(nm(i))}:</b> ${esc(S.set.limits[i])}`).join(' · ')}</div>` : ''}
    ${R.live ? `<div class="note info mt">${ic('wifi')} מחוברים ל${esc(R.peerName || 'טלפון שני')}. המשחק יופיע בשני הטלפונים.</div>` : ''}
    <button class="btn wide mt2" data-pg="go">${ic('play')}התחילו</button>`;
  };
  const b = sheet('', draw); draw(b);
  b.onclick = e => { const t = e.target.closest('[data-pg]'); if (!t) return; const k = t.dataset.pg; if (k === 'go') { closeSheet(); startGame(PG.m, {dur: PG.dur, start: PG.start, level: PG.level, vibe: PG.vibe, ...PG.extra}); return; } PG[k] = JSON.parse(t.dataset.v); sfx('tap'); draw(b); };
}
ACT.quick = () => pregame('mix');
ACT.surprise = () => pregame('mix', {title: 'סבב הפתעה'});
ACT.playcat = a => { const c = a.dataset.c; if (CATS[c].m === 'adult' && !S.set.adult.on) return go('adultgate'); pregame('cat', {cat: c, title: CATS[c].n}); };

/* ───────── categories ───────── */
SCREENS.categories = () => {
  const groups = ['know','tod','guess','deep','flirt','adult','who','dil','date','mem'].filter(m => m !== 'adult' || (S.set.adult.on && !S.set.hideAdult));
  return `<div class="scr">${topbar('קטגוריות')}<p class="mut mb">כוכב מסמן מועדפת (תופיע יותר בסבבים מעורבים). עין מסתירה קטגוריה מכל המשחקים. הכל הפיך.</p>
  ${groups.map(m => `<div class="sec"><h3 style="display:flex;align-items:center;gap:8px"><i style="width:12px;height:12px;border-radius:4px;background:linear-gradient(145deg,${modeG(m)[0]},${modeG(m)[1]})"></i>${MODES[m].n}</h3></div><div class="list">${Object.keys(CATS).filter(c => CATS[c].m === m).map(c => { const all = CARDS.filter(x => x.c === c); const seen = all.filter(x => S.prog.seen[x.id]).length; const fav = S.set.fav.includes(c), hid = S.set.hide.includes(c); return `<div class="li" style="${hid ? 'opacity:.5' : ''}"><div class="sp"><div>${CATS[c].n}</div><div class="xs mut">${all.length} קלפים · ראיתם ${seen}</div></div><button class="ib ${fav ? 'on' : ''}" aria-label="מועדפת" aria-pressed="${fav}" data-act="catfav" data-c="${c}">${ic('star')}</button><button class="ib ${hid ? 'on' : ''}" aria-label="הסתרה" aria-pressed="${hid}" data-act="cathide" data-c="${c}">${ic(hid ? 'eyeoff' : 'eye')}</button><button class="ib" aria-label="שחקו" data-act="playcat" data-c="${c}" ${hid ? 'disabled' : ''}>${ic('play')}</button></div>`; }).join('')}</div>`).join('')}</div>`;
};
ACT.catfav = a => { const c = a.dataset.c, f = S.set.fav; f.includes(c) ? f.splice(f.indexOf(c), 1) : f.push(c); save(); render(); };
ACT.cathide = a => { const c = a.dataset.c, f = S.set.hide; f.includes(c) ? f.splice(f.indexOf(c), 1) : f.push(c); save(); render(); };

/* ───────── missions ───────── */
SCREENS.missions = c => {
  const tab = c.tab || 'today';
  const tabs = `<div class="seg mb">${[['today','היום'],['week','אתגרי השבוע'],['hist','התשובות שלכם']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="mtab" data-t="${k}">${l}</button>`).join('')}</div>`;
  let body = '';
  if (tab === 'today') { const wm = weekMission(); body = `<p class="mut mb">${new Date().toLocaleDateString('he-IL', {weekday:'long', day:'numeric', month:'long'})}. משימות קטנות שקורות בחיים, לא באפליקציה. אין עונש על מה שלא הספקתם.</p>
    <div class="col" style="gap:10px">${todayMissions().map(m => misRow(m, dayKey(), 25)).join('')}</div>
    <div class="sec"><h3>משימת השבוע</h3></div>${wm ? misRow(wm, 'w' + weekKey(), 60) : ''}
    <button class="btn wide mt2 gold" data-act="spont">${ic('dice')}משימה ספונטנית</button>`; }
  if (tab === 'week') body = `<p class="mut mb">שלושה אתגרים מתחלפים בכל שבוע. סיימתם? אספו את הבונוס.</p><div class="col">${weekChallenges().map(([id, n, metric, need]) => { const have = Math.min(need, weekCount(metric)); const claimed = S.prog.claimed[weekKey() + id]; return `<div class="tile"><div class="row"><b class="sp">${n}</b><span class="disp">${have}/${need}</span></div><div class="bar mt"><i style="width:${have / need * 100}%"></i></div>${have >= need ? (claimed ? `<div class="xs mut mt">${ic('check')} נאסף</div>` : `<button class="btn sm ok mt" data-act="claim" data-id="${id}">אספו 50 נקודות</button>`) : ''}</div>`; }).join('')}</div>`;
  if (tab === 'hist') { const hf = c.hf || 'all';
    const A = Object.values(ansAll()).filter(e => (e.kind === 'game' ? true : CARD[e.id]) && (hf === 'all' || (hf === 'game') === (e.kind === 'game'))).sort((x, y) => Math.max(...y.at) - Math.max(...x.at));
    const nG = Object.values(ansAll()).filter(e => e.kind === 'game').length;
    const chips = `<div class="chips mb">${[['all', 'הכל'], ['game', `מהמשחקים (${nG})`], ['mis', 'משימות וקלף היום']].map(([k, l]) => `<button class="chip ${hf === k ? 'on' : ''}" data-act="histf" data-f="${k}">${l}</button>`).join('')}</div>`;
    const row = e => { if (e.kind === 'game') { const lb = i => e.lab && e.lab[i] ? ' ' + gw(i, e.lab[i], e.lab[i] === 'ענה' ? 'ענתה' : e.lab[i] === 'ניחש' ? 'ניחשה' : 'בחרה') : ''; return `<button class="tile tap" style="text-align:start;width:100%" data-act="histgame" data-id="${esc(e.id)}"><div class="row xs mut"><span class="sp">${MODES[e.mode] ? esc(MODES[e.mode].n) : 'משחק'}${CATS[e.cat] ? ' · ' + esc(CATS[e.cat].n) : ''} · ${fmtDate(e.ok)}</span><span class="status ok"><i></i>${ic('check')}${e.prev && e.prev.length ? ' ×' + (e.prev.length + 1) : ''}</span></div><div style="margin:6px 0">${esc(e.q)}</div>${[0,1].map(i => `<div class="sm" style="margin-top:4px"><b>${esc(nm(i))}${lb(i)}:</b> ${esc(e.t[i] || '—')}</div>`).join('')}</button>`; }
      return `<button class="tile tap" style="text-align:start;width:100%" data-act="histopen" data-id="${e.id}" data-per="${esc(e.per)}" data-pts="${e.pts}" data-k="${e.kind}"><div class="row xs mut"><span class="sp">${e.kind === 'daily' ? 'קלף היום' : CATS[CARD[e.id].c].n} · ${fmtDate(Math.max(...e.at))}</span>${e.ok ? `<span class="status ok"><i></i>+${e.pts}</span>` : `<span class="status wait"><i></i>${(e.t[0] ? 1 : 0) + (e.t[1] ? 1 : 0)}/2</span>`}</div><div style="margin:6px 0">${esc(fmt(CARD[e.id].t, myIdx() ?? 0))}</div>${[0,1].map(i => `<div class="sm" style="margin-top:4px"><b>${esc(nm(i))}:</b> ${e.t[i] ? (e.ok || myIdx() === i ? esc(e.t[i]) : '<span class="mut">ענה/תה, נחשף כששניכם עונים</span>') : '<span class="mut">עוד לא ענה/תה</span>'}</div>`).join('')}</button>`; };
    body = `<p class="mut mb">כל התשובות שלכם: מהמשחקים, מהמשימות ומקלפי היום.</p>${chips}` + (A.length ? `<div class="col">${A.slice(0, 200).map(row).join('')}</div>${A.length > 200 ? `<p class="xs mut mt" style="text-align:center">מוצגות 200 התשובות האחרונות מתוך ${A.length}</p>` : ''}` : `<div class="empty">${ic('note')}<p>כאן יישמרו כל התשובות שלכם: לשאלות במשחקים, למשימות ולקלפי היום.</p></div>`); }
  if (tab === 'oldhist') { const L = S.misLog.slice().reverse(); body = L.length ? `<div class="tl col">${L.map(l => `<div class="tile"><div class="xs mut">${fmtDate(l.ts)}</div><div>${esc(fmt((CARD[l.id] || {t: l.t || ''}).t, 0))}</div></div>`).join('')}</div>` : `<div class="empty">${ic('target')}<p>עוד לא סימנתם משימות. ההיסטוריה הזוגית שלכם תתחיל כאן.</p></div>`; }
  return `<div class="scr">${topbar('משימות זוגיות')}${tabs}${body}</div>`;
};
ACT.histf = a => { cur().hf = a.dataset.f; render(); };
ACT.histgame = a => prevAnsSheet(a.dataset.id);
ACT.histopen = a => answerSheet(a.dataset.id, a.dataset.per, +a.dataset.pts, a.dataset.k);
ACT.mtab = a => { cur().tab = a.dataset.t; render(); };
ACT.claim = a => { const k = weekKey() + a.dataset.id; if (S.prog.claimed[k]) return; S.prog.claimed[k] = 1; addPts(50); confetti(); sfx('ach'); save(); render(); };
ACT.spont = () => {
  const pool = CARDS.filter(c => c.m === 'mis' && allowedTags(c));
  const show = () => { const m = rnd(pool); const b = sheet(`<div class="card in" style="${gstyle('mis')};min-height:240px"><div class="hd"><span class="pill">${ic('dice')}משימה ספונטנית</span></div><div class="body"><div class="txt">${esc(fmt(m.t, 0))}</div></div></div><div class="col mt"><button class="btn wide ok" id="spd">${ic('note')}עשינו! לכתוב תשובות (+30)</button><button class="btn soft wide" id="spo">משימה אחרת</button></div>`, b => { $('#spd', b).onclick = () => { closeSheet(); answerSheet(m.id, 'sp' + dayKey() + m.id.slice(-3), 30, 'mis'); }; $('#spo', b).onclick = show; }); };
  show();
};

/* ───────── memories ───────── */
SCREENS.memories = c => {
  const f = c.f || 'all'; const L = S.mem.filter(m => f === 'all' || m.type === f).sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.ts - a.ts);
  const keys = ['met','first_date','first_kiss'];
  return `<div class="scr">${topbar('הזיכרונות שלנו', `<button class="ib" data-act="memadd" aria-label="הוספת זיכרון">${ic('plus')}</button>`)}
  ${S.couple.since ? `<div class="tile row" style="background:linear-gradient(140deg,#d19a5b,#8a4f44);color:#fff;border:0"><div class="sp"><div class="sm" style="opacity:.85">ביחד כבר</div><div class="disp" style="font-size:34px">${daysTogether().toLocaleString('he-IL')} ימים</div></div>${ringsArt('', '#fff').replace('<svg class=""', '<svg width="70" height="70"')}</div>` : ''}
  <div class="grid2 mt" style="grid-template-columns:repeat(3,minmax(0,1fr))">${keys.map(k => { const m = S.mem.find(x => x.type === k); return `<button class="tile tap" style="text-align:center;padding:12px" data-act="${m ? 'memopen' : 'memadd'}" data-id="${m ? m.id : ''}" data-t="${k}">${ic(MEM_I[k])}<div class="xs mt">${MEM_T[k]}</div><div class="xs mut">${m ? (fmtDate(m.date) || 'נשמר') : '+ הוסיפו'}</div></button>`; }).join('')}</div>
  <button class="btn wide mt" data-act="memplay" style="background:linear-gradient(135deg,#d19a5b,#8a4f44)">${ic('play')}שחקו בזיכרונות${S.mem.length ? ` (${S.mem.length})` : ''}</button>
  <div class="chips mt">${['all', ...Object.keys(MEM_T)].filter(k => k === 'all' || S.mem.some(m => m.type === k)).map(k => `<button class="chip ${f === k ? 'on' : ''}" data-act="memf" data-f="${k}">${k === 'all' ? 'הכל' : MEM_T[k]}</button>`).join('')}</div>
  ${L.length ? `<div class="tl col mt">${L.map(m => `<button class="mem" data-act="memopen" data-id="${m.id}">${photos[m.id] ? `<img src="${photos[m.id]}" alt="">` : `<span class="ico" style="width:64px;height:64px;border-radius:14px;display:grid;place-items:center;background:var(--sur2)">${ic(MEM_I[m.type] || 'bm')}</span>`}<span><span class="xs mut">${MEM_T[m.type] || ''}${m.date ? ' · ' + fmtDate(m.date) : ''}</span><b style="display:block">${esc(m.title)}</b>${m.text ? `<span class="sm mut" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(m.text)}</span>` : ''}${m.song ? `<span class="xs" style="display:block">${ic('music')} ${esc(m.song)}</span>` : ''}</span></button>`).join('')}</div>`
   : `<div class="empty"><svg viewBox="0 0 200 200" style="color:var(--rose)"><use href="#rings"/></svg><p>האלבום שלכם מחכה לזיכרון הראשון: דייט ראשון, בדיחה פנימית, שיר, טיול. הם הופכים לחידונים אישיים במשחק.</p><button class="btn mt" data-act="memadd">הוסיפו זיכרון</button></div>`}
  <p class="xs dim mt2" style="text-align:center">${ic('lock')} הזיכרונות פרטיים לכם. התמונות נשמרות רק במכשיר הזה.</p></div>`;
};
ACT.memf = a => { cur().f = a.dataset.f; render(); };
ACT.memadd = a => memEdit(null, a.dataset.t || 'keep');
ACT.memopen = a => memEdit(S.mem.find(m => m.id === a.dataset.id));
ACT.memplay = () => startGame('mem', {dur: S.set.dur, start: 'r'});
function memEdit(m, type) {
  const isNew = !m; m = m ? {...m} : {id: uid(), type: type || 'keep', title: '', date: '', text: '', song: '', ts: Date.now()};
  let ph = photos[m.id] || null;
  const b = sheet(`<h2>${isNew ? 'זיכרון חדש' : 'זיכרון'}</h2>
   <label class="f">סוג</label><div class="row wrap" id="mt">${Object.entries(MEM_T).filter(([k]) => k !== 'game').map(([k, l]) => `<button class="chip ${m.type === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('')}</div>
   <label class="f" for="mti">כותרת</label><input id="mti" class="inp" maxlength="60" value="${esc(m.title)}" placeholder="למשל: הפיצה השרופה בתל אביב">
   <label class="f" for="mda">תאריך</label><input id="mda" type="date" class="inp" value="${esc(m.date)}" data-nofocus="1">
   <label class="f" for="mtx">מה קרה? (פרטים שיהפכו לשאלות במשחק)</label><textarea id="mtx" class="inp" maxlength="800" placeholder="מה לבשתם, מה אמרתם, מה היה מצחיק...">${esc(m.text)}</textarea>
   <label class="f" for="mso">שיר (אופציונלי)</label><input id="mso" class="inp" maxlength="80" value="${esc(m.song)}" placeholder="אמן ושם השיר">
   <label class="f">תמונה (אופציונלי)</label><div class="row"><label class="btn soft sm" style="cursor:pointer">${ic('cam')}בחירת תמונה<input type="file" accept="image/*" id="mph" hidden></label><div id="mpv">${ph ? `<img src="${ph}" style="width:64px;height:64px;border-radius:14px;object-fit:cover" alt="">` : ''}</div></div>
   <div class="col mt2"><button class="btn wide" id="msv">שמירה</button>${isNew ? '' : `<button class="btn ghost wide" id="mdl" style="color:#ff7b8f">${ic('trash')}מחיקת הזיכרון</button>`}</div>`, b => {
    $('#mt', b).onclick = e => { const t = e.target.closest('[data-t]'); if (!t) return; m.type = t.dataset.t; $$('#mt .chip', b).forEach(x => x.classList.toggle('on', x === t)); };
    $('#mph', b).onchange = e => { const f = e.target.files[0]; if (!f) return; const img = new Image(); const url = URL.createObjectURL(f); img.onload = () => { const s = Math.min(1, 720 / Math.max(img.width, img.height)); const cv = document.createElement('canvas'); cv.width = img.width * s; cv.height = img.height * s; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); ph = cv.toDataURL('image/jpeg', .72); $('#mpv', b).innerHTML = `<img src="${ph}" style="width:64px;height:64px;border-radius:14px;object-fit:cover" alt="">`; URL.revokeObjectURL(url); }; img.src = url; };
    $('#msv', b).onclick = () => { m.title = $('#mti', b).value.trim() || MEM_T[m.type]; m.date = $('#mda', b).value; m.text = $('#mtx', b).value.trim(); m.song = $('#mso', b).value.trim();
      if (ph && ph !== photos[m.id]) { photos[m.id] = ph; if (!savePhotos()) delete photos[m.id]; }
      const i = S.mem.findIndex(x => x.id === m.id); if (i >= 0) S.mem[i] = m; else { S.mem.push(m); S.prog.st.mems++; petFeed(1); logEv('mem'); addPts(15); checkAch(); }
      if (m.type === 'met' && m.date && !S.couple.since) S.couple.since = m.date;
      save(); closeSheet(); render(); };
    const d = $('#mdl', b); if (d) d.onclick = () => confirmSheet('למחוק את הזיכרון?', 'אי אפשר לשחזר אותו אחרי המחיקה.', 'מחיקה', () => { S.mem = S.mem.filter(x => x.id !== m.id); delete photos[m.id]; savePhotos(); save(); render(); });
  });
}

/* ───────── favorites ───────── */
SCREENS.favorites = c => {
  const tab = c.tab || 'fav';
  const lists = {fav: S.fav, saved: S.saved, notes: Object.keys(S.notes), hidden: Object.keys(S.reported)};
  const L = lists[tab].filter(id => CARD[id]);
  const row = id => { const k = CARD[id]; return `<div class="tile" style="display:flex;gap:12px;${gstyle(k.m)}"><i style="width:6px;border-radius:6px;background:linear-gradient(var(--g1),var(--g2));flex:none"></i><div class="sp"><div class="xs mut">${MODES[k.m] ? MODES[k.m].n : ''} · ${CATS[k.c].n}</div><div style="margin-top:4px">${esc(fmt(k.t, 0))}</div>${tab === 'notes' ? `<div class="note mt sm">${ic('note')} ${esc(S.notes[id])}</div>` : ''}${tab === 'hidden' ? `<div class="xs mut mt">סיבה: ${esc(S.reported[id].r)}</div>` : ''}</div><button class="ib" data-act="${tab === 'hidden' ? 'unhide' : 'unlist'}" data-id="${id}" data-l="${tab}" aria-label="${tab === 'hidden' ? 'החזרה' : 'הסרה'}">${ic(tab === 'hidden' ? 'eye' : 'x')}</button></div>`; };
  return `<div class="scr">${topbar('מועדפים ושמורים')}
  <div class="seg mb">${[['fav','מועדפים'],['saved','לפעם הבאה'],['notes','הערות'],['hidden','הוסתרו']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="ftab" data-t="${k}">${l}</button>`).join('')}</div>
  ${(tab === 'fav' || tab === 'saved') && L.length ? `<button class="btn wide mb" data-act="playlist" data-l="${tab}">${ic('play')}שחקו בקלפים האלה</button>` : ''}
  ${tab === 'hidden' ? `<p class="mut sm mb">קלפים שדיווחתם עליהם לא יופיעו שוב. הדיווח נשמר במכשיר בלבד. אפשר להחזיר כל קלף.</p>` : ''}
  ${L.length ? `<div class="col">${L.map(row).join('')}</div>` : `<div class="empty">${ic(tab === 'hidden' ? 'flag' : tab === 'notes' ? 'note' : 'heart')}<p>${{fav: 'סמנו לב על קלפים שאהבתם, והם יחכו לכם כאן.', saved: 'שמרו קלפים לפעם הבאה, ותוכלו לשחק בהם כחפיסה.', notes: 'הערות שכתבתם על קלפים יופיעו כאן.', hidden: 'אין קלפים מוסתרים.'}[tab]}</p></div>`}</div>`;
};
ACT.ftab = a => { cur().tab = a.dataset.t; render(); };
ACT.unlist = a => { const {id, l} = a.dataset; if (l === 'notes') delete S.notes[id]; else { const arr = l === 'fav' ? S.fav : S.saved; const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); } save(); render(); };
ACT.unhide = a => { delete S.reported[a.dataset.id]; save(); toast('הקלף חזר לחפיסה'); render(); };
ACT.playlist = a => { const ids = (a.dataset.l === 'fav' ? S.fav : S.saved).filter(id => CARD[id] && !S.reported[id]); startGame('saved', {ids, title: a.dataset.l === 'fav' ? 'חפיסת המועדפים' : 'שמורים לפעם הבאה', dur: 0, start: 'r'}); };

/* ───────── achievements ───────── */
SCREENS.achievements = () => {
  const pts = S.prog.pts, r = rankOf(pts), nx = RANKS[r + 1]; const st = S.prog.st;
  const colModes = ['know','tod','guess','deep','flirt','who','dil','date','mem','sur','end'];
  return `<div class="scr">${topbar('הישגים והתקדמות')}
  <div class="hero" style="min-height:0">${ringsArt('art')}<div class="row" style="position:relative">${rankRing(78).replace('fill="var(--ink)"', 'fill="#fff"')}<div><div class="sm" style="opacity:.85">הדרגה הזוגית שלכם</div><div class="disp" style="font-size:30px">${RANKS[r][1]}</div><div class="sm">${pts} נקודות חיבור</div></div></div>
  ${nx ? `<div style="position:relative;margin-top:14px"><div class="bar" style="background:rgba(255,255,255,.2)"><i style="width:${(pts - RANKS[r][0]) / (nx[0] - RANKS[r][0]) * 100}%;background:#fff"></i></div><div class="xs mt" style="opacity:.9">עוד ${nx[0] - pts} נקודות לדרגת "${nx[1]}"</div></div>` : ''}</div>
  <p class="xs mut mt">נקודות נצברות מכל שאלה, משימה, זיכרון ורגע. אף פעם לא יורדות על דילוג או על הפסקה.</p>
  <div class="stats mt">${[[st.cards,'קלפים'],[st.ans,'תשובות'],[st.tasks,'משימות'],[st.comps,'מחמאות'],[st.bull,'ניחושי בול'],[st.mins,'דקות ביחד']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="sec"><h3>תגים זוגיים</h3><span class="sm mut">${Object.keys(S.prog.ach).length}/${ACH.length}</span></div>
  <div class="ach">${ACH.map(a => { const on = S.prog.ach[a[0]]; return `<div><span class="badge ${on ? '' : 'off'}">${ic(on ? a[4] : 'lock')}</span><b style="font-weight:500">${a[1]}</b><span class="xs mut">${a[2]}</span></div>`; }).join('')}</div>
  <div class="sec"><h3>אוספי קלפים</h3></div>
  <div class="col">${colModes.map(m => { const all = CARDS.filter(c => c.m === m); const seen = all.filter(c => S.prog.seen[c.id]).length; const name = MODES[m] ? MODES[m].n : CATS[m].n; return `<div class="row"><span class="sp sm">${name}</span><span class="xs mut">${seen}/${all.length}</span><div class="bar" style="width:40%"><i style="width:${seen / all.length * 100}%"></i></div></div>`; }).join('')}</div>
  <div class="tile mt ${goldOpen() ? 'gold' : ''}" style="${goldOpen() ? 'color:#3a1a00;border:0' : ''}"><div class="row">${ic(goldOpen() ? 'star' : 'lock')}<b class="sp">אוסף הזהב · ${CARDS.filter(c => c.m === 'gold').length} קלפים מיוחדים</b></div><p class="sm mt">${goldOpen() ? 'פתוח! קלפי הזהב מופיעים כקלפים מיוחדים במהלך המשחקים.' : 'נפתח בדרגת "להבה" (300 נקודות). שאלות עמוקות ורגעים שנשארים.'}</p>${goldOpen() ? `<button class="btn sm mt" style="background:#3a1a00" data-act="playgold">שחקו באוסף הזהב</button>` : ''}</div></div>`;
};
ACT.playgold = () => pregame('gold', {title: 'אוסף הזהב'});

/* ───────── profile & journal ───────── */
SCREENS.profile = () => {
  const P = S.couple.p;
  return `<div class="scr">${topbar('הפרופיל הזוגי', `<button class="ib" data-act="editprof" aria-label="עריכה">${ic('note')}</button>`)}
  <div class="hero" style="min-height:0;text-align:center">${ringsArt('art')}<svg width="90" height="90" style="color:#fff;position:relative"><use href="#rings"/></svg>
  <h1 style="max-width:none;font-size:30px;margin-top:6px">${esc(P[0].name)} ו${esc(P[1].name)}</h1>${S.couple.name ? `<div class="disp" style="opacity:.9;position:relative">${esc(S.couple.name)}</div>` : ''}
  <div class="row wrap" style="justify-content:center;gap:6px;margin-top:10px;position:relative">${S.couple.rel ? `<span class="pill">${esc(S.couple.rel)}</span>` : ''}${S.couple.since ? `<span class="pill">${ic('cal')}${daysTogether()} ימים ביחד</span>` : ''}<span class="pill">${ic('star')}${RANKS[rankOf(S.prog.pts)][1]}</span></div></div>
  <div class="stats mt">${[[S.prog.st.games,'משחקים'],[S.prog.days.length,'ימים ששיחקנו'],[S.journal.length,'פרקים ביומן']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
  <div class="sec"><h3>היומן הזוגי</h3><span class="xs mut">משחקים ששמרתם</span></div>
  ${S.journal.length ? `<div class="col">${S.journal.slice().reverse().slice(0, 8).map(j => `<button class="tile tap" style="text-align:start;${gstyle(j.mode)}" data-act="jopen" data-id="${j.id}"><div class="row"><i style="width:10px;height:10px;border-radius:50%;background:var(--g1)"></i><b class="sp">${esc(j.title)}</b><span class="xs mut">${fmtDate(j.ts)}</span></div><div class="sm mut mt">${j.cards} קלפים · ${j.tasks} משימות · ${j.pts} נקודות${j.note ? ' · ' + esc(j.note.slice(0, 50)) : ''}</div></button>`).join('')}</div>` : `<div class="tile mut sm">בסוף כל משחק אפשר לשמור אותו כאן, עם רגעים ומחשבות.</div>`}
  <div class="sec"><h3>הכל במקום אחד</h3></div>
  <div class="list">${linkRow('hints', 'heart', 'רמזים זוגיים', unreadHints() ? unreadHints() + ' חדשים' : '')}${linkRow('cal', 'cal', 'הלוז המשותף')}${linkRow('work', 'clock', 'מחשבון עבודה')}${linkRow('places', 'heart', 'המקומות שלנו', placeList().length ? placeList().length + ' מקומות' : '')}${linkRow('pet', 'gift', 'החיה שלנו והאוסף')}${linkRow('missions', 'note', 'התשובות שלכם', '', {tab:'hist'})}${linkRow('achievements', 'trophy', 'הישגים, דרגות ואוספים')}${linkRow('favorites', 'heart', 'מועדפים, שמורים והערות')}${linkRow('categories', 'cards', 'קטגוריות')}${linkRow('remote', 'wifi', 'משחק בשני טלפונים / מרחוק')}</div>
  <div class="list mt">${linkRow('remote', 'wifi', 'החדר שלנו', S.room ? 'חדר "' + esc(S.room.rname || '') + '"' : '')}<button class="li" style="width:100%;text-align:start" data-act="exitroom"><span class="ico">${ic('link')}</span><span class="sp">יציאה מהחדר</span></button></div>
  <div class="list mt">${linkRow('bounds', 'shield', 'גבולות ורמת אינטימיות')}${linkRow('privacy', 'lock', 'פרטיות ואבטחה')}${linkRow('settings', 'gear', 'הגדרות כלליות')}${linkRow('infra', 'info', 'מה עובד ואיפה')}</div></div>`;
};
ACT.jopen = a => { const j = S.journal.find(x => x.id === a.dataset.id); if (!j) return;
  sheet(`<h2>${esc(j.title)}</h2><p class="mut">${fmtDate(j.ts)} · ${MODES[j.mode] ? MODES[j.mode].n : ''}</p><div class="stats mt">${[[j.cards,'קלפים'],[j.tasks,'משימות'],[j.pts,'נקודות']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>${j.note ? `<div class="note mt">${esc(j.note)}</div>` : ''}${(j.hl || []).length ? `<h3 class="mt2">רגעים מהמשחק</h3><div class="col mt">${j.hl.filter(id => CARD[id]).map(id => `<div class="tile sm">${esc(fmt(CARD[id].t, 0))}${S.react[id] ? ' ' + S.react[id] : ''}</div>`).join('')}</div>` : ''}<div class="col mt2"><button class="btn soft wide" data-close>סגירה</button><button class="btn ghost wide" id="jdel" style="color:#ff7b8f">${ic('trash')}מחיקה מהיומן</button></div>`, b => { $('#jdel', b).onclick = () => { S.journal = S.journal.filter(x => x.id !== j.id); save(); closeSheet(); render(); }; }); };
ACT.editprof = () => {
  const P = S.couple.p;
  sheet(`<h2>עריכת פרופיל</h2>${[0,1].map(i => `<label class="f">שם ${i ? 'בן/בת הזוג' : 'שלך'}</label><input class="inp" id="pn${i}" maxlength="18" value="${esc(P[i].name)}"><div class="seg mt" id="pg${i}">${[['m','זכר'],['f','נקבה'],['x','לא משנה']].map(([v, l]) => `<button data-v="${v}" class="${P[i].g === v ? 'on' : ''}">${l}</button>`).join('')}</div>`).join('')}
  <label class="f">שם זוגי</label><input class="inp" id="pcn" maxlength="24" value="${esc(S.couple.name)}">
  <label class="f">סוג הקשר</label><select class="inp" id="prel"><option value="">לא נבחר</option>${RELS.map(r => `<option ${S.couple.rel === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
  <label class="f">ביחד מאז</label><input class="inp" type="date" id="psi" value="${esc(S.couple.since)}">
  <button class="btn wide mt2" id="psv">שמירה</button>`, b => {
    const gs = [P[0].g, P[1].g];
    [0,1].forEach(i => $('#pg' + i, b).onclick = e => { const t = e.target.closest('[data-v]'); if (!t) return; gs[i] = t.dataset.v; $$('#pg' + i + ' button', b).forEach(x => x.classList.toggle('on', x === t)); });
    $('#psv', b).onclick = () => { [0,1].forEach(i => { P[i].name = $('#pn' + i, b).value.trim().slice(0, 18) || P[i].name; P[i].g = gs[i]; }); S.couple.name = $('#pcn', b).value.trim(); S.couple.rel = $('#prel', b).value; S.couple.since = $('#psi', b).value; save(); closeSheet(); render(); toast('הפרופיל עודכן'); };
  });
};

/* ───────── boundaries & adult gate ───────── */
SCREENS.bounds = () => `<div class="scr">${topbar('גבולות ואינטימיות')}
  <div class="note info">${ic('shield')} הגבולות שלכם קובעים אילו קלפים בכלל מופיעים. כל שינוי הפיך, ואפשר לשנות גם באמצע משחק.</div>
  <div class="sec"><h3>רמת מגע</h3></div>${seg('set.touch', TOUCH.map((t, i) => [i, t]), S.set.touch)}
  <p class="xs mut mt">${['אף קלף לא יבקש מגע.','חיבוק, החזקת ידיים, עיסוי כף יד.','ריקוד צמוד, נשיקות (אם מאושרות), ליטוף.','מגע אינטימי, רק במצב 18+ ורק בהסכמה בכל קלף.'][S.set.touch]}</p>
  <div class="sec"><h3>נושאים ומשימות</h3></div><div class="list">${Object.entries(BOUNDS).map(([k, l]) => sw('set.bounds.' + k, l)).join('')}</div>
  <div class="sec"><h3>גבולות אישיים</h3></div><p class="xs mut mb">משהו שחשוב שהשני יזכור? זה יופיע כתזכורת לפני כל משחק.</p>
  ${[0,1].map(i => `<label class="f" for="lim${i}">${esc(nm(i))}</label><input id="lim${i}" class="inp" maxlength="120" value="${esc(S.set.limits[i])}" data-in="lim" data-i="${i}" placeholder="למשל: לא בא לי שאלות על העבודה">`).join('')}
  <div class="sec"><h3>מצב 18+</h3><span class="status ${S.set.adult.on ? 'ok' : ''}"><i></i>${S.set.adult.on ? 'פתוח' : 'נעול'}</span></div>
  <div class="tile" style="${gstyle('adult')};background:linear-gradient(150deg,var(--g1),var(--g2));color:#fff;border:0">
   <p class="sm">משחקי אינטימיות לא גרפיים לבני 18 ומעלה, ב-4 רמות. כל קלף נחשף רק אחרי ששניכם מאשרים, ואפשר לעצור, לדלג או להוריד רמה בכל רגע.</p>
   ${S.set.adult.on ? `<label class="f" style="color:#fff">רמה מקסימלית</label><div class="seg">${[1,2,3,4].map(l => `<button class="${S.set.adult.max === l ? 'on' : ''}" style="color:#fff" data-act="seg" data-k="set.adult.max" data-v="${l}">${l}</button>`).join('')}</div><p class="xs mt" style="opacity:.85">רמה ${S.set.adult.max}: ${ADULT_LV[S.set.adult.max]}</p><button class="btn soft wide mt" data-act="adultlock">${ic('lock')}נעילה מחדש</button>` : `<button class="btn wide mt" style="background:#fff;color:#7a0f2e" data-go="adultgate">${ic('lock')}פתיחה בהסכמת שניכם</button>`}
  </div>
  ${sw('set.hideAdult', 'הסתרת מצב 18+ ממסך הבית', 'שימושי כשמישהו אחר מסתכל על הטלפון')}</div>`;
ACT.lim = a => { S.set.limits[+a.dataset.i] = a.value.slice(0, 120); save(); };
ACT.adultlock = () => { S.set.adult.on = false; S.set.adult.ok = [[0,0],[0,0]]; save(); toast('מצב 18+ ננעל'); render(); };
SCREENS.adultgate = () => {
  const ok = S.set.adult.ok; const all = ok.every(x => x[0] && x[1]);
  return `<div class="scr" style="${gstyle('adult')}">${topbar('אינטימיות למבוגרים')}
  <div class="card" style="min-height:0"><div class="body" style="padding:6px 0"><div class="txt" style="font-size:22px">לפני שפותחים</div>
  <ul class="sm" style="padding-inline-start:18px;margin:12px 0 0;line-height:1.7"><li>המצב מיועד לבני 18 ומעלה בלבד.</li><li>כל קלף נחשף רק אחרי ששניכם לוחצים "בעניין".</li><li>"לא הפעם" תמיד זמין, בלי עונש, בלי נקודות שהולכות לאיבוד ובלי הסברים.</li><li>הסכמה לקלף אחד לא אומרת הסכמה לקלף הבא.</li><li>כפתור "עצרו" נמצא על המסך כל הזמן.</li><li>התוכן לא גרפי, ומותאם לרמת המגע שבחרתם.</li></ul></div></div>
  ${[0,1].map(i => `<div class="tile mt"><b>${esc(nm(i))}</b>${[[0,'אני בן/בת 18 ומעלה'],[1,'אני רוצה לשחק במצב הזה']].map(([k, l]) => `<button class="li" style="width:100%;text-align:start;padding-inline:0" data-act="agok" data-i="${i}" data-k="${k}" aria-pressed="${!!ok[i][k]}"><span class="chk ${ok[i][k] ? 'on' : ''}">${ok[i][k] ? ic('check') : ''}</span><span>${l}</span></button>`).join('')}</div>`).join('')}
  <label class="f">רמה מקסימלית להתחלה</label>${seg('set.adult.max', [1,2,3,4].map(l => [l, `${l} · ${ADULT_LV[l]}`]), S.set.adult.max)}
  ${S.set.touch < 2 ? `<div class="note mt">רמת המגע שלכם היא "${TOUCH[S.set.touch]}", כך שרוב משימות המגע לא יופיעו. אפשר לשנות במסך הגבולות.</div>` : ''}
  <button class="btn wide mt2" data-act="agopen" ${all ? '' : 'disabled'}>${ic('fire')}פתיחת המצב</button><button class="btn ghost wide" data-act="back">לא עכשיו</button></div>`;
};
ACT.agok = a => { const i = +a.dataset.i, k = +a.dataset.k; S.set.adult.ok[i][k] = S.set.adult.ok[i][k] ? 0 : 1; save(); render(); };
ACT.agopen = () => { S.set.adult.on = true; save(); sfx('ach'); stack = [{name:'home'}]; render(); setTimeout(() => pregame('adult'), 200); };

/* ───────── settings, privacy, infra ───────── */
SCREENS.settings = () => `<div class="scr">${topbar('הגדרות כלליות')}
  <div class="sec"><h3>מראה ותחושה</h3></div>${seg('set.ui', [['dark','כהה'],['light','בהיר'],['auto','לפי המכשיר']], S.set.ui)}
  <div class="list mt">${sw('set.sound', 'צלילים', 'אפקטים עדינים בשליפה, חשיפה והישגים')}${sw('set.haptic', 'רטט', 'במכשירים שתומכים')}${sw('set.motion', 'אנימציות', 'כבו לחוויה שקטה יותר')}</div>
  <div class="sec"><h3>משחק</h3></div>
  <label class="f">חשיפה הדרגתית של קלפים</label>${seg('set.reveal', [['all','כל קלף'],['special','רק קלפים מיוחדים'],['none','בלי']], S.set.reveal)}
  <label class="f">משך משחק ברירת מחדל</label>${seg('set.dur', DURS, S.set.dur)}
  <label class="f">סגנון ברירת מחדל</label><div class="row wrap">${Object.entries(VIBES).filter(([k]) => k !== 'intimate' || S.set.adult.on).map(([k, l]) => `<button class="chip ${S.set.vibe === k ? 'on' : ''}" data-act="seg" data-k="set.vibe" data-v='"${k}"'>${l}</button>`).join('')}</div>
  <label class="f">איך משחקים</label>${seg('set.play', [['one','טלפון אחד'],['two','שני טלפונים'],['remote','מרחוק']], S.set.play)}
  <div class="sec"><h3>שפה</h3></div><div class="tile sm">עברית (מימין לשמאל). כל הטקסטים והקלפים בנויים כמאגר נפרד, כך שאפשר להוסיף שפות בעתיד.</div>
  <div class="sec"><h3>הנתונים שלכם</h3></div>
  <div class="list">
   <button class="li" style="width:100%;text-align:start" data-act="export"><span class="ico">${ic('copy')}</span><span class="sp">העתקת גיבוי (טקסט)</span></button>
   <button class="li" style="width:100%;text-align:start" data-act="import"><span class="ico">${ic('book')}</span><span class="sp">שחזור מגיבוי</span></button>
   <button class="li" style="width:100%;text-align:start" data-act="reset"><span class="ico">${ic('trash')}</span><span class="sp" style="color:#ff7b8f">איפוס מלא של האפליקציה</span></button></div>
  <div class="list mt">${linkRow('privacy', 'lock', 'פרטיות ואבטחה')}${linkRow('bounds', 'shield', 'גבולות')}${linkRow('infra', 'info', 'מה עובד ואיפה')}</div>
  <p class="xs dim mt2" style="text-align:center">Between Us · ${CARDS.length} קלפים · גרסה 1.0</p></div>`;
ACT.export = () => copyText(JSON.stringify(S));
ACT.import = () => sheet(`<h2>שחזור מגיבוי</h2><p class="mut sm">הדביקו כאן את טקסט הגיבוי. הוא יחליף את הנתונים הנוכחיים במכשיר.</p><textarea class="inp mt" id="imp" placeholder="{...}"></textarea><button class="btn wide mt" id="impg">שחזור</button>`, b => { $('#impg', b).onclick = () => { try { const d = JSON.parse($('#imp', b).value); if (!d || !d.couple) throw 0; S = deepMerge(DEF(), d); save(); closeSheet(); stack = [{name:'home'}]; render(); toast('הנתונים שוחזרו'); } catch (e) { toast('הטקסט לא נראה כמו גיבוי של Between Us', 'err'); } }; });
ACT.reset = () => confirmSheet('לאפס הכל?', 'כל ההתקדמות, הזיכרונות, המועדפים וההגדרות יימחקו מהמכשיר הזה. מומלץ להעתיק גיבוי לפני.', 'כן, לאפס', () => { S = DEF(); photos = {}; savePhotos(); save(); if (CLOUD.ref) CLOUD.ref.delete().catch(() => {}); stack = [{name:'splash'}]; render(); });
SCREENS.privacy = () => `<div class="scr">${topbar('פרטיות ואבטחה')}
  <div class="note info">${ic('shield')} כל מה שאתם כותבים, עונים ושומרים נשאר אצלכם. אין פרסומות, אין מעקב ואין שיתוף עם אף אחד.</div>
  <div class="sec"><h3>נעילה</h3></div>
  <div class="list"><div class="li"><div class="sp"><div>קוד נעילה לאפליקציה</div><div class="xs mut">${S.set.pin ? 'פעיל: 4 ספרות בכל פתיחה' : 'כבוי'}</div></div><button class="btn sm ${S.set.pin ? 'soft' : ''}" data-act="${S.set.pin ? 'pinoff' : 'pinset'}">${S.set.pin ? 'הסרה' : 'הגדרה'}</button></div>
  ${sw('set.discreet', 'מצב דיסקרטי', 'מסתיר את המסך כשיוצאים מהאפליקציה וחוזרים')}${sw('set.hideAdult', 'הסתרת מצב 18+ מהבית')}${window.BU_STANDALONE ? sw('set.pushNote', 'נוסח הרמז בהתראות', 'כשכבוי, רמזים עדיין מגיעים לאפליקציה מוצפנים, אבל בלי התראה דרך ntfy') : ''}</div>
  ${window.BU_STANDALONE ? '' : `  <div class="sec"><h3>גיבוי פרטי</h3><span class="status ${CLOUD.state === 'on' ? 'ok' : CLOUD.state === 'checking' ? 'wait' : 'no'}"><i></i>${{on: 'זמין', checking: 'בודק...', off: 'לא זמין כאן', err: 'שגיאה'}[CLOUD.state]}</span></div>
  <div class="list">${sw('set.cloud', 'גיבוי אוטומטי לחשבון Claude שלך', 'פרטי לחשבון שלך בלבד, ללא תמונות. עובד כשהאפליקציה פתוחה דרך Claude.')}
  ${CLOUD.remote ? `<button class="li" style="width:100%;text-align:start" data-act="cloudrestore"><span class="ico">${ic('book')}</span><span class="sp">שחזור מהגיבוי האחרון<span class="xs mut" style="display:block">${CLOUD.ts ? new Date(CLOUD.ts).toLocaleString('he-IL') : ''}</span></span></button>` : ''}</div>`}
  <div class="sec"><h3>מחיקה</h3></div>
  <div class="list"><button class="li" style="width:100%;text-align:start" data-act="delmem"><span class="ico">${ic('album')}</span><span class="sp">מחיקת כל הזיכרונות והתמונות</span></button>
  <button class="li" style="width:100%;text-align:start" data-act="delnotes"><span class="ico">${ic('note')}</span><span class="sp">מחיקת הערות, תגובות והיומן</span></button>
  <button class="li" style="width:100%;text-align:start" data-act="reset"><span class="ico">${ic('trash')}</span><span class="sp" style="color:#ff7b8f">מחיקת כל הנתונים</span></button></div></div>`;
ACT.cloudrestore = () => confirmSheet('לשחזר מהגיבוי?', 'הנתונים במכשיר יוחלפו בגיבוי האחרון מהחשבון שלך.', 'שחזור', () => { try { S = deepMerge(DEF(), JSON.parse(CLOUD.remote)); save(); stack = [{name:'home'}]; render(); toast('שוחזר'); } catch (e) { toast('הגיבוי פגום', 'err'); } });
ACT.delmem = () => confirmSheet('למחוק את כל הזיכרונות?', 'כל הזיכרונות והתמונות יימחקו לצמיתות.', 'מחיקה', () => { S.mem = []; photos = {}; savePhotos(); save(); render(); });
ACT.delnotes = () => confirmSheet('למחוק הערות ויומן?', 'ההערות, התגובות לקלפים והיומן הזוגי יימחקו.', 'מחיקה', () => { S.notes = {}; S.react = {}; S.journal = []; save(); render(); });
ACT.pinoff = () => { S.set.pin = ''; save(); render(); toast('הקוד הוסר'); };
ACT.pinset = () => pinPad('בחרו קוד של 4 ספרות', p1 => pinPad('הקלידו שוב לאישור', p2 => { if (p1 === p2) { S.set.pin = String(hashStr('bu' + p1)); save(); toast('קוד הנעילה הוגדר'); render(); } else toast('הקודים לא תואמים, נסו שוב', 'err'); }));
function pinPad(title, done, lockMode) {
  let v = '';
  const el = document.createElement('div'); el.className = 'lockscr';
  const draw = () => { el.innerHTML = `<svg width="70" height="70" style="color:var(--rose)"><use href="#rings"/></svg><h2>${title}</h2><div class="pins">${[0,1,2,3].map(i => `<i class="${i < v.length ? 'f' : ''}"></i>`).join('')}</div><div class="pad">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}" aria-label="${k === '⌫' ? 'מחיקה' : k}">${k}</button>`).join('')}</div>${lockMode ? `<button class="btn ghost" data-k="forgot">שכחתי את הקוד</button>` : `<button class="btn ghost" data-k="cancel">ביטול</button>`}`; };
  draw(); document.body.appendChild(el);
  el.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k; sfx('tap'); buzz(6);
    if (k === 'cancel') { el.remove(); return; }
    if (k === 'forgot') { el.remove(); confirmSheet('לאפס את האפליקציה?', 'בלי הקוד אפשר רק לאפס הכל ולהתחיל מחדש. גיבוי טקסט ששמרתם בעבר יאפשר לשחזר.', 'איפוס', () => { S = DEF(); save(); stack = [{name:'splash'}]; render(); }); return; }
    if (k === '⌫') v = v.slice(0, -1); else if (v.length < 4) v += k;
    draw(); if (v.length === 4) setTimeout(() => { const r = done(v); if (r === false) { v = ''; el.querySelector('.pins').animate([{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'none'}], 300); draw(); } else el.remove(); }, 150); };
}
SCREENS.infra = () => `<div class="scr">${topbar('מה עובד ואיפה')}
  <p class="mut mb">שקיפות מלאה: מה עובד עכשיו, ומה דורש תשתית שעוד לא קיימת.</p>
  <table class="inf"><tbody>
  ${[['ok','משחק על טלפון אחד','עובד במלואו, גם בלי אינטרנט. כל 10 המצבים, הקלפים, הניקוד וההישגים.'],
     ['ok','שמירת התקדמות, מועדפים, זיכרונות ויומן','נשמר במכשיר. התמונות נשמרות רק במכשיר הזה.'],
     ...(window.BU_STANDALONE ? [['ok','שני טלפונים ומשחק מרחוק','הטלפונים מתחברים ישירות, בלי חשבון ובלי שרת, כששניכם באפליקציה באותו זמן. כל 5 שניות האפליקציה מרעננת ושולחת את המצב מחדש.'],['part','שמירה','הכל נשמר רק על הטלפונים שלכם. אין גיבוי בענן: מה שלא סונכרן נשאר בטלפון שבו נכתב.']] : [[CLOUD.state === 'on' ? 'ok' : 'part','גיבוי פרטי בענן','לחשבון Claude שלך, כשהאפליקציה פתוחה דרך Claude. ' + (CLOUD.state === 'on' ? 'פעיל עכשיו.' : 'לא זמין בתצוגה הנוכחית.')],
     [R.cap === 'on' ? 'ok' : 'part','שני טלפונים ומשחק מרחוק','סנכרון בזמן אמת בין שני טלפונים, כששניכם פותחים את האפליקציה דרך Claude ומחוברים לחשבון. ' + (R.cap === 'on' ? 'זמין עכשיו.' : R.cap === 'checking' ? 'בודק זמינות...' : 'לא זמין בתצוגה הנוכחית.')],
     ['part','QR וקישור הצטרפות','הקישור פותח את האפליקציה עם הקוד. בן/בת הזוג צריכים גישה לאפליקציה (שיתוף מ-Claude).']]),
     ['no','חשבונות משתמש וסנכרון התקדמות משותף','כל טלפון שומר התקדמות משלו. איחוד אוטומטי של שני טלפונים לפרופיל אחד דורש שרת ייעודי. מבנה הנתונים מוכן לזה.'],
     ['no','התראות למשימות יומיות','דורש אפליקציה מותקנת מחנות האפליקציות.']].map(([s, t, d]) => `<tr><td style="width:28px"><span class="status ${s === 'ok' ? 'ok' : s === 'part' ? 'wait' : 'no'}" style="padding:4px"><i></i></span></td><td><b>${t}</b><div class="sm mut">${d}</div></td></tr>`).join('')}
  </tbody></table></div>`;
