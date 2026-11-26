/* Between Us — streak, pet (egg → animal), partner notifications helpers */

/* ───────── streak (forgiving: one missed day never breaks it) ───────── */
function streakInfo() {
  const set = new Set(S.prog.days); const d = new Date(); const today = set.has(dayKey(d));
  if (!today) d.setDate(d.getDate() - 1);
  let n = 0, miss = 0, graceUsed = false;
  for (let i = 0; i < 500; i++) {
    if (set.has(dayKey(d))) { n++; miss = 0; }
    else { miss++; if (miss >= 2 || n === 0) break; graceUsed = true; }
    d.setDate(d.getDate() - 1);
  }
  return {n, today, graceUsed};
}
const STREAK_MS = [3, 7, 14, 30, 60, 100, 365];
function streakCheck() {
  const {n} = streakInfo(); S.prog.best = Math.max(S.prog.best || 0, n);
  S.prog.streakAw = S.prog.streakAw || {};
  STREAK_MS.forEach(m => { if (n >= m && !S.prog.streakAw[m]) { S.prog.streakAw[m] = Date.now(); setTimeout(() => { toast(`<b>רצף של ${m} ימים!</b><br><span class="mut sm">בונוס ${m * 5} נקודות וחיזוק לחיה שלכם</span>`, 'ach', 'fire'); confetti(); sfx('ach'); }, 900); addPts(m * 5, true); petFeed(2, true); } });
}
function weekDots() {
  const set = new Set(S.prog.days); const out = []; const d = new Date(); d.setDate(d.getDate() - 6);
  const names = ['א','ב','ג','ד','ה','ו','ש'];
  for (let i = 0; i < 7; i++) { out.push(`<span style="display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;color:var(--mut)"><i style="width:22px;height:22px;border-radius:50%;display:grid;place-items:center;${set.has(dayKey(d)) ? 'background:linear-gradient(135deg,#ffb347,#ff5c8a)' : 'background:var(--sur2)'}">${set.has(dayKey(d)) ? '<svg class="i" style="width:13px;height:13px;stroke:#fff"><use href="#i-fire"/></svg>' : ''}</i>${names[d.getDay()]}</span>`); d.setDate(d.getDate() + 1); }
  return `<div style="display:flex;justify-content:space-between;gap:4px">${out.join('')}</div>`;
}

