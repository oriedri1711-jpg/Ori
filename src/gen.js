/* Between Us — endless cards + written answers for every game card.
   1. Procedural cards: per-mode templates × topics, ids like "pg-know-123" rebuild the same card on every phone.
   2. Claude cards (optional): the `sample` capability writes fresh cards per mode, kept on the device (S.gen).
   3. Every question card asks each player to write an answer; answers are saved in "התשובות שלכם" and answered cards are marked. */

const GEN_MODES = ['know', 'deep', 'flirt', 'who', 'dil', 'guess', 'tod'];
const L = (s, sep = '|') => s.split(sep).map(x => x.trim()).filter(Boolean);

/* ── word banks ── */
const W = {
  topics: L('אוכל|מוזיקה|כסף|חברות|משפחה|עבודה|טיולים|חגים|ספורט|בית ספר|אהבה|שינה|בגדים|טכנולוגיה|ים|ספרים|סרטים|בעלי חיים|בישול|ימי הולדת|מתנות|הצלחה|כישלון|אומץ|זמן פנוי|בקרים|לילות|חורף|קיץ|ריקוד|אמנות|טבע|נסיעות|סודות|חלומות|יצירתיות|תחביבים|מזל|שכנים|ילדות|מסורות|הומור'),
  themes: L('אמון|קנאה|מרחב אישי|כסף|זמן ביחד|ריבים|סליחה|שגרה|הפתעות|המשפחות שלנו|חברים|העתיד|קריירה|מגע|מילים טובות|שתיקות|גבולות|תמיכה בימים קשים|שינויים|חלומות משותפים|הבית שלנו|מסורות זוגיות|הומור|כבוד|תקשורת|פגיעות|הערכה|חופש|ביטחון|רומנטיקה'),
  feats: L('חיוך|מבט|קול|צחוק|ידיים|ריח|שיער|הליכה|חיבוק|סגנון|הומור|ביטחון|לחישה|נשיקה|עיניים'),
  places: L('בחוף בשקיעה|במעלית תקועה|בגשם|בפקק ארוך|בסופר|במטבח|בהופעה|בחתונה של חברים|בטיסה|באמצע הלילה|על הספה|בתור לקופה|בבוקר של יום שישי|בפיקניק|בבריכה|בשוק|ברכבת|באוהל|במסעדה יוקרתית|בחדר מלון'),
  whoAct: L('ילך לאיבוד|יתחיל לשיר בקול|ישכח משהו חשוב|יתחבר עם כולם|יבכה מהתרגשות|ייקח פיקוד|יצחק בזמן הכי לא מתאים|יתלונן ראשון|יאכל הכי הרבה|ימצא פתרון יצירתי|ייבהל ראשון|יצלם הכל|יתווכח על החוקים|יירדם ראשון|יוציא יותר מדי כסף|יעשה פדיחה|ישאל מיליון שאלות|יתנדב ראשון|יוותר ראשון|ינצח בסוף|יתאהב במקום ולא ירצה לחזור|ירקוד בלי שביקשו|יזמין קינוח לפני האוכל|יכיר חבר חדש'),
  whoCtx: L('בטיול לחו"ל|בחתונה|על אי בודד|באפוקליפסת זומבים|בתוכנית ריאליטי|בחדר בריחה|במסיבת הפתעה|בשבוע בלי טלפונים|בקמפינג|במשחק מונופול|בארוחה משפחתית|ביום גשום|בסדנת בישול|בפארק שעשועים|בקריוקי|בטיסה ארוכה'),
  opts: L('לטוס ללילה אחד לפריז|ערב ספא פרטי בבית|ארוחת שף של שבע מנות|יום שלם בלי טלפונים|לישון עד הצהריים|טיול בטבע עם תרמיל|הופעה בשורה הראשונה|ללמוד יחד ריקוד חדש|לבשל יחד ארוחה של שלוש מנות|סופ"ש בצימר בצפון|ערב משחקי קופסה|פיקניק בשקיעה|לנסוע לחו"ל בלי לתכנן|לאמץ כלב|לגור ליד הים|ללמוד שפה חדשה יחד|קעקוע זוגי קטן|מרתון סרטים|קפיצת באנג\'י|מסעדה עם מוזיקה חיה|טיול כביש בלי יעד|ארוחת בוקר במיטה כל שבת|מסיבת הפתעה עם כל החברים|ערב קריוקי|לישון באוהל מתחת לכוכבים|אוכל רחוב בשוק|שיעור בישול זוגי|לבנות משהו יחד מעץ|יום בפארק מים|שעה של עיסויים|לכתוב יחד שיר|לצלם יחד סרט קצר|יום התנדבות משותף|לשחות בים בלילה|רכבת לעיר שלא הכרתם|אתגר ספורט זוגי|ערב שלם רק של שיחה|ארוחה גדולה עם כל המשפחה|לשתול גינה קטנה|סדנת קדרות'),
  fav: [['מאכל','m'],['שיר','m'],['סרט','m'],['צבע','m'],['עונה','f'],['חג','m'],['יום בשבוע','m'],['קינוח','m'],['מקום בארץ','m'],['חטיף','m'],['משקה','m'],['ספר','m'],['סדרה','f'],['ריח','m'],['פרח','m'],['חיה','f'],['ענף ספורט','m'],['אפליקציה','f'],['שעה ביום','f'],['מסעדה','f'],['פריט לבוש','m'],['משחק','m'],['זיכרון משותף שלנו','m'],['מקום בבית','m'],['ארוחת בוקר','f'],['עיר בעולם','f'],['זמר או להקה','m'],['מילה','f']],
  ifHad: L('מיליון שקל|יום חופש פתאומי|שעה לבד בבית|כרטיס טיסה לכל מקום|כוח-על אחד|מכונת זמן|שבוע בלי טלפון|ערב חופשי מכל אחריות|הזדמנות לפגוש כל אדם בעולם|עוד שעה ביום|בית ריק לסופ"ש|חנות משלי|תקציב חופשי לשיפוץ הבית|במה מול אלף איש|יכולת לדבר עם בעלי חיים'),
  adj: L('מביך|מצחיק|מטורף|ספונטני|רומנטי|אמיץ|ילדותי|מתוק'),
  ctx: L('בבית הספר|בעבודה|בדייט|בחתונה|בטיול|מול ההורים|בחו"ל|בתחבורה ציבורית|בסופר|במסיבה|ברשתות החברתיות|בהודעה בטלפון|מול {p}'),
  ppl: L('מצחיק|מוזר|מעניין|מרשים|מפתיע'),
  tell: L('על היום שלך;למה {הוא|היא} {מדהים|מדהימה};מה [אכלת|אכלת] היום;איך הכרתם;על החלום הכי מוזר שלך;מה התוכניות לסופ"ש;מתכון לחביתה;את העלילה של הסרט האחרון שראיתם', ';'),
  style: L('בקול של קריין חדשות|כמו בטלנובלה|בלחישה דרמטית|במבטא צרפתי|כמו מאמן כושר|כמו מדריך טיולים|בחרוזים|כמו רובוט|בשירה אופראית|כמו קריין של סרט טבע|בסגנון ראפ|בלי להשתמש באות ר'),
  imit: L('{מתעורר|מתעוררת} בבוקר;{מחפש|מחפשת} את המפתחות;{רעב|רעבה} מאוד;{מתלהב|מתלהבת} ממשהו קטן;{מדבר|מדברת} בטלפון עם השירות;{מנסה|מנסה} להחליט מה לאכול;{צופה|צופה} בסדרה מותחת;{מתארגן|מתארגנת} ליציאה', ';'),
  draw: L('בעיניים עצומות|ביד הלא דומיננטית|בלי להרים את העט|בתור גיבור על|בתור חיה')
};

