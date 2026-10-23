// เวลาทั้งหมดของระบบคิดเป็นเวลาไทย (Render ใช้ UTC)
const TZ = 'Asia/Bangkok';

const dateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});
const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

/** วันนี้ในรูปแบบ YYYY-MM-DD */
export function todayStr(d = new Date()) {
  return dateFmt.format(d);
}

/** วันเวลาปัจจุบัน YYYY-MM-DD HH:mm:ss (เวลาไทย) */
export function nowStr(d = new Date()) {
  return `${dateFmt.format(d)} ${timeFmt.format(d)}`;
}

/** เดือนปัจจุบัน YYYY-MM */
export function thisMonth() {
  return todayStr().slice(0, 7);
}

export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function daysInMonth(month) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 2026-10-23 -> 231069 (วัน เดือน ปี พ.ศ. 2 หลัก) */
export function thaiDateCode(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const be = String((Number(y) + 543) % 100).padStart(2, '0');
  return `${d}${m}${be}`;
}
