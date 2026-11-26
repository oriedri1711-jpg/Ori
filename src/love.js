/* Between Us — love hints + shared calendar.
   Sync paths: (1) live room presence when both phones are open; (2) in the downloadable app, an end-to-end
   encrypted mailbox on the free public ntfy.sh service (no account; messages kept ~12h), so a hint or an event
   reaches the partner even if their app was closed. Optional push: the ntfy app subscribed to the "-n" topic. */

const HINTS = [
  ['love', '❤️', 'אני [אוהב|אוהבת] אותך'], ['miss', '🥺', 'אני [מתגעגע|מתגעגעת] אליך'], ['think', '💭', 'אני [חושב|חושבת] עליך'],
  ['hug', '🤗', '[שולח|שולחת] לך חיבוק ענק'], ['kiss', '😘', '[שולח|שולחת] לך נשיקה'], ['amaz', '✨', '{אתה מדהים|את מדהימה}'],
  ['morn', '☀️', 'בוקר טוב, {אהוב|אהובה} שלי'], ['night', '🌙', 'לילה טוב, חלומות מתוקים'], ['proud', '🌟', 'אני גאה בך'],
  ['luck', '🍀', 'בהצלחה היום! {אתה תותח|את תותחית}'], ['wait', '⏳', 'מחכה לראות אותך'], ['needhug', '🫂', 'אני [צריך|צריכה] חיבוק'],
  ['call', '📞', '{תתקשר|תתקשרי} אליי כשנוח לך'], ['thanks', '💐', 'תודה ש{אתה|את} איתי'], ['smile', '😊', '{חייך|חייכי}, זה הכי יפה עליך'],
  ['home', '🏠', '[בדרך|בדרך] הביתה']
];
const meSlot = () => (S.room ? (S.room.host ? 0 : 1) : 0);
const hintsAll = () => (S.hints = S.hints || []);
const calAll = () => (S.cal = S.cal || {});
const unreadHints = () => hintsAll().filter(h => h.from !== meSlot() && !h.read).length;

/* ── crypto + mailbox (downloadable app only) ── */
const RELAY_URL = window.BU_RELAY || 'https://ntfy.sh';
const LV = {key: null, keyHex: '', polling: false, last: 0, ok: null};
async function relayIds(name, pw) {
  const n = normName(name);
  const h = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');
  try { return {topic: 'bu' + (await h('bu-topic|' + n + '|' + pw)).slice(0, 26), key: await h('bu-key|' + n + '|' + pw)}; } catch (e) { return null; }
}
const relayOn = () => !!(window.BU_STANDALONE && S.room && S.room.relay && S.room.relay.topic && window.crypto && crypto.subtle);
async function relayKey() {
  const hex = S.room.relay.key; if (LV.key && LV.keyHex === hex) return LV.key;
  const raw = new Uint8Array(hex.match(/../g).map(x => parseInt(x, 16)));
  LV.key = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); LV.keyHex = hex; return LV.key;
}
const b64 = u => btoa(String.fromCharCode(...u));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function seal(obj) { const k = await relayKey(); const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, k, new TextEncoder().encode(JSON.stringify(obj)))); return 'bu1.' + b64(iv) + '.' + b64(ct); }
async function unseal(s) { if (typeof s !== 'string' || !s.startsWith('bu1.')) return null; const [, iv, ct] = s.split('.'); const k = await relayKey(); const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: unb64(iv)}, k, unb64(ct)); return JSON.parse(new TextDecoder().decode(pt)); }
async function relayPost(type, data, note) {
  if (!relayOn()) return false;
  try {
    const msg = await seal({type, data, from: meSlot(), dev: devId()});
    const r = await fetch(RELAY_URL + '/', {method: 'POST', body: JSON.stringify({topic: S.room.relay.topic, message: msg})});
    if (note && S.set.pushNote !== false) fetch(RELAY_URL + '/', {method: 'POST', body: JSON.stringify({topic: S.room.relay.topic + '-n', title: 'Between Us', message: note, tags: ['heart'], priority: 4})}).catch(() => {});
    LV.ok = r.ok; return r.ok;
  } catch (e) { LV.ok = false; return false; }
}
function devId() { if (!S.devId) { S.devId = uid(); save(); } return S.devId; }
async function relayPoll() {
  if (!relayOn() || LV.polling) return; LV.polling = true;
  try {
    const since = (S.relaySince && S.relaySince[S.room.relay.topic]) || '12h';
    const r = await fetch(`${RELAY_URL}/${S.room.relay.topic}/json?poll=1&since=${encodeURIComponent(since)}`);
    if (!r.ok) throw new Error('http ' + r.status); LV.ok = true;
    const lines = (await r.text()).split('\n').filter(Boolean); let lastId = null;
    for (const l of lines) {
      let m; try { m = JSON.parse(l); } catch (e) { continue; } if (!m || m.event !== 'message') continue; lastId = m.id;
      let d; try { d = await unseal(m.message); } catch (e) { continue; } if (!d || d.dev === devId()) continue;
      if (d.type === 'hint') loveMerge({lh: [d.data]}, true); else if (d.type === 'cal') loveMerge({lc: [d.data]}, true); else if (d.type === 'read') loveMerge({hr: d.data}, true); else if (d.type === 'place' && typeof placeMerge === 'function') placeMerge([d.data]); else if (d.type === 'work' && typeof workMerge === 'function') workMerge([d.data]); else if (d.type === 'wcfg' && d.data && typeof workMerge === 'function') workMerge(null, {[d.data.who === 0 ? 0 : 1]: d.data.c}); else if (d.type === 'arc' && typeof arcMerge === 'function') arcMerge(d.data);
    }
    if (lastId) { S.relaySince = S.relaySince || {}; S.relaySince[S.room.relay.topic] = lastId; save(); }
  } catch (e) { LV.ok = false; }
  finally { LV.polling = false; LV.last = Date.now(); }
}