/* ───────── pets ───────── */
const RAR = {
  common:    {n:'Common',    he:'נפוצה',     c:['#9aa4b2','#5d6676'], w:38},
  uncommon:  {n:'Uncommon',  he:'לא שכיחה',  c:['#46d39a','#1f8e6a'], w:27},
  rare:      {n:'Rare',      he:'נדירה',     c:['#4fa3ff','#2950c8'], w:18},
  epic:      {n:'Epic',      he:'אפית',      c:['#b46bff','#6a2bd0'], w:10},
  legendary: {n:'Legendary', he:'אגדית',     c:['#ffd36b','#ff8a1f'], w:5},
  lovers:    {n:'Lovers',    he:'נאהבים',    c:['#ff6fa8','#c2185b'], w:2}
};
const RAR_ORDER = Object.keys(RAR);
const SPECIES = [
  ['chick','common','🐥','אפרוח','מצייץ כל פעם שמישהו אומר תודה'],['bunny','common','🐰','ארנבון','קופץ משמחה מכל מחמאה'],['hamster','common','🐹','אוגר','אוגר רגעים קטנים בלחיים'],['turtle','common','🐢','צב','לאט לאט, אבל תמיד ביחד'],
  ['fox','uncommon','🦊','שועל','שובב, וזוכר כל בדיחה פנימית'],['panda','uncommon','🐼','פנדה','אלוף בחיבוקים ארוכים'],['otter','uncommon','🦦','לוטרה','ישנה כשהיא מחזיקה יד'],['penguin','uncommon','🐧','פינגווין','מביא אבן מושלמת למי שהוא אוהב'],
  ['owl','rare','🦉','ינשוף','יודע לשאול את השאלות העמוקות'],['koala','rare','🐨','קואלה','לא עוזב את מי שנצמד אליו'],['sloth','rare','🦥','עצלן','מזכיר לכם להאט ולהיות ביחד'],['flamingo','rare','🦩','פלמינגו','רוקד על רגל אחת בשבילכם'],
  ['unicorn','epic','🦄','חד קרן','מופיע רק אצל זוגות שמאמינים'],['dragon','epic','🐉','דרקון','שומר על האש ביניכם'],['peacock','epic','🦚','טווס','פורש נוצות על כל הצלחה זוגית'],
  ['lion','legendary','🦁','אריה הזהב','אמיץ כמו הלב שלכם'],['whale','legendary','🐋','לוויתן השמיים','שר שירים שרק שניכם שומעים'],['swan','legendary','🦢','ברבור הירח','זוהר בלילות שאתם משחקים'],
  ['swans','lovers','🦢🦢','ברבורי האהבה','זוג לכל החיים'],['penguins','lovers','🐧🐧','פינגווינים לנצח','מוצאים אחד את השני תמיד'],['otters','lovers','🦦🦦','לוטרות יד ביד','אף פעם לא נסחפים לבד']
];
const SP = Object.fromEntries(SPECIES.map(s => [s[0], {id:s[0], r:s[1], e:s[2], n:s[3], d:s[4]}]));
const EGG_NEED = 12;
const STAGES = [[0,'תינוק'],[15,'צעיר'],[40,'בוגר'],[80,'אגדה מטופחת']];
const MAX_PETS = 8;
const newEgg = () => ({egg:0, need:EGG_NEED, laid:Date.now()});
function petState() {
  if (!S.pet) S.pet = {pets:[], egg:newEgg(), active:'egg', dex:{}, done:[]};
  const P = S.pet;
  if (P.cur) { if (P.cur.stage === 'pet') { P.pets = [{id:uid(), sp:P.cur.sp, care:P.cur.care, name:P.cur.name, born:P.cur.born, pets:P.cur.pets}]; P.egg = null; P.active = P.pets[0].id; } else { P.pets = []; P.egg = {egg:P.cur.egg, need:P.cur.need || EGG_NEED, laid:P.cur.laid}; P.active = 'egg'; } delete P.cur; }
  P.pets = P.pets || []; if (P.egg === undefined) P.egg = null; P.dex = P.dex || {}; P.done = P.done || [];
  if (!P.egg && !P.pets.length) P.egg = newEgg();
  if (P.active !== 'egg' && !P.pets.some(p => p.id === P.active)) P.active = P.egg ? 'egg' : (P.pets[0] || {}).id;
  if (P.active === 'egg' && !P.egg) P.active = (P.pets[0] || {}).id;
  return P;
}
function rollSpecies() {
  const tot = RAR_ORDER.reduce((s, r) => s + RAR[r].w, 0); let x = Math.random() * tot, r = 'common';
  for (const k of RAR_ORDER) { if (x < RAR[k].w) { r = k; break; } x -= RAR[k].w; }
  return rnd(SPECIES.filter(s => s[1] === r))[0];
}
const petStage = c => { let i = 0; STAGES.forEach((s, k) => { if (c.care >= s[0]) i = k; }); return i; };
const eggReady = () => { const e = petState().egg; return e && e.egg >= e.need; };
/* every task warms the incubating egg AND helps every hatched pet grow */
function petFeed(n, silent) {
  const P = petState();
  if (P.egg) { const was = P.egg.egg; P.egg.egg = Math.max(0, Math.min(P.egg.need, P.egg.egg + n)); if (P.egg.egg >= P.egg.need && was < P.egg.need && !silent) setTimeout(() => toast('<b>הביצה מוכנה לבקוע!</b><br><span class="mut sm">היכנסו לחיות שלכם כדי לגלות מי מחכה בפנים</span>', 'ach', 'spark'), 600); }
  P.pets.forEach(p => { const before = petStage(p); p.care = Math.max(0, p.care + n); const after = petStage(p); if (after > before && !silent) setTimeout(() => { toast(`<b>${esc(p.name || SP[p.sp].n)} גדל!</b><br><span class="mut sm">שלב חדש: ${STAGES[after][1]}</span>`, 'ach', 'heart'); confetti(); }, 700); });
  save();
}
function hatch() {
  const P = petState(); if (!eggReady()) return null;
  const pet = {id:uid(), sp:rollSpecies(), care:0, name:'', born:Date.now(), pets:''};
  P.pets.push(pet); P.egg = null; P.active = pet.id;
  P.dex[pet.sp] = (P.dex[pet.sp] || 0) + 1; S.prog.st.hatched = (S.prog.st.hatched || 0) + 1;
  save(); checkAch(); return pet;
}
const sprite = (sp, size = 120, cls = '') => `<span class="pet ${cls}" style="font-size:${size}px" aria-label="${esc(SP[sp].n)}">${SP[sp].e}</span>`;
function eggSvg(size = 130, crack = 0, rar) {
  const g = rar ? RAR[rar].c : ['#fff4e6', '#ffc6d9'];
  return `<svg class="egg" width="${size}" height="${size * 1.2}" viewBox="0 0 100 120" aria-label="ביצה"><defs><radialGradient id="eg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></radialGradient></defs>
  <ellipse cx="50" cy="112" rx="30" ry="5" fill="rgba(0,0,0,.25)"/><path d="M50 6C28 6 12 44 12 70c0 24 17 40 38 40s38-16 38-40C88 44 72 6 50 6z" fill="url(#eg)"/>
  <circle cx="34" cy="46" r="6" fill="#ff8fb5" opacity=".7"/><circle cx="62" cy="34" r="4" fill="#b46bff" opacity=".6"/><circle cx="66" cy="74" r="7" fill="#ffc46b" opacity=".7"/><path d="M28 86l6 4" stroke="#ff8fb5" stroke-width="4" stroke-linecap="round"/>
  ${crack > .33 ? '<path d="M30 58l8 6 6-8 8 7 7-6" fill="none" stroke="#6b4a3a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' : ''}
  ${crack > .66 ? '<path d="M44 64l-3 12 6 5M60 63l4 10-5 7" fill="none" stroke="#6b4a3a" stroke-width="2.5" stroke-linecap="round"/>' : ''}</svg>`;
}
function petMini() {
  const P = petState(); const sel = P.active === 'egg' ? null : P.pets.find(p => p.id === P.active);
  const extra = P.pets.length + (P.egg ? 1 : 0) > 1 ? `<div class="xs mut" style="text-align:center">${P.pets.length} חיות${P.egg ? ' + ביצה' : ''}</div>` : '';
  if (!sel) { const e = P.egg; return `<div style="display:flex;justify-content:center">${eggSvg(54, e.egg / e.need)}</div><div class="bar mt" style="height:7px"><i style="width:${e.egg / e.need * 100}%"></i></div><div class="xs mut mt">${e.egg >= e.need ? 'מוכנה לבקוע!' : `ביצה · ${e.egg}/${e.need}`}</div>${extra}`; }
  const s = SP[sel.sp]; return `<div style="text-align:center">${sprite(sel.sp, 50, 'bob')}</div><div class="xs mt" style="text-align:center"><b>${esc(sel.name || s.n)}</b></div><div style="text-align:center"><span class="rar r-${s.r}">${RAR[s.r].n}</span></div>${extra}`;
}

