/* Between Us — work & pay calculator. Each partner logs work days (hours, break, travel, bonus);
   monthly gross summary with overtime (Israeli default: after 8.6h → 2h at 125%, then 150%). Synced like the calendar. */
const workAll = () => (S.work = S.work || {cfg: {}, days: {}});
const WDEF = {rate: 0, travel: 0, ot: true, otAfter: 8.6, ot1: 125, ot2: 150, brk: 0};
const wcfg = who => ({...WDEF, ...(workAll().cfg[who] || {})});
const WV = {who: null, mo: 0};
const money = n => '₪' + (Math.round((+n || 0) * 100) / 100).toLocaleString('he-IL', {maximumFractionDigits: 2});
const hm = h => { const t = Math.round((+h || 0) * 60); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : null; };
function dayHours(d) {
  if (d.kind === 'bonus') return 0;
  if (d.start && d.end) { let a = toMin(d.start), b = toMin(d.end); if (a === null || b === null) return +d.hours || 0; if (b <= a) b += 1440; return Math.max(0, (b - a - (+d.brk || 0)) / 60); }
  return Math.max(0, +d.hours || 0);
}
function dayPay(d, c) {
  if (d.kind === 'bonus') return {reg: 0, o1: 0, o2: 0, base: 0, travel: 0, bonus: +d.bonus || 0};
  const h = dayHours(d); let reg = h, o1 = 0, o2 = 0;
  if (c.ot && h > c.otAfter) { reg = c.otAfter; const x = h - c.otAfter; o1 = Math.min(2, x); o2 = Math.max(0, x - 2); }
  const rate = d.rate !== undefined && d.rate !== '' && +d.rate > 0 ? +d.rate : c.rate;
  const base = reg * rate + o1 * rate * c.ot1 / 100 + o2 * rate * c.ot2 / 100;
  const travel = d.travel !== undefined && d.travel !== '' ? +d.travel || 0 : (h > 0 ? c.travel : 0);
  return {reg, o1, o2, base, travel, bonus: +d.bonus || 0, h};
}
const monthKey = mo => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + mo); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
function workMonth(who, mk) {
  const c = wcfg(who); const L = Object.values(workAll().days).filter(d => !d.del && d.who === who && d.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date) || (a.start || '').localeCompare(b.start || ''));
  const t = {days: new Set(), h: 0, reg: 0, o1: 0, o2: 0, base: 0, travel: 0, bonus: 0};
  L.forEach(d => { const p = dayPay(d, c); if (d.kind !== 'bonus' && p.h > 0) t.days.add(d.date); t.h += p.h || 0; t.reg += p.reg; t.o1 += p.o1; t.o2 += p.o2; t.base += p.base; t.travel += p.travel; t.bonus += p.bonus; });
  t.total = t.base + t.travel + t.bonus; t.n = t.days.size; return {L, t, c};
}
SCREENS.work = () => {
  const me = meSlot(); if (WV.who === null) WV.who = me; const who = WV.who; const mk = monthKey(WV.mo);
  const {L, t, c} = workMonth(who, mk); const mine = who === me;
  const mName = new Date(mk + '-15').toLocaleDateString('he-IL', {month: 'long', year: 'numeric'});
  const row = d => { const p = dayPay(d, c); const dd = new Date(d.date + 'T12:00');
    return `<button class="tile tap row" style="width:100%;text-align:start" data-act="wopen" data-id="${esc(d.id)}"><div style="min-width:48px;text-align:center"><div class="xs mut">${dd.toLocaleDateString('he-IL', {weekday: 'short'})}</div><div class="disp" style="font-size:20px">${dd.getDate()}</div></div>
      <div class="sp">${d.kind === 'bonus' ? `<b>🎁 ${esc(d.note || 'בונוס')}</b>` : `<b>${d.start && d.end ? esc(d.start) + '–' + esc(d.end) : hm(p.h) + ' שעות'}</b>${d.brk ? `<span class="xs mut"> · הפסקה ${d.brk} דק׳</span>` : ''}<div class="xs mut">${hm(p.h)} שע׳${p.o1 + p.o2 > 0 ? ` · ${hm(p.o1 + p.o2)} נוספות` : ''}${p.travel ? ` · נסיעות ${money(p.travel)}` : ''}${p.bonus ? ` · בונוס ${money(p.bonus)}` : ''}${d.note ? ' · ' + esc(d.note.slice(0, 30)) : ''}</div>`}</div>
      <b>${money(p.base + p.travel + p.bonus)}</b></button>`; };
  return `<div class="scr">${topbar('מחשבון עבודה', `<button class="ib" data-act="wcfg" aria-label="הגדרות שכר">${ic('gear')}</button>`)}
  <div class="seg mb">${[[me, 'שלי'], [1 - me, 'של ' + esc(nm(1 - me))]].map(([v, l]) => `<button class="${who === v ? 'on' : ''}" data-act="wwho" data-v="${v}">${l}</button>`).join('')}</div>
  <div class="row mb"><button class="ib" data-act="wmo" data-d="-1" aria-label="חודש קודם">${ic('fwd')}</button><b class="sp" style="text-align:center">${mName}</b><button class="ib" data-act="wmo" data-d="1" aria-label="חודש הבא">${ic('back')}</button></div>
  ${!c.rate ? `<button class="note mt mb" style="width:100%;text-align:start" data-act="wcfg">${ic('info')} עוד לא הוגדר שכר לשעה${mine ? '' : ' ל' + esc(nm(who))}. לחצו כאן כדי להגדיר.</button>` : ''}
  <div class="tile" style="background:linear-gradient(150deg,rgba(255,92,138,.25),rgba(110,60,220,.2))">
   <div class="xs mut">סה״כ ברוטו ל${esc(mName)}</div><div class="disp" style="font-size:38px;margin:4px 0">${money(t.total)}</div>
   <div class="stats" style="grid-template-columns:repeat(3,1fr)">${[[t.n, 'ימי עבודה'], [hm(t.h), 'שעות'], [hm(t.o1 + t.o2), 'שעות נוספות']].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
   <div class="list mt">${[['שכר שעות רגילות', `${hm(t.reg)} × ${money(c.rate)}`, t.reg * c.rate], ...(t.o1 ? [[`נוספות ${c.ot1}%`, hm(t.o1), t.o1 * c.rate * c.ot1 / 100]] : []), ...(t.o2 ? [[`נוספות ${c.ot2}%`, hm(t.o2), t.o2 * c.rate * c.ot2 / 100]] : []), ['נסיעות', c.travel ? `${money(c.travel)} ליום` : '', t.travel], ['בונוסים', '', t.bonus]].map(([a, b, v]) => `<div class="li" style="padding:8px 12px"><span class="sp sm">${a}${b ? ` <span class="xs mut">${b}</span>` : ''}</span><b class="sm">${money(v)}</b></div>`).join('')}</div>
   <p class="xs mut mt">חישוב משוער של ברוטו, לפני מס וניכויים.${L.some(d => d.rate) ? ' חלק מהימים עם שכר שעתי שונה.' : ''}</p></div>
  <div class="grid2 mt"><button class="btn" data-act="wadd">${ic('plus')}יום עבודה</button><button class="btn soft" data-act="wbonus">🎁 בונוס</button></div>
  ${typeof calList === 'function' ? `<button class="btn ghost wide mt" data-act="wfill">${ic('cal')}מילוי מהלוז (אירועי "עבודה")</button>` : ''}
  <div class="sec"><h3>הימים של ${mine ? 'החודש' : esc(nm(who))}</h3><span class="sm mut">${L.length}</span></div>
  ${L.length ? `<div class="col" style="gap:8px">${L.slice().reverse().map(row).join('')}</div>` : `<div class="empty">${ic('clock')}<p>עוד אין ימי עבודה בחודש הזה.</p></div>`}
  </div>`;
};
ACT.wwho = a => { WV.who = +a.dataset.v; render(); };
ACT.wmo = a => { WV.mo += +a.dataset.d; render(); };
function workSave(d) { d.ts = Date.now(); d.ed = meSlot(); workAll().days[d.id] = d; save(); ansSync(); if (typeof relayPost === 'function') relayPost('work', d); }
function lastDay(who) { return Object.values(workAll().days).filter(d => !d.del && d.who === who && d.kind !== 'bonus').sort((a, b) => b.ts - a.ts)[0]; }
ACT.wadd = () => workSheet(null, 'day');
ACT.wbonus = () => workSheet(null, 'bonus');
ACT.wopen = a => workSheet(a.dataset.id);
function workSheet(id, kind) {
  const who = WV.who ?? meSlot(); const prev = lastDay(who) || {};
  const d = id ? {...workAll().days[id]} : {id: uid(), who, kind, date: ymd(new Date()), start: prev.start || '09:00', end: prev.end || '17:00', brk: prev.brk ?? wcfg(who).brk, hours: '', travel: '', bonus: '', note: '', rate: ''};
  const isB = d.kind === 'bonus'; let mode = d.start || !id ? 'times' : 'hours';
  const draw = b => {
    b.innerHTML = `<div class="grab"></div><h3>${isB ? 'בונוס' : id ? 'עריכת יום עבודה' : 'יום עבודה'} · ${esc(nm(who))}</h3>
    <label class="f" for="wd">תאריך</label><input id="wd" class="inp" type="date" value="${esc(d.date)}">
    ${isB ? `<label class="f" for="wb">סכום הבונוס (₪)</label><input id="wb" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.bonus)}">
      <label class="f" for="wn">על מה?</label><input id="wn" class="inp" maxlength="60" value="${esc(d.note)}" placeholder="למשל: בונוס מכירות, מתנה לחג">` : `
    <div class="seg mt" id="wm">${[['times', 'משעה עד שעה'], ['hours', 'מספר שעות']].map(([v, l]) => `<button class="${mode === v ? 'on' : ''}" data-m="${v}">${l}</button>`).join('')}</div>
    <div id="wtimes" style="${mode === 'times' ? '' : 'display:none'}"><div class="grid2"><div><label class="f" for="ws">התחלה</label><input id="ws" class="inp" type="time" value="${esc(d.start || '')}"></div><div><label class="f" for="we">סיום</label><input id="we" class="inp" type="time" value="${esc(d.end || '')}"></div></div>
      <label class="f" for="wk">הפסקה (דקות)</label><input id="wk" class="inp" type="number" inputmode="numeric" min="0" step="5" value="${esc(d.brk || 0)}"></div>
    <div id="whours" style="${mode === 'hours' ? '' : 'display:none'}"><label class="f" for="wh">כמה שעות?</label><input id="wh" class="inp" type="number" inputmode="decimal" min="0" max="24" step="0.25" value="${esc(d.hours || (id ? dayHours(d) : ''))}"></div>
    <p class="sm mt" id="wsum"></p>
    <div class="grid2"><div><label class="f" for="wt">נסיעות היום (₪)</label><input id="wt" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.travel)}" placeholder="${wcfg(who).travel || 0} (ברירת מחדל)"></div><div><label class="f" for="wb">בונוס היום (₪)</label><input id="wb" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.bonus)}" placeholder="0"></div></div>
    <label class="f" for="wr">שכר לשעה ביום הזה (לא חובה)</label><input id="wr" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${esc(d.rate)}" placeholder="${wcfg(who).rate || 'לפי ההגדרות'}">
    <label class="f" for="wn">הערה</label><input id="wn" class="inp" maxlength="80" value="${esc(d.note)}" placeholder="משמרת ערב, חג...">`}
    <button class="btn wide mt" id="wsv">${ic('check')}שמירה</button>${id ? `<button class="btn ghost wide mt" id="wdl" style="color:#ff7b8f">${ic('trash')}מחיקה</button>` : ''}<button class="btn soft wide mt" data-close>ביטול</button>`;
    const read = () => { const o = {...d, date: $('#wd', b).value, note: $('#wn', b).value.trim(), bonus: $('#wb', b).value};
      if (!isB) { if (mode === 'times') { o.start = $('#ws', b).value; o.end = $('#we', b).value; o.brk = +$('#wk', b).value || 0; o.hours = ''; } else { o.start = ''; o.end = ''; o.brk = 0; o.hours = $('#wh', b).value; } o.travel = $('#wt', b).value; o.rate = $('#wr', b).value; }
      return o; };
    const upd = () => { const s = $('#wsum', b); if (!s) return; const o = read(); const p = dayPay(o, wcfg(who)); s.innerHTML = `${hm(p.h)} שעות${p.o1 + p.o2 > 0 ? ` (מהן ${hm(p.o1 + p.o2)} נוספות)` : ''} · <b>${money(p.base + p.travel + p.bonus)}</b>`; };
    b.oninput = upd; upd();
    const wm = $('#wm', b); if (wm) wm.onclick = ev => { const t = ev.target.closest('[data-m]'); if (!t) return; mode = t.dataset.m; $$('#wm button', b).forEach(x => x.classList.toggle('on', x === t)); $('#wtimes', b).style.display = mode === 'times' ? '' : 'none'; $('#whours', b).style.display = mode === 'hours' ? '' : 'none'; upd(); };
    $('#wsv', b).onclick = () => { const o = read();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(o.date)) return toast('בחרו תאריך');
      if (isB && !(+o.bonus > 0)) return toast('הזינו סכום');
      if (!isB && !(dayHours(o) > 0)) return toast(mode === 'times' ? 'בדקו את שעות ההתחלה והסיום' : 'הזינו מספר שעות');
      workSave(o); closeSheet(); const n = new Date(); const dd = new Date(o.date + 'T12:00'); WV.mo = (dd.getFullYear() - n.getFullYear()) * 12 + dd.getMonth() - n.getMonth(); sfx('ok'); render(); toast(isB ? 'הבונוס נשמר' : 'יום העבודה נשמר'); };
    if (id) $('#wdl', b).onclick = () => { closeSheet(); confirmSheet('למחוק?', 'הרשומה תימחק גם אצל ' + esc(nm(1 - meSlot())) + '.', 'מחיקה', () => { workSave({...d, del: true}); render(); }); };
  };
  const b = sheet('', draw); draw(b);
}
ACT.wcfg = () => {
  const who = WV.who ?? meSlot(); const c = wcfg(who);
  sheet(`<h3>הגדרות שכר · ${esc(nm(who))}</h3>
  <label class="f" for="cr">שכר לשעה (₪)</label><input id="cr" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${c.rate || ''}" placeholder="למשל 40">
  <label class="f" for="ctr">נסיעות ליום עבודה (₪)</label><input id="ctr" class="inp" type="number" inputmode="decimal" min="0" step="any" value="${c.travel || ''}" placeholder="למשל 22.6">
  <label class="f" for="cbk">הפסקה קבועה (דקות, לא חובה)</label><input id="cbk" class="inp" type="number" inputmode="numeric" min="0" step="5" value="${c.brk || 0}">
  <div class="list mt"><div class="li"><span class="sp">חישוב שעות נוספות<span class="xs mut" style="display:block">שעתיים ראשונות ${c.ot1}%, אחר כך ${c.ot2}%</span></span><button class="sw ${c.ot ? 'on' : ''}" id="cot" role="switch" aria-checked="${c.ot}"></button></div></div>
  <label class="f" for="coa">שעות נוספות אחרי (שעות ביום)</label><input id="coa" class="inp" type="number" inputmode="decimal" min="1" max="24" step="0.1" value="${c.otAfter}">
  <p class="xs mut">בשבוע של 5 ימים בדרך כלל 8.6 שעות, בשבוע של 6 ימים 8.</p>
  <button class="btn wide mt" id="csv2">${ic('check')}שמירה</button><button class="btn soft wide mt" data-close>ביטול</button>`, b => {
    let ot = c.ot; $('#cot', b).onclick = e => { ot = !ot; e.currentTarget.classList.toggle('on', ot); e.currentTarget.setAttribute('aria-checked', ot); };
    $('#csv2', b).onclick = () => { const n = {rate: Math.max(0, +$('#cr', b).value || 0), travel: Math.max(0, +$('#ctr', b).value || 0), brk: Math.max(0, +$('#cbk', b).value || 0), ot, otAfter: Math.min(24, Math.max(1, +$('#coa', b).value || 8.6)), ot1: c.ot1, ot2: c.ot2, ts: Date.now()};
      workAll().cfg[who] = n; save(); ansSync(); if (typeof relayPost === 'function') relayPost('wcfg', {who, c: n}); closeSheet(); render(); toast('ההגדרות נשמרו'); };
  });
};
ACT.wfill = () => {
  const who = WV.who ?? meSlot(); const mk = monthKey(WV.mo); const today = ymd(new Date());
  const days = new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0).getDate();
  const occ = occRange(mk + '-01', days, e => /עבוד|משמרת/.test(e.title) && (e.who === who || e.who === 'b') && e.time && e.end).filter(o => o.d <= today);
  const have = new Set(Object.values(workAll().days).filter(d => !d.del && d.who === who).map(d => d.date));
  const add = occ.filter(o => !have.has(o.d));
  if (!occ.length) return toast('לא מצאתי בלוז אירועי "עבודה" עם שעות בחודש הזה (עד היום)');
  if (!add.length) return toast('כל ימי העבודה מהלוז כבר רשומים');
  confirmSheet(`להוסיף ${add.length} ימי עבודה?`, `מהלוז: ${add.slice(0, 4).map(o => new Date(o.d + 'T12:00').toLocaleDateString('he-IL', {day: 'numeric', month: 'numeric'})).join(', ')}${add.length > 4 ? '...' : ''}. אפשר לערוך כל יום אחר כך.`, 'הוספה', () => {
    add.forEach(o => workSave({id: uid(), who, kind: 'day', date: o.d, start: o.e.time, end: o.e.end, brk: wcfg(who).brk, hours: '', travel: '', bonus: '', note: '', rate: ''}));
    render(); toast(`נוספו ${add.length} ימים`); });
};
/* sync */
function workFields() { const me = meSlot(); const lim = window.BU_STANDALONE ? 120 : 8; const W = workAll();
  return {lw: Object.values(W.days).filter(d => d.ed === me).sort((a, b) => b.ts - a.ts).slice(0, lim), wc: Object.fromEntries(Object.entries(W.cfg).filter(([, c]) => c && c.ts))}; }
