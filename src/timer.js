/* Between Us — timer & stopwatch, reachable from every screen through a floating clock button.
   State lives in S.timer so it keeps running across screens and app restarts. */
const TM = () => (S.timer = S.timer || {mode: 'timer', end: 0, dur: 300, paused: 0, swStart: 0, swAcc: 0, swRun: false, laps: []});
const fmtT = ms => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const fmtSW = ms => { const t = Math.max(0, ms); const h = Math.floor(t / 3600000), m = Math.floor(t % 3600000 / 60000), s = Math.floor(t % 60000 / 1000), c = Math.floor(t % 1000 / 10); return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(s).padStart(2, '0') + '.' + String(c).padStart(2, '0'); };
const tLeft = () => { const t = TM(); return t.paused ? t.paused : t.end ? t.end - Date.now() : 0; };
const swNow = () => { const t = TM(); return t.swAcc + (t.swRun ? Date.now() - t.swStart : 0); };
function beep() {
  try { const ac = new (window.AudioContext || window.webkitAudioContext)(); [0, .35, .7, 1.4, 1.75, 2.1].forEach(at => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.type = 'sine'; g.gain.setValueAtTime(.0001, ac.currentTime + at); g.gain.exponentialRampToValueAtTime(.35, ac.currentTime + at + .02); g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + at + .28); o.connect(g).connect(ac.destination); o.start(ac.currentTime + at); o.stop(ac.currentTime + at + .3); }); setTimeout(() => ac.close(), 3000); } catch (e) {}
  try { navigator.vibrate && navigator.vibrate([400, 150, 400, 150, 600]); } catch (e) {}
}
function timerDone() {
  const t = TM(); t.end = 0; t.paused = 0; save(); beep();
  toast(`<b>⏰ הזמן נגמר!</b><br><span class="mut sm">הטיימר של ${fmtT(t.dur * 1000)} הסתיים</span>`, 'ach', 'clock');
  if (document.hidden) document.title = '⏰ הזמן נגמר | Between Us';
  fabDraw(); if (TSHEET) TSHEET();
}
/* floating button */
let TSHEET = null;
function fabDraw() {
  let b = document.getElementById('fabT');
  if (!b) { b = document.createElement('button'); b.id = 'fabT'; b.className = 'fabt'; b.setAttribute('aria-label', 'טיימר'); b.onclick = () => timerSheet(); document.body.appendChild(b); }
  const t = TM(); const run = t.end > 0 || t.paused > 0; const sw = t.swRun;
  const hide = !S.onboard || ['splash', 'onboard', 'gate', 'lock'].includes(cur().name);
  b.style.display = hide ? 'none' : '';
  b.classList.toggle('on', run || sw);
  b.classList.toggle('lift', !document.querySelector('#app .nav'));
  b.innerHTML = `${ic('clock')}${run ? `<span>${fmtT(tLeft())}</span>` : sw ? `<span>${fmtSW(swNow()).slice(0, -3)}</span>` : ''}`;
}
setInterval(() => { const t = TM(); if (t.end && !t.paused && Date.now() >= t.end) timerDone(); if (t.end || t.swRun) { fabDraw(); if (TSHEET) TSHEET(true); } }, 250);
const _render0 = render;
render = function () { _render0.apply(this, arguments); try { fabDraw(); } catch (e) {} };
document.addEventListener('visibilitychange', () => { if (!document.hidden) { const t = TM(); if (t.end && !t.paused && Date.now() >= t.end) timerDone(); } });