SCREENS.pet = () => {
  const P = petState(); const sel = P.active === 'egg' ? null : P.pets.find(p => p.id === P.active);
  let hero;
  if (!sel) {
    const e = P.egg, ready = e.egg >= e.need;
    hero = `<div class="hab" style="--h1:#5b3a8a;--h2:#2a1240"><div class="stars"></div><button class="eggbtn ${ready ? 'ready' : ''}" data-act="${ready ? 'hatch' : 'eggtap'}" aria-label="${ready ? 'בקיעה' : 'ביצה'}">${eggSvg(150, e.egg / e.need)}</button>
      <div class="disp" style="font-size:24px;position:relative">${ready ? 'הביצה רועדת... הקישו!' : 'ביצה מסתורית'}</div>
      <p style="position:relative;opacity:.9;margin-top:4px">${ready ? 'מי מחכה בפנים? אולי מישהו נדיר במיוחד.' : `עוד ${e.need - e.egg} נקודות טיפוח עד שהיא בוקעת`}</p>
      <div class="bar mt" style="background:rgba(255,255,255,.2);position:relative"><i style="width:${e.egg / e.need * 100}%;background:#fff"></i></div></div>`;
  } else {
    const s = SP[sel.sp], st = petStage(sel), nx = STAGES[st + 1], bg = RAR[s.r].c;
    hero = `<div class="hab" style="--h1:${bg[0]};--h2:${bg[1]}"><div class="stars"></div><span class="rar r-${s.r}" style="position:relative">${RAR[s.r].n} · ${RAR[s.r].he}</span>
      <button class="petbtn" data-act="petpat" aria-label="ללטף">${sprite(sel.sp, 92 + st * 18, 'bob')}</button>
      <div class="row" style="justify-content:center;position:relative"><div class="disp" style="font-size:26px">${esc(sel.name || s.n)}</div><button class="ib" style="width:36px;height:36px;background:rgba(255,255,255,.18);border:0;color:#fff" data-act="petname" aria-label="שינוי שם">${ic('note')}</button></div>
      <p style="position:relative;opacity:.92">${s.n} · ${STAGES[st][1]}</p><p class="sm" style="position:relative;opacity:.85;margin-top:4px">${s.d}</p>
      ${nx ? `<div class="bar mt" style="background:rgba(255,255,255,.2);position:relative"><i style="width:${(sel.care - STAGES[st][0]) / (nx[0] - STAGES[st][0]) * 100}%;background:#fff"></i></div><div class="xs mt" style="position:relative;opacity:.9">עוד ${nx[0] - sel.care} לשלב "${nx[1]}"</div>` : `<div class="xs mt" style="position:relative">הגיע לשיא הגדילה!</div>`}</div>`;
  }
  const team = `<div class="chips mt">${P.pets.map(p => `<button class="chip ${P.active === p.id ? 'on' : ''}" data-act="petsel" data-id="${p.id}"><span style="font-size:18px">${SP[p.sp].e}</span>${esc(p.name || SP[p.sp].n)}</button>`).join('')}${P.egg ? `<button class="chip ${P.active === 'egg' ? 'on' : ''}" data-act="petsel" data-id="egg">${eggReady() ? ic('spark') : ''}ביצה ${P.egg.egg}/${P.egg.need}</button>` : ''}</div>`;
  const nextEgg = P.egg ? `<div class="note info mt">${ic('lock')} הביצה הבאה תגיע רק אחרי שהביצה הנוכחית תבקע. ככה כל ביצה בוקעת בתורה.</div>`
    : P.pets.length >= MAX_PETS ? `<div class="note mt">יש לכם ${MAX_PETS} חיות, המקסימום כרגע. אפשר לשחרר חיה לאוסף כדי לפנות מקום לביצה חדשה.</div>`
    : `<button class="btn wide gold mt" data-act="newegg">${ic('gift')}לקבל את הביצה הבאה</button>`;
  const owned = RAR_ORDER.map(r => `<div class="sec"><h3 style="display:flex;gap:8px;align-items:center"><span class="rar r-${r}">${RAR[r].n}</span><span class="sm mut">${RAR[r].he} · ${RAR[r].w}%</span></h3></div><div class="ach" style="grid-template-columns:repeat(4,minmax(0,1fr))">${SPECIES.filter(x => x[1] === r).map(x => { const have = P.dex[x[0]]; return `<div><span class="badge ${have ? '' : 'off'}" style="${have ? `background:linear-gradient(145deg,${RAR[r].c[0]},${RAR[r].c[1]})` : ''};font-size:${x[2].length > 2 ? 22 : 32}px">${have ? x[2] : '?'}</span><span class="xs">${have ? x[3] : '???'}</span></div>`; }).join('')}</div>`).join('');
  return `<div class="scr">${topbar('החיות שלנו')}
  ${hero}${team}${nextEgg}
  ${sel && P.pets.length > 1 ? `<button class="btn ghost wide" data-act="petfree">שחרור ${esc(sel.name || SP[sel.sp].n)} לאוסף</button>` : ''}
  <div class="tile mt"><b>איך מגדלים?</b><div class="col sm mut mt" style="gap:6px">
   <div>${ic('target')} משימה זוגית ששניכם עניתם עליה: +2</div><div>${ic('check')} משימה במשחק: +1</div><div>${ic('star')} קלף היום ששניכם עניתם עליו: +1 · זיכרון חדש: +1</div><div>${ic('fire')} כל אבן דרך ברצף: +2</div></div>
   <p class="xs mut mt">כל נקודה מחממת את הביצה, וגם עוזרת לכל החיות שכבר בקעו לגדול. אפשר לגדל כמה חיות במקביל.</p>
   <p class="xs dim mt">החיות לא נפגעות ולא נעלמות אם לא נכנסים. הן פשוט מחכות לכם.</p>
   <button class="btn sm mt" data-go="missions">למשימות של היום</button></div>
  <div class="sec"><h3>האוסף שלנו</h3><span class="sm mut">${Object.keys(P.dex).length}/${SPECIES.length}</span></div>
  ${P.done.length ? `<p class="xs mut mb">שוחררו לאוסף: ${P.done.map(d => SP[d.sp].e + ' ' + esc(d.name || SP[d.sp].n)).join(' · ')}</p>` : ''}
  ${owned}</div>`;
};
ACT.petsel = a => { petState().active = a.dataset.id; save(); render(); };
ACT.eggtap = () => { const e = $('.egg'); if (e) e.animate([{transform:'rotate(0)'},{transform:'rotate(-8deg)'},{transform:'rotate(8deg)'},{transform:'rotate(0)'}], 400); sfx('tap'); toast('עוד קצת טיפוח והיא תבקע. משימות זוגיות מחממות אותה הכי מהר.'); };
ACT.hatch = () => {
  const e = $('.eggbtn'); sfx('reveal'); buzz(40);
  const go2 = () => { const pet = hatch(); if (!pet) return; const s = SP[pet.sp]; render(); confetti(s.r === 'common' ? 50 : 140); sfx('ach');
    sheet(`<div style="text-align:center"><div class="sm mut">בקע לכם...</div><div style="margin:10px 0">${sprite(pet.sp, 110, 'pop')}</div><span class="rar r-${s.r}">${RAR[s.r].n}</span><h2 class="mt">${s.n}</h2><p class="mut mt">${s.d}</p>
      <label class="f" for="pnm">תנו לו שם</label><input id="pnm" class="inp" maxlength="16" placeholder="${esc(s.n)}"><button class="btn wide mt" id="pns">זה השם!</button>
      <p class="xs mut mt">עכשיו אפשר לקבל את הביצה הבאה.</p></div>`, b => { $('#pns', b).onclick = () => { pet.name = $('#pnm', b).value.trim().slice(0, 16); save(); closeSheet(); render(); }; }); };
  if (e && S.set.motion) { e.classList.add('shake'); setTimeout(go2, 1100); } else go2();
};
const selPet = () => { const P = petState(); return P.pets.find(p => p.id === P.active); };
ACT.petpat = () => { const c = selPet(); if (!c) return; const d = dayKey(); const el = $('.petbtn .pet'); if (el) el.animate([{transform:'scale(1)'},{transform:'scale(1.18) rotate(-6deg)'},{transform:'scale(1)'}], 450);
  for (let i = 0; i < 5; i++) { const h = document.createElement('div'); h.className = 'plus'; h.textContent = '♥'; h.style.color = '#ff5c8a'; h.style.left = (40 + Math.random() * 20) + '%'; h.style.animationDelay = i * .08 + 's'; document.body.appendChild(h); setTimeout(() => h.remove(), 1400); }
  if (c.pets !== d) { c.pets = d; c.care += 1; save(); toast('ליטוף יומי: +1 טיפוח'); render(); } sfx('ok'); };
