/* Between Us — shared answers for daily missions & the daily card.
   Each partner writes an answer; points arrive only when both answered. Synced between phones via the room. */
const ansKey = (id, per) => id + '|' + per;
const ansAll = () => (S.answers = S.answers || {});
const ansGet = (id, per) => ansAll()[ansKey(id, per)];
const myIdx = () => (S.room ? (S.room.host ? 0 : 1) : null); // null = one phone, both write here
function ansEnsure(id, per, pts, kind) { const k = ansKey(id, per), A = ansAll(); if (!A[k]) A[k] = {id, per, kind, pts, t: ['', ''], at: [0, 0], ok: 0}; return A[k]; }
function ansCheck(e) {
  if (e.ok || !e.t[0] || !e.t[1]) return false;
  e.ok = Date.now(); const c = CARD[e.id];
  if (e.kind === 'daily') { const d = S.daily[e.per]; if (d) d.done = true; S.prog.seen[e.id] = (S.prog.seen[e.id] || 0) + 1; S.prog.st.ans++; logEv('ans'); petFeed(1); }
  else { if (!misDone(e.id, e.per)) S.misLog.push({id: e.id, p: e.per, ts: Date.now()}); S.prog.st.mis++; logEv('mis'); petFeed(2); if (c && c.tags.includes('phone')) S.prog.st.nophone++; if (c && c.tags.includes('comp')) S.prog.st.comps++; }
  markDay(); addPts(e.pts); confetti(60); sfx('ach');
  setTimeout(() => toast(`<b>שניכם עניתם!</b><br><span class="mut sm">+${e.pts} נקודות. התשובות נחשפו.</span>`, 'ach', 'heart'), 300);
  checkAch(); return true;
}
function ansWrite(id, per, i, text, pts, kind) {
  const e = ansEnsure(id, per, pts, kind); e.t[i] = String(text || '').trim().slice(0, 300); e.at[i] = Date.now();
  ansCheck(e); save(); ansSync();
}
function ansRemove(id, per) {
  const k = ansKey(id, per), e = ansAll()[k]; if (!e) return;
  if (e.ok) { S.prog.pts = Math.max(0, S.prog.pts - e.pts); petFeed(e.kind === 'daily' ? -1 : -2, true);
    if (e.kind === 'daily') { if (S.daily[e.per]) S.daily[e.per].done = false; } else { S.misLog = S.misLog.filter(l => !(l.id === id && l.p === per)); S.prog.st.mis = Math.max(0, S.prog.st.mis - 1); } }
  delete ansAll()[k]; save(); ansSync();
}
/* status pill for rows */
function ansStatus(id, per) {
  const e = ansGet(id, per); if (!e) return {n: 0, ok: false};
  return {n: (e.t[0] ? 1 : 0) + (e.t[1] ? 1 : 0), ok: !!e.ok, e};
}

