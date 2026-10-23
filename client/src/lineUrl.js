// ลิงก์ LINE ร้าน — ต้องใช้ได้แม้เซิร์ฟเวอร์ล่ม จึงจำค่าล่าสุดไว้ในเบราว์เซอร์
// และมีค่าสำรองจาก VITE_LINE_URL ที่ฝังไว้ตอน build
import { api } from './api.js';

const KEY = 'lineUrl';
const FALLBACK = import.meta.env.VITE_LINE_URL || '';

export function getLineUrl() {
  try {
    return localStorage.getItem(KEY) || FALLBACK;
  } catch {
    return FALLBACK;
  }
}

/** ดึงลิงก์ล่าสุดจากเซิร์ฟเวอร์แล้วจำไว้ (เรียกครั้งเดียวตอนเปิดแอป) */
export async function refreshLineUrl() {
  try {
    const { line_url: url } = await api.get('/api/contact');
    if (url) {
      try { localStorage.setItem(KEY, url); } catch { /* ไม่เป็นไร */ }
    }
    return url || FALLBACK;
  } catch {
    return getLineUrl();
  }
}
