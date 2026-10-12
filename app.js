'use strict';
/* Trainingsplaner – alle Daten bleiben im localStorage dieses Browsers. */

const KEY = 'trainingsplaner.v1'; // Schlüssel bleibt gleich, damit vorhandene Daten erhalten bleiben
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WD_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
const SUGGEST = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
const BASE_CAT = { OA: 'Oberkörper', OB: 'Oberkörper', UA: 'Unterkörper', UB: 'Unterkörper' };

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

/* ---------- Zustand ---------- */
function mkPlan(t) {
  return { id: t.id, name: t.name, cat: t.cat, note: t.note || '', items: t.items.map(([ex, sets, reps]) => ({ uid: uid(), ex, sets, reps })) };
}
function defaultTemplates() { return DEFAULT_TEMPLATES.map(mkPlan); }
function defaults() {
  return {
    v: 2, templates: defaultTemplates(), custom: {},
    cal: { count: 3, days: { 0: '18:00', 2: '18:00', 4: '18:00' }, dur: 60, first: 0, start: nextMonday(), weeks: 8,
      mode: 'rot', rot: ['OA', 'UA', 'OB', 'UB'], fixed: {}, cues: true,
      run: { on: true, day: 5, time: '10:00', dur: 30, plan: 'CA' } },
    edits: {}, lastExport: null
  };
}
function validState(s) {
  if (!s || !(s.v === 1 || s.v === 2) || !Array.isArray(s.templates) || !s.templates.length) return false;
  if (s.v === 1 && s.templates.length !== 4) return false;
  return s.templates.every(t => t && typeof t.name === 'string' && Array.isArray(t.items)) && s.cal && typeof s.cal.start === 'string';
}
// Bringt Daten aus Version 1 (und ältere Backups) auf den aktuellen Stand, ohne etwas zu verwerfen.
function migrate(s) {
  if (s.v === 1) {
    s.templates.forEach(t => { t.cat = t.cat || BASE_CAT[t.id] || 'Ganzkörper'; });
    const ids = s.templates.map(t => t.id);
    s.cal.mode = 'rot';
    s.cal.rot = ids.slice(0, 4);
    s.cal.fixed = {};
    DEFAULT_TEMPLATES.filter(t => !ids.includes(t.id) && (t.id === 'GK' || t.id === 'CA')).forEach(t => s.templates.push(mkPlan(t)));
    s.cal.run = { ...(s.cal.run || {}), plan: '' }; // bisheriges Verhalten: Standard-Lauftext
    s.v = 2;
  }
  s.templates.forEach(t => {
    t.id = t.id || 'p_' + uid(); t.cat = PLAN_CATS.includes(t.cat) ? t.cat : (t.cat ? 'Sonstiges' : 'Ganzkörper'); t.note = t.note || '';
    t.items.forEach(it => { it.uid = it.uid || uid(); });
  });
  for (const c of Object.values(s.custom || {})) {
    c.cat = EX_CATS.includes(c.cat) ? c.cat : 'Oberkörper';
    c.m = Array.isArray(c.m) ? c.m : []; c.eq = c.eq || 'Körpergewicht'; c.lv = c.lv || 1;
    c.cues = Array.isArray(c.cues) ? c.cues : []; c.easy = c.easy || ''; c.hard = c.hard || ''; c.own = true;
  }
  return s;
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = JSON.parse(raw);
    if (validState(s)) {
      if (s.v === 1) { try { localStorage.setItem(KEY + '.backup-v1', raw); } catch (e) { /* optional */ } }
      migrate(s);
      const d = defaults();
      return { ...d, ...s, cal: { ...d.cal, ...s.cal, run: { ...d.cal.run, ...s.cal.run } }, custom: s.custom || {}, edits: s.edits || {} };
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

const allEx = () => ({ ...EXERCISES, ...S.custom });
const exInfo = id => EXERCISES[id] || S.custom[id] || { name: 'Unbekannte Übung', cat: 'Oberkörper', m: [], cues: [] };
const planById = id => S.templates.find(t => t.id === id) || null;
const dose = it => (Number(it.sets) === 1 && /min|\bs\b|sek/i.test(it.reps)) ? it.reps : `${it.sets} × ${it.reps}`;
const planOpts = (sel, extra = '', cat = true) => extra + S.templates.map(t => `<option value="${t.id}"${t.id === sel ? ' selected' : ''}>${esc(t.name)}${cat ? ` (${esc(t.cat)})` : ''}</option>`).join('');

/* ---------- Termine ---------- */
function buildEvents() {
  const c = S.cal, list = [];
  for (let i = 0; i < c.weeks * 7; i++) {
    const d = addDays(c.start, i), w = weekday(d);
    if (c.days[w] != null) list.push({ id: 'K' + d, type: 'K', orig: d, date: d, time: c.days[w], dur: c.dur, wd: w });
    if (c.run.on && c.run.day === w) list.push({ id: 'L' + d, type: 'L', orig: d, date: d, time: c.run.time, dur: c.run.dur, wd: w });
  }
  for (const e of list) {
    const x = S.edits[e.id];
    if (x) {
      e.date = x.date || e.date; e.time = x.time || e.time; e.dur = x.dur || e.dur; e.skip = !!x.skip; e.edited = true;
      if (x.plan && planById(x.plan)) e.over = x.plan;
    }
  }
  list.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.type.localeCompare(b.type));
  // Plan-Zuordnung: Rotation (fortlaufend, keine Einheit fällt weg) oder fester Plan je Wochentag.
  const rot = (c.rot || []).filter(planById);
  const fallback = S.templates[0].id;
  let k = Number(c.first) || 0;
  for (const e of list) {
    if (e.type === 'L') { e.plan = e.over || (planById(c.run.plan) ? c.run.plan : ''); continue; }
    if (e.over) { e.plan = e.over; continue; }
    if (c.mode === 'fix') { e.plan = planById(c.fixed[e.wd]) ? c.fixed[e.wd] : fallback; continue; }
    if (!rot.length) { e.plan = fallback; continue; }
    e.plan = rot[k % rot.length];
    if (!e.skip) k++; else e.plan = null;
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
  if (e.type === 'L') return p ? `Lauftraining – ${p.name}` : 'Lauftraining (locker)';
  if (!p) return 'Training';
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
      `CATEGORIES:${icsEsc(e.type === 'L' ? 'Laufen' : (p ? p.cat : 'Training'))}`,
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
let curTpl = 0, editMode = false, openEv = null;

function exOptions(sel) {
  const groups = {};
  for (const [id, e] of Object.entries(allEx())) (groups[e.own ? 'Eigene Übungen' : e.cat] = groups[e.own ? 'Eigene Übungen' : e.cat] || []).push([id, e.name]);
  return Object.entries(groups).map(([g, arr]) =>
    `<optgroup label="${esc(g)}">${arr.sort((a, b) => a[1].localeCompare(b[1], 'de')).map(([id, n]) => `<option value="${id}"${id === sel ? ' selected' : ''}>${esc(n)}</option>`).join('')}</optgroup>`).join('');
}
function variantsHTML(e) {
  return `${e.m && e.m.length ? `<p class="mut"><b>Muskeln:</b> ${esc(e.m.join(', '))}</p>` : ''}
    ${e.cues && e.cues.length ? `<ul>${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
    ${e.easy ? `<p class="var"><b>Leichter:</b> ${esc(e.easy)}</p>` : ''}${e.hard ? `<p class="var"><b>Schwerer:</b> ${esc(e.hard)}</p>` : ''}`;
}

function renderPlan() {
  if (curTpl >= S.templates.length) curTpl = 0;
  const t = S.templates[curTpl];
  let h = `<div class="chips" role="tablist">${S.templates.map((x, i) => `<button data-act="tpl" data-i="${i}" class="${i === curTpl ? 'on' : ''}">${esc(x.name)}<small>${esc(x.cat)}</small></button>`).join('')}
    <button data-act="pnew" class="add">+ Neuer Plan</button></div>
  <div class="row" style="margin-top:14px"><div class="sp"><h2 style="margin:0">${esc(t.name)}</h2><span class="tag">${esc(t.cat)}</span></div>
  <button data-act="edit" class="${editMode ? 'pri' : ''}">${editMode ? 'Fertig' : 'Bearbeiten'}</button></div>`;
  if (editMode) {
    h += `<div class="card"><div class="row"><label class="f">Name<input type="text" maxlength="40" value="${esc(t.name)}" data-act="pname"></label>
      <label class="f">Kategorie<select data-act="pcat">${PLAN_CATS.map(c => `<option${c === t.cat ? ' selected' : ''}>${c}</option>`).join('')}</select></label></div>
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
    case 'tpl': curTpl = i; break;
    case 'edit': editMode = !editMode; break;
    case 'up': if (i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]]; break;
    case 'down': if (i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]]; break;
    case 'del': items.splice(i, 1); break;
    case 'swap': items[i].ex = el.value; break;
    case 'sets': items[i].sets = Math.min(10, Math.max(1, parseInt(el.value, 10) || 1)); break;
    case 'reps': items[i].reps = el.value.trim().slice(0, 40) || '10'; break;
    case 'add': items.push({ uid: uid(), ex: $('#addSel').value, sets: 2, reps: '10–12' }); break;
    case 'pname': t.name = el.value.trim().slice(0, 40) || 'Ohne Namen'; break;
    case 'pcat': t.cat = el.value; break;
    case 'pnote': t.note = el.value.trim().slice(0, 300); break;
    case 'pnew':
      S.templates.push({ id: 'p_' + uid(), name: 'Neuer Plan', cat: 'Ganzkörper', note: '', items: [] });
      curTpl = S.templates.length - 1; editMode = true; break;
    case 'pcopy': {
      const c = JSON.parse(JSON.stringify(t)); c.id = 'p_' + uid(); c.name = (t.name + ' (Kopie)').slice(0, 40);
      c.items.forEach(it => { it.uid = uid(); });
      S.templates.splice(curTpl + 1, 0, c); curTpl++; toast('Plan kopiert.'); break;
    }
    case 'pdel': {
      if (S.templates.length < 2 || !confirm(`Plan „${t.name}“ löschen? Kalendertermine mit diesem Plan bekommen einen anderen Plan.`)) return false;
      S.templates.splice(curTpl, 1);
      S.cal.rot = S.cal.rot.filter(id => id !== t.id);
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
  const sel = (arr, cur, lab = v => v) => arr.map(v => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${esc(lab(v))}</option>`).join('');
  return `<div class="card evedit"><h3>${id === 'new' ? 'Eigene Übung anlegen' : 'Übung bearbeiten'}</h3>
    <label class="f" style="margin-top:8px">Name<input type="text" id="fName" maxlength="60" value="${esc(e.name)}"></label>
    <div class="row" style="margin-top:8px"><label class="f">Kategorie<select id="fCat">${sel(EX_CATS, e.cat)}</select></label>
    <label class="f">Ausrüstung<select id="fEq">${sel(EQUIP, e.eq)}</select></label>
    <label class="f">Schwierigkeit<select id="fLv">${sel([1, 2, 3], e.lv, v => LEVELS[v])}</select></label></div>
    <p class="mut" style="margin-top:10px">Muskelgruppen</p>
    <div class="checks">${MUSCLES.map(m => `<label><input type="checkbox" class="fM" value="${m}"${e.m.includes(m) ? ' checked' : ''}> ${m}</label>`).join('')}</div>
    <label class="f" style="margin-top:8px">Anleitung (eine Zeile pro Hinweis)<textarea id="fCues">${esc(e.cues.join('\n'))}</textarea></label>
    <label class="f" style="margin-top:8px">Leichtere Variante<input type="text" id="fEasy" maxlength="120" value="${esc(e.easy)}"></label>
    <label class="f" style="margin-top:8px">Schwerere Variante<input type="text" id="fHard" maxlength="120" value="${esc(e.hard)}"></label>
    <div class="row" style="margin-top:10px"><button class="pri" data-act="libSave" data-id="${id}">Speichern</button><button data-act="libCancel">Abbrechen</button></div></div>`;
}
function renderLib() {
  const all = allEx();
  const sel = (k, label, arr, lab = v => v) => `<label class="f">${label}<select data-act="libF" data-k="${k}"><option value="">Alle</option>${arr.map(v => `<option value="${v}"${String(v) === libF[k] ? ' selected' : ''}>${esc(lab(v))}</option>`).join('')}</select></label>`;
  let h = `<div class="card"><input type="search" id="libQ" placeholder="Übung suchen …" value="${esc(libQ)}" aria-label="Übung suchen">
    <div class="filters">${sel('m', 'Muskelgruppe', MUSCLES)}${sel('cat', 'Kategorie', EX_CATS)}${sel('eq', 'Ausrüstung', EQUIP)}${sel('lv', 'Schwierigkeit', [1, 2, 3], v => LEVELS[v])}</div>
    <div class="row" style="margin-top:8px"><span class="mut sp" id="libCount"></span><button data-act="libReset">Filter zurücksetzen</button></div></div>
    ${libEdit ? libForm(libEdit) : '<button class="full" data-act="libNew">+ Eigene Übung anlegen</button>'}`;
  const ids = Object.keys(all).sort((a, b) => EX_CATS.indexOf(all[a].cat) - EX_CATS.indexOf(all[b].cat) || all[a].name.localeCompare(all[b].name, 'de'));
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
      S.custom[nid] = { ...(S.custom[nid] || {}), own: true, name: name.slice(0, 60), cat: $('#fCat').value, eq: $('#fEq').value, lv: Number($('#fLv').value),
        m: [...document.querySelectorAll('.fM:checked')].map(x => x.value),
        cues: $('#fCues').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10),
        easy: $('#fEasy').value.trim(), hard: $('#fHard').value.trim() };
      libEdit = null; toast('Übung gespeichert.'); return true;
    }
    case 'libDel': {
      const used = S.templates.filter(t => t.items.some(it => it.ex === id));
      if (!confirm(`„${S.custom[id].name}“ löschen?${used.length ? ` Sie wird auch aus ${used.length} Plan/Plänen entfernt.` : ''}`)) return false;
      used.forEach(t => { t.items = t.items.filter(it => it.ex !== id); });
      delete S.custom[id]; return true;
    }
    case 'libAdd': {
      const p = planById($('#to_' + id).value);
      if (!p) return false;
      p.items.push({ uid: uid(), ex: id, sets: 2, reps: '10–12' });
      toast(`Zu „${p.name}“ hinzugefügt. Sätze/Wdh. im Plan anpassen.`); return true;
    }
    default: return false;
  }
}

/* ---------- Ansicht: Kalender ---------- */
function renderCal() {
  const c = S.cal, ev = buildEvents();
  const sel = Object.keys(c.days).map(Number).sort();
  const active = ev.filter(e => !e.skip), clashes = active.filter(e => e.clash).length;
  const nK = active.filter(e => e.type === 'K').length, nL = active.filter(e => e.type === 'L').length;
  const opt = (vals, cur, lab = v => v) => vals.map(v => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${lab(v)}</option>`).join('');
  const rot = c.rot.filter(planById);
  let h = `<h2>Trainingstage</h2><div class="card">
    <div class="row"><label class="f">Einheiten pro Woche<select data-act="count">${opt([1, 2, 3, 4, 5, 6], c.count)}</select></label>
    <label class="f">Dauer (Minuten)<input type="number" min="15" max="180" step="5" inputmode="numeric" value="${c.dur}" data-act="dur"></label></div>
    <p class="mut" style="margin-top:12px">Wochentage (${sel.length} von ${c.count} gewählt)</p>
    <div class="days">${WD.map((d, i) => `<button data-act="day" data-i="${i}" class="${c.days[i] != null ? 'on' : ''}" aria-pressed="${c.days[i] != null}">${d}</button>`).join('')}</div>
    ${sel.length !== c.count ? `<p class="note w" style="margin-top:8px">Bitte genau ${c.count} Tage auswählen.</p>` : ''}
    <p class="mut" style="margin-top:14px">Pläne verteilen</p>
    <div class="seg2"><button data-act="mode" data-m="rot" class="${c.mode !== 'fix' ? 'on' : ''}">Rotation</button><button data-act="mode" data-m="fix" class="${c.mode === 'fix' ? 'on' : ''}">Fester Plan je Tag</button></div>
    <div class="daytimes${c.mode === 'fix' ? ' wide' : ''}">${sel.map(i => `<div class="dt"><label class="f">${WD_LONG[i]}<input type="time" value="${c.days[i]}" data-act="dtime" data-i="${i}"></label>
      ${c.mode === 'fix' ? `<select data-act="fplan" data-i="${i}" aria-label="Plan ${WD_LONG[i]}">${planOpts(planById(c.fixed[i]) ? c.fixed[i] : S.templates[0].id, '', false)}</select>` : ''}</div>`).join('')}</div>`;
  if (c.mode !== 'fix') {
    h += `<p class="mut" style="margin-top:12px">Reihenfolge der Rotation – die Pläne werden fortlaufend auf die Trainingstage verteilt, so fällt keiner weg.</p>
      <ol class="rot">${rot.map((id, i) => `<li><span class="sp">${esc(planById(id).name)}</span>
        <button class="ico" data-act="rotUp" data-i="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Nach oben">↑</button>
        <button class="ico" data-act="rotDown" data-i="${i}" ${i === rot.length - 1 ? 'disabled' : ''} aria-label="Nach unten">↓</button>
        <button class="ico dang" data-act="rotDel" data-i="${i}" aria-label="Entfernen">✕</button></li>`).join('')}</ol>
      ${rot.length ? '' : '<p class="note w">Bitte mindestens einen Plan zur Rotation hinzufügen.</p>'}
      <div class="row"><div class="sp"><select id="rotSel" aria-label="Plan zur Rotation hinzufügen">${planOpts('')}</select></div><button data-act="rotAdd">Hinzufügen</button></div>
      ${rot.length > 1 ? `<label class="f" style="margin-top:10px">Erste Einheit im Zeitraum<select data-act="first">${opt(rot.map((_, i) => i), Math.min(c.first, rot.length - 1), v => esc(planById(rot[v]).name))}</select></label>` : ''}`;
  }
  h += `</div>

    <h2>Lauftraining</h2><div class="card">
    <label class="switch"><input type="checkbox" data-act="runOn" ${c.run.on ? 'checked' : ''}> 1× pro Woche laufen</label>
    ${c.run.on ? `<div class="row"><label class="f">Tag<select data-act="runDay">${opt([0, 1, 2, 3, 4, 5, 6], c.run.day, v => WD_LONG[v])}</select></label>
    <label class="f">Uhrzeit<input type="time" value="${c.run.time}" data-act="runTime"></label>
    <label class="f">Dauer (Minuten)<input type="number" min="10" max="180" step="5" inputmode="numeric" value="${c.run.dur}" data-act="runDur"></label></div>
    <label class="f" style="margin-top:8px">Inhalt<select data-act="runPlan">${planOpts(c.run.plan, `<option value=""${planById(c.run.plan) ? '' : ' selected'}>Standard: lockerer Lauf 20–30 min</option>`)}</select></label>
    <p class="note" style="margin-top:10px">${esc(RUN_HINT)}</p>` : ''}</div>

    <h2>Zeitraum</h2><div class="card"><div class="row">
    <label class="f">Startdatum<input type="date" value="${c.start}" data-act="start"></label>
    <label class="f">Dauer<select data-act="weeks">${opt([4, 8, 12], c.weeks, v => v + ' Wochen')}</select></label></div></div>

    <h2>Vorschau</h2>
    <div class="stats"><span class="tag">${nK}× Training</span>${nL ? `<span class="tag" style="background:var(--run-soft);color:var(--run)">${nL}× Laufen</span>` : ''}
    ${clashes ? `<span class="tag w">${clashes} Termine überschneiden sich</span>` : ''}</div>
    <p class="mut">Tippe auf einen Termin, um ihn zu verschieben, einen anderen Plan zu wählen oder ihn auszulassen.</p>`;
  let wk = -1;
  for (const e of ev) {
    const w = Math.floor((parseD(e.date) - parseD(c.start)) / 864e5 / 7);
    if (w !== wk) { wk = w; h += `<div class="week">Woche ${w + 1}</div>`; }
    const end = minToT(toMin(e.time) + Number(e.dur));
    h += `<button class="ev ${e.type}${e.skip ? ' skip' : ''}${e.clash ? ' clash' : ''}" data-act="ev" data-id="${e.id}">
      <span class="d">${shortD(e.date)}</span><span class="t">${e.skip ? (e.type === 'L' ? 'Lauftraining' : 'Training') : esc(evTitle(e))}<small>${e.time}–${end} · ${e.dur} min</small></span>
      ${e.clash ? '<span class="tag w">Überschneidung</span>' : e.skip ? '<span class="tag w">ausgelassen</span>' : e.edited ? '<span class="tag">geändert</span>' : ''}</button>`;
    if (openEv === e.id) {
      h += `<div class="evedit"><div class="row"><label class="f">Datum<input type="date" id="eDate" value="${e.date}"></label>
        <label class="f">Uhrzeit<input type="time" id="eTime" value="${e.time}"></label>
        <label class="f">Dauer (min)<input type="number" id="eDur" min="10" max="240" step="5" value="${e.dur}"></label></div>
        <label class="f" style="margin-top:8px">Plan<select id="ePlan">${planOpts(e.over || '', `<option value=""${e.over ? '' : ' selected'}>Automatisch${e.type === 'L' ? ' (Lauf-Einstellung)' : ''}</option>`)}</select></label>
        <label class="switch"><input type="checkbox" id="eSkip" ${e.skip ? 'checked' : ''}> Termin auslassen</label>
        <div class="row"><button class="pri" data-act="evSave" data-id="${e.id}">Übernehmen</button>
        ${e.edited ? `<button data-act="evReset" data-id="${e.id}">Original</button>` : ''}<button data-act="evClose">Abbrechen</button></div></div>`;
    }
  }
  const ok = sel.length === c.count && active.length > 0;
  h += `<h2>Export</h2><div class="card">
    ${Object.keys(S.edits).length ? `<button class="full" data-act="clearEdits" style="margin-bottom:10px">Alle Einzeländerungen verwerfen</button>` : ''}
    <label class="switch" style="font-weight:400"><input type="checkbox" data-act="cues" ${c.cues ? 'checked' : ''}> Kurze Technikhinweise in die Terminbeschreibung</label>
    <button class="pri full" data-act="ics" ${ok ? '' : 'disabled'}>ICS-Datei herunterladen (${active.length} Termine)</button>
    <p class="mut" style="margin-top:10px">Jeder Termin enthält Planname, Übungen in Reihenfolge, Sätze und Wiederholungen bzw. Haltezeiten – so, wie der Plan beim Export aussieht.
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
  const c = S.cal;
  switch (act) {
    case 'count': {
      c.count = Number(el.value);
      const old = c.days, t = Object.values(old)[0] || '18:00';
      c.days = {}; SUGGEST[c.count].forEach(d => { c.days[d] = old[d] || t; }); break;
    }
    case 'day': {
      if (c.days[i] != null) delete c.days[i];
      else if (Object.keys(c.days).length >= c.count) { toast(`Es sind bereits ${c.count} Tage gewählt. Erst einen Tag abwählen.`); return false; }
      else c.days[i] = Object.values(c.days)[0] || '18:00';
      break;
    }
    case 'dtime': if (el.value) c.days[i] = el.value; break;
    case 'dur': c.dur = Math.min(180, Math.max(15, parseInt(el.value, 10) || 60)); break;
    case 'mode': {
      c.mode = el.dataset.m;
      // Beim ersten Wechsel: Tage mit der Rotationsreihenfolge vorbelegen
      const rot = c.rot.filter(planById);
      if (c.mode === 'fix' && rot.length) Object.keys(c.days).map(Number).sort().forEach((d, n) => { if (!planById(c.fixed[d])) c.fixed[d] = rot[n % rot.length]; });
      break;
    }
    case 'fplan': c.fixed[i] = el.value; break;
    case 'rotUp': { const r = c.rot = c.rot.filter(planById); if (i > 0) [r[i - 1], r[i]] = [r[i], r[i - 1]]; break; }
    case 'rotDown': { const r = c.rot = c.rot.filter(planById); if (i < r.length - 1) [r[i + 1], r[i]] = [r[i], r[i + 1]]; break; }
    case 'rotDel': c.rot = c.rot.filter(planById); c.rot.splice(i, 1); c.first = 0; break;
    case 'rotAdd': c.rot = c.rot.filter(planById); c.rot.push($('#rotSel').value); break;
    case 'first': c.first = Number(el.value); break;
    case 'runOn': c.run.on = el.checked; break;
    case 'runDay': c.run.day = Number(el.value); break;
    case 'runTime': if (el.value) c.run.time = el.value; break;
    case 'runDur': c.run.dur = Math.min(180, Math.max(10, parseInt(el.value, 10) || 30)); break;
    case 'runPlan': c.run.plan = el.value; break;
    case 'cues': c.cues = el.checked; break;
    case 'start': if (el.value) { c.start = el.value; S.edits = {}; } break;
    case 'weeks': c.weeks = Number(el.value); break;
    case 'ev': openEv = openEv === id ? null : id; return 'view';
    case 'evClose': openEv = null; return 'view';
    case 'evSave': {
      const d = $('#eDate').value, t = $('#eTime').value, du = parseInt($('#eDur').value, 10), plan = $('#ePlan').value;
      if (!d || !t || !(du > 0)) { toast('Bitte Datum, Uhrzeit und Dauer angeben.'); return false; }
      const base = buildEvents().find(e => e.id === id);
      S.edits[id] = { date: d, time: t, dur: Math.min(240, du), skip: $('#eSkip').checked };
      if (plan) S.edits[id].plan = plan;
      if (base && !base.edited && d === base.date && t === base.time && du === Number(base.dur) && !S.edits[id].skip && !plan) delete S.edits[id];
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
  return `<h2>Datensicherung</h2><div class="card">
    <p>Alle Einstellungen werden nur lokal in diesem Browser gespeichert. Es werden keine Daten übertragen.</p>
    <p class="mut">Beim Löschen der Browserdaten oder auf einem anderen Gerät sind sie nicht vorhanden – sichere sie bei Bedarf als Datei. Ältere Sicherungen werden beim Import automatisch übernommen.</p>
    ${storageOk ? '' : '<p class="note w">Der Browser erlaubt gerade kein Speichern (z. B. privater Modus).</p>'}
    <div class="row" style="margin-top:10px"><button class="pri sp" data-act="export">Sicherung exportieren (JSON)</button>
    <label class="btn sp">Sicherung importieren<input type="file" accept="application/json,.json" id="importFile" hidden></label></div></div>
    <h2>Zurücksetzen</h2><div class="card">
    <button class="full" data-act="resetPlan">Trainingspläne auf Vorlagen zurücksetzen</button>
    <button class="full dang" style="margin-top:8px" data-act="resetAll">Alles zurücksetzen (Pläne, Kalender, eigene Übungen)</button></div>
    <h2>Hinweise</h2><div class="card mut">
    <p>Die Vorlagen sind für einen Wiedereinstieg gedacht. Bei Schmerzen, Vorerkrankungen oder Unsicherheit ärztlich oder physiotherapeutisch abklären.</p>
    <p>Illustrationen: eigene, einfache Zeichnungen dieser App.</p></div>`;
}
function setAction(act) {
  switch (act) {
    case 'export': download(`trainingsplan-sicherung-${fmtD(new Date())}.json`, JSON.stringify(S, null, 2), 'application/json'); toast('Sicherung erstellt.'); return false;
    case 'resetPlan':
      if (!confirm('Alle Trainingspläne auf die Standardvorlagen zurücksetzen? Selbst erstellte Pläne werden entfernt.')) return false;
      S.templates = defaultTemplates(); S.cal.rot = ['OA', 'UA', 'OB', 'UB']; S.cal.first = 0; curTpl = 0; break;
    case 'resetAll': if (!confirm('Wirklich alles zurücksetzen? Das kann nicht rückgängig gemacht werden.')) return false;
      try { localStorage.removeItem(KEY); } catch (e) { /* egal */ } S = defaults(); curTpl = 0; editMode = false; toast('Zurückgesetzt.'); break;
    default: return false;
  }
  return true;
}
function importFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!validState(s)) throw new Error('format');
      if (!confirm('Aktuelle Daten durch die Sicherung ersetzen?')) return;
      localStorage.setItem(KEY, JSON.stringify(s)); S = load(); curTpl = 0; save(); render(); toast('Sicherung importiert.');
    } catch (e) { toast('Die Datei ist keine gültige Sicherung.'); }
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
}
function handle(ev) {
  const el = ev.target.closest('[data-act]');
  if (!el) return;
  if (ev.type === 'click' && (el.tagName === 'SELECT' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return; // Eingaben reagieren auf "change"
  const act = el.dataset.act, i = Number(el.dataset.i), id = el.dataset.id;
  const t = tab();
  const r = t === 'plan' ? planAction(act, i, el) : t === 'uebungen' ? libAction(act, el, id) : t === 'kalender' ? calAction(act, i, el, id) : setAction(act);
  if (r === 'view') { render(); return; }
  if (r) { save(); render(); }
}
document.addEventListener('click', handle);
document.addEventListener('change', e => {
  if (e.target.id === 'importFile' && e.target.files[0]) { importFile(e.target.files[0]); e.target.value = ''; return; }
  handle(e);
});
document.addEventListener('input', e => { if (e.target.id === 'libQ') { libQ = e.target.value; filterLib(); } });
window.addEventListener('hashchange', () => { openEv = null; libEdit = null; render(); window.scrollTo(0, 0); });
save();
render();