function timerSheet() {
  const t = TM(); let mode = t.mode || 'timer';
  const PRE = [[1, 'דקה'], [3, '3 דק׳'], [5, '5 דק׳'], [10, '10 דק׳'], [15, 'רבע שעה'], [30, 'חצי שעה'], [45, '45 דק׳'], [60, 'שעה']];
  const draw = (b, tick) => {
    if (tick) { const big = $('#tbig', b); if (big) big.textContent = mode === 'timer' ? fmtT(t.end || t.paused ? tLeft() : t.dur * 1000) : fmtSW(swNow()); const ring = $('#tring', b); if (ring && mode === 'timer') ring.style.strokeDashoffset = String(565 * (1 - (t.end || t.paused ? tLeft() / (t.dur * 1000) : 1))); return; }
    const run = t.end > 0, paused = t.paused > 0;
    b.innerHTML = `<div class="grab"></div><div class="row"><h3 class="sp">${ic('clock')} ${mode === 'timer' ? 'טיימר' : 'סטופר'}</h3><button class="ib" data-close aria-label="סגירה">${ic('x')}</button></div>
    <div class="seg mt">${[['timer', 'טיימר'], ['sw', 'סטופר']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-tm="${k}">${l}</button>`).join('')}</div>
    ${mode === 'timer' ? `
    <div style="position:relative;width:220px;height:220px;margin:18px auto 8px"><svg viewBox="0 0 200 200" style="width:100%;height:100%;transform:rotate(-90deg)"><circle cx="100" cy="100" r="90" fill="none" stroke="var(--sur2)" stroke-width="10"/><circle id="tring" cx="100" cy="100" r="90" fill="none" stroke="var(--rose)" stroke-width="10" stroke-linecap="round" stroke-dasharray="565" style="stroke-dashoffset:${565 * (1 - (run || paused ? tLeft() / (t.dur * 1000) : 1))};transition:stroke-dashoffset .25s linear"/></svg>
     <div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div id="tbig" class="disp" style="font-size:46px;direction:ltr">${fmtT(run || paused ? tLeft() : t.dur * 1000)}</div><div class="xs mut">${run ? 'רץ' : paused ? 'מושהה' : 'מוכן'}</div></div></div></div>
    ${run || paused ? `<div class="grid2"><button class="btn soft" data-ta="reset">${ic('x')}איפוס</button><button class="btn" data-ta="${paused ? 'resume' : 'pause'}">${paused ? ic('play') + 'המשך' : ic('pause') + 'השהיה'}</button></div><button class="btn ghost wide mt" data-ta="plus1">+ דקה</button>`
    : `<div class="row wrap" style="gap:6px;justify-content:center">${PRE.map(([m, l]) => `<button class="chip ${t.dur === m * 60 ? 'on' : ''}" data-pre="${m}">${l}</button>`).join('')}</div>
      <div class="row mt" style="gap:8px;justify-content:center;direction:ltr"><input id="th" class="inp" type="number" min="0" max="23" inputmode="numeric" value="${Math.floor(t.dur / 3600)}" style="width:72px;text-align:center" aria-label="שעות"><b>:</b><input id="tmn" class="inp" type="number" min="0" max="59" inputmode="numeric" value="${Math.floor(t.dur % 3600 / 60)}" style="width:72px;text-align:center" aria-label="דקות"><b>:</b><input id="ts" class="inp" type="number" min="0" max="59" inputmode="numeric" value="${t.dur % 60}" style="width:72px;text-align:center" aria-label="שניות"></div>
      <p class="xs mut" style="text-align:center;margin-top:4px">שעות : דקות : שניות</p>
      <button class="btn wide mt" data-ta="start">${ic('play')}התחלה</button>`}
    <p class="xs mut mt" style="text-align:center">הטיימר ממשיך לרוץ גם כשעוברים מסך. כשהזמן נגמר יש צפצוף ורטט.</p>`
    : `
    <div id="tbig" class="disp" style="font-size:52px;text-align:center;margin:26px 0 18px;direction:ltr">${fmtSW(swNow())}</div>
    <div class="grid2"><button class="btn soft" data-ta="${t.swRun ? 'lap' : 'swreset'}" ${!t.swRun && !swNow() ? 'disabled' : ''}>${t.swRun ? ic('flag') + 'הקפה' : ic('x') + 'איפוס'}</button><button class="btn" data-ta="${t.swRun ? 'swstop' : 'swgo'}">${t.swRun ? ic('pause') + 'עצירה' : ic('play') + (swNow() ? 'המשך' : 'התחלה')}</button></div>
    ${!t.swRun && swNow() >= 60000 && typeof workSave === 'function' ? `<button class="btn ghost wide mt" data-ta="towork">${ic('clock')}שמירה כיום עבודה (${hm(swNow() / 3600000)} שעות)</button>` : ''}
    ${t.laps.length ? `<div class="list mt">${t.laps.slice().reverse().map((l, i) => `<div class="li" style="padding:8px 12px"><span class="sp sm">הקפה ${t.laps.length - i}</span><span class="sm" style="direction:ltr">${fmtSW(l)}</span></div>`).join('')}</div>` : ''}`}`;
  };
  const b = sheet('', null); draw(b);
  TSHEET = tick => { const sb = $('.sheet'); if (!sb || sb !== b) { TSHEET = null; return; } draw(sb, tick); };
  b.addEventListener('click', ev => {
    const m = ev.target.closest('[data-tm]'); if (m) { mode = t.mode = m.dataset.tm; save(); draw(b); return; }
    const p = ev.target.closest('[data-pre]'); if (p) { t.dur = +p.dataset.pre * 60; save(); draw(b); return; }
    const a = ev.target.closest('[data-ta]'); if (!a) return; const k = a.dataset.ta;
    if (k === 'start') { const d = (+$('#th', b).value || 0) * 3600 + (+$('#tmn', b).value || 0) * 60 + (+$('#ts', b).value || 0); if (d < 1) return toast('בחרו כמה זמן'); t.dur = Math.min(d, 86399); t.end = Date.now() + t.dur * 1000; t.paused = 0; sfx('tap'); }
    if (k === 'pause') { t.paused = Math.max(0, t.end - Date.now()); t.end = 0; }
    if (k === 'resume') { t.end = Date.now() + t.paused; t.paused = 0; }
    if (k === 'reset') { t.end = 0; t.paused = 0; }
    if (k === 'plus1') { if (t.paused) t.paused += 60000; else t.end += 60000; t.dur += 60; }
    if (k === 'swgo') { t.swStart = Date.now(); t.swRun = true; }
    if (k === 'swstop') { t.swAcc = swNow(); t.swRun = false; }
    if (k === 'swreset') { t.swAcc = 0; t.swRun = false; t.laps = []; }
    if (k === 'lap') { t.laps.push(swNow()); t.laps = t.laps.slice(-30); }
    if (k === 'towork') { const ms = swNow(); const me = meSlot(); const endD = new Date(); const st = new Date(endD - ms); const f = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      workSave({id: uid(), who: me, kind: 'day', date: ymd(st), start: '', end: '', brk: 0, hours: String(Math.round(ms / 36000) / 100), travel: '', bonus: '', note: `סטופר ${f(st)}–${f(endD)}`, rate: ''}); t.swAcc = 0; t.laps = []; save(); closeSheet(); toast('נשמר במחשבון העבודה'); go('work'); return; }
    save(); fabDraw(); draw(b);
  });
}
ACT.timer = () => timerSheet();

const flushSave = () => { try { clearTimeout(saveT); localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.hidden) flushSave(); });
