import crypto from 'node:crypto';
import { store } from './sheets.js';
import { todayStr, nowStr, thisMonth, addDays, daysInMonth, thaiDateCode, isValidDate } from './time.js';

export const STATUSES = ['waiting', 'in_progress', 'done'];

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ล็อกในหน่วยความจำ: ให้การจองทำทีละรายการ (Render ฟรีมีเครื่องเดียว)
let lock = Promise.resolve();
function withLock(fn) {
  const run = lock.then(fn, fn);
  lock = run.catch(() => {});
  return run;
}

// ---------- Settings ----------
export const MAX_ANNOUNCEMENTS = 3;
const ANNOUNCEMENT_MAX_LEN = 300;

function cleanAnnouncements(list) {
  return list
    .map((t) => (typeof t === 'string' ? t.trim().slice(0, ANNOUNCEMENT_MAX_LEN) : ''))
    .filter(Boolean)
    .slice(0, MAX_ANNOUNCEMENTS);
}

export async function getSettings() {
  const rows = await store.getRows('Settings');
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const caps = {};
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith('cap:') && v !== '') caps[k.slice(4)] = Math.max(0, parseInt(v, 10) || 0);
  }
  return {
    default_capacity: Math.max(0, parseInt(map.default_capacity, 10) || 0),
    max_days_ahead: Math.max(0, parseInt(map.max_days_ahead, 10) || 30),
    line_url: map.line_url || '',
    closed_dates: (map.closed_dates || '').split(',').map((s) => s.trim()).filter(isValidDate).sort(),
    caps,
    announcements: cleanAnnouncements(
      Array.from({ length: MAX_ANNOUNCEMENTS }, (_, i) => map[`announcement_${i + 1}`]),
    ),
  };
}

export async function saveSettings(input) {
  const cur = await getSettings();
  const next = {
    default_capacity: clampInt(input.default_capacity, cur.default_capacity, 0, 999),
    max_days_ahead: clampInt(input.max_days_ahead, cur.max_days_ahead, 0, 365),
    line_url: typeof input.line_url === 'string' ? input.line_url.trim() : cur.line_url,
    closed_dates: Array.isArray(input.closed_dates)
      ? [...new Set(input.closed_dates.filter(isValidDate))].sort()
      : cur.closed_dates,
    caps: input.caps && typeof input.caps === 'object' ? input.caps : cur.caps,
    announcements: Array.isArray(input.announcements) ? cleanAnnouncements(input.announcements) : cur.announcements,
  };
  const today = todayStr();
  const rows = [
    { key: 'default_capacity', value: next.default_capacity },
    { key: 'max_days_ahead', value: next.max_days_ahead },
    { key: 'line_url', value: next.line_url },
    ...next.announcements.map((text, i) => ({ key: `announcement_${i + 1}`, value: text })),
    // เก็บเฉพาะวันที่ยังไม่ผ่านไป
    { key: 'closed_dates', value: next.closed_dates.filter((d) => d >= today).join(',') },
    ...Object.entries(next.caps)
      .filter(([d, v]) => isValidDate(d) && d >= today && v !== '' && v != null)
      .sort()
      .map(([d, v]) => ({ key: `cap:${d}`, value: clampInt(v, 0, 0, 999) })),
  ];
  await store.replaceAll('Settings', rows);
  return getSettings();
}

