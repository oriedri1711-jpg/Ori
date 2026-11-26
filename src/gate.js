/* Between Us — room gate: enter the app by creating or joining a room with a name + password.
   Rooms persist in the artifact database (rooms/<sha(name+password)>), so the same name + password works again later. */
const GATE = {tab: 'join', busy: false, err: '', name: '', pw: ''};
let DBH = null, UID = null;
async function sha(s) {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 40); }
  catch (e) { return (hashStr(s).toString(16) + hashStr('x' + s).toString(16) + hashStr(s + 'y').toString(16)).slice(0, 40); }
}
async function dbReady() {
  if (DBH !== null) return DBH;
  try { if (!window.claude || !window.claude.use) { DBH = false; return DBH; } const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]); DBH = db || false; UID = user ? await user.id() : null; } catch (e) { DBH = false; }
  return DBH;
}
const normName = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
async function roomIds(name, pw) { const n = normName(name); return {nid: await sha('bu-name|' + n), rid: await sha('bu-room|' + n + '|' + pw)}; }
const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const LOCAL_ROOMS = 'betweenUs.rooms';
function localRooms() { try { return JSON.parse(localStorage.getItem(LOCAL_ROOMS)) || {}; } catch (e) { return {}; } }
function saveLocalRoom(rid, data) { try { const r = localRooms(); r[rid] = data; localStorage.setItem(LOCAL_ROOMS, JSON.stringify(r)); } catch (e) {} }

async function gateSubmit() {
  const name = GATE.name.trim(), pw = GATE.pw;
  if (name.length < 2) return gateErr('שם החדר צריך לפחות 2 תווים');
  if (pw.length < 4) return gateErr('הסיסמה צריכה לפחות 4 תווים');
  GATE.busy = true; GATE.err = ''; render();
  try {
    const {nid, rid} = await roomIds(name, pw); const db = await dbReady(); GATE.relay = await relayIds(name, pw);
    if (GATE.tab === 'create') {
      if (db) {
        const taken = await withTimeout(db.doc('roomnames/' + nid).get());
        if (taken.exists) return gateErr('כבר יש חדר בשם הזה. בחרו שם אחר, או היכנסו אליו עם הסיסמה.');
        const code = genCode();
        await withTimeout(db.doc('rooms/' + rid).set({code, created: Date.now(), hostUid: UID || '', v: 1}));
        await withTimeout(db.doc('roomnames/' + nid).set({t: Date.now()}));
        enterRoom({code, host: true, rname: name, cloud: true});
      } else {
        if (Object.values(localRooms()).some(r => r.nid === nid)) return gateErr('כבר יש חדר בשם הזה במכשיר');
        const code = window.BU_STANDALONE ? codeFrom(rid) : genCode(); saveLocalRoom(rid, {nid, code, host: true}); enterRoom({code, host: true, rname: name, cloud: false});
      }
    } else {
      if (db) {
        const snap = await withTimeout(db.doc('rooms/' + rid).get());
        if (!snap.exists) { const n = await withTimeout(db.doc('roomnames/' + nid).get()); return gateErr(n.exists ? 'הסיסמה לא נכונה' : 'אין חדר בשם הזה. אפשר ליצור אותו בלשונית "חדר חדש".'); }
        const d = snap.data() || {}; const code = String(d.code || '').replace(/[^a-z0-9]/g, '').slice(0, 6); if (code.length !== 6) return gateErr('החדר פגום. נסו ליצור חדר חדש.');
        enterRoom({code, host: !!(UID && d.hostUid && d.hostUid === UID), rname: name, cloud: true});
      } else {
        let r = localRooms()[rid];
        if (!r && window.BU_STANDALONE) { r = {nid, code: codeFrom(rid), host: false}; saveLocalRoom(rid, r); }
        if (!r) return gateErr('לא נמצא חדר כזה במכשיר הזה');
        enterRoom({code: r.code, host: r.host, rname: name, cloud: false});
      }
    }
  } catch (e) { gateErr(e && e.message === 'timeout' ? 'אין תגובה מהשרת. בדקו חיבור ונסו שוב.' : 'משהו השתבש. נסו שוב.'); }
}
const codeFrom = rid => Array.from({length: 6}, (_, i) => 'abcdefghjkmnpqrstuvwxyz23456789'[parseInt(rid.substr(i * 4, 4), 16) % 31]).join('');
function gateErr(m) { GATE.busy = false; GATE.err = m; render(); }
function enterRoom(r) {
  GATE.busy = false; GATE.err = ''; GATE.pw = '';
  S.room = {code: r.code, host: r.host, rname: r.rname, cloud: r.cloud, relay: GATE.relay || null}; GATE.relay = null; S.roomAuth = true; save(); setTimeout(() => typeof relayPoll === 'function' && relayPoll(), 300);
  stack = [{name: 'home'}]; render(); confetti(); sfx('ach');
  toast(`<b>נכנסתם לחדר "${esc(r.rname)}"</b><br><span class="mut sm">${r.host ? 'יצרתם את החדר' : 'הצטרפתם לחדר'}. אותו שם וסיסמה יכניסו אתכם שוב.</span>`);
  if (R.room) joinRoom(r.code, r.host);
}
function exitRoom() {
  leaveRoom(true); S.roomAuth = false; const keep = S.room; S.room = null; save();
  try { R.room && R.room.presence({dans: null, app: null, code: null}); } catch (e) {}
  GATE.name = keep && keep.rname || ''; GATE.tab = 'join'; stack = [{name: 'gate'}]; render();
  toast('יצאתם מהחדר. הוא נשמר, ואפשר לחזור אליו עם אותו שם וסיסמה.');
}

