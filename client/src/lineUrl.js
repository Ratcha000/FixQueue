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

/**
 * ลิงก์เปิดแชท LINE ร้านพร้อมข้อความในช่องพิมพ์ (ลูกค้ากดส่งเอง)
 * ใช้ได้กับ LINE OA ที่ลิงก์มี @ไอดี เช่น https://line.me/R/ti/p/@shop
 * ถ้าหาไอดีไม่เจอ คืนลิงก์ LINE เดิม (ข้อความจะถูกคัดลอกไว้ให้วางเอง)
 */
export function lineMessageUrl(text) {
  const url = getLineUrl();
  if (!url) return '';
  let decoded = url;
  try { decoded = decodeURIComponent(url); } catch { /* ใช้ค่าเดิม */ }
  const id = decoded.match(/@[\w.-]+/)?.[0];
  if (!id) return url;
  return `https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(text)}`;
}