function workMerge(lw, wc) {
  let n = 0; const W = workAll();
  if (Array.isArray(lw)) lw.forEach(d => { if (!d || typeof d.id !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date || '')) return; const c0 = W.days[d.id]; if (c0 && c0.ts >= (+d.ts || 0)) return;
    W.days[d.id] = {id: d.id.slice(0, 40), who: d.who === 0 ? 0 : 1, kind: d.kind === 'bonus' ? 'bonus' : 'day', date: d.date, start: String(d.start || '').slice(0, 5), end: String(d.end || '').slice(0, 5), brk: Math.max(0, +d.brk || 0), hours: d.hours === '' ? '' : String(+d.hours || ''), travel: d.travel === '' ? '' : String(+d.travel || 0), bonus: d.bonus === '' ? '' : String(+d.bonus || 0), rate: d.rate === '' ? '' : String(+d.rate || ''), note: String(d.note || '').slice(0, 80), ts: +d.ts || Date.now(), ed: d.ed === 0 ? 0 : 1, del: !!d.del}; n++; });
  if (wc && typeof wc === 'object') [0, 1].forEach(k => { const c = wc[k]; if (!c || !(+c.ts)) return; const c0 = W.cfg[k]; if (c0 && (c0.ts || 0) >= +c.ts) return;
    W.cfg[k] = {rate: Math.max(0, +c.rate || 0), travel: Math.max(0, +c.travel || 0), brk: Math.max(0, +c.brk || 0), ot: !!c.ot, otAfter: Math.min(24, Math.max(1, +c.otAfter || 8.6)), ot1: +c.ot1 || 125, ot2: +c.ot2 || 150, ts: +c.ts}; n++; });
  if (n) { save(); if (cur().name === 'work' && !$('.sheet') && !(document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName))) render(); }
}
function workHome() { const me = meSlot(); const {t} = workMonth(me, monthKey(0)); return `<button class="tile tap row mb" style="width:100%;text-align:start;padding:12px 14px" data-go="work"><span class="ico">${ic('clock')}</span><span class="sp"><b>מחשבון עבודה</b><span class="xs mut" style="display:block">${t.n ? `החודש: ${t.n} ימים · ${hm(t.h)} שעות` : 'רשמו ימי עבודה, נסיעות ובונוסים'}</span></span><b>${t.total ? money(t.total) : ''}</b></button>`; }