/* ── templates: [category, kind, depth, (i,j) → text] over two banks ── */
const T = {
  know: {cat: 'self', a: W.topics, b: [
    x => `מה הזיכרון הכי חזק שלך שקשור ל${x}?`, x => `איזה סיפור מצחיק יש לך על ${x}?`, x => `מה הדעה הכי לא פופולרית שלך בנושא ${x}?`,
    x => `מה [למדת|למדת] על עצמך דרך ${x}?`, x => `אם [היית צריך|היית צריכה] לתת ציון ל${x} בחיים שלך, כמה ולמה?`, x => `איך נראה הקשר שלך ל${x} כש[היית בן|היית בת] חמש עשרה?`,
    x => `מה הדבר הראשון שעולה לך בראש כשאומרים "${x}"?`, x => `מה הרגע הכי מביך שלך שקשור ל${x}?`, x => `מה {p} עוד לא {יודע|יודעת} עליך בנושא ${x}?`,
    x => `איך השתנה הקשר שלך ל${x} בחמש השנים האחרונות?`, x => `איזה הרגל קטן שלך קשור ל${x}?`, x => `מי האדם שהכי השפיע עליך בכל מה שקשור ל${x}?`,
    x => `אם [היית כותב|היית כותבת] ספר על ${x}, איך הוא היה נקרא?`, x => `מה החלום שלך בכל מה שקשור ל${x}?`, x => `על מה בנושא ${x} [היית מוכן|היית מוכנה] להתווכח עם כל העולם?`,
    x => `2|מה הפחד הכי שקט שלך בנושא ${x}?`, x => `מה [היית מלמד|היית מלמדת] ילד בן שש על ${x}?`, x => `איזה שיר, ריח או תמונה מזכירים לך ${x}?`]},
  deep: {cat: 'comm', a: W.themes, b: [
    x => `2|מה [למדת|למדת] על עצמך דרך ${x} בזוגיות שלכם?`, x => `2|איפה אתם הכי חזקים כשזה מגיע ל${x}?`, x => `2|מה [היית רוצה|היית רוצה] שתעשו אחרת בנושא ${x}?`,
    x => `3|איך נראה הנושא "${x}" בבית שגדלת בו, ומה מזה [הבאת|הבאת] איתך לזוגיות?`, x => `2|מה {p} {עושה|עושה} בנושא ${x} שגורם לך להרגיש [אהוב|אהובה]?`, x => `3|מה קשה לך לבקש מ{p} בנושא ${x}?`,
    x => `2|איזה רגע שלכם שקשור ל${x} [היית רוצה|היית רוצה] לחיות שוב?`, x => `3|מה הפחד הכי שקט שלך בנושא ${x}?`, x => `2|אם הייתם כותבים כלל זוגי אחד על ${x}, מה הוא היה?`,
    x => `2|מה השתנה אצלך ביחס ל${x} מאז שאתם ביחד?`, x => `2|על מה בנושא ${x} [אתה מודה|את מודה] ל{p}?`, x => `3|מה {p} {צריך|צריכה} לדעת עליך בנושא ${x} כדי להבין אותך טוב יותר?`,
    x => `2|מה תרצו שיהיה אצלכם בנושא ${x} בעוד חמש שנים?`, x => `3|מתי [הרגשת|הרגשת] הכי [קרוב|קרובה] ל{p} בכל מה שקשור ל${x}?`, x => `2|איזה משפט הכי עוזר לך לשמוע בנושא ${x}?`]},
  flirt: {cat: 'fq', a: W.feats.concat(W.places), b: null},
  who: {cat: 'wlife', kind: 'w', a: W.whoAct, b: W.whoCtx},
  dil: {cat: 'dllife', kind: 'd', a: W.opts, b: W.opts},
  guess: {cat: 'gtaste', kind: 'g'},
  tod: {}
};
const FLIRT_F = [
  x => `מה הכי מושך אותך ב${x} של {p}? [תהיה|תהיי] [ספציפי|ספציפית].`, x => `[תאר|תארי] במילה אחת את ה${x} של {p}, ואז [תסביר|תסבירי] למה דווקא המילה הזאת.`,
  x => `מתי לאחרונה [שמת|שמת] לב ל${x} של {p} [והתאהבת|והתאהבת] מחדש?`, x => `אם [היית כותב|היית כותבת] שיר על ה${x} של {p}, מה הייתה השורה הראשונה?`,
  x => `באיזה רגע הכי קשה לך לעמוד בפני ה${x} של {p}?`, x => `כמה [נמשכת|נמשכת] ל${x} של {p} בדייט הראשון, מ-1 עד 10?`,
  x => `איזה צבע, שיר או ריח מזכיר לך את ה${x} של {p}?`, x => `!2|[תן|תני] ל{p} מחמאה על ה${x} {שלו|שלה}, מקרוב, בלי לצחוק באמצע.`];