/* ── merge (from the live room or the mailbox) ── */
function loveFields() {
  const me = meSlot(); const lim = window.BU_STANDALONE ? [40, 150] : [10, 14];
  const lh = hintsAll().filter(h => h.from === me).slice(-lim[0]).map(h => ({id: h.id, k: h.k, e: h.e, t: h.t, ts: h.ts, from: h.from}));
  const lc = Object.values(calAll()).filter(e => e.ed === me).sort((a, b) => b.ts - a.ts).slice(0, lim[1]);
  const hr = hintsAll().filter(h => h.from !== me && h.read).reduce((m, h) => Math.max(m, h.ts), 0);
  return {lh, lc, hr, ...(typeof workFields === 'function' ? workFields() : {}), ...(typeof placeFields === 'function' ? placeFields() : {})};
}
function loveMerge(p, viaRelay) {
  if (!p) return; const me = meSlot(); let nh = [], nc = 0;
  if (Array.isArray(p.lh)) p.lh.forEach(h => {
    if (!h || typeof h.id !== 'string' || typeof h.t !== 'string' || h.from === me || hintsAll().some(x => x.id === h.id)) return;
    const x = {id: h.id.slice(0, 40), k: String(h.k || '').slice(0, 12), e: String(h.e || '💌').slice(0, 8), t: h.t.slice(0, 140), ts: +h.ts || Date.now(), from: h.from === 0 ? 0 : 1, read: false};
    hintsAll().push(x); nh.push(x);
  });
  if (Array.isArray(p.lc)) p.lc.forEach(e => {
    if (!e || typeof e.id !== 'string' || typeof e.title !== 'string') return; const cur0 = calAll()[e.id];
    if (cur0 && cur0.ts >= (+e.ts || 0)) return;
    calAll()[e.id] = {id: e.id.slice(0, 40), title: e.title.slice(0, 80), date: String(e.date || '').slice(0, 10), time: String(e.time || '').slice(0, 5), end: String(e.end || '').slice(0, 5), who: e.who === 0 || e.who === 1 ? e.who : 'b', note: String(e.note || '').slice(0, 300), ts: +e.ts || Date.now(), ed: e.ed === 0 ? 0 : 1, by: e.by === 0 ? 0 : 1, del: !!e.del, rep: Array.isArray(e.rep) ? [...new Set(e.rep.map(Number).filter(x => x >= 0 && x <= 6))] : [], until: /^\d{4}-\d{2}-\d{2}$/.test(e.until || '') ? e.until : '', skip: Array.isArray(e.skip) ? e.skip.filter(x => /^\d{4}-\d{2}-\d{2}$/.test(x)).slice(-120) : []};
    nc++;
  });
  if (+p.hr) { const was = S.hintRead || 0; S.hintRead = Math.max(was, +p.hr); if (S.hintRead !== was) nc = nc || 0.5; }
  if (!nh.length && !nc) return;
  if (hintsAll().length > 400) S.hints = hintsAll().slice(-400);
  save();
  if (nh.length) { const h = nh[nh.length - 1]; toast(`<span style="font-size:26px">${esc(h.e)}</span> <b>${esc(nm(h.from))}:</b> ${esc(h.t)}${nh.length > 1 ? `<br><span class="xs mut">ועוד ${nh.length - 1} רמזים</span>` : ''}`, 'info'); buzz(120); sfx('ach'); if (document.hidden) document.title = '💌 ' + nm(h.from) + ' | Between Us'; }
  if (nc >= 1 && !nh.length && cur().name !== 'cal') toast(`${ic('cal')} ${esc(nm(1 - me))} ${gw(1 - me, 'עדכן', 'עדכנה')} את הלוז המשותף`, 'info');
  if (['home', 'hints', 'cal'].includes(cur().name) && !$('.sheet') && !(document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName))) render();
}
function loveLobby(presence) { loveMerge({lh: presence.lh, lc: presence.lc, hr: presence.hr}); if (typeof workMerge === 'function') workMerge(presence.lw, presence.wc); if (typeof placeMerge === 'function') placeMerge(presence.lp); }

