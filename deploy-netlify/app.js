import express from 'express';
import cookieParser from 'cookie-parser';
import publicRoutes from '../server/routes/public.js';
import adminRoutes from '../server/routes/admin.js';

// เหมือน server/index.js แต่ไม่มี listen / static (Netlify เสิร์ฟหน้าเว็บเอง)
export const app = express();
app.set('trust proxy', 1); // อยู่หลัง proxy ของ Netlify — ให้ rate limit เห็น IP จริง
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'ไม่พบ API นี้' }));

// Express 5 ส่ง error จาก async handler มาที่นี่เอง
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง' });
});