SCREENS.gate = () => {
  const t = GATE.tab;
  return `<div class="scr" style="padding-top:calc(24px + var(--safe-t))">
  <div style="text-align:center"><svg width="96" height="96" style="color:var(--rose)"><use href="#rings"/></svg><h1 class="mt">החדר שלכם</h1>
  <p class="mut mt">כדי להיכנס לאפליקציה יוצרים חדר זוגי עם שם וסיסמה, או נכנסים לחדר קיים. החדר נשמר גם אחרי שיוצאים ממנו.</p></div>
  <div class="seg mt2">${[['join','כניסה לחדר'],['create','חדר חדש']].map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="gtab" data-t="${k}">${l}</button>`).join('')}</div>
  <form id="gform" class="tile mt" autocomplete="off">
   <label class="f" for="gname" style="margin-top:0">שם החדר</label><input id="gname" class="inp" maxlength="30" value="${esc(GATE.name)}" placeholder="למשל: נועה ודני" data-in="gname" autocapitalize="off">
   <label class="f" for="gpw">סיסמה</label><input id="gpw" class="inp" type="password" maxlength="40" value="" placeholder="לפחות 4 תווים" data-in="gpw">
   ${GATE.err ? `<div class="note mt" role="alert">${esc(GATE.err)}</div>` : ''}
   <button class="btn wide mt" type="submit" ${GATE.busy ? 'disabled' : ''}>${GATE.busy ? 'רגע...' : t === 'create' ? ic('plus') + 'יצירת החדר' : ic('link') + 'כניסה'}</button>
  </form>
  <div class="note info mt sm">${ic('info')} ${t === 'create' ? 'שלחו לבן/בת הזוג את שם החדר והסיסמה. מי שיוצר את החדר בוחר את המשחקים במשחק משותף.' : 'קיבלתם שם וסיסמה מבן/בת הזוג? הזינו אותם כאן.'}</div>
  <p class="xs dim mt" style="text-align:center">${window.BU_STANDALONE ? 'שניכם מזינים את אותו שם וסיסמה, כל אחד בטלפון שלו. הטלפונים מתחברים ישירות כששניכם באפליקציה באותו זמן. הכל נשמר רק על הטלפונים שלכם.' : 'כדי ששני הטלפונים יתחברו בזמן אמת, בן/בת הזוג צריכים הזמנה לאפליקציה דרך כפתור השיתוף של Claude (לפי אימייל) והתחברות לחשבון Claude.'}</p></div>`;
};
SCREENS.gate_mount = () => { const f = $('#gform'); if (f) f.onsubmit = e => { e.preventDefault(); GATE.pw = $('#gpw').value; gateSubmit(); }; };
ACT.gtab = a => { GATE.tab = a.dataset.t; GATE.err = ''; render(); };
ACT.gname = a => { GATE.name = a.value; };
ACT.gpw = a => { GATE.pw = a.value; };
ACT.exitroom = () => confirmSheet('לצאת מהחדר?', 'החדר נשמר. כדי לחזור תצטרכו את אותו שם וסיסמה.', 'יציאה', exitRoom);

/* who is in the room right now */
function roomPeople() {
  const out = []; const seen = new Set();
  const add = (p, where) => { if (!p.presence || p.presence.app !== 'bu' || p.presence.code !== R.code) return; if (seen.has(p.peer)) return; seen.add(p.peer); out.push({me: p.isMe, name: String(p.presence.name || 'שחקן').slice(0, 18), role: p.presence.role === 'host' ? 'host' : 'guest', idle: Date.now() - p.updatedAt > 5 * 60000}); };
  try { if (R.named) R.named.peers().forEach(add); } catch (e) {}
  return out.sort((a, b) => (b.me - a.me));
}