/* ── hints ── */
function sendHint(k, custom) {
  const me = meSlot(); const pre = HINTS.find(h => h[0] === k);
  const t = custom ? String(custom).trim().slice(0, 140) : fmt(pre[2], me);
  if (!t) return;
  const h = {id: uid(), k: custom ? 'custom' : k, e: custom ? '💌' : pre[1], t, ts: Date.now(), from: me, read: false};
  hintsAll().push(h); save(); ansSync(); sfx('ok'); buzz(30);
  relayPost('hint', {id: h.id, k: h.k, e: h.e, t: h.t, ts: h.ts, from: me}, `${h.e} ${nm(me)}: ${h.t}`).then(ok => { h.relay = ok ? 1 : 0; save(); if (cur().name === 'hints') render(); });
  toast(`${h.e} נשלח ל${esc(nm(1 - me))}`, 'info');
  if (cur().name === 'hints' || cur().name === 'home') render();
}
function markHintsRead() {
  const me = meSlot(); let any = false; hintsAll().forEach(h => { if (h.from !== me && !h.read) { h.read = true; any = true; } });
  if (any) { save(); ansSync(); const hr = loveFields().hr; relayPost('read', hr); }
}
function hintStatus(h) {
  if (h.from !== meSlot()) return '';
  if ((S.hintRead || 0) >= h.ts) return `<span class="xs" style="color:var(--ok)">${ic('check')}${ic('check')} נקרא</span>`;
  return `<span class="xs mut">${ic('check')} ${h.relay ? 'נשלח, יגיע גם אם האפליקציה סגורה' : R.live ? 'נשלח' : 'יישלח כששניכם מחוברים'}</span>`;
}
const timeAgo = ts => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'עכשיו'; if (s < 3600) return `לפני ${Math.floor(s / 60)} דק׳`; if (s < 86400) return `לפני ${Math.floor(s / 3600)} שע׳`; return new Date(ts).toLocaleDateString('he-IL', {day: 'numeric', month: 'short'}) + ' ' + new Date(ts).toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'}); };
SCREENS.hints = () => {
  const me = meSlot(), p = 1 - me; const L = hintsAll().slice().reverse().slice(0, 80);
  const relay = relayOn();
  return `<div class="scr">${topbar('רמזים זוגיים')}
  <p class="mut mb">שלחו ל${esc(nm(p))} רמז קטן באמצע היום. ${relay ? 'הרמז מגיע גם אם האפליקציה של ' + esc(nm(p)) + ' סגורה, ויופיע כשהיא תיפתח.' : 'הרמז יגיע כששניכם מחוברים.'}</p>
  <div class="grid2" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">${HINTS.map(([k, e, t]) => `<button class="tile tap" style="text-align:start;padding:12px;display:flex;gap:10px;align-items:center" data-act="hint" data-k="${k}"><span style="font-size:26px;line-height:1">${e}</span><span class="sm" style="font-weight:500">${esc(fmt(t, me))}</span></button>`).join('')}</div>
  <div class="tile mt"><label class="f" for="hcus" style="margin-top:0">רמז משלך</label><div class="row"><input id="hcus" class="inp" maxlength="140" placeholder="משהו קטן מהלב..." autocomplete="off"><button class="btn" data-act="hintc" aria-label="שליחה">${ic('heart')}</button></div></div>
  ${window.BU_STANDALONE ? `<div class="note info mt sm">${ic('info')} ${relay ? `${LV.ok === false ? '<b>תיבת הדואר לא זמינה כרגע</b> (אין אינטרנט?). ' : ''}רוצים התראה בטלפון גם כשהאפליקציה סגורה? <button class="lnk" data-act="pushhelp" style="text-decoration:underline">כך מפעילים</button>` : 'כדי שרמזים יגיעו גם כשהאפליקציה של בן/בת הזוג סגורה, צאו מהחדר והיכנסו שוב עם השם והסיסמה (פעם אחת).'}</div>` : ''}
  <div class="sec"><h3>השיחה שלכם</h3><span class="sm mut">${hintsAll().length}</span></div>
  ${L.length ? `<div class="col" style="gap:8px">${L.map(h => { const mine = h.from === me; return `<div class="tile" style="max-width:86%;${mine ? 'margin-inline-start:auto;background:linear-gradient(135deg,rgba(255,92,138,.22),rgba(194,24,91,.18))' : ''}"><div class="row"><span style="font-size:24px">${esc(h.e)}</span><div class="sp"><div class="xs mut">${mine ? 'את/ה' : esc(nm(h.from))} · ${timeAgo(h.ts)}</div><div>${esc(h.t)}</div></div></div>${mine ? `<div class="mt" style="text-align:end">${hintStatus(h)}</div>` : ''}</div>`; }).join('')}</div>` : `<div class="empty">${ic('heart')}<p>עוד לא נשלחו רמזים. התחילו עם ❤️</p></div>`}
  </div>`;
};
SCREENS.hints_mount = () => { markHintsRead(); const i = $('#hcus'); if (i) i.onkeydown = e => { if (e.key === 'Enter') ACT.hintc(); }; };
ACT.hint = a => sendHint(a.dataset.k);
ACT.hintc = () => { const i = $('#hcus'); const v = i && i.value.trim(); if (!v) return toast('כתבו כמה מילים'); i.value = ''; sendHint(null, v); };
ACT.pushhelp = () => { const t = S.room.relay.topic + '-n';
  sheet(`<h3>התראות גם כשהאפליקציה סגורה</h3><p class="sm mut mt">משתמשים באפליקציה החינמית ntfy (בלי חשבון). מתקינים אותה פעם אחת ונרשמים לערוץ הסודי של החדר שלכם:</p>
  <ol class="sm" style="padding-inline-start:20px;line-height:1.8"><li>מתקינים את <b>ntfy</b> מחנות האפליקציות (Google Play או App Store).</li><li>לוחצים על + ומזינים את שם הערוץ:</li></ol>
  <div class="tile row"><code class="sp" style="direction:ltr;font-size:15px;word-break:break-all">${esc(t)}</code><button class="btn sm soft" data-act="copytopic">${ic('copy')}העתקה</button></div>
  <p class="xs mut mt">כל רמז שנשלח אליכם יקפוץ כהתראה. נוסח הרמז עובר בשרת של ntfy כדי להופיע בהתראה. לוז ושאר הנתונים עוברים מוצפנים. אפשר לכבות את ההתראות בהגדרות.</p>
  <button class="btn soft wide mt" data-close>סגירה</button>`); };
