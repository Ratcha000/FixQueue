// ชั้นเก็บข้อมูล: Google Sheet ผ่าน Apps Script Web App (ถ้าตั้ง APPS_SCRIPT_URL)
// หรือหน่วยความจำ (ไว้ทดสอบในเครื่อง)

const QUEUE_HEADERS = [
  'code', 'pin', 'seq', 'date', 'app', 'problem',
  'line_name', 'problem_email', 'family_name', 'notify_email', 'bill_due', 'billing_cycle',
  'detail', 'status', 'created_at', 'updated_at', 'handled',
];

export const HEADERS = {
  Queues: QUEUE_HEADERS,
  Archive: QUEUE_HEADERS,
  Options: ['app', 'problem'],
  Settings: ['key', 'value'],
};

// ชื่อคอลัมน์เดิม -> ชื่อใหม่ (ใช้ย้ายข้อมูลเก่าตอน init)
const RENAMES = { name: 'line_name', email: 'problem_email', family_email: 'family_name' };

// คอลัมน์ที่ใช้หาแถวตอนอัปเดต
const KEY = { Queues: 'code', Archive: 'code', Settings: 'key', Options: 'app' };

const DEFAULT_OPTIONS = [
  ['YouTube', 'เมลหลุด / ถูกออกจากระบบ'],
  ['YouTube', 'ดูวิดีโอไม่ได้'],
  ['YouTube', 'Premium ไม่ทำงาน'],
  ['Netflix', 'เข้าสู่ระบบไม่ได้'],
  ['Netflix', 'จอเต็ม / เกินจำนวนอุปกรณ์'],
  ['Spotify', 'เมลหลุด / ถูกออกจากระบบ'],
  ['Spotify', 'Premium หาย'],
];

const DEFAULT_SETTINGS = [
  ['default_capacity', '20'],
  ['max_days_ahead', '30'],
  ['line_url', 'https://line.me/R/ti/p/@yourshop'],
  ['closed_dates', ''],
];

const CACHE_MS = 15_000;
const WRITE_ACTIONS = new Set(['append', 'update', 'remove', 'replaceAll', 'archive']);
const TIMEOUT_MS = 25_000;

const rowToObject = (name, r) => Object.fromEntries(HEADERS[name].map((h, j) => [h, r[j] ?? '']));
/** เก็บเฉพาะคอลัมน์ที่รู้จัก เป็นข้อความทั้งหมด */
const clean = (name, obj) => Object.fromEntries(HEADERS[name].map((h) => [h, (obj[h] ?? '').toString()]));

// ---------- Google Sheet ผ่าน Apps Script ----------
class AppsScriptStore {
  constructor(url, secret) {
    this.url = url;
    this.secret = secret;
    this.cache = new Map();
    this.version = new Map(); // เพิ่มทุกครั้งที่เขียนชีต ใช้กันข้อมูลเก่าทับข้อมูลใหม่ในแคช
    this.inflight = new Map(); // การอ่านที่กำลังรออยู่ (ลูกค้าหลายคนโหลดพร้อมกันจะใช้ผลเดียวกัน)
  }

  /** หลังเขียนชีต: ล้างแคช และทำให้การอ่านที่ค้างอยู่ก่อนหน้าไม่ถูกเก็บลงแคช */
  invalidate(name) {
    this.version.set(name, (this.version.get(name) || 0) + 1);
    this.cache.delete(name);
    this.inflight.delete(name);
  }

  async call(action, params = {}) {
    if (!WRITE_ACTIONS.has(action)) return this.request(action, params);
    try {
      return await this.request(action, params);
    } finally {
      // ล้างแคชเสมอ แม้เขียนพลาดหรือหมดเวลา (Apps Script อาจเขียนสำเร็จไปแล้ว)
      if (params.sheet) this.invalidate(params.sheet);
      if (action === 'archive') { this.invalidate('Queues'); this.invalidate('Archive'); }
    }
  }

