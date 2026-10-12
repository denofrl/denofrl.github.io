'use strict';
/* Trainingsplaner – alle Daten bleiben ausschließlich im Browser dieses Geräts (localStorage).
   Es gibt keinen Server: niemand sonst kann diese Daten sehen oder ändern. */

const KEY = 'trainingsplaner.v1'; // Schlüssel bleibt gleich, damit vorhandene Daten erhalten bleiben
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const BASE_CAT = { OA: 'Oberkörper', OB: 'Oberkörper', UA: 'Unterkörper', UB: 'Unterkörper' };
const ROT_LABEL = { R1: 'Rotation Kraft / Calisthenics', R2: 'Rotation Laufen / Cardio' };
const MAX_IMPORT = 1024 * 1024; // 1 MB

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');

/* ---------- Datum ---------- */
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const fmtD = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return fmtD(d); };
const weekday = s => (parseD(s).getDay() + 6) % 7; // 0 = Montag
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minToT = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const shortD = s => { const d = parseD(s); return `${WD[weekday(s)]} ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`; };
function nextMonday() { const t = fmtD(new Date()); const w = weekday(t); return w === 0 ? t : addDays(t, 7 - w); }

/* ---------- Validierung (gilt für gespeicherte Daten UND importierte Dateien) ---------- */
const RE_ID = /^[A-Za-z0-9_-]{1,40}$/, RE_DATE = /^\d{4}-\d{2}-\d{2}$/, RE_TIME = /^([01]\d|2[0-3]):[0-5]\d$/, RE_EDIT = /^[KL]\d{4}-\d{2}-\d{2}(-\d{1,2})?$/;
const isDate = x => typeof x === 'string' && RE_DATE.test(x) && !isNaN(parseD(x));
const str = (x, n, d = '') => (typeof x === 'string' ? x.trim().slice(0, n) : d);
const int = (x, lo, hi, d) => { const n = parseInt(x, 10); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const arr = (x, n) => (Array.isArray(x) ? x.slice(0, n) : []);
const obj = x => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});

/* ---------- Zustand ---------- */
function mkPlan(t) {
  return { id: t.id, name: t.name, cat: t.cat, note: t.note || '', dur: t.dur || 0, items: t.items.map(([ex, sets, reps]) => ({ uid: uid(), ex, sets, reps })) };
}
const defaultTemplates = () => DEFAULT_TEMPLATES.map(mkPlan);
const slot = (wd, time, dur, use) => ({ id: 's' + uid(), wd, time, dur, use });
function defaults() {
  return {
    v: 3, templates: defaultTemplates(), custom: {}, cats: [], ui: { theme: 'auto' },
    cal: { start: nextMonday(), weeks: 8, cues: true,
      slots: [slot(0, '18:00', 60, 'R1'), slot(2, '18:00', 60, 'R1'), slot(4, '18:00', 60, 'R1'), slot(5, '10:00', 40, 'R2')],
      rot1: ['OA', 'UA', 'OB', 'UB'], first1: 0, rot2: ['RG', 'RV', 'RG', 'RL'], first2: 0 },
    edits: {}, lastExport: null
  };
}
function validState(s) {
  if (!s || typeof s !== 'object' || ![1, 2, 3].includes(s.v) || !Array.isArray(s.templates) || !s.templates.length) return false;
  return s.templates.every(t => t && typeof t.name === 'string' && Array.isArray(t.items)) && s.cal && typeof s.cal === 'object';
}
// Ältere Versionen schrittweise auf den aktuellen Stand bringen, ohne Nutzerdaten zu verwerfen.
function migrate(s) {
  if (s.v === 1) {
    s.templates.forEach(t => { t.cat = t.cat || BASE_CAT[t.id] || 'Ganzkörper'; });
    s.cal.mode = 'rot'; s.cal.rot = s.templates.map(t => t.id).slice(0, 4); s.cal.fixed = {};
    if (!s.templates.some(t => t.id === 'GK')) s.templates.push(mkPlan(DEFAULT_TEMPLATES.find(t => t.id === 'GK')));
    s.cal.run = { ...obj(s.cal.run), plan: '' };
    s.v = 2;
  }
  if (s.v === 2) {
    const c = s.cal, days = obj(c.days), fixed = obj(c.fixed), slots = [];
    Object.keys(days).map(Number).sort().forEach(wd => slots.push(slot(wd, days[wd], c.dur || 60, c.mode === 'fix' && fixed[wd] ? fixed[wd] : 'R1')));
    const run = obj(c.run);
    if (run.on) slots.push(slot(run.day, run.time, run.dur || 30, run.plan && run.plan !== 'CA' ? run.plan : 'R2'));
    c.slots = slots; c.rot1 = Array.isArray(c.rot) ? c.rot : ['OA', 'UA', 'OB', 'UB']; c.first1 = c.first || 0;
    c.rot2 = ['RG', 'RV', 'RG', 'RL']; c.first2 = 0;
    ['RG', 'RV', 'RL'].forEach(id => { if (!s.templates.some(t => t.id === id)) s.templates.push(mkPlan(DEFAULT_TEMPLATES.find(t => t.id === id))); });
    s.templates.forEach(t => { t.items = t.items.filter(it => it && it.ex !== 'jacks'); }); // Hampelmann entfernt
    s.v = 3;
  }
  return s;
}
// Baut aus beliebigen Eingabedaten einen sauberen Zustand. Nur bekannte Felder mit gültigen Werten werden übernommen;
// eingebaute Übungen und Vorlagen (im Code) können nicht überschrieben werden.
function sanitize(input) {
  if (!validState(input)) return null;
  const s = migrate(JSON.parse(JSON.stringify(input)));
  const d = defaults(), out = { v: 3 };
  out.cats = [...new Set(arr(s.cats, 30).map(c => str(c, 30)).filter(c => c && !PLAN_CATS.includes(c) && !EX_CATS.includes(c)))];
  const planCats = [...PLAN_CATS, ...out.cats], exCats = [...EX_CATS, ...out.cats];
  out.ui = { theme: THEMES[obj(s.ui).theme] ? s.ui.theme : 'auto' };
  out.custom = {};
  for (const [id, c0] of Object.entries(obj(s.custom)).slice(0, 200)) {
    const c = obj(c0), name = str(c.name, 60);
    if (!RE_ID.test(id) || !id.startsWith('c_') || EXERCISES[id] || !name) continue;
    out.custom[id] = { own: true, name, cat: exCats.includes(c.cat) ? c.cat : 'Oberkörper',
      m: arr(c.m, 20).filter(m => MUSCLES.includes(m)), eq: EQUIP.includes(c.eq) ? c.eq : 'Körpergewicht', lv: int(c.lv, 1, 3, 1),
      cues: arr(c.cues, 10).map(x => str(x, 200)).filter(Boolean), easy: str(c.easy, 160), hard: str(c.hard, 160) };
  }
  const exOk = id => typeof id === 'string' && (EXERCISES[id] || out.custom[id]);
  const seen = new Set();
  out.templates = arr(s.templates, 50).map(t0 => {
    const t = obj(t0); let id = typeof t.id === 'string' && RE_ID.test(t.id) && !seen.has(t.id) ? t.id : 'p_' + uid(); seen.add(id);
    return { id, name: str(t.name, 40) || 'Plan', cat: planCats.includes(t.cat) ? t.cat : 'Sonstiges', note: str(t.note, 300), dur: int(t.dur, 0, 240, 0),
      items: arr(t.items, 40).map(obj).filter(it => exOk(it.ex)).map(it => ({ uid: uid(), ex: it.ex, sets: int(it.sets, 1, 10, 2), reps: str(String(it.reps ?? ''), 40) || '10' })) };
  });
  if (!out.templates.length) out.templates = defaultTemplates();
  const planOk = id => out.templates.some(t => t.id === id);
  const c = obj(s.cal);
  out.cal = { start: isDate(c.start) ? c.start : d.cal.start, weeks: int(c.weeks, 1, 52, 8), cues: c.cues !== false,
    slots: arr(c.slots, 21).map(obj).filter(x => Number.isInteger(x.wd) && x.wd >= 0 && x.wd < 7 && RE_TIME.test(x.time))
      .map(x => ({ id: RE_ID.test(x.id) ? x.id : 's' + uid(), wd: x.wd, time: x.time, dur: int(x.dur, 10, 240, 60),
        use: x.use === 'R1' || x.use === 'R2' || planOk(x.use) ? x.use : 'R1' })),
    rot1: arr(c.rot1, 30).filter(planOk), first1: int(c.first1, 0, 29, 0),
    rot2: arr(c.rot2, 30).filter(planOk), first2: int(c.first2, 0, 29, 0) };
  out.edits = {};
  for (const [k, e0] of Object.entries(obj(s.edits)).slice(0, 2000)) {
    const e = obj(e0); if (!RE_EDIT.test(k)) continue;
    const x = {};
    if (isDate(e.date)) x.date = e.date;
    if (RE_TIME.test(e.time)) x.time = e.time;
    if (e.dur != null) x.dur = int(e.dur, 10, 240, 60);
    if (e.skip === true) x.skip = true;
    if (planOk(e.plan)) x.plan = e.plan;
    if (Object.keys(x).length) out.edits[k] = x;
  }
  out.lastExport = Number.isFinite(s.lastExport) ? s.lastExport : null;
  return out;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v < 3) { try { localStorage.setItem(KEY + '.backup-v' + parsed.v, raw); } catch (e) { /* optional */ } }
      const s = sanitize(parsed);
      if (s) return s;
    }
  } catch (e) { /* ungültig → Standard */ }
  return defaults();
}
let S = load();
let storageOk = true;
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); storageOk = true; }
  catch (e) { storageOk = false; toast('Speichern nicht möglich (privater Modus?). Änderungen gehen beim Schließen verloren.'); }
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); }
function applyTheme() {
  const t = S.ui.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
}