function clampInt(v, fallback, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function capacityFor(date, settings) {
  if (settings.closed_dates.includes(date)) return 0;
  return settings.caps[date] ?? settings.default_capacity;
}

// ---------- Options ----------
export async function getOptions() {
  const rows = await store.getRows('Options');
  const apps = new Map();
  for (const { app, problem } of rows) {
    if (!app) continue;
    if (!apps.has(app)) apps.set(app, []);
    if (problem) apps.get(app).push(problem);
  }
  return [...apps.entries()].map(([app, problems]) => ({ app, problems }));
}

// ---------- ปฏิทิน / คิวว่าง ----------
function countByDate(rows) {
  const out = {};
  for (const r of rows) {
    const c = (out[r.date] ||= { total: 0, waiting: 0, in_progress: 0, done: 0 });
    c.total += 1;
    if (c[r.status] !== undefined) c[r.status] += 1;
  }
  return out;
}

export async function getCalendar(month) {
  const settings = await getSettings();
  const rows = await store.getRows('Queues');
  const counts = countByDate(rows);
  const today = todayStr();
  const lastBookable = addDays(today, settings.max_days_ahead);
  const days = [];
  for (let d = 1; d <= daysInMonth(month); d++) {
    const date = `${month}-${String(d).padStart(2, '0')}`;
    if (date < today) { days.push({ date, state: 'past' }); continue; }
    if (date > lastBookable) { days.push({ date, state: 'out' }); continue; }
    const c = counts[date] || { total: 0, waiting: 0, in_progress: 0, done: 0 };
    const cap = capacityFor(date, settings);
    const free = Math.max(0, cap - c.total);
    const state = cap === 0 ? 'closed' : free === 0 ? 'full' : 'open';
    if (date === today) {
      days.push({ date, state, today: true, free, waiting: c.waiting, in_progress: c.in_progress, done: c.done });
    } else {
      days.push({ date, state, free });
    }
  }
  return { today, days };
}

export async function getAvailableDates() {
  const settings = await getSettings();
  const counts = countByDate(await store.getRows('Queues'));
  const today = todayStr();
  const out = [];
  for (let i = 0; i <= settings.max_days_ahead; i++) {
    const date = addDays(today, i);
    const free = Math.max(0, capacityFor(date, settings) - (counts[date]?.total || 0));
    if (free > 0) out.push({ date, free });
  }
  return out;
}

export async function getTodaySummary() {
  const settings = await getSettings();
  const today = todayStr();
  const c = countByDate(await store.getRows('Queues'))[today] || { total: 0, waiting: 0, in_progress: 0, done: 0 };
  const cap = capacityFor(today, settings);
  return { date: today, capacity: cap, free: Math.max(0, cap - c.total), ...c };
}

// ---------- สร้างคิว ----------
const MAX = {
  app: 100, problem: 200, line_name: 100,
  problem_email: 200, family_name: 100, notify_email: 200,
  bill_due: 10, billing_cycle: 50, detail: 2000,
};
const REQUIRED = ['line_name', 'problem_email', 'family_name', 'bill_due', 'billing_cycle'];
const EMAIL_LABEL = { problem_email: 'อีเมลที่มีปัญหา', notify_email: 'อีเมลลูกค้า' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export async function createQueue(input) {
  const data = Object.fromEntries(Object.entries(MAX).map(([k, max]) => [k, clean(input[k], max)]));
  const date = clean(input.date, 10);

  for (const k of REQUIRED) {
    if (!data[k]) throw new HttpError(400, 'กรุณากรอกข้อมูลให้ครบทุกช่องที่มีเครื่องหมาย *');
  }
  for (const [k, label] of Object.entries(EMAIL_LABEL)) {
    // ช่องที่ไม่บังคับ (อีเมลลูกค้า) ตรวจเฉพาะเมื่อกรอกมา
    if (data[k] && !EMAIL_RE.test(data[k])) throw new HttpError(400, `รูปแบบ${label}ไม่ถูกต้อง`);
  }
  if (!isValidDate(data.bill_due)) throw new HttpError(400, 'กรุณาเลือกวันหมดรอบบิล');
  if (!isValidDate(date)) throw new HttpError(400, 'กรุณาเลือกวันที่');

  return withLock(async () => {
    const settings = await getSettings();
    const today = todayStr();
    if (date < today || date > addDays(today, settings.max_days_ahead)) {
      throw new HttpError(400, 'วันที่เลือกอยู่นอกช่วงที่เปิดให้จอง');
    }
    const rows = await store.getRows('Queues', { fresh: true });
    const sameDay = rows.filter((r) => r.date === date);
    if (sameDay.length >= capacityFor(date, settings)) {
      throw new HttpError(409, 'ขออภัย คิววันนี้เต็มแล้ว กรุณาเลือกวันอื่น');
    }

    const seq = sameDay.reduce((m, r) => Math.max(m, parseInt(r.seq, 10) || 0), 0) + 1;
    const pin = generatePin(rows);
    const now = nowStr();
    const queue = {
      code: `A${String(seq).padStart(2, '0')}-${thaiDateCode(date)}-${pin}`,
      pin,
      seq,
      date,
      ...data,
      status: 'waiting',
      created_at: now,
      updated_at: now,
    };
    await store.append('Queues', queue);
    return queue;
  });
}

/** PIN 4 หลัก ไม่ซ้ำกับคิวที่สร้างเดือนนี้ และคิวที่ยังไม่เสร็จ (รีเซ็ตทุกเดือน) */
function generatePin(rows) {
  const month = thisMonth();
  const used = new Set(
    rows.filter((r) => r.created_at.startsWith(month) || r.status !== 'done').map((r) => r.pin),
  );
  if (used.size >= 10000) throw new HttpError(503, 'ระบบออกเลขคิวไม่ได้ชั่วคราว กรุณาติดต่อแอดมิน');
  for (;;) {
    const pin = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    if (!used.has(pin)) return pin;
  }
}

// ---------- เช็คคิว ----------
function maskEmail(email) {
  const [user, domain] = email.split('@');
  if (!domain) return '';
  return `${user.slice(0, 2)}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export async function findByPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new HttpError(400, 'กรุณากรอกเลข 4 หลัก');
  const rows = await store.getRows('Queues');
  const matches = rows.filter((r) => r.pin === pin).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const q = matches[0];
  if (!q) throw new HttpError(404, 'ไม่พบคิวของเลขนี้ กรุณาตรวจสอบอีกครั้ง');
  const seq = parseInt(q.seq, 10);
  const ahead = q.status === 'done'
    ? 0
    : rows.filter((r) => r.date === q.date && r.status !== 'done' && parseInt(r.seq, 10) < seq).length;
  return {
    code: q.code,
    date: q.date,
    app: q.app,
    problem: q.problem,
    line_name: q.line_name,
    problem_email: maskEmail(q.problem_email),
    bill_due: q.bill_due,
    billing_cycle: q.billing_cycle,
    detail: q.detail,
    status: q.status,
    created_at: q.created_at,
    updated_at: q.updated_at,
    ahead,
  };
}

// ---------- แอดมิน ----------
export async function listByDate(date) {
  if (!isValidDate(date)) throw new HttpError(400, 'วันที่ไม่ถูกต้อง');
  const rows = await store.getRows('Queues', { fresh: true });
  return rows
    .filter((r) => r.date === date)
    .sort((a, b) => (parseInt(a.seq, 10) || 0) - (parseInt(b.seq, 10) || 0));
}

const SEARCH_LIMIT = 100;

/** ค้นหาคิวจากอีเมลที่มีปัญหา (บางส่วนของอีเมลก็ได้) ทั้งคิวปัจจุบันและชีต Archive */
export async function searchByEmail(text) {
  const needle = String(text || '').trim().toLowerCase();
  if (needle.length < 3) throw new HttpError(400, 'พิมพ์อีเมลอย่างน้อย 3 ตัวอักษร');
  const [current, archived] = await Promise.all([
    store.getRows('Queues', { fresh: true }),
    store.getRows('Archive').catch(() => []),
  ]);
  const match = (r) => r.problem_email.toLowerCase().includes(needle);
  return [
    ...current.filter(match),
    ...archived.filter(match).map((r) => ({ ...r, archived: true })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date) || (parseInt(a.seq, 10) || 0) - (parseInt(b.seq, 10) || 0))
    .slice(0, SEARCH_LIMIT);
}

export async function updateStatus(code, status) {
  if (!STATUSES.includes(status)) throw new HttpError(400, 'สถานะไม่ถูกต้อง');
  return withLock(async () => {
    const rows = await store.getRows('Queues', { fresh: true });
    const q = rows.find((r) => r.code === code);
    if (!q) throw new HttpError(404, 'ไม่พบคิวนี้');
    const updated = { ...q, status, updated_at: nowStr() };
    await store.update('Queues', updated);
    return updated;
  });
}

export async function deleteQueue(code) {
  return withLock(async () => {
    const rows = await store.getRows('Queues', { fresh: true });
    if (!rows.some((r) => r.code === code)) throw new HttpError(404, 'ไม่พบคิวนี้');
    await store.remove('Queues', code);
    return { ok: true, code };
  });
}

// ---------- ย้ายคิวเก่าไปชีต Archive ----------
export const ARCHIVE_AFTER_DAYS = 90;
let lastArchiveDay = '';

/** ย้ายคิวที่เสร็จแล้วและเก่ากว่า 90 วันไปชีต Archive (ชีตหลักจะได้เล็กและเร็ว) */
export function archiveOld() {
  return withLock(async () => {
    const moved = await store.archive(addDays(todayStr(), -ARCHIVE_AFTER_DAYS));
    lastArchiveDay = todayStr();
    return moved;
  });
}

/** เรียกได้บ่อย แต่จะทำจริงวันละครั้ง */
export function archiveOldDaily() {
  if (lastArchiveDay === todayStr()) return;
  lastArchiveDay = todayStr();
  archiveOld()
    .then((n) => n && console.log(`ย้ายคิวเก่า ${n} รายการไปชีต Archive`))
    .catch((err) => console.error('ย้ายคิวเก่าไม่สำเร็จ:', err.message));
}
