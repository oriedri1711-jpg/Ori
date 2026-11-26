/* Between Us — "our places": save where you are right now (GPS) as a favorite spot, shared with the partner.
   Synced like the calendar (live room + encrypted mailbox). Navigation opens Google Maps or Waze. */
const placesAll = () => (S.places = S.places || {});
const PCATS = [['rom', '💑', 'רומנטי'], ['food', '🍽️', 'אוכל וקפה'], ['nature', '🌳', 'טבע'], ['sea', '🏖️', 'ים'], ['city', '🌆', 'עיר'], ['fun', '🎉', 'בילוי'], ['home', '🏠', 'בית'], ['star', '⭐', 'אחר']];
const pcat = k => PCATS.find(c => c[0] === k) || PCATS[7];
const placeList = () => Object.values(placesAll()).filter(p => !p.del);
const PV = {sort: 'new', f: 'all', here: null, hereAt: 0, busy: false};
function distKm(a, b) { const R = 6371, r = x => x * Math.PI / 180; const dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }
const fmtKm = d => d < 1 ? Math.round(d * 1000) + ' מ׳' : d < 10 ? d.toFixed(1) + ' ק״מ' : Math.round(d) + ' ק״מ';
function getHere(timeout = 15000) {
  return new Promise((res, rej) => {
    if (!navigator.geolocation) return rej(new Error('nogeo'));
    navigator.geolocation.getCurrentPosition(p => { PV.here = {lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0)}; PV.hereAt = Date.now(); res(PV.here); },
      e => rej(e), {enableHighAccuracy: true, timeout, maximumAge: 30000});
  });
}
const geoErr = e => e && e.code === 1 ? 'אין הרשאת מיקום. אפשרו מיקום לאפליקציה בהגדרות הטלפון ונסו שוב.' : e && e.message === 'nogeo' ? 'הטלפון הזה לא תומך במיקום.' : 'לא הצלחתי למצוא את המיקום. בדקו שה-GPS פועל ונסו שוב.';
const mapsUrl = p => p.lat != null ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.addr || p.name)}`;
const wazeUrl = p => p.lat != null ? `https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(p.addr || p.name)}&navigate=yes`;
function placeSave(p) { p.ts = Date.now(); p.ed = meSlot(); placesAll()[p.id] = p; save(); ansSync(); if (typeof relayPost === 'function') relayPost('place', p, p.del ? null : `📍 ${nm(meSlot())} ${gw(meSlot(), 'שמר', 'שמרה')} מקום: ${p.name}`); }

SCREENS.places = () => {
  const me = meSlot(); let L = placeList();
  if (PV.f !== 'all') L = L.filter(p => p.cat === PV.f);
  if (PV.sort === 'near' && PV.here) L.sort((a, b) => (a.lat == null) - (b.lat == null) || distKm(PV.here, a) - distKm(PV.here, b)); else L.sort((a, b) => b.at - a.at);
  const cats = [...new Set(placeList().map(p => p.cat))];
  return `<div class="scr">${topbar('המקומות שלנו', `<button class="ib" data-act="padd" aria-label="הוספה ידנית">${ic('plus')}</button>`)}
  <button class="btn wide" data-act="phere" ${PV.busy ? 'disabled' : ''} style="min-height:64px;font-size:18px">${PV.busy ? 'מחפש את המיקום...' : '📍 שמירת המקום שבו אני עכשיו'}</button>
  <p class="xs mut mt" style="text-align:center">המקום נשמר אצל שניכם. ${esc(nm(1 - me))} ${gw(1 - me, 'יקבל', 'תקבל')} עדכון.</p>
  ${placeList().length ? `<div class="row mt" style="gap:8px"><div class="seg sp">${[['new', 'החדשים'], ['near', 'הכי קרובים']].map(([k, l]) => `<button class="${PV.sort === k ? 'on' : ''}" data-act="psort" data-s="${k}">${l}</button>`).join('')}</div></div>
  ${cats.length > 1 ? `<div class="chips mt">${[['all', '', 'הכל'], ...PCATS.filter(c => cats.includes(c[0]))].map(([k, e, l]) => `<button class="chip ${PV.f === k ? 'on' : ''}" data-act="pf" data-f="${k}">${e} ${l}</button>`).join('')}</div>` : ''}` : ''}
  <div class="sec"><h3>${placeList().length ? 'שמרתם ' + placeList().length + ' מקומות' : 'עוד אין מקומות'}</h3></div>
  ${L.length ? `<div class="col" style="gap:8px">${L.map(p => { const c = pcat(p.cat); const d = PV.here && p.lat != null ? distKm(PV.here, p) : null;
    return `<button class="tile tap row" style="width:100%;text-align:start" data-act="popen" data-id="${esc(p.id)}"><span style="font-size:30px;width:44px;text-align:center">${c[1]}</span><div class="sp"><b>${esc(p.name)}</b><div class="xs mut">${p.by === me ? 'שמרת' : esc(nm(p.by)) + ' ' + gw(p.by, 'שמר', 'שמרה')} · ${new Date(p.at).toLocaleDateString('he-IL', {day: 'numeric', month: 'short', year: '2-digit'})}${p.visits && p.visits.length ? ` · ${p.visits.length + 1} ביקורים` : ''}</div>${p.note ? `<div class="xs mut" style="margin-top:2px">${esc(p.note.slice(0, 60))}</div>` : ''}</div>${d != null ? `<span class="pill" style="white-space:nowrap">${fmtKm(d)}</span>` : ''}</button>`; }).join('')}</div>`
  : `<div class="empty">${ic('heart')}<p>נמצאים עכשיו במקום שאתם אוהבים? לחצו על הכפתור למעלה, והמקום יישמר לשניכם.</p></div>`}
  </div>`;
};
ACT.psort = async a => { PV.sort = a.dataset.s; render(); if (PV.sort === 'near' && (!PV.here || Date.now() - PV.hereAt > 120000)) { try { await getHere(10000); render(); } catch (e) { toast(geoErr(e), 'err'); } } };
ACT.pf = a => { PV.f = a.dataset.f; render(); };
ACT.phere = async () => {
  PV.busy = true; render();
  try { const h = await getHere(); PV.busy = false; render();
    const near = placeList().filter(p => p.lat != null && distKm(h, p) < 0.08)[0];
    placeSheet(null, {lat: h.lat, lng: h.lng, acc: h.acc}, near);
  } catch (e) { PV.busy = false; render(); toast(geoErr(e), 'err'); }
};
ACT.padd = () => placeSheet(null, {});
ACT.popen = a => placeView(a.dataset.id);
function placeSheet(id, loc, near) {
  const p = id ? {...placesAll()[id]} : {id: uid(), name: '', cat: 'rom', note: '', addr: '', lat: loc.lat ?? null, lng: loc.lng ?? null, acc: loc.acc || 0, by: meSlot(), at: Date.now(), visits: []};
  const manual = p.lat == null;
  const draw = b => {
    b.innerHTML = `<div class="grab"></div><h3>${id ? 'עריכת מקום' : manual ? 'הוספת מקום' : '📍 שמירת המקום הזה'}</h3>
    ${near && !id ? `<button class="note mt" style="width:100%;text-align:start" id="pnear">כבר שמרתם את "${esc(near.name)}" ממש כאן. <u>לסמן ביקור נוסף שם?</u></button>` : ''}
    ${!manual ? `<p class="xs mut mt">${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}${p.acc ? ` · דיוק ${p.acc} מ׳` : ''}</p>` : ''}
    <label class="f" for="pn">איך נקרא למקום?</label><input id="pn" class="inp" maxlength="50" value="${esc(p.name)}" placeholder="למשל: הספסל שלנו בטיילת">
    <label class="f">סוג</label><div class="row wrap" id="pc" style="gap:6px">${PCATS.map(([k, e, l]) => `<button class="chip ${p.cat === k ? 'on' : ''}" data-c="${k}">${e} ${l}</button>`).join('')}</div>
    ${manual ? `<label class="f" for="pa">כתובת או שם המקום במפות</label><input id="pa" class="inp" maxlength="120" value="${esc(p.addr || '')}" placeholder="למשל: קפה ניסים, תל אביב">` : ''}
    <label class="f" for="pt">למה הוא מיוחד לכם?</label><textarea id="pt" class="inp" maxlength="300" rows="2" placeholder="הדייט הראשון, השקיעה הכי יפה...">${esc(p.note || '')}</textarea>
    <button class="btn wide mt" id="psv">${ic('check')}שמירה</button><button class="btn soft wide mt" data-close>ביטול</button>`;
    $('#pc', b).onclick = ev => { const t = ev.target.closest('[data-c]'); if (!t) return; p.cat = t.dataset.c; $$('#pc .chip', b).forEach(x => x.classList.toggle('on', x === t)); };
    const nb = $('#pnear', b); if (nb) nb.onclick = () => { closeSheet(); placeVisit(near.id); };
    $('#psv', b).onclick = () => { p.name = $('#pn', b).value.trim(); p.note = $('#pt', b).value.trim(); if (manual) p.addr = $('#pa', b).value.trim();
      if (!p.name) return toast('תנו למקום שם'); placeSave(p); closeSheet(); sfx('ach'); if (!id) confetti(40); render(); toast(id ? 'נשמר' : `📍 "${esc(p.name)}" נשמר לשניכם`); };
  };
  const b = sheet('', null); draw(b); setTimeout(() => { const i = $('#pn', b); if (i && !id) i.focus(); }, 50);
}
function placeVisit(pid) { const p = {...placesAll()[pid]}; p.visits = [...(p.visits || []), Date.now()].slice(-50); placeSave(p); toast(`❤️ ביקור מספר ${p.visits.length + 1} ב"${esc(p.name)}"`); render(); }
function placeView(pid) {
  const p = placesAll()[pid]; if (!p) return; const c = pcat(p.cat); const me = meSlot(); const d = PV.here && p.lat != null ? distKm(PV.here, p) : null;
  const bb = p.lat != null ? [p.lng - .006, p.lat - .004, p.lng + .006, p.lat + .004].map(x => x.toFixed(5)).join(',') : '';
  sheet(`<div class="row"><span style="font-size:34px">${c[1]}</span><div class="sp"><h3 style="margin:0">${esc(p.name)}</h3><div class="xs mut">${c[2]} · ${p.by === me ? 'שמרת' : esc(nm(p.by)) + ' ' + gw(p.by, 'שמר', 'שמרה')} ב-${new Date(p.at).toLocaleDateString('he-IL', {day: 'numeric', month: 'long', year: 'numeric'})}${d != null ? ' · ' + fmtKm(d) + ' ממך' : ''}</div></div></div>
    ${p.lat != null ? `<iframe title="מפה" src="https://www.openstreetmap.org/export/embed.html?bbox=${bb}&layer=mapnik&marker=${p.lat},${p.lng}" style="width:100%;height:190px;border:0;border-radius:16px;margin-top:12px;background:var(--sur2)" loading="lazy"></iframe>` : p.addr ? `<p class="sm mt">${ic('link')} ${esc(p.addr)}</p>` : ''}
    ${p.note ? `<p class="mt" style="white-space:pre-wrap">${esc(p.note)}</p>` : ''}
    ${p.visits && p.visits.length ? `<p class="xs mut mt">${p.visits.length + 1} ביקורים · האחרון ב-${new Date(p.visits[p.visits.length - 1]).toLocaleDateString('he-IL', {day: 'numeric', month: 'short'})}</p>` : ''}
    <div class="grid2 mt"><a class="btn" style="text-decoration:none;white-space:nowrap" href="${mapsUrl(p)}" target="_blank" rel="noopener">${ic('fwd')}Google Maps</a><a class="btn soft" style="text-decoration:none;white-space:nowrap" href="${wazeUrl(p)}" target="_blank" rel="noopener">${ic('fwd')}Waze</a></div>
    <div class="grid2 mt"><button class="btn soft" id="pvis">❤️ היינו פה שוב</button><button class="btn soft" id="phint">💌 שליחה ל${esc(nm(1 - me))}</button></div>
    <div class="row mt" style="gap:8px"><button class="btn ghost sp" id="ped">${ic('note')}עריכה</button><button class="btn ghost sp" id="pdl" style="color:#ff7b8f">${ic('trash')}מחיקה</button></div>`, b => {
    $('#pvis', b).onclick = () => { closeSheet(); placeVisit(pid); };
    $('#phint', b).onclick = () => { closeSheet(); if (typeof sendHint === 'function') sendHint(null, `📍 ${p.name}: בא לי שנחזור לשם 💕`); };
    $('#ped', b).onclick = () => { closeSheet(); placeSheet(pid, p); };
    $('#pdl', b).onclick = () => { closeSheet(); confirmSheet('למחוק את המקום?', 'הוא יימחק גם אצל ' + esc(nm(1 - me)) + '.', 'מחיקה', () => { placeSave({...p, del: true}); render(); }); };
  });
}
/* sync */
function placeFields() { const me = meSlot(); return {lp: placeList().concat(Object.values(placesAll()).filter(p => p.del)).filter(p => p.ed === me).sort((a, b) => b.ts - a.ts).slice(0, window.BU_STANDALONE ? 100 : 6)}; }
function placeMerge(list) {
  if (!Array.isArray(list)) return; let n = 0;
  list.forEach(p => { if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') return; const c0 = placesAll()[p.id]; if (c0 && c0.ts >= (+p.ts || 0)) return;
    const num = v => (v === null || v === undefined || v === '' || !isFinite(+v)) ? null : +v;
    placesAll()[p.id] = {id: p.id.slice(0, 40), name: p.name.slice(0, 50), cat: pcat(p.cat)[0], note: String(p.note || '').slice(0, 300), addr: String(p.addr || '').slice(0, 120), lat: num(p.lat), lng: num(p.lng), acc: Math.max(0, +p.acc || 0), by: p.by === 0 ? 0 : 1, at: +p.at || Date.now(), visits: Array.isArray(p.visits) ? p.visits.map(Number).filter(Boolean).slice(-50) : [], ts: +p.ts || Date.now(), ed: p.ed === 0 ? 0 : 1, del: !!p.del}; n++; });
  if (n) { save(); if (['places', 'home'].includes(cur().name) && !$('.sheet') && !(document.activeElement && /^(TEXTAREA|INPUT)$/.test(document.activeElement.tagName))) render(); }
}
function placesHome() { const n = placeList().length; const last = placeList().sort((a, b) => b.at - a.at)[0];
  return `<button class="tile tap" style="text-align:start" data-go="places"><div class="row xs mut">📍 המקומות שלנו</div><div class="sm mt"><b>${n ? n + ' מקומות' : 'שמרו מקום'}</b></div><div class="xs mut">${last ? pcat(last.cat)[1] + ' ' + esc(last.name.slice(0, 22)) : 'המקום שבו אתם עכשיו'}</div></button>`; }