const allEx = () => ({ ...EXERCISES, ...S.custom });
const exInfo = id => EXERCISES[id] || S.custom[id] || { name: 'Unbekannte Übung', cat: 'Oberkörper', m: [], cues: [] };
const planById = id => S.templates.find(t => t.id === id) || null;
const dose = it => (Number(it.sets) === 1 && /min|\bs\b|sek|\bm\b/i.test(it.reps)) ? it.reps : `${it.sets} × ${it.reps}`;
const planOpts = (sel, extra = '', cat = true) => extra + S.templates.map(t => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${esc(t.name)}${cat ? ` (${esc(t.cat)})` : ''}</option>`).join('');
const planCats = () => [...PLAN_CATS, ...S.cats];
const exCats = () => [...EX_CATS, ...S.cats];
const catSelect = (list, cur, attrs) => `<select class="catsel" ${attrs}>${list.map(c => `<option${c === cur ? ' selected' : ''}>${esc(c)}</option>`).join('')}<option value="__new">+ Neue Kategorie …</option></select>`;

/* ---------- Termine ---------- */
function slotKind(use) {
  if (use === 'R1') return 'K';
  if (use === 'R2') return 'L';
  const p = planById(use); return p && p.cat === 'Cardio' ? 'L' : 'K';
}
function buildEvents() {
  const c = S.cal, list = [];
  const slots = [...c.slots].sort((a, b) => a.wd - b.wd || a.time.localeCompare(b.time));
  for (let i = 0; i < c.weeks * 7; i++) {
    const d = addDays(c.start, i), w = weekday(d), seen = {};
    for (const sl of slots.filter(x => x.wd === w)) {
      const base = slotKind(sl.use) + d;
      seen[base] = (seen[base] || 0) + 1;
      list.push({ id: seen[base] > 1 ? `${base}-${seen[base]}` : base, use: sl.use, date: d, time: sl.time, dur: sl.dur });
    }
  }
  for (const e of list) {
    const x = S.edits[e.id];
    if (x) {
      e.date = x.date || e.date; e.time = x.time || e.time; if (x.dur) { e.dur = x.dur; e.durSet = true; }
      e.skip = !!x.skip; e.edited = true; if (x.plan && planById(x.plan)) e.over = x.plan;
    }
  }
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.id.localeCompare(b.id));
  // Zwei getrennte, fortlaufende Rotationen: keine Einheit fällt weg; ausgelassene Termine verbrauchen keinen Plan.
  const rots = { R1: c.rot1.filter(planById), R2: c.rot2.filter(planById) }, k = { R1: c.first1, R2: c.first2 };
  for (const e of list) {
    if (e.over) e.plan = e.over;
    else if (rots[e.use]) {
      const r = rots[e.use];
      if (e.skip || !r.length) e.plan = r.length ? null : S.templates[0].id;
      else { e.plan = r[k[e.use] % r.length]; k[e.use]++; }
    } else e.plan = planById(e.use) ? e.use : S.templates[0].id;
    const p = planById(e.plan);
    if (p && p.dur && !e.durSet) e.dur = p.dur;
    e.cardio = p ? p.cat === 'Cardio' : e.use === 'R2';
  }
  const act = list.filter(e => !e.skip);
  const span = e => { const s = parseD(e.date).getTime() / 6e4 + toMin(e.time); return [s, s + Number(e.dur)]; };
  for (let i = 0; i < act.length; i++) for (let j = i + 1; j < act.length; j++) {
    const [a1, a2] = span(act[i]), [b1, b2] = span(act[j]);
    if (a1 < b2 && b1 < a2) { act[i].clash = act[j].clash = true; }
  }
  return list;
}
function evTitle(e) {
  const p = planById(e.plan);
  if (!p) return e.cardio ? 'Cardio' : 'Training';
  return p.cat === 'Cardio' ? `Cardio – ${p.name}` : `Krafttraining – ${p.name}`;
}
// Beschreibung wird beim Export aus dem aktuellen Plan erzeugt.
function evDescription(e) {
  const p = planById(e.plan);
  if (!p) return RUN_HINT;
  const L = [`${p.name} (${p.cat})`, ''];
  p.items.forEach((it, i) => {
    const x = exInfo(it.ex);
    L.push(`${i + 1}. ${x.name} – ${dose(it)}`);
    if (S.cal.cues && x.cues && x.cues[0]) L.push(`   ${x.cues[0]}`);
  });
  if (!p.items.length) L.push('(Keine Übungen eingetragen)');
  if (p.note) L.push('', p.note);
  if (p.cat !== 'Cardio') L.push('', TRAINING_HINT);
  return L.join('\n');
}

/* ---------- ICS ---------- */
function icsEsc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
function icsFold(line) {
  const enc = new TextEncoder(); let out = '', cur = '', n = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (n + b > 75) { out += cur + '\r\n '; cur = ''; n = 1; }
    cur += ch; n += b;
  }
  return out + cur;
}
// Lokale Zeit → UTC. Der Browser kennt die Sommer-/Winterzeit-Regeln für jedes einzelne Datum.
function icsUTC(date, time, addMin = 0) {
  const [y, m, d] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, mi + addMin).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
function buildICS(events) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//denofrl//Trainingsplaner//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Training'];
  for (const e of events) {
    const p = planById(e.plan);
    L.push('BEGIN:VEVENT',
      `UID:${e.id}-${S.cal.start}@denofrl.github.io`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsUTC(e.date, e.time)}`,
      `DTEND:${icsUTC(e.date, e.time, Number(e.dur))}`,
      `SUMMARY:${icsEsc(evTitle(e))}`,
      `DESCRIPTION:${icsEsc(evDescription(e))}`,
      `CATEGORIES:${icsEsc(p ? p.cat : 'Training')}`,
      'TRANSP:OPAQUE', 'END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
function download(name, text, type) {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- Ansicht: Trainingsplan ---------- */
let curTpl = 0, editMode = false, newPlan = false, openEv = null;

function exOptions(sel) {
  const groups = {};
  for (const [id, e] of Object.entries(allEx())) { const g = e.own ? 'Eigene Übungen' : e.cat; (groups[g] = groups[g] || []).push([id, e.name]); }
  return Object.entries(groups).map(([g, a]) =>
    `<optgroup label="${esc(g)}">${a.sort((x, y) => x[1].localeCompare(y[1], 'de')).map(([id, n]) => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(n)}</option>`).join('')}</optgroup>`).join('');
}
function variantsHTML(e) {
  return `${e.m && e.m.length ? `<p class="mut"><b>Muskeln:</b> ${esc(e.m.join(', '))}</p>` : ''}
    ${e.cues && e.cues.length ? `<ul>${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    ${e.easy ? `<p class="var"><b>Leichter:</b> ${esc(e.easy)}</p>` : ''}${e.hard ? `<p class="var"><b>Schwerer:</b> ${esc(e.hard)}</p>` : ''}`;
}

function renderPlan() {
  if (curTpl >= S.templates.length) curTpl = 0;
  const chips = `<div class="chips" role="tablist">${S.templates.map((x, i) => `<button data-act="tpl" data-i="${i}" class="${i === curTpl && !newPlan ? 'on' : ''}">${esc(x.name)}<small>${esc(x.cat)}</small></button>`).join('')}
    <button data-act="pnew" class="add${newPlan ? ' on' : ''}">+ Neuer Plan</button></div>`;
  if (newPlan) {
    return chips + `<h2>Neuen Plan anlegen</h2><div class="card">
      <label class="f">Name<input type="text" id="npName" maxlength="40" placeholder="z. B. Push Tag"></label>
      <label class="f" style="margin-top:8px">Kategorie${catSelect(planCats(), 'Ganzkörper', 'id="npCat"')}</label>
      <label class="f" style="margin-top:8px">Startpunkt<select id="npFrom"><option value="">Leerer Plan</option>${S.templates.map(t => `<option value="${t.id}">Kopie von ${esc(t.name)}</option>`).join('')}</select></label>
      <div class="row" style="margin-top:12px"><button class="pri sp" data-act="npCreate">Anlegen</button><button class="sp" data-act="npCancel">Abbrechen</button></div></div>`;
  }
  const t = S.templates[curTpl];
  let h = chips + `<div class="row" style="margin-top:14px"><div class="sp"><h2 style="margin:0">${esc(t.name)}</h2><span class="tag">${esc(t.cat)}</span>${t.dur ? ` <span class="tag">${t.dur} min</span>` : ''}</div>
  <button data-act="edit" class="${editMode ? 'pri' : ''}">${editMode ? 'Fertig' : 'Bearbeiten'}</button></div>`;
  if (editMode) {
    h += `<div class="card"><div class="row"><label class="f">Name<input type="text" maxlength="40" value="${esc(t.name)}" data-act="pname"></label>
      <label class="f">Kategorie${catSelect(planCats(), t.cat, 'data-act="pcat"')}</label></div>
      <label class="f" style="margin-top:8px">Dauer im Kalender (Minuten, optional – leer = Dauer des Termins)<input type="number" min="0" max="240" step="5" inputmode="numeric" value="${t.dur || ''}" data-act="pdur"></label>
      <label class="f" style="margin-top:8px">Hinweis zum Plan (optional, erscheint im Kalender)<textarea maxlength="300" data-act="pnote">${esc(t.note)}</textarea></label>
      <div class="row" style="margin-top:8px"><button class="sp" data-act="pcopy">Plan kopieren</button><button class="sp dang" data-act="pdel" ${S.templates.length < 2 ? 'disabled' : ''}>Plan löschen</button></div></div>`;
  } else {
    h += `<p class="mut">${esc(t.note || (t.cat === 'Cardio' ? RUN_HINT : TRAINING_HINT))}</p>`;
  }
  if (!t.items.length) h += '<div class="card mut">Keine Übungen. Tippe auf „Bearbeiten“ oder füge Übungen im Bereich „Übungen“ hinzu.</div>';
  t.items.forEach((it, i) => {
    const e = exInfo(it.ex);
    h += `<div class="card ex"><div class="fig">${figureSVG(e.pose || CUSTOM_POSE)}</div><div>`;
    if (editMode) {
      h += `<span class="num">Übung ${i + 1}</span>
        <select data-act="swap" data-i="${i}" aria-label="Übung austauschen">${exOptions(it.ex)}</select>
        <div class="edit-grid"><label class="f">Sätze<input type="number" min="1" max="10" inputmode="numeric" value="${esc(it.sets)}" data-act="sets" data-i="${i}"></label>
        <label class="f">Wiederholungen / Zeit<input type="text" value="${esc(it.reps)}" data-act="reps" data-i="${i}"></label></div>
        <div class="edit-actions"><button class="ico" data-act="up" data-i="${i}" aria-label="Nach oben" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button class="ico" data-act="down" data-i="${i}" aria-label="Nach unten" ${i === t.items.length - 1 ? 'disabled' : ''}>↓</button>
        <span class="sp"></span><button class="dang" data-act="del" data-i="${i}">Entfernen</button></div>`;
    } else {
      h += `<span class="num">${i + 1}. · ${esc(e.cat)}</span><h3>${esc(e.name)}</h3><div class="dose">${esc(dose(it))}</div>
        <details><summary>Anleitung & Varianten</summary>${variantsHTML(e)}</details>`;
    }
    h += '</div></div>';
  });
  if (editMode) {
    h += `<div class="card"><h3>Übung hinzufügen</h3><div class="row" style="margin-top:8px"><div class="sp"><select id="addSel">${exOptions('')}</select></div>
      <button class="pri" data-act="add">Hinzufügen</button></div>
      <p class="mut">Eigene Übungen legst du im Bereich „Übungen“ an.</p></div>
      ${DEFAULT_TEMPLATES.some(d => d.id === t.id) ? `<button class="dang full" data-act="resetTpl">„${esc(t.name)}“ auf Vorlage zurücksetzen</button>` : ''}`;
  }
  return h;
}

function planAction(act, i, el) {
  const t = S.templates[curTpl], items = t.items;
  switch (act) {
    case 'tpl': curTpl = i; newPlan = false; break;
    case 'edit': editMode = !editMode; break;
    case 'up': if (i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]]; break;
    case 'down': if (i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]]; break;
    case 'del': items.splice(i, 1); break;
    case 'swap': items[i].ex = el.value; break;
    case 'sets': items[i].sets = int(el.value, 1, 10, 1); break;
    case 'reps': items[i].reps = el.value.trim().slice(0, 40) || '10'; break;
    case 'add': items.push({ uid: uid(), ex: $('#addSel').value, sets: 2, reps: '10–12' }); break;
    case 'pname': t.name = el.value.trim().slice(0, 40) || 'Ohne Namen'; break;
    case 'pcat': if (el.value === '__new') return false; t.cat = el.value; break;
    case 'pdur': t.dur = int(el.value, 0, 240, 0); break;
    case 'pnote': t.note = el.value.trim().slice(0, 300); break;
    case 'pnew': newPlan = true; editMode = false; return 'view';
    case 'npCancel': newPlan = false; return 'view';
    case 'npCreate': {
      const name = $('#npName').value.trim().slice(0, 40), cat = $('#npCat').value, from = planById($('#npFrom').value);
      if (!name) { toast('Bitte einen Namen eingeben.'); $('#npName').focus(); return false; }
      const p = from ? JSON.parse(JSON.stringify(from)) : { note: '', dur: 0, items: [] };
      p.id = 'p_' + uid(); p.name = name; p.cat = planCats().includes(cat) ? cat : 'Sonstiges';
      p.items.forEach(it => { it.uid = uid(); });
      S.templates.push(p); curTpl = S.templates.length - 1; newPlan = false; editMode = true; break;
    }
    case 'pcopy': {
      const c = JSON.parse(JSON.stringify(t)); c.id = 'p_' + uid(); c.name = (t.name + ' (Kopie)').slice(0, 40);
      c.items.forEach(it => { it.uid = uid(); });
      S.templates.splice(curTpl + 1, 0, c); curTpl++; toast('Plan kopiert.'); break;
    }
    case 'pdel': {
      if (S.templates.length < 2 || !confirm(`Plan „${t.name}“ löschen? Kalendertermine mit diesem Plan bekommen einen anderen Plan.`)) return false;
      S.templates.splice(curTpl, 1);
      S.cal.rot1 = S.cal.rot1.filter(id => id !== t.id); S.cal.rot2 = S.cal.rot2.filter(id => id !== t.id);
      S.cal.slots.forEach(sl => { if (sl.use === t.id) sl.use = t.cat === 'Cardio' ? 'R2' : 'R1'; });
      curTpl = Math.max(0, curTpl - 1); editMode = false; break;
    }
    case 'resetTpl': {
      if (!confirm(`„${t.name}“ wirklich auf die Standardvorlage zurücksetzen?`)) return false;
      const d = DEFAULT_TEMPLATES.find(x => x.id === t.id);
      if (d) S.templates[curTpl] = mkPlan(d);
      break;
    }
    default: return false;
  }
  return true;
}