ACT.petname = () => { const c = selPet(); if (!c) return; sheet(`<h3>שם לחיה</h3><input id="pnm" class="inp mt" maxlength="16" value="${esc(c.name)}" placeholder="${esc(SP[c.sp].n)}"><button class="btn wide mt" id="pns">שמירה</button>`, b => { $('#pns', b).onclick = () => { c.name = $('#pnm', b).value.trim().slice(0, 16); save(); closeSheet(); render(); }; }); };
ACT.newegg = () => { const P = petState(); if (P.egg) return toast('קודם הביצה הנוכחית צריכה לבקוע'); if (P.pets.length >= MAX_PETS) return; P.egg = newEgg(); P.active = 'egg'; save(); render(); toast('ביצה חדשה הגיעה. מי יבקע הפעם?'); };
ACT.petfree = () => { const c = selPet(); if (!c) return; confirmSheet(`לשחרר את ${esc(c.name || SP[c.sp].n)}?`, 'החיה תעבור לאוסף ותפנה מקום. היא נשארת רשומה באוסף שלכם.', 'שחרור לאוסף', () => { const P = petState(); P.done.push({sp:c.sp, name:c.name, ts:Date.now()}); P.pets = P.pets.filter(p => p.id !== c.id); P.active = P.egg ? 'egg' : (P.pets[0] || {}).id; save(); render(); }); };