/* ───────── sheet ───────── */
function answerSheet(id, per, pts, kind) {
  const c = CARD[id]; if (!c) return; const me = myIdx();
  let edit = [false, false];
  const draw = b => {
    const e = ansGet(id, per) || {t: ['', ''], at: [0, 0], ok: 0};
    const both = !!e.ok;
    const block = i => {
      const mine = me === i; const has = !!e.t[i]; const canWrite = mine && R.live;
      let inner;
      if (canWrite && (!has || edit[i])) inner = `<textarea class="inp" id="aw${i}" maxlength="300" placeholder="${kind === 'daily' ? 'התשובה של ' + esc(nm(i)) : 'מה עשית, איך היה, מה הרגשת?'}">${esc(e.t[i])}</textarea><button class="btn sm wide mt" data-aw="${i}">${has ? 'עדכון' : 'שמירת התשובה'}</button>`;
      else if (has && (both || (me !== null && me === i))) inner = `<p style="white-space:pre-wrap">${esc(e.t[i])}</p>${canWrite ? `<button class="btn ghost sm" data-ed="${i}">${ic('note')}עריכה</button>` : ''}`;
      else if (has) inner = `<p class="mut">${ic('lock')} ${gw(i, 'ענה', 'ענתה')}. התשובה תיחשף כששניכם תענו.</p>${canWrite ? `<button class="btn ghost sm" data-ed="${i}">${ic('note')}עריכה</button>` : ''}`;
      else if (mine && !R.live) inner = `<p class="mut">${ic('wifi')} כדי לענות, שניכם צריכים להיות מחוברים עכשיו.</p>`;
      else inner = `<p class="mut">${ic('clock')} מחכים לתשובה של ${esc(nm(i))}${me !== null && !R.live ? '. התשובה תגיע כשהטלפון של ' + esc(nm(i)) + ' יתחבר.' : ''}</p>`;
      return `<div class="tile mt"><div class="row mb"><span class="chk ${has ? 'on' : ''}" style="width:26px;height:26px">${has ? ic('check') : ''}</span><b class="sp">${esc(nm(i))}${me === i ? ' (את/ה)' : ''}</b></div>${inner}</div>`;
    };
    const gate = me === null ? `<div class="tile mt" style="text-align:center">${ic('wifi')}<h3 class="mt">עונים רק כששניכם מחוברים</h3><p class="mut sm mt">כל אחד עונה מהטלפון שלו, אחרי שחיברתם את הטלפונים בחדר משותף. ככה התשובות באמת של שניכם.</p><button class="btn wide mt" data-go="remote">${ic('link')}חיבור בן/בת הזוג</button></div>`
      : !R.live ? `<div class="note mt">${ic('wifi')} ${esc(nm(1 - me))} לא מחובר/ת כרגע. אפשר לענות כששניכם פותחים את האפליקציה באותו זמן.</div>` : '';
    b.innerHTML = `<div class="grab"></div><div class="card" style="${gstyle(kind === 'daily' ? c.m : 'mis')};min-height:0"><div class="hd"><span class="pill">${kind === 'daily' ? 'קלף היום' : CATS[c.c].n}</span><span class="pill">+${pts} כששניכם עונים</span></div><div class="body" style="padding:12px 0 4px"><div class="txt" style="font-size:21px">${esc(fmt(c.t, me ?? 0))}</div></div></div>
      ${both ? `<div class="note mt" style="text-align:center">${ic('heart')} שניכם עניתם, והנקודות התקבלו</div>` : `<p class="xs mut mt">כל אחד כותב תשובה משלו. התשובות נשמרות בהיסטוריה, והנקודות מגיעות רק אחרי ששניכם עניתם.</p>`}
      ${me === null ? gate : gate + block(0) + block(1)}
      <div class="col mt"><button class="btn soft wide" data-close>סגירה</button>${ansGet(id, per) ? `<button class="btn ghost wide" data-del="1" style="color:#ff7b8f">${ic('trash')}מחיקת התשובות${both ? ' (והנקודות)' : ''}</button>` : ''}</div>`;
  };
  const b = sheet('', draw); draw(b);
  b.onclick = ev => {
    const s = ev.target.closest('[data-aw]'); if (s) { const i = +s.dataset.aw; const v = $('#aw' + i, b).value.trim(); if (!v) return toast('כתבו כמה מילים'); edit[i] = false; ansWrite(id, per, i, v, pts, kind); sfx('ok'); draw(b); render(); return; }
    const d = ev.target.closest('[data-ed]'); if (d) { edit[+d.dataset.ed] = true; draw(b); return; }
    if (ev.target.closest('[data-del]')) { closeSheet(); confirmSheet('למחוק את התשובות?', 'התשובות של שניכם יימחקו מהמכשיר הזה, והנקודות של המשימה יבוטלו.', 'מחיקה', () => { ansRemove(id, per); render(); }); }
  };
  ANS_OPEN = {id, per, redraw: () => { const sb = $('.sheet'); if (sb) draw(sb); }};
}
let ANS_OPEN = null;

/* ───────── sync between phones (lobby presence, keyed by room code) ───────── */
let ansT = 0;
function ansSync() {
  clearTimeout(ansT);
  ansT = setTimeout(() => {
    if (!R.room || !S.room || myIdx() === null) return; const me = myIdx(); const cut = Date.now() - 3 * 864e5;
    const dans = Object.entries(ansAll()).filter(([, e]) => e.kind !== 'game' && e.t[me] && e.at[me] > cut).sort((a, b) => b[1].at[me] - a[1].at[me]).slice(0, 6)
      .map(([k, e]) => ({k, t: e.t[me].slice(0, 200), at: e.at[me], pts: e.pts, kind: e.kind}));
    R.room.presence({app: 'bu', code: S.room.code, role: S.room.host ? 'host' : 'guest', dans, ...(typeof loveFields === 'function' ? loveFields() : {})}).catch(() => {});
  }, 400);
}
function ansMerge(list, pi) {
  if (!Array.isArray(list)) return; let changed = false;
  list.forEach(x => {
    if (!x || typeof x.k !== 'string' || typeof x.t !== 'string') return; const [id, per] = x.k.split('|'); if (!CARD[id] || !per) return;
    const e = ansEnsure(id, per, Math.min(60, +x.pts || 25), x.kind === 'daily' ? 'daily' : 'mis');
    if ((+x.at || 0) > e.at[pi]) { const first = !e.t[pi]; e.t[pi] = x.t.slice(0, 300); e.at[pi] = +x.at; changed = true;
      if (first && !ansCheck(e)) { toast(`<b>${esc(nm(pi))} ${gw(pi, 'ענה', 'ענתה')} על ${e.kind === 'daily' ? 'קלף היום' : 'משימה'}</b><br><span class="mut sm">ענו גם אתם כדי לקבל את הנקודות</span>`); buzz(60); sfx('ok'); } }
  });
  if (changed) { save(); if (ANS_OPEN) ANS_OPEN.redraw(); if (['home','missions'].includes(cur().name)) render(); }
}
function ansLobby(ch) {
  if (!S.room) return; const want = S.room.host ? 'guest' : 'host';
  const p = ch.peers.find(x => !x.isMe && x.presence && x.presence.app === 'bu' && x.presence.code === S.room.code && x.presence.role === want);
  if (p) { ansMerge(p.presence.dans, S.room.host ? 1 : 0); if (typeof loveLobby === 'function') loveLobby(p.presence); }
}