/* ---------- Ansicht: Übungen ---------- */
let libQ = '', libF = { m: '', cat: '', eq: '', lv: '' }, libEdit = null;
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function libMatch(e) {
  if (!e) return false;
  if (libF.m && !(e.m || []).includes(libF.m)) return false;
  if (libF.cat && e.cat !== libF.cat) return false;
  if (libF.eq && e.eq !== libF.eq) return false;
  if (libF.lv && String(e.lv) !== libF.lv) return false;
  if (libQ) {
    const hay = norm([e.name, e.cat, e.eq, (e.m || []).join(' '), (e.cues || []).join(' ')].join(' '));
    if (!norm(libQ).split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
function filterLib() {
  const all = allEx(); let n = 0;
  document.querySelectorAll('.libitem').forEach(el => { const ok = libMatch(all[el.dataset.id]); el.hidden = !ok; if (ok) n++; });
  const c = $('#libCount'); if (c) c.textContent = `${n} Übung${n === 1 ? '' : 'en'}`;
}
function libForm(id) {
  const e = id === 'new' ? { name: '', cat: 'Oberkörper', m: [], eq: 'Körpergewicht', lv: 1, cues: [], easy: '', hard: '' } : S.custom[id];
  const sel = (a, cur, lab = v => v) => a.map(v => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(lab(v))}</option>`).join('');
  return `<div class="card evedit"><h3>${id === 'new' ? 'Eigene Übung anlegen' : 'Übung bearbeiten'}</h3>
    <label class="f" style="margin-top:8px">Name<input type="text" id="fName" maxlength="60" value="${esc(e.name)}"></label>
    <div class="row" style="margin-top:8px"><label class="f">Kategorie${catSelect(exCats(), e.cat, 'id="fCat"')}</label>
    <label class="f">Ausrüstung<select id="fEq">${sel(EQUIP, e.eq)}</select></label>
    <label class="f">Schwierigkeit<select id="fLv">${sel([1, 2, 3], e.lv, v => LEVELS[v])}</select></label></div>
    <p class="mut" style="margin-top:10px">Muskelgruppen</p>
    <div class="checks">${MUSCLES.map(m => `<label><input type="checkbox" class="fM" value="${m}"${e.m.includes(m) ? ' checked' : ''}> ${m}</label>`).join('')}</div>
    <label class="f" style="margin-top:8px">Anleitung (eine Zeile pro Hinweis)<textarea id="fCues">${esc(e.cues.join('\n'))}</textarea></label>
    <label class="f" style="margin-top:8px">Leichtere Variante<input type="text" id="fEasy" maxlength="160" value="${esc(e.easy)}"></label>
    <label class="f" style="margin-top:8px">Schwerere Variante<input type="text" id="fHard" maxlength="160" value="${esc(e.hard)}"></label>
    <div class="row" style="margin-top:10px"><button class="pri" data-act="libSave" data-id="${id}">Speichern</button><button data-act="libCancel">Abbrechen</button></div></div>`;
}
function renderLib() {
  const all = allEx();
  const sel = (k, label, a, lab = v => v) => `<label class="f">${label}<select data-act="libF" data-k="${k}"><option value="">Alle</option>${a.map(v => `<option value="${esc(v)}"${String(v) === libF[k] ? ' selected' : ''}>${esc(lab(v))}</option>`).join('')}</select></label>`;
  let h = `<div class="card"><input type="search" id="libQ" placeholder="Übung suchen …" value="${esc(libQ)}" aria-label="Übung suchen">
    <div class="filters">${sel('m', 'Muskelgruppe', MUSCLES)}${sel('cat', 'Kategorie', exCats())}${sel('eq', 'Ausrüstung', EQUIP)}${sel('lv', 'Schwierigkeit', [1, 2, 3], v => LEVELS[v])}</div>
    <div class="row" style="margin-top:8px"><span class="mut sp" id="libCount"></span><button data-act="libReset">Filter zurücksetzen</button></div></div>
    ${libEdit ? libForm(libEdit) : '<button class="full" data-act="libNew">+ Eigene Übung anlegen</button>'}`;
  const cats = exCats(), ord = c => (cats.indexOf(c) + 1) || 99;
  const ids = Object.keys(all).sort((a, b) => ord(all[a].cat) - ord(all[b].cat) || all[a].name.localeCompare(all[b].name, 'de'));
  for (const id of ids) {
    const e = all[id];
    h += `<div class="card ex libitem" data-id="${id}"${libMatch(e) ? '' : ' hidden'}><div class="fig">${figureSVG(e.pose || CUSTOM_POSE)}</div><div>
      <span class="num">${esc(e.cat)}${e.own ? ' · eigene' : ''}</span><h3>${esc(e.name)}</h3>
      <div class="meta"><span class="tag">${esc(e.eq)}</span><span class="tag lv${e.lv}">${LEVELS[e.lv] || ''}</span></div>
      <details><summary>Anleitung & Varianten</summary>${variantsHTML(e)}
        <div class="row" style="margin-top:8px"><div class="sp"><select id="to_${id}" aria-label="Plan">${planOpts(S.templates[curTpl] ? S.templates[curTpl].id : '')}</select></div>
        <button class="pri" data-act="libAdd" data-id="${id}">Zum Plan</button></div>
        ${e.own ? `<div class="row" style="margin-top:8px"><button class="sp" data-act="libEditEx" data-id="${id}">Bearbeiten</button><button class="sp dang" data-act="libDel" data-id="${id}">Löschen</button></div>` : ''}
      </details></div></div>`;
  }
  return h;
}
function libAction(act, el, id) {
  switch (act) {
    case 'libF': libF[el.dataset.k] = el.value; filterLib(); return false;
    case 'libReset': libQ = ''; libF = { m: '', cat: '', eq: '', lv: '' }; return 'view';
    case 'libNew': libEdit = 'new'; return 'view';
    case 'libEditEx': libEdit = id; window.scrollTo(0, 0); return 'view';
    case 'libCancel': libEdit = null; return 'view';
    case 'libSave': {
      const name = $('#fName').value.trim();
      if (!name) { toast('Bitte einen Namen eingeben.'); return false; }
      const nid = id === 'new' ? 'c_' + uid() : id;
      if (EXERCISES[nid]) return false;
      S.custom[nid] = { own: true, name: name.slice(0, 60), cat: exCats().includes($('#fCat').value) ? $('#fCat').value : 'Oberkörper', eq: $('#fEq').value, lv: int($('#fLv').value, 1, 3, 1),
        m: [...document.querySelectorAll('.fM:checked')].map(x => x.value),
        cues: $('#fCues').value.split('\n').map(s => s.trim().slice(0, 200)).filter(Boolean).slice(0, 10),
        easy: $('#fEasy').value.trim().slice(0, 160), hard: $('#fHard').value.trim().slice(0, 160) };
      libEdit = null; toast('Übung gespeichert.'); return true;
    }
    case 'libDel': {
      const used = S.templates.filter(t => t.items.some(it => it.ex === id));
      if (!S.custom[id] || !confirm(`„${S.custom[id].name}“ löschen?${used.length ? ` Sie wird auch aus ${used.length} Plan/Plänen entfernt.` : ''}`)) return false;
      used.forEach(t => { t.items = t.items.filter(it => it.ex !== id); });
      delete S.custom[id]; return true;
    }
    case 'libAdd': {
      const p = planById($('#to_' + id).value);
      if (!p) return false;
      p.items.push({ uid: uid(), ex: id, sets: EXERCISES[id] && EXERCISES[id].cat === 'Cardio' ? 1 : 2, reps: EXERCISES[id] && EXERCISES[id].cat === 'Cardio' ? '20 min' : '10–12' });
      toast(`Zu „${p.name}“ hinzugefügt. Sätze/Wdh. im Plan anpassen.`); return true;
    }
    default: return false;
  }
}

/* ---------- Ansicht: Kalender ---------- */
function rotEditor(r) {
  const c = S.cal, list = c[r].filter(planById), fk = r === 'rot1' ? 'first1' : 'first2';
  return `<h3>${r === 'rot1' ? ROT_LABEL.R1 : ROT_LABEL.R2}</h3>
    <ol class="rot">${list.map((id, i) => `<li><span class="sp">${esc(planById(id).name)}</span>
      <button class="ico" data-act="rotUp" data-r="${r}" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">↑</button>
      <button class="ico" data-act="rotDown" data-r="${r}" data-i="${i}" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Nach unten">↓</button>
      <button class="ico dang" data-act="rotDel" data-r="${r}" data-i="${i}" aria-label="Entfernen">✕</button></li>`).join('')}</ol>
    ${list.length ? '' : '<p class="note w">Noch kein Plan in dieser Rotation.</p>'}
    <div class="row"><div class="sp"><select id="add_${r}" aria-label="Plan hinzufügen">${planOpts('')}</select></div><button data-act="rotAdd" data-r="${r}">Hinzufügen</button></div>
    ${list.length > 1 ? `<label class="f" style="margin-top:8px">Beginnt mit<select data-act="first" data-r="${fk}">${list.map((id, i) => `<option value="${i}"${i === Math.min(c[fk], list.length - 1) ? ' selected' : ''}>${i + 1}. ${esc(planById(id).name)}</option>`).join('')}</select></label>` : ''}`;
}
function renderCal() {
  const c = S.cal, ev = buildEvents();
  const active = ev.filter(e => !e.skip), clashes = active.filter(e => e.clash).length;
  const nC = active.filter(e => e.cardio).length, nK = active.length - nC;
  const slots = [...c.slots].sort((a, b) => a.wd - b.wd || a.time.localeCompare(b.time));
  const perWeekC = slots.filter(s => slotKind(s.use) === 'L').length;
  const useOpts = cur => `<optgroup label="Rotation">${['R1', 'R2'].map(r => `<option value="${r}"${cur === r ? ' selected' : ''}>${ROT_LABEL[r]}</option>`).join('')}</optgroup>
    <optgroup label="Fester Plan">${planOpts(cur, '', false)}</optgroup>`;
  const end = addDays(c.start, c.weeks * 7 - 1);
  let h = `<h2>Wochenplan</h2><div class="card">
    <p class="mut">Alle Trainings einer Woche – Kraft, Calisthenics und Laufen. Jeder Termin nutzt eine Rotation oder einen festen Plan. Mehrere Termine pro Tag sind möglich.</p>
    ${slots.length ? '<div class="slothead"><span>Tag</span><span>Uhrzeit</span><span>Minuten</span></div>' : ''}
    ${slots.map(s => `<div class="slot${slotKind(s.use) === 'L' ? ' L' : ''}">
      <div class="slotrow"><select data-act="sWd" data-id="${s.id}" aria-label="Wochentag">${WD_LONG.map((d, i) => `<option value="${i}"${i === s.wd ? ' selected' : ''}>${d}</option>`).join('')}</select>
      <input type="time" value="${s.time}" data-act="sTime" data-id="${s.id}" aria-label="Uhrzeit">
      <input type="number" min="10" max="240" step="5" inputmode="numeric" value="${s.dur}" data-act="sDur" data-id="${s.id}" aria-label="Dauer in Minuten"></div>
      <div class="slotrow2"><select data-act="sUse" data-id="${s.id}" aria-label="Inhalt">${useOpts(s.use)}</select>
      <button class="ico dang" data-act="sDel" data-id="${s.id}" aria-label="Termin entfernen">✕</button></div></div>`).join('')}
    ${slots.length ? '' : '<p class="note w">Noch keine Trainingstermine. Füge mindestens einen hinzu.</p>'}
    <button class="full" data-act="sAdd">+ Trainingstermin</button>
    <p class="mut" style="margin-top:8px">${slots.length} Einheiten pro Woche: ${slots.length - perWeekC}× Kraft/Calisthenics, ${perWeekC}× Laufen/Cardio. Dauer in Minuten; Pläne mit eigener Dauer (z. B. Long Run) überschreiben sie.</p></div>

    <h2>Rotationen</h2><div class="card">
    <p class="mut">Die Pläne einer Rotation werden fortlaufend auf die zugehörigen Termine verteilt – so fällt keiner weg. Pläne dürfen mehrfach vorkommen.</p>
    ${rotEditor('rot1')}<hr>${rotEditor('rot2')}</div>

    <h2>Zeitraum</h2><div class="card"><div class="row">
    <label class="f">Startdatum<input type="date" value="${c.start}" data-act="start"></label>
    <div class="f">Wochen<div class="stepper"><button class="ico" data-act="wMinus" aria-label="Eine Woche weniger" ${c.weeks <= 1 ? 'disabled' : ''}>−</button>
      <input type="number" min="1" max="52" inputmode="numeric" value="${c.weeks}" data-act="weeks" aria-label="Anzahl Wochen">
      <button class="ico" data-act="wPlus" aria-label="Eine Woche mehr" ${c.weeks >= 52 ? 'disabled' : ''}>+</button></div></div></div>
    <p class="mut" style="margin-top:8px">Zeitraum: ${shortD(c.start)}${parseD(c.start).getFullYear()} bis ${shortD(end)}${parseD(end).getFullYear()} (1–52 Wochen)</p></div>

    <h2>Vorschau</h2>
    <div class="stats"><span class="tag">${nK}× Kraft/Calisthenics</span>${nC ? `<span class="tag run">${nC}× Cardio</span>` : ''}
    ${clashes ? `<span class="tag w">${clashes} Termine überschneiden sich</span>` : ''}</div>
    <p class="mut">Tippe auf einen Termin, um ihn zu verschieben, einen anderen Plan zu wählen oder ihn auszulassen.</p>`;
  let wk = -1;
  for (const e of ev) {
    const w = Math.floor((parseD(e.date) - parseD(c.start)) / 864e5 / 7);
    if (w !== wk) { wk = w; h += `<div class="week">Woche ${w + 1}</div>`; }
    const endT = minToT(toMin(e.time) + Number(e.dur));
    h += `<button class="ev${e.cardio ? ' L' : ''}${e.skip ? ' skip' : ''}${e.clash ? ' clash' : ''}" data-act="ev" data-id="${e.id}">
      <span class="d">${shortD(e.date)}</span><span class="t">${e.skip ? (e.cardio ? 'Cardio' : 'Training') : esc(evTitle(e))}<small>${e.time}–${endT} · ${e.dur} min</small></span>
      ${e.clash ? '<span class="tag w">Überschneidung</span>' : e.skip ? '<span class="tag w">ausgelassen</span>' : e.edited ? '<span class="tag">geändert</span>' : ''}</button>`;
    if (openEv === e.id) {
      h += `<div class="evedit"><div class="row"><label class="f">Datum<input type="date" id="eDate" value="${e.date}"></label>
        <label class="f">Uhrzeit<input type="time" id="eTime" value="${e.time}"></label>
        <label class="f">Dauer (min)<input type="number" id="eDur" min="10" max="240" step="5" value="${e.dur}"></label></div>
        <label class="f" style="margin-top:8px">Plan<select id="ePlan">${planOpts(e.over || '', `<option value=""${e.over ? '' : ' selected'}>Automatisch (laut Wochenplan)</option>`)}</select></label>
        <label class="switch"><input type="checkbox" id="eSkip" ${e.skip ? 'checked' : ''}> Termin auslassen</label>
        <div class="row"><button class="pri" data-act="evSave" data-id="${e.id}">Übernehmen</button>
        ${e.edited ? `<button data-act="evReset" data-id="${e.id}">Original</button>` : ''}<button data-act="evClose">Abbrechen</button></div></div>`;
    }
  }
  if (!ev.length) h += '<div class="card mut">Keine Termine – lege oben im Wochenplan Trainingstermine an.</div>';
  h += `<h2>Export</h2><div class="card">
    ${Object.keys(S.edits).length ? `<button class="full" data-act="clearEdits" style="margin-bottom:10px">Alle Einzeländerungen verwerfen</button>` : ''}
    <label class="switch" style="font-weight:400"><input type="checkbox" data-act="cues" ${c.cues ? 'checked' : ''}> Kurze Technikhinweise in die Terminbeschreibung</label>
    <button class="pri full" data-act="ics" ${active.length ? '' : 'disabled'}>ICS-Datei herunterladen (${active.length} Termine)</button>
    <p class="mut" style="margin-top:10px">Jeder Termin enthält Planname, Übungen in Reihenfolge, Sätze und Wiederholungen bzw. Zeiten – so, wie der Plan beim Export aussieht.
    Die Datei funktioniert mit Google Kalender, Apple Kalender und Outlook und wird nur auf deinem Gerät erzeugt.
    Importierte Termine werden <b>nicht</b> synchronisiert: Spätere Änderungen hier erscheinen erst nach einem neuen Import.</p>
    ${S.lastExport ? `<p class="note w">Zuletzt exportiert am ${new Date(S.lastExport).toLocaleString('de-DE')}. Ein erneuter Import kann doppelte Termine erzeugen – lösche alte Termine vorher im Kalender oder importiere in einen eigenen, neuen Kalender.</p>` : ''}
    <details><summary>So importierst du die Datei</summary><ul>
      <li><b>Google Kalender:</b> am Computer calendar.google.com → Einstellungen → Importieren & exportieren → Datei wählen. (Tipp: vorher einen eigenen Kalender „Training“ anlegen.)</li>
      <li><b>Apple Kalender (iPhone):</b> Datei in Safari öffnen bzw. in „Dateien“ antippen → „Alle hinzufügen“.</li>
      <li><b>Outlook:</b> Datei öffnen oder unter Kalender → Kalender hinzufügen → Aus Datei hochladen.</li>
      <li><b>Android:</b> Datei unter „Downloads“ antippen und mit Google Kalender öffnen – oder über Google Kalender im Browser importieren.</li></ul></details></div>`;
  return h;
}

function calAction(act, i, el, id) {
  const c = S.cal, sl = c.slots.find(s => s.id === id), r = el.dataset.r;
  switch (act) {
    case 'sAdd': {
      if (c.slots.length >= 21) { toast('Maximal 21 Termine pro Woche.'); return false; }
      const used = new Set(c.slots.map(s => s.wd)); const wd = [0, 1, 2, 3, 4, 5, 6].find(d => !used.has(d)) ?? 0;
      c.slots.push(slot(wd, '18:00', 60, 'R1')); break;
    }
    case 'sDel': c.slots = c.slots.filter(s => s.id !== id); break;
    case 'sWd': if (sl) sl.wd = int(el.value, 0, 6, 0); break;
    case 'sTime': if (sl && RE_TIME.test(el.value)) sl.time = el.value; break;
    case 'sDur': if (sl) sl.dur = int(el.value, 10, 240, 60); break;
    case 'sUse': if (sl) { sl.use = el.value; if (el.value === 'R2' && sl.dur === 60) sl.dur = 40; } break;
    case 'rotUp': { const l = c[r] = c[r].filter(planById); if (i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]]; break; }
    case 'rotDown': { const l = c[r] = c[r].filter(planById); if (i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]]; break; }
    case 'rotDel': c[r] = c[r].filter(planById); c[r].splice(i, 1); c[r === 'rot1' ? 'first1' : 'first2'] = 0; break;
    case 'rotAdd': { const v = $('#add_' + r).value; if (planById(v)) { c[r] = c[r].filter(planById); c[r].push(v); } break; }
    case 'first': c[r] = int(el.value, 0, 29, 0); break;
    case 'cues': c.cues = el.checked; break;
    case 'start': if (isDate(el.value)) { c.start = el.value; S.edits = {}; } break;
    case 'weeks': c.weeks = int(el.value, 1, 52, c.weeks); break;
    case 'wMinus': c.weeks = Math.max(1, c.weeks - 1); break;
    case 'wPlus': c.weeks = Math.min(52, c.weeks + 1); break;
    case 'ev': openEv = openEv === id ? null : id; return 'view';
    case 'evClose': openEv = null; return 'view';
    case 'evSave': {
      const d = $('#eDate').value, t = $('#eTime').value, du = parseInt($('#eDur').value, 10), plan = $('#ePlan').value;
      if (!isDate(d) || !RE_TIME.test(t) || !(du > 0)) { toast('Bitte Datum, Uhrzeit und Dauer angeben.'); return false; }
      const base = buildEvents().find(e => e.id === id);
      const x = { date: d, time: t, skip: $('#eSkip').checked };
      if (!base || du !== Number(base.dur) || base.durSet) x.dur = int(du, 10, 240, 60);
      if (planById(plan)) x.plan = plan;
      S.edits[id] = x;
      if (base && !base.edited && d === base.date && t === base.time && !x.dur && !x.skip && !x.plan) delete S.edits[id];
      openEv = null; break;
    }
    case 'evReset': delete S.edits[id]; openEv = null; break;
    case 'clearEdits': if (!confirm('Alle Einzeländerungen an Terminen verwerfen?')) return false; S.edits = {}; break;
    case 'ics': {
      if (S.lastExport && !confirm('Du hast bereits eine ICS-Datei exportiert. Wenn du sie erneut importierst, können doppelte Termine entstehen. Trotzdem herunterladen?')) return false;
      const ev = buildEvents().filter(e => !e.skip);
      download(`training-${c.start}.ics`, buildICS(ev), 'text/calendar;charset=utf-8');
      S.lastExport = Date.now(); toast('ICS-Datei erstellt.'); break;
    }
    default: return false;
  }
  return true;
}

/* ---------- Ansicht: Einstellungen ---------- */
function renderSettings() {
  return `<h2>Darstellung</h2><div class="card"><label class="f">Design<select data-act="theme">${Object.entries(THEMES).map(([k, v]) => `<option value="${k}"${k === S.ui.theme ? ' selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <h2>Deine Daten</h2><div class="card">
    <p>Diese Website ist öffentlich, aber deine Pläne und Einstellungen werden <b>nur auf diesem Gerät</b> in diesem Browser gespeichert. Es gibt keinen Server und kein Konto – niemand sonst kann deine Daten sehen oder ändern.</p>
    <p class="mut">Für ein anderes Gerät oder als Sicherung: Speicherdatei herunterladen und dort wieder hochladen. Beim Hochladen wird die Datei geprüft; übernommen werden nur deine Pläne, eigenen Übungen, Kategorien und Kalendereinstellungen. Die eingebaute Übungsbibliothek und die Standardvorlagen der App können dadurch nicht verändert werden.</p>
    ${storageOk ? '' : '<p class="note w">Der Browser erlaubt gerade kein Speichern (z. B. privater Modus). Lade deine Daten vor dem Schließen als Datei herunter.</p>'}
    <div class="row" style="margin-top:10px"><button class="pri sp" data-act="export">Speicherdatei herunterladen</button>
    <label class="btn sp">Speicherdatei hochladen<input type="file" accept="application/json,.json" id="importFile" hidden></label></div></div>
    <h2>Eigene Kategorien</h2><div class="card">
    ${S.cats.length ? `<ul class="catlist">${S.cats.map((c, i) => `<li><span class="sp">${esc(c)}</span><button class="ico dang" data-act="catDel" data-i="${i}" aria-label="Kategorie ${esc(c)} löschen">✕</button></li>`).join('')}</ul>` : '<p class="mut">Noch keine. Neue Kategorien legst du beim Bearbeiten eines Plans oder einer Übung an („+ Neue Kategorie …“).</p>'}
    <div class="row" style="margin-top:8px"><div class="sp"><input type="text" id="catNew" maxlength="30" placeholder="Neue Kategorie" aria-label="Neue Kategorie"></div><button data-act="catAdd">Hinzufügen</button></div></div>
    <h2>Zurücksetzen</h2><div class="card">
    <button class="full" data-act="resetPlan">Trainingspläne auf Vorlagen zurücksetzen</button>
    <button class="full dang" style="margin-top:8px" data-act="resetAll">Alles auf diesem Gerät löschen und zurücksetzen</button></div>
    <h2>Hinweise</h2><div class="card mut">
    <p>Die Vorlagen sind für einen Wiedereinstieg gedacht. Bei Schmerzen, Vorerkrankungen oder Unsicherheit ärztlich oder physiotherapeutisch abklären.</p>
    <p>Illustrationen: eigene, einfache Zeichnungen dieser App.</p></div>`;
}
function addCat(name) {
  const n = String(name || '').trim().slice(0, 30);
  if (!n) return null;
  if (!PLAN_CATS.includes(n) && !EX_CATS.includes(n) && !S.cats.includes(n)) { if (S.cats.length >= 30) { toast('Maximal 30 eigene Kategorien.'); return null; } S.cats.push(n); }
  return n;
}
function setAction(act, i, el) {
  switch (act) {
    case 'theme': S.ui.theme = THEMES[el.value] ? el.value : 'auto'; applyTheme(); break;
    case 'catAdd': if (!addCat($('#catNew').value)) return false; break;
    case 'catDel': {
      const c = S.cats[i]; if (c == null || !confirm(`Kategorie „${c}“ löschen? Pläne und Übungen damit werden umgestellt.`)) return false;
      S.cats.splice(i, 1);
      S.templates.forEach(t => { if (t.cat === c) t.cat = 'Sonstiges'; });
      Object.values(S.custom).forEach(x => { if (x.cat === c) x.cat = 'Oberkörper'; });
      break;
    }
    case 'export': download(`trainingsplan-speicherdatei-${fmtD(new Date())}.json`, JSON.stringify(S, null, 2), 'application/json'); toast('Speicherdatei erstellt.'); return false;
    case 'resetPlan':
      if (!confirm('Alle Trainingspläne auf die Standardvorlagen zurücksetzen? Selbst erstellte Pläne werden entfernt.')) return false;
      S.templates = defaultTemplates(); S.cal.rot1 = ['OA', 'UA', 'OB', 'UB']; S.cal.rot2 = ['RG', 'RV', 'RG', 'RL']; S.cal.first1 = S.cal.first2 = 0;
      S.cal.slots.forEach(s => { if (!planById(s.use) && s.use !== 'R1' && s.use !== 'R2') s.use = 'R1'; });
      curTpl = 0; break;
    case 'resetAll': if (!confirm('Wirklich alle Daten auf diesem Gerät löschen? Das kann nicht rückgängig gemacht werden.')) return false;
      try { Object.keys(localStorage).filter(k => k.startsWith('trainingsplaner.')).forEach(k => localStorage.removeItem(k)); } catch (e) { /* egal */ }
      S = defaults(); curTpl = 0; editMode = false; applyTheme(); toast('Zurückgesetzt.'); break;
    default: return false;
  }
  return true;
}
function importFile(file) {
  if (file.size > MAX_IMPORT) { toast('Die Datei ist zu groß für eine Speicherdatei.'); return; }
  const r = new FileReader();
  r.onload = () => {
    let s = null;
    try { s = sanitize(JSON.parse(r.result)); } catch (e) { s = null; }
    if (!s) { toast('Die Datei ist keine gültige Speicherdatei.'); return; }
    if (!confirm(`Speicherdatei mit ${s.templates.length} Plänen übernehmen? Die aktuellen Daten auf diesem Gerät werden ersetzt.`)) return;
    S = s; curTpl = 0; editMode = false; newPlan = false; save(); applyTheme(); render(); toast('Speicherdatei übernommen.');
  };
  r.readAsText(file);
}

/* ---------- Steuerung ---------- */
const VIEWS = { plan: ['Trainingsplan', renderPlan], uebungen: ['Übungen', renderLib], kalender: ['Kalender', renderCal], einstellungen: ['Einstellungen', renderSettings] };
const tab = () => (VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'plan');
function render() {
  const t = tab(), y = window.scrollY;
  $('#title').textContent = VIEWS[t][0];
  $('#app').innerHTML = VIEWS[t][1]();
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === t));
  if (t === 'uebungen') filterLib();
  window.scrollTo(0, y);
  const chip = document.querySelector('.chips .on'); // aktiven Plan in der Leiste sichtbar halten
  if (chip) chip.parentNode.scrollLeft = chip.offsetLeft - 16;
  document.querySelectorAll('select.catsel').forEach(s => { s.dataset.prev = s.value; });
}
function handle(ev) {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  if (ev.type === 'click' && (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return; // Eingaben reagieren auf "change"
  const act = el.dataset.act, i = Number(el.dataset.i), id = el.dataset.id;
  const t = tab();
  const r = t === 'plan' ? planAction(act, i, el) : t === 'uebungen' ? libAction(act, el, id) : t === 'kalender' ? calAction(act, i, el, id) : setAction(act, i, el);
  if (r === 'view') { render(); return; }
  if (r) { save(); render(); }
}
// "+ Neue Kategorie …" in Kategorie-Auswahlen
function newCategory(sel) {
  const name = addCat(prompt('Name der neuen Kategorie:') || '');
  if (!name) { sel.value = sel.dataset.prev || sel.options[0].value; return false; }
  if (![...sel.options].some(o => o.value === name)) sel.add(new Option(name, name), sel.options[sel.options.length - 1]);
  sel.value = name; sel.dataset.prev = name; save();
  return true;
}
document.addEventListener('click', handle);
document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; return; }
  if (e.target.classList && e.target.classList.contains('catsel') && e.target.value === '__new' && !newCategory(e.target)) return;
  handle(e);
});
document.addEventListener('input', e => { if (e.target.id === 'libQ') { libQ = e.target.value; filterLib(); } });
window.addEventListener('hashchange', () => { openEv = null; libEdit = null; newPlan = false; render(); window.scrollTo(0, 0); });
applyTheme();
save();
render();
