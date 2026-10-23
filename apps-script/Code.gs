/**
 * ฐานข้อมูลระบบจองคิว — วางไฟล์นี้ใน Google Sheet (ส่วนขยาย → Apps Script)
 * แล้ว Deploy เป็น Web app: Execute as = Me, Who has access = Anyone
 *
 * ⚠️ เปลี่ยน SECRET ให้ตรงกับ APPS_SCRIPT_SECRET บน Render (ข้อความสุ่มยาวๆ)
 *
 * โครงสร้างคอลัมน์มาจากเซิร์ฟเวอร์ (ตอน init) และอ่าน/เขียนตามชื่อหัวตาราง
 * จึงสลับลำดับคอลัมน์ใน Sheet ได้ และเพิ่มช่องใหม่ได้โดยไม่ต้อง deploy สคริปต์นี้ใหม่
 */
const SECRET = 'เปลี่ยนเป็นรหัสลับของคุณ';

function doGet() {
  return json_({ ok: true, service: 'queue-db', version: 2 });
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.secret !== SECRET) return json_({ error: 'unauthorized' });
    return json_({ ok: true, data: handle_(req) });
  } catch (err) {
    return json_({ error: String((err && err.message) || err) });
  }
}

function handle_(req) {
  switch (req.action) {
    case 'init': return withLock_(() => init_(req.headers || {}, req.renames || {}, req.seed || {}));
    case 'getRows': return getRows_(req.sheet);
    case 'append': return withLock_(() => append_(req.sheet, req.obj));
    case 'update': return withLock_(() => update_(req.sheet, req.key, req.obj));
    case 'replaceAll': return withLock_(() => replaceAll_(req.sheet, req.objs || []));
    case 'archive': return withLock_(() => archive_(req.before));
    default: throw new Error('unknown action: ' + req.action);
  }
}

// ---------- helpers ----------
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function sheet_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(String(name));
  if (!sh) throw new Error('missing sheet: ' + name + ' (call init)');
  return sh;
}

/** หัวตาราง (แถว 1) ตัดช่องว่างท้ายออก */
function header_(sh) {
  const width = sh.getLastColumn();
  if (!width) return [];
  const h = sh.getRange(1, 1, 1, width).getDisplayValues()[0];
  while (h.length && h[h.length - 1] === '') h.pop();
  return h;
}

/** เขียนเป็นข้อความล้วน กัน Sheet แปลง PIN "0534" เป็นเลข 534 หรือแปลงวันที่ */
function writeRows_(sh, startRow, rows) {
  if (!rows.length) return;
  sh.getRange(startRow, 1, rows.length, rows[0].length).setNumberFormat('@').setValues(rows);
}

function readBody_(sh, width) {
  const last = sh.getLastRow();
  if (last < 2 || !width) return [];
  return sh.getRange(2, 1, last - 1, width).getDisplayValues().filter((r) => r.some((v) => v !== ''));
}

function toRow_(header, obj) {
  return header.map((h) => (obj && obj[h] != null ? String(obj[h]) : ''));
}

function clearBody_(sh, width) {
  const last = sh.getLastRow();
  if (last >= 2 && width) sh.getRange(2, 1, last - 1, width).clearContent();
}

// ---------- actions ----------
/**
 * สร้างชีตที่ยังไม่มี และย้ายข้อมูลถ้าหัวตารางเปลี่ยน
 * headers = { Queues: [...], ... }, renames = { ชื่อเก่า: ชื่อใหม่ }, seed = { Options: [[...]], ... }
 */
function init_(headers, renames, seed) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const migrated = {};
  Object.keys(headers).forEach((name) => {
    const want = headers[name];
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);

    if (sh.getLastRow() === 0) {
      writeRows_(sh, 1, [want]);
      sh.setFrozenRows(1);
      writeRows_(sh, 2, (seed[name] || []).map((r) => want.map((_, i) => (r[i] == null ? '' : String(r[i])))));
      return;
    }

    const cur = header_(sh);
    if (cur.join('\u0001') === want.join('\u0001')) return;

    // จับคู่คอลัมน์ใหม่กับคอลัมน์เดิมตามชื่อ (รวมชื่อที่ถูกเปลี่ยน)
    const src = want.map((k) => {
      let i = cur.indexOf(k);
      if (i < 0) {
        const old = Object.keys(renames).find((o) => renames[o] === k);
        if (old) i = cur.indexOf(old);
      }
      return i;
    });
    const rows = readBody_(sh, cur.length).map((r) => src.map((i) => (i >= 0 ? r[i] : '')));
    sh.getRange(1, 1, Math.max(sh.getLastRow(), 1), Math.max(cur.length, want.length)).clearContent();
    writeRows_(sh, 1, [want]);
    writeRows_(sh, 2, rows);
    migrated[name] = rows.length;
  });
  return { migrated: migrated };
}

/** คืนค่า { header, rows } ให้เซิร์ฟเวอร์จับคู่ตามชื่อคอลัมน์ */
function getRows_(name) {
  const sh = sheet_(name);
  const header = header_(sh);
  return { header: header, rows: readBody_(sh, header.length) };
}

function append_(name, obj) {
  const sh = sheet_(name);
  writeRows_(sh, sh.getLastRow() + 1, [toRow_(header_(sh), obj)]);
  return true;
}

/** อัปเดตแถวที่คอลัมน์ `key` (เช่น code) ตรงกับ obj[key] */
function update_(name, key, obj) {
  const sh = sheet_(name);
  const header = header_(sh);
  const col = header.indexOf(key);
  if (col < 0) throw new Error('missing column: ' + key);
  const last = sh.getLastRow();
  if (last >= 2) {
    const keys = sh.getRange(2, col + 1, last - 1, 1).getDisplayValues();
    for (let i = 0; i < keys.length; i++) {
      if (keys[i][0] === String(obj[key])) {
        writeRows_(sh, i + 2, [toRow_(header, obj)]);
        return true;
      }
    }
  }
  throw new Error('not found');
}

function replaceAll_(name, objs) {
  const sh = sheet_(name);
  const header = header_(sh);
  clearBody_(sh, header.length);
  writeRows_(sh, 2, objs.map((o) => toRow_(header, o)));
  return true;
}

/** ย้ายคิวที่เสร็จแล้ว และวันนัดก่อน `before` (YYYY-MM-DD) ไปชีต Archive */
function archive_(before) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(before || '')) throw new Error('bad date');
  const sh = sheet_('Queues');
  const header = header_(sh);
  const dateCol = header.indexOf('date');
  const statusCol = header.indexOf('status');
  if (dateCol < 0 || statusCol < 0) throw new Error('missing date/status column');

  const rows = readBody_(sh, header.length);
  const isOld = (r) => r[statusCol] === 'done' && r[dateCol] < before;
  const move = rows.filter(isOld);
  if (!move.length) return 0;

  const arch = sheet_('Archive');
  const archHeader = header_(arch);
  const toArch = move.map((r) => archHeader.map((h) => {
    const i = header.indexOf(h);
    return i >= 0 ? r[i] : '';
  }));
  writeRows_(arch, arch.getLastRow() + 1, toArch);

  clearBody_(sh, header.length);
  writeRows_(sh, 2, rows.filter((r) => !isOld(r)));
  return move.length;
}