const FLIRT_P = [
  x => `מה הדבר הכי רומנטי שאפשר לעשות ${x}?`, x => `איך [היית מפלרטט|היית מפלרטטת] עם {p} ${x}, אם עוד לא הייתם מכירים?`,
  x => `נשיקה ${x}: כן, לא, או רק אם אף אחד לא מסתכל?`, x => `מה [היית רוצה|היית רוצה] ש{p} {ילחש|תלחש} לך ${x}?`,
  x => `איזה שיר היה מתנגן ברקע אם הייתם בסרט רומנטי ${x}?`, x => `2|[ספר|ספרי] על פנטזיה רומנטית תמימה שמתרחשת ${x}.`];
function guessList() {
  const out = [];
  W.fav.forEach(([x, g]) => {
    const f = g === 'f';
    out.push(`מה ה${x} ${f ? 'האהובה' : 'האהוב'} עליי?`, `${f ? 'איזו' : 'איזה'} ${x} הכי פחות ${f ? 'אהובה' : 'אהוב'} עליי?`, `${f ? 'איזו' : 'איזה'} ${x} [הייתי לוקח|הייתי לוקחת] איתי לאי בודד?`, `${f ? 'איזו' : 'איזה'} ${x} ${f ? 'מזכירה' : 'מזכיר'} לי את הילדות?`);
  });
  W.ifHad.forEach(x => out.push(`מה [הייתי עושה|הייתי עושה] עם ${x}?`));
  return out;
}
let GUESS_L = null;
function todList(k) {
  const out = [];
  if (k === 'tr') { W.adj.forEach(a => W.ctx.forEach(c => out.push(['tfun', `מה הדבר הכי ${a} ש[עשית|עשית] אי פעם ${c}?`]))); W.ppl.forEach(a => W.ctx.slice(0, 11).forEach(c => out.push(['tfun', `מי האדם הכי ${a} ש[פגשת|פגשת] ${c}?`]))); }
  else { W.tell.forEach(a => W.style.forEach(s => out.push(['dfun', `!${'[ספר|ספרי]'} ל{p} ${a}, ${s}.`]))); W.imit.forEach(a => out.push(['dimit', `![חקה|חקי] את {p} כש{הוא|היא} ${a}.`])); W.draw.forEach(a => out.push(['dcreat', `![צייר|ציירי] את {p} ${a}, תוך 30 שניות.`])); }
  return out;
}
const TOD_L = {};
function procSize(mode, k) {
  if (mode === 'know' || mode === 'deep') return T[mode].a.length * T[mode].b.length;
  if (mode === 'flirt') return W.feats.length * FLIRT_F.length + W.places.length * FLIRT_P.length;
  if (mode === 'who') return W.whoAct.length * W.whoCtx.length;
  if (mode === 'dil' || mode === 'guess-o') return W.opts.length * (W.opts.length - 1);
  if (mode === 'guess') return (GUESS_L || (GUESS_L = guessList())).length + procSize('guess-o');
  if (mode === 'tod') return (TOD_L[k] || (TOD_L[k] = todList(k))).length;
  return 0;
}
/* build a card from its id: pg-<mode>-<n> or pg-tod-<k>-<n> */
const PGC = {};
function procCard(id) {
  if (PGC[id]) return PGC[id];
  const p = id.split('-'); if (p[0] !== 'pg') return null;
  const mode = p[1]; let k = null, n = +p[2];
  if (mode === 'tod') { k = p[2]; n = +p[3]; }
  if (!(n >= 0) || n >= procSize(mode, k)) return null;
  let c = null; const mk = (cat, kind, raw, o) => {
    let d = 1, s = raw; const mm = s.match(/^!?(\d)\|/); let task = s[0] === '!'; s = s.replace(/^!/, ''); if (mm) { d = +mm[1]; s = s.replace(/^\d\|/, ''); }
    return {id, m: mode, k: task ? (mode === 'tod' ? 'da' : 't') : kind, c: cat, d, t: s, tags: [], tl: 0, gen: 'pg', ...(o ? {o} : {})};
  };
  if (mode === 'know' || mode === 'deep') { const t = T[mode]; const a = t.a[n % t.a.length], f = t.b[Math.floor(n / t.a.length)]; c = mk(t.cat, 'q', f(a)); }
  else if (mode === 'flirt') { const nf = W.feats.length * FLIRT_F.length; if (n < nf) { const x = W.feats[n % W.feats.length], f = FLIRT_F[Math.floor(n / W.feats.length)]; c = mk(f(x).startsWith('!') ? 'fcomp' : 'fq', 'q', f(x)); } else { n -= nf; const x = W.places[n % W.places.length], f = FLIRT_P[Math.floor(n / W.places.length)]; c = mk('fimag', 'q', f(x)); } }
  else if (mode === 'who') { const a = W.whoAct[n % W.whoAct.length], b = W.whoCtx[Math.floor(n / W.whoAct.length)]; c = mk('wlife', 'w', `מי מאיתנו ${a} ${b}?`); }
  else if (mode === 'dil') { const L2 = W.opts.length, i = n % L2; let j = Math.floor(n / L2); if (j >= i) j++; const A = W.opts[i], B = W.opts[j]; c = mk('dlfun', 'd', `מה עדיף לכם: ${A}, או ${B}?`, [A, B]); }
  else if (mode === 'guess') { const gl = GUESS_L || (GUESS_L = guessList()); if (n < gl.length) c = mk(n % 3 ? 'gtaste' : 'gheart', 'g', gl[n]); else { n -= gl.length; const L2 = W.opts.length, i = n % L2; let j = Math.floor(n / L2); if (j >= i) j++; const A = W.opts[i], B = W.opts[j]; c = mk('gtaste', 'g', `מה [הייתי בוחר|הייתי בוחרת]: ${A}, או ${B}?`, [A, B]); } }
  else if (mode === 'tod') { const [cat, s] = (TOD_L[k] || (TOD_L[k] = todList(k)))[n]; c = mk(cat, k, s); }
  if (c) PGC[id] = c; return c;
}

