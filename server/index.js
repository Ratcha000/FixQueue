import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import { store } from './sheets.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'client', 'dist');
const PORT = process.env.PORT || 3000;

const app = express();
app.set('trust proxy', 1); // Render อยู่หลัง proxy — ให้ rate limit เห็น IP จริง
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

// หน้าแอดมินไม่ให้ search engine เก็บ
app.use('/admin', (req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false }));
  // ทุก path ที่ไม่ใช่ไฟล์ ให้ React Router จัดการ
  app.use((req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

store.init()
  .then(() => app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('เชื่อมต่อ Google Sheet (Apps Script) ไม่ได้:', err.message);
    process.exit(1);
  });