ACT.copytopic = () => copyText(S.room.relay.topic + '-n');

/* ── shared calendar ── */
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const WHO_C = w => (w === 'b' ? 'var(--gold)' : w === meSlot() ? 'var(--rose)' : '#7b8cff');
const whoLbl = w => (w === 'b' ? 'משותף' : w === meSlot() ? 'שלי' : 'של ' + nm(w));
const calList = () => Object.values(calAll()).filter(e => !e.del);
const dowOf = d => new Date(d + 'T12:00').getDay();
const isRep = e => Array.isArray(e.rep) && e.rep.length > 0;
function occOn(e, d) { if (e.del) return false; if (!isRep(e)) return e.date === d; return d >= e.date && (!e.until || d <= e.until) && e.rep.includes(dowOf(d)) && !(e.skip || []).includes(d); }
function occRange(from, days, filt = () => true) { const out = []; const L = calList().filter(filt); const d0 = new Date(from + 'T12:00'); for (let i = 0; i < days; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); const k = ymd(d); L.forEach(e => { if (occOn(e, k)) out.push({e, d: k}); }); } return out; }
const DAY_N = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
function repLbl(e) { if (!isRep(e)) return ''; const r = [...e.rep].sort(); const s = r.join(''); const t = s === '0123456' ? 'כל יום' : s === '01234' ? 'א׳–ה׳' : s === '012345' ? 'א׳–ו׳' : r.map(i => HEB_D[i]).join(' '); return `🔁 ${t}${e.until ? ' עד ' + new Date(e.until + 'T12:00').toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'}) : ''}`; }
const evSort = (a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99'));
function upcoming(n = 3) { return occRange(ymd(new Date()), 45).sort((a, b) => evSort({...a.e, date: a.d}, {...b.e, date: b.d})).slice(0, n).map(o => ({...o.e, date: o.d})); }
const CALV = {mo: 0, sel: null, f: 'all'};
const HEB_D = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
function evRow(o) {
  const e = o.e || o, od = o.d || e.date; const d = new Date(od + 'T12:00');
  return `<button class="tile tap row" style="width:100%;text-align:start;border-inline-start:4px solid ${WHO_C(e.who)}" data-act="calopen" data-id="${esc(e.id)}" data-d="${od}"><div style="min-width:54px;text-align:center"><div class="xs mut">${d.toLocaleDateString('he-IL', {weekday: 'short'})}</div><div class="disp" style="font-size:20px">${d.getDate()}</div><div class="xs mut">${d.toLocaleDateString('he-IL', {month: 'short'})}</div></div><div class="sp"><b>${esc(e.title)}</b><div class="xs mut">${e.time ? esc(e.time) + (e.end ? '–' + esc(e.end) : '') + ' · ' : 'כל היום · '}<span style="color:${WHO_C(e.who)}">${esc(whoLbl(e.who))}</span>${isRep(e) ? ' · ' + repLbl(e) : ''}</div>${e.note ? `<div class="xs mut" style="margin-top:2px">${esc(e.note.slice(0, 80))}</div>` : ''}</div></button>`;
}
SCREENS.cal = () => {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + CALV.mo);
  const y = base.getFullYear(), m = base.getMonth(); const first = new Date(y, m, 1).getDay(); const days = new Date(y, m + 1, 0).getDate(); const today = ymd(new Date());
  const filt = e => CALV.f === 'all' || (CALV.f === 'me' ? e.who === meSlot() : CALV.f === 'p' ? e.who === 1 - meSlot() : e.who === 'b');
  const byDay = {}; occRange(`${y}-${String(m + 1).padStart(2, '0')}-01`, days, filt).forEach(o => { (byDay[o.d] = byDay[o.d] || []).push(o); });
  const cells = []; for (let i = 0; i < first; i++) cells.push('<div></div>');
  for (let d = 1; d <= days; d++) { const k = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; const ev = byDay[k] || [];
    cells.push(`<button data-act="calday" data-d="${k}" style="aspect-ratio:1;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;${k === CALV.sel ? 'background:var(--rose);color:#fff' : k === today ? 'background:var(--sur2);outline:1.5px solid var(--rose)' : ''}" aria-label="${d}${ev.length ? ', ' + ev.length + ' אירועים' : ''}"><span style="font-weight:${k === today ? 700 : 400}">${d}</span><span style="display:flex;gap:2px;height:6px">${ev.slice(0, 3).map(o => `<i style="width:6px;height:6px;border-radius:50%;background:${k === CALV.sel ? '#fff' : WHO_C(o.e.who)}"></i>`).join('')}</span></button>`); }
  const oSort = (a, b) => evSort({...a.e, date: a.d}, {...b.e, date: b.d});
  const list = CALV.sel ? (byDay[CALV.sel] || occRange(CALV.sel, 1, filt)).sort(oSort) : occRange(today, 60, filt).sort(oSort).slice(0, 30);
  return `<div class="scr">${topbar('הלוז שלנו', `<button class="ib" data-act="caladd" aria-label="אירוע חדש">${ic('plus')}</button>`)}
  <div class="chips mb">${[['all', 'הכל'], ['me', 'שלי'], ['p', 'של ' + esc(nm(1 - meSlot()))], ['b', 'משותף']].map(([k, l]) => `<button class="chip ${CALV.f === k ? 'on' : ''}" data-act="calf" data-f="${k}">${k !== 'all' ? `<i style="width:10px;height:10px;border-radius:50%;background:${WHO_C(k === 'me' ? meSlot() : k === 'p' ? 1 - meSlot() : 'b')}"></i>` : ''}${l}</button>`).join('')}</div>
  <div class="tile"><div class="row" style="margin-bottom:8px"><button class="ib" data-act="calmo" data-d="-1" aria-label="חודש קודם">${ic('fwd')}</button><b class="sp" style="text-align:center">${base.toLocaleDateString('he-IL', {month: 'long', year: 'numeric'})}</b><button class="ib" data-act="calmo" data-d="1" aria-label="חודש הבא">${ic('back')}</button></div>
   <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center" class="xs mut">${HEB_D.map(d => `<div>${d}</div>`).join('')}</div>
   <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:4px">${cells.join('')}</div></div>
  <div class="sec"><h3>${CALV.sel ? new Date(CALV.sel + 'T12:00').toLocaleDateString('he-IL', {weekday: 'long', day: 'numeric', month: 'long'}) : 'מה מחכה לכם'}</h3>${CALV.sel ? `<button data-act="calday" data-d="">הכל</button>` : ''}</div>
  ${list.length ? `<div class="col" style="gap:8px">${list.map(evRow).join('')}</div>` : `<div class="empty">${ic('cal')}<p>${CALV.sel ? 'אין כלום ביום הזה.' : 'הלוז ריק. הוסיפו מה קורה אצלכם השבוע.'}</p></div>`}
  <button class="btn wide mt" data-act="caladd">${ic('plus')}${CALV.sel ? 'הוספה ליום הזה' : 'אירוע חדש'}</button>
  <p class="xs mut mt" style="text-align:center">${relayOn() ? 'כל שינוי נשלח מוצפן ל' + esc(nm(1 - meSlot())) + ', גם אם האפליקציה שלו/ה סגורה.' : 'הלוז מסתנכרן כששניכם מחוברים.'}</p></div>`;
};
ACT.calmo = a => { CALV.mo += +a.dataset.d; CALV.sel = null; render(); };
ACT.calday = a => { CALV.sel = a.dataset.d || null; render(); };
ACT.calf = a => { CALV.f = a.dataset.f; render(); };
ACT.caladd = () => calSheet(null);
ACT.calopen = a => calSheet(a.dataset.id, a.dataset.d);
function calSheet(id, occ) {
  const e = id ? calAll()[id] : {title: '', date: CALV.sel || ymd(new Date()), time: '', end: '', who: meSlot(), note: '', rep: [], until: ''};
  let who = e.who; let reps = new Set(e.rep || []);
  const draw = b => {
    b.innerHTML = `<div class="grab"></div><h3>${id ? 'עריכת אירוע' : 'אירוע חדש'}</h3>
    <label class="f" for="ct">מה?</label><input id="ct" class="inp" maxlength="80" value="${esc(e.title)}" placeholder="למשל: ארוחת ערב אצל ההורים">
    <label class="f">של מי?</label><div class="seg" id="cw">${[[meSlot(), 'שלי'], [1 - meSlot(), 'של ' + esc(nm(1 - meSlot()))], ['b', 'משותף']].map(([v, l]) => `<button class="${who === v ? 'on' : ''}" data-w="${v}">${l}</button>`).join('')}</div>
    <div class="grid2"><div><label class="f" for="cd">תאריך</label><input id="cd" class="inp" type="date" value="${esc(e.date)}"></div><div><label class="f" for="cs">שעה (לא חובה)</label><input id="cs" class="inp" type="time" value="${esc(e.time)}"></div></div>
    <label class="f" for="ce">עד שעה (לא חובה)</label><input id="ce" class="inp" type="time" value="${esc(e.end || '')}">
    <label class="f">חוזר כל שבוע</label>
    <div id="cr" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">${HEB_D.map((d, i) => `<button class="chip ${reps.has(i) ? 'on' : ''}" data-r="${i}" style="justify-content:center;padding:0" aria-label="${DAY_N[i]}" aria-pressed="${reps.has(i)}">${d}</button>`).join('')}</div>
    <div class="row wrap mt" id="crp" style="gap:6px">${[['01234', 'א׳–ה׳'], ['012345', 'א׳–ו׳'], ['0123456', 'כל יום'], ['', 'בלי חזרה']].map(([v, l]) => `<button class="chip" data-rp="${v}">${l}</button>`).join('')}</div>
    <div id="cuw" style="${reps.size ? '' : 'display:none'}"><label class="f" for="cu">עד תאריך (לא חובה)</label><input id="cu" class="inp" type="date" value="${esc(e.until || '')}"><p class="xs mut" style="margin-top:4px">בלי תאריך, זה חוזר כל שבוע עד שמוחקים.</p></div>
    <label class="f" for="cn">הערה</label><textarea id="cn" class="inp" maxlength="300" rows="2" placeholder="כתובת, מה להביא...">${esc(e.note || '')}</textarea>
    ${id ? `<p class="xs mut mt">${e.by === e.ed ? 'נוסף' : 'עודכן'} ע״י ${esc(nm(e.ed))} · ${timeAgo(e.ts)}</p>` : ''}
    <button class="btn wide mt" id="csv">${ic('check')}שמירה</button>${id ? `<button class="btn ghost wide mt" id="cdel" style="color:#ff7b8f">${ic('trash')}מחיקה</button>` : ''}<button class="btn soft wide mt" data-close>ביטול</button>`;
    $('#cw', b).onclick = ev => { const t = ev.target.closest('[data-w]'); if (!t) return; who = t.dataset.w === 'b' ? 'b' : +t.dataset.w; $$('#cw button', b).forEach(x => x.classList.toggle('on', x === t)); };
    const syncR = () => { $$('#cr [data-r]', b).forEach(x => { const on = reps.has(+x.dataset.r); x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); $('#cuw', b).style.display = reps.size ? '' : 'none'; };
    $('#cr', b).onclick = ev => { const t = ev.target.closest('[data-r]'); if (!t) return; const i = +t.dataset.r; reps.has(i) ? reps.delete(i) : reps.add(i); syncR(); };
    $('#crp', b).onclick = ev => { const t = ev.target.closest('[data-rp]'); if (!t) return; reps = new Set(t.dataset.rp.split('').filter(Boolean).map(Number)); syncR(); };
    $('#csv', b).onclick = () => {
      const title = $('#ct', b).value.trim(), date = $('#cd', b).value; if (!title) return toast('כתבו מה האירוע'); if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast('בחרו תאריך');
      const me = meSlot(); const ev2 = {id: id || uid(), title, date, time: $('#cs', b).value || '', end: $('#ce', b).value || '', who, note: $('#cn', b).value.trim(), ts: Date.now(), ed: me, by: id ? e.by : me, del: false, rep: [...reps].sort(), until: reps.size ? ($('#cu', b).value || '') : '', skip: id ? (e.skip || []) : []};
      if (ev2.until && ev2.until < ev2.date) return toast('תאריך הסיום לפני תאריך ההתחלה');
      calAll()[ev2.id] = ev2; save(); ansSync(); relayPost('cal', ev2, `📅 ${nm(me)} ${gw(me, id ? 'עדכן' : 'הוסיף', id ? 'עדכנה' : 'הוסיפה')} ללוז: ${title}`); closeSheet(); sfx('ok'); CALV.sel = date; const dd = new Date(date + 'T12:00'), n0 = new Date(); CALV.mo = (dd.getFullYear() - n0.getFullYear()) * 12 + dd.getMonth() - n0.getMonth(); render(); toast(id ? 'האירוע עודכן' : 'נוסף ללוז המשותף');
    };
    if (id && isRep(e) && occ) $('#cdel', b).onclick = () => { closeSheet(); sheet(`<h3>למחוק אירוע חוזר</h3><p class="mut sm">${esc(e.title)} · ${repLbl(e)}</p><div class="col mt"><button class="btn soft wide" id="d1">רק ביום הזה (${new Date(occ + 'T12:00').toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})})</button><button class="btn wide" id="da" style="background:#c2185b">את כל החזרות</button><button class="btn ghost wide" data-close>ביטול</button></div>`, sb => {
      const me = meSlot(); const done = ev2 => { calAll()[id] = ev2; save(); ansSync(); relayPost('cal', ev2); closeSheet(); render(); toast('נמחק'); };
      $('#d1', sb).onclick = () => done({...e, skip: [...(e.skip || []), occ].slice(-120), ts: Date.now(), ed: me});
      $('#da', sb).onclick = () => done({...e, del: true, ts: Date.now(), ed: me}); }); };
    else if (id) $('#cdel', b).onclick = () => { closeSheet(); confirmSheet('למחוק את האירוע?', 'הוא יימחק גם אצל ' + esc(nm(1 - meSlot())) + '.', 'מחיקה', () => { const me = meSlot(); const ev2 = {...e, del: true, ts: Date.now(), ed: me}; calAll()[id] = ev2; save(); ansSync(); relayPost('cal', ev2); render(); }); };
  };
  const b = sheet('', draw); draw(b);
}

/* ── home widgets ── */
function loveHome() {
  const me = meSlot(), p = 1 - me; const un = unreadHints(); const last = hintsAll().filter(h => h.from === p).slice(-1)[0]; const up = upcoming(2);
  return `<div class="grid2 mb">
   <div class="tile" style="text-align:start"><div class="row xs mut"><span class="sp">${ic('heart')}רמזים</span>${un ? `<span class="pill" style="background:var(--rose);color:#fff">${un} חדשים</span>` : ''}</div>
    <div class="row mt" style="gap:6px">${HINTS.slice(0, 3).map(([k, e, t]) => `<button class="ib" style="font-size:22px;width:44px;height:44px" data-act="hint" data-k="${k}" aria-label="${esc(fmt(t, me))}">${e}</button>`).join('')}</div>
    <button class="xs mut" style="margin-top:8px;text-align:start;width:100%" data-go="hints">${last ? `${esc(last.e)} ${esc(last.t.slice(0, 26))}` : 'כל הרמזים'} ‹</button></div>
   <button class="tile tap" style="text-align:start" data-go="cal"><div class="row xs mut">${ic('cal')}הלוז שלנו</div>${up.length ? up.map(e => `<div class="sm" style="margin-top:6px;border-inline-start:3px solid ${WHO_C(e.who)};padding-inline-start:6px"><b>${esc(e.title.slice(0, 20))}</b><div class="xs mut">${new Date(e.date + 'T12:00').toLocaleDateString('he-IL', {weekday: 'short', day: 'numeric', month: 'numeric'})}${e.time ? ' · ' + esc(e.time) : ''}</div></div>`).join('') : `<div class="sm mut mt">אין אירועים קרובים. הוסיפו!</div>`}</button>
  </div>`;
}
setInterval(() => { if (!document.hidden) relayPoll(); }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) relayPoll(); });
setTimeout(relayPoll, 1500);