/* ── Claude-written cards (kept per device in S.gen) ── */
const GEN_HINT = {know: 'שאלות היכרות אישיות ומפתיעות (ילדות, חלומות, הרגלים, אישיות)', deep: 'שאלות עמוקות ורגישות על הזוגיות, אמון, רגשות ועתיד', flirt: 'שאלות פלרטטניות, רומנטיות ומשעשעות, לא מיניות',
  who: 'משפטי "מי מאיתנו..." מצחיקים, בלשון זכר עתידי (מי מאיתנו יזמין...)', dil: 'דילמות "מה עדיף" עם בדיוק שתי אפשרויות קצרות', guess: 'שאלות בגוף ראשון שהשחקן עונה עליהן בסתר ובן/בת הזוג מנחשים (מה הכי..., איזה... אני...)', tod: 'שאלות "אמת" משעשעות ומביכות-קלות'};
let SAMPLE = undefined, GEN_BUSY = {};
const genAll = () => (S.gen = S.gen || {});
const genPool = mode => (genAll()[mode] = genAll()[mode] || []);
function genCard(id) { const m = id.split('-')[1]; return (genAll()[m] || []).find(c => c.id === id) || null; }
async function sampleNS() { if (SAMPLE !== undefined) return SAMPLE; try { SAMPLE = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { SAMPLE = null; } return SAMPLE; }
async function genFill(mode, why) {
  if (!GEN_MODES.includes(mode) || mode === 'tod' || GEN_BUSY[mode] || S.set.aiCards === false) return 0;
  const fresh = genPool(mode).filter(c => !isAnswered(c.id) && !(S.prog.seen[c.id] > 0)).length; if (fresh >= 8) return 0;
  const sm = await sampleNS(); if (!sm) return 0;
  GEN_BUSY[mode] = 1;
  try {
    const have = genPool(mode).slice(-30).map(c => c.t).concat(CARDS.filter(c => c.m === mode).slice(0, 12).map(c => c.t));
    const kind = T[mode].kind || 'q';
    const prompt = `אתה כותב קלפים למשחק זוגי בעברית בשם Between Us. כתוב 12 קלפים חדשים ומקוריים לסוג: ${GEN_HINT[mode]}.
כללים: עברית טבעית וחמה, משפט אחד עד שניים, בלי תוכן מיני או גרפי, בלי לפגוע. פנייה לשחקן בגוף שני.
כשמילה תלויה במגדר של השחקן כתוב [צורת זכר|צורת נקבה], למשל [אתה|את], [עשית|עשית]. למגדר של בן/בת הזוג כתוב {צורת זכר|צורת נקבה}. את שם בן/בת הזוג כתוב {p}.
${kind === 'w' ? 'כל קלף מתחיל ב"מי מאיתנו".' : ''}${kind === 'd' || kind === 'g' ? 'אפשר להוסיף שדה o עם 2 עד 4 תשובות קצרות לבחירה.' : ''}
אל תחזור על אלה: ${have.map(t => '"' + t.slice(0, 70) + '"').join(', ')}.
החזר JSON בלבד: מערך של אובייקטים {"t":"טקסט הקלף","d":1|2|3${kind === 'd' ? ',"o":["א","ב"]' : kind === 'g' ? ',"o":["א","ב"] (לא חובה)' : ''}}.`;
    const out = await sm.json(prompt, {modelTier: 'quick'});
    const arr = Array.isArray(out) ? out : (out && Array.isArray(out.cards) ? out.cards : []);
    const cat = T[mode].cat, pool = genPool(mode); let n = 0;
    arr.slice(0, 16).forEach(x => {
      if (!x || typeof x.t !== 'string') return; const t = x.t.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 220); if (t.length < 8 || pool.some(c => c.t === t)) return;
      let o = Array.isArray(x.o) ? x.o.filter(v => typeof v === 'string' && v.trim()).map(v => v.replace(/[<>|]/g, '').trim().slice(0, 50)).slice(0, 4) : null;
      if (kind === 'd' && (!o || o.length < 2)) return; if (o && o.length < 2) o = null;
      const c = {id: 'ai-' + mode + '-' + uid().slice(0, 8), m: mode, k: kind, c: cat, d: Math.min(3, Math.max(1, +x.d || 1)), t, tags: [], tl: 0, gen: 'ai', ...(o ? {o} : {})};
      pool.push(c); n++;
    });
    if (pool.length > 300) pool.splice(0, pool.length - 300);
    if (n) { save(); if (why === 'click') toast(`${ic('star')} Claude כתב ${n} קלפים חדשים`, 'info'); }
    return n;
  } catch (e) { if (e && e.code === 'not_granted') S.set.aiCards = false; return 0; }
  finally { GEN_BUSY[mode] = 0; }
}

