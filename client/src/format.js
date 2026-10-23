const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const WEEKDAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

/** 2026-10-23 -> ศุกร์ 23 ต.ค. 2569 */
export function thaiDate(dateStr, { weekday = false } = {}) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${weekday ? `${WEEKDAYS[wd]} ` : ''}${d} ${MONTHS[m - 1]} ${y + 543}`;
}

/** 2026-10-23 14:05:00 -> 23 ต.ค. 2569 เวลา 14:05 น. */
export function thaiDateTime(s) {
  if (!s) return '';
  return `${thaiDate(s)} เวลา ${s.slice(11, 16)} น.`;
}

export const STATUS_LABEL = {
  waiting: 'รอแก้ไข',
  in_progress: 'กำลังแก้ไข',
  done: 'แก้ไขเสร็จแล้ว',
};

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // สำรองสำหรับเบราว์เซอร์ที่ไม่รองรับ clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