  async request(action, params) {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: this.secret, action, ...params }),
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Apps Script ไม่ได้ตอบเป็น JSON (HTTP ${res.status}) — ตรวจว่า Deploy เป็น Web app และตั้ง Who has access = Anyone`);
    }
    if (data.error === 'unauthorized') throw new Error('APPS_SCRIPT_SECRET ไม่ตรงกับ SECRET ใน Code.gs');
    if (data.error) throw new Error(`Apps Script: ${data.error}`);
    return data.data;
  }

  async init() {
    const result = await this.call('init', {
      headers: HEADERS,
      renames: RENAMES,
      seed: { Options: DEFAULT_OPTIONS, Settings: DEFAULT_SETTINGS },
    });
    for (const [sheet, n] of Object.entries(result?.migrated || {})) {
      console.log(`ปรับคอลัมน์ชีต ${sheet} เป็นแบบใหม่แล้ว (${n} แถว)`);
    }
  }

  async getRows(name, { fresh = false } = {}) {
    if (!fresh) {
      const hit = this.cache.get(name);
      if (hit && Date.now() - hit.at < CACHE_MS) return hit.rows;
      const pending = this.inflight.get(name);
      if (pending) return pending;
    }
    const startVersion = this.version.get(name) || 0;
    const job = this.call('getRows', { sheet: name }).then(({ header, rows: raw }) => {
      // จับคู่ตามชื่อหัวตาราง (แอดมินสลับลำดับคอลัมน์ใน Sheet ได้)
      const rows = raw.map((r) => {
        const obj = Object.fromEntries(header.map((h, i) => [h, r[i] ?? '']));
        return clean(name, obj);
      });
      // ถ้ามีการเขียนชีตระหว่างที่อ่านอยู่ ข้อมูลชุดนี้อาจเก่าแล้ว: ไม่เก็บลงแคช
      if ((this.version.get(name) || 0) === startVersion) {
        this.cache.set(name, { at: Date.now(), rows });
      }
      return rows;
    });
    if (!fresh) {
      this.inflight.set(name, job);
      const done = () => { if (this.inflight.get(name) === job) this.inflight.delete(name); };
      job.then(done, done);
    }
    return job;
  }

  async append(name, obj) {
    await this.call('append', { sheet: name, obj: clean(name, obj) });
  }

  /** อัปเดตแถวที่คอลัมน์หลัก (เช่น code) ตรงกัน */
  async update(name, obj) {
    await this.call('update', { sheet: name, key: KEY[name], obj: clean(name, obj) });
  }

  /** ลบแถวที่คอลัมน์หลักตรงกับ value */
  async remove(name, value) {
    try {
      await this.call('remove', { sheet: name, key: KEY[name], value });
    } catch (err) {
      if (/unknown action/.test(err.message)) {
        throw new Error('Apps Script ยังไม่รองรับการลบ — อัปเดต Code.gs แล้ว Deploy เป็น New version');
      }
      throw err;
    }
  }

  async replaceAll(name, objs) {
    await this.call('replaceAll', { sheet: name, objs: objs.map((o) => clean(name, o)) });
  }

  /** ย้ายคิวที่เสร็จแล้วและวันนัดก่อน `before` ไปชีต Archive คืนค่าจำนวนที่ย้าย */
  async archive(before) {
    return this.call('archive', { before });
  }
}

// ---------- หน่วยความจำ (ทดสอบในเครื่อง) ----------
class MemoryStore {
  constructor() {
    this.data = {
      Queues: [],
      Archive: [],
      Options: DEFAULT_OPTIONS.map((r) => rowToObject('Options', r)),
      Settings: DEFAULT_SETTINGS.map((r) => rowToObject('Settings', r)),
    };
  }
  async init() {}
  async getRows(name) {
    return this.data[name].map((o) => ({ ...o }));
  }
  async append(name, obj) {
    this.data[name].push(clean(name, obj));
  }
  async update(name, obj) {
    const key = KEY[name];
    const i = this.data[name].findIndex((o) => o[key] === obj[key]);
    if (i < 0) throw new Error('not found');
    this.data[name][i] = clean(name, obj);
  }
  async remove(name, value) {
    const key = KEY[name];
    const i = this.data[name].findIndex((o) => o[key] === value);
    if (i < 0) throw new Error('not found');
    this.data[name].splice(i, 1);
  }
  async replaceAll(name, objs) {
    this.data[name] = objs.map((o) => clean(name, o));
  }
  async archive(before) {
    const old = (q) => q.status === 'done' && q.date < before;
    const move = this.data.Queues.filter(old);
    this.data.Archive.push(...move);
    this.data.Queues = this.data.Queues.filter((q) => !old(q));
    return move.length;
  }
}

function createStore() {
  const { APPS_SCRIPT_URL, APPS_SCRIPT_SECRET } = process.env;
  if (APPS_SCRIPT_URL && APPS_SCRIPT_SECRET) return new AppsScriptStore(APPS_SCRIPT_URL, APPS_SCRIPT_SECRET);
  console.warn('⚠️  ไม่ได้ตั้ง APPS_SCRIPT_URL / APPS_SCRIPT_SECRET — ใช้ข้อมูลในหน่วยความจำ (หายเมื่อรีสตาร์ท)');
  return new MemoryStore();
}

export const store = createStore();