/* ── endless supply ── */
const isAnswered = id => { const e = typeof ansGet === 'function' && ansGet(id, 'g'); return !!(e && e.ok); };
function genModesFor(G) {
  if (G.mode === 'cat') { const m = CATS[G.cat] && CATS[G.cat].m; return GEN_MODES.includes(m) ? [m] : []; }
  if (G.mode === 'mix') return ({light: ['know','who','dil'], funny: ['who','dil','guess'], romantic: ['flirt','deep'], deep: ['deep','know'], emotional: ['deep'], flirty: ['flirt'], bold: ['flirt'], mix: ['know','deep','who','dil','guess','flirt']})[G.vibe] || [];
  return GEN_MODES.includes(G.mode) && G.mode !== 'tod' ? [G.mode] : [];
}
function moreIds(G, n = 8) {
  const modes = genModesFor(G); if (!modes.length) return [];
  const used = new Set(G.deck); const out = [];
  for (let tries = 0; out.length < n && tries < n * 40; tries++) {
    const mode = modes[tries % modes.length];
    const ai = (mode === 'tod' ? [] : genPool(mode)).filter(c => !used.has(c.id) && !isAnswered(c.id) && !(S.prog.seen[c.id] > 0) && allowed(c));
    let id;
    if (ai.length && Math.random() < .6) id = ai[Math.floor(Math.random() * ai.length)].id;
    else { const tk = mode === 'tod' ? (G.cat && G.cat[0] === 'd' ? 'da' : 'tr') : null; const size = procSize(mode, tk); const cand = 'pg-' + mode + '-' + (tk ? tk + '-' : '') + Math.floor(Math.random() * size); const c = procCard(cand); if (!c || used.has(cand) || isAnswered(cand) || (S.prog.seen[cand] > 0 && tries < n * 30) || !allowed(c)) continue; id = cand; }
    used.add(id); out.push(id);
  }
  if (G.mode === 'cat') out.forEach(id => { const c = anyCard(id); if (c && CATS[G.cat]) c.c = G.cat; });
  modes.forEach(m => genFill(m));
  return out;
}
function todExtra(k, n = 24) { const size = procSize('tod', k); const out = []; for (let i = 0; i < n; i++) { const c = procCard('pg-tod-' + k + '-' + Math.floor(Math.random() * size)); if (c && allowed(c)) out.push(c); } return out; }
const anyCard = id => CARD[id] || (id.startsWith('pg-') ? procCard(id) : id.startsWith('ai-') ? genCard(id) : null);
function modeStock(mode) {
  const st = CARDS.filter(c => c.m === mode && c.k !== 't' && c.k !== 'da');
  const ans = Object.values(ansAll()).filter(e => e.kind === 'game' && e.ok && e.mode === mode).length;
  return {total: GEN_MODES.includes(mode) ? '∞' : st.length, answered: ans};
}

