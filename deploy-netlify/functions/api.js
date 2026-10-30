import serverless from 'serverless-http';
import { store } from '../../server/sheets.js';
import { app } from '../app.js';

process.env.NODE_ENV ||= 'production'; // ให้ cookie แอดมินเป็น secure (server/auth.js)

// Netlify ส่ง /api/* มาเป็น /.netlify/functions/api/* — แปลงกลับเป็น /api/* ให้ Express
const wrapped = serverless((req, res) => {
  req.url = req.url.replace(/^\/\.netlify\/functions\/api(?=\/|\?|$)/, '/api');
  // IP จริงของผู้ใช้ (ใช้กับ rate limit กันเดา PIN) — serverless ไม่มี socket ให้ Express อ่าน
  const ip = req.headers['x-nf-client-connection-ip']
    || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || 'unknown';
  Object.defineProperty(req, 'ip', { value: ip });
  app(req, res);
});

// เตรียม Google Sheet ครั้งเดียวต่อ cold start (ถ้าล้มเหลว ครั้งหน้าลองใหม่)
let ready;

export const handler = async (event, context) => {
  ready ||= store.init().catch((err) => {
    ready = undefined;
    throw err;
  });
  try {
    await ready;
  } catch (err) {
    console.error('เชื่อมต่อ Google Sheet (Apps Script) ไม่ได้:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' }),
    };
  }
  return wrapped(event, context);
};