/* ── written answers inside the game ── */
const needsText = c => c && (c.k === 'q' || c.k === 'tr') && c.m !== 'mem';
const GDRAFT = {};
function gameAnsKey(G) { return G.id + ':' + G.card + ':' + (G.st.cards || 0); }
function recordFromG(g) {
  if (!g || !g.card) return; const c = getCard(g.card); if (!c || c.m === 'mem') return;
  const T0 = g.turn, O0 = 1 - g.turn; let t = null, lab = null;
  if (needsText(c) && g.ga && g.ga[0] && g.ga[1]) t = [g.ga[0], g.ga[1]];
  else if (c.k === 'g' && g.phase === 'reveal' && g.txt[0] && g.txt[1]) { t = ['', '']; t[T0] = g.txt[0]; t[O0] = g.txt[1]; lab = ['', '']; lab[T0] = 'ענה'; lab[O0] = 'ניחש'; }
  else if ((c.k === 'w' || c.k === 'd') && g.phase === 'reveal' && g.pick[0] !== null && g.pick[1] !== null) { const opts = c.k === 'w' ? [nm(0), nm(1)] : c.o; t = [opts[g.pick[0]], opts[g.pick[1]]].map(x => String(x || '—')); lab = ['בחר', 'בחר']; }
  if (!t) return;
  const k = ansKey(c.id, 'g'), A = ansAll(); const old = A[k]; const sig = g.id + ':' + g.st.cards;
  if (old && old.sig === sig) return;
  const prev = old ? [{t: old.t, at: old.ok || Math.max(...old.at), q: old.q}].concat(old.prev || []).slice(0, 5) : [];
  A[k] = {id: c.id, per: 'g', kind: 'game', mode: c.m, cat: c.c, pts: 0, q: fmt(c.t, T0), turn: T0, lab, t, at: [Date.now(), Date.now()], ok: Date.now(), sig, prev, o: c.o || null};
  S.prog.seen[c.id] = Math.max(1, S.prog.seen[c.id] || 0);
  save();
}
function gameAnsHtml(c) {
  if (!needsText(c)) return '';
  const ga = G.ga || ['', '']; const live = R.live; const me = R.me;
  const slot = i => {
    const has = !!ga[i]; const mine = !live || me === i; const both = ga[0] && ga[1];
    let inner;
    if (has && (both || (live && mine))) inner = `<p style="white-space:pre-wrap;margin:4px 0 0">${esc(ga[i])}</p>${!both && mine ? `<button class="btn ghost sm" data-act="g_ansed" data-p="${i}">${ic('note')}עריכה</button>` : ''}`;
    else if (has) inner = `<p class="mut sm" style="margin:4px 0 0">${ic('lock')} ${gw(i, 'ענה', 'ענתה')}. נחשף כששניכם עונים.</p>`;
    else if (mine) inner = `<textarea class="inp" id="ga${i}" maxlength="300" rows="2" data-in="gadraft" data-p="${i}" placeholder="${live ? 'התשובה שלך' : 'התשובה של ' + esc(nm(i))}">${esc(GDRAFT[gameAnsKey(G) + i] || '')}</textarea>${live ? `<button class="btn sm wide mt" data-act="g_anssave" data-p="${i}">שמירת התשובה</button>` : ''}`;
    else inner = `<p class="mut sm" style="margin:4px 0 0">${ic('clock')} מחכים לתשובה של ${esc(nm(i))}...</p>`;
    return `<div class="tile" style="padding:10px 12px"><div class="row"><span class="chk ${has ? 'on' : ''}" style="width:22px;height:22px">${has ? ic('check') : ''}</span><b class="sp sm">${esc(nm(i))}${live && me === i ? ' (את/ה)' : ''}</b></div>${inner}</div>`;
  };
  return `<div class="col" style="gap:8px;margin:2px 0 10px"><p class="xs mut" style="margin:0">${ic('note')} כל אחד כותב תשובה משלו. התשובות נשמרות ב"התשובות שלכם".</p>${slot(G.turn)}${slot(1 - G.turn)}</div>`;
}
function answeredPill(c) {
  const e = c && ansGet(c.id, 'g'); if (!e || !e.ok || (G && e.sig && e.sig.startsWith(G.id + ':'))) return '';
  return `<button class="pill" data-act="g_prevans" style="background:rgba(70,211,154,.35);border:0;color:#fff;cursor:pointer">${ic('check')} כבר עניתם · לראות</button>`;
}
function prevAnsSheet(id) {
  const e = ansGet(id, 'g'); if (!e) return; const c = anyCard(id) || {t: e.q, c: e.cat};
  const lab = i => e.lab && e.lab[i] ? ` ${gw(i, e.lab[i], e.lab[i] === 'ענה' ? 'ענתה' : e.lab[i] === 'ניחש' ? 'ניחשה' : 'בחרה')}` : '';
  const rounds = [{t: e.t, at: e.ok}].concat(e.prev || []);
  sheet(`<h3>${esc(e.q || fmt(c.t, 0))}</h3><p class="xs mut">${MODES[e.mode] ? esc(MODES[e.mode].n) : ''}${CATS[e.cat] ? ' · ' + esc(CATS[e.cat].n) : ''}</p>
    ${rounds.map((r, ri) => `<div class="tile mt"><div class="xs mut mb">${ri ? 'פעם קודמת · ' : ''}${fmtDate(r.at)}</div>${[0, 1].map(i => `<div style="margin-top:6px"><b class="sm">${esc(nm(i))}${lab(i)}</b><p style="white-space:pre-wrap;margin:2px 0 0">${esc(r.t[i] || '—')}</p></div>`).join('')}</div>`).join('')}
    <div class="col mt"><button class="btn soft wide" data-close>סגירה</button><button class="btn ghost wide" id="padel" style="color:#ff7b8f">${ic('trash')}מחיקת התשובות</button></div>`,
    b => { $('#padel', b).onclick = () => { closeSheet(); confirmSheet('למחוק את התשובות?', 'התשובות לקלף הזה יימחקו מהמכשיר הזה.', 'מחיקה', () => { delete ansAll()[ansKey(id, 'g')]; save(); render(); }); }; });
}
