import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { checkPassword, setSession, clearSession, requireAdmin } from '../auth.js';
import { listByDate, updateStatus, getSettings, saveSettings, archiveOld, archiveOldDaily, ARCHIVE_AFTER_DAYS } from '../queue.js';
import { todayStr } from '../time.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาที' },
});

router.post('/login', loginLimiter, (req, res) => {
  if (!checkPassword(req.body?.password)) {
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  setSession(res);
  res.json({ ok: true });
});

router.post('/logout', (req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

router.use(requireAdmin);

router.get('/me', (req, res) => {
  archiveOldDaily();
  res.json({ ok: true, today: todayStr() });
});

router.post('/archive', async (req, res) => {
  res.json({ moved: await archiveOld(), days: ARCHIVE_AFTER_DAYS });
});

router.get('/queues', async (req, res) => {
  res.json(await listByDate(req.query.date || todayStr()));
});

router.patch('/queues/:code', async (req, res) => {
  res.json(await updateStatus(req.params.code, req.body?.status));
});

router.get('/settings', async (req, res) => {
  res.json(await getSettings());
});

router.put('/settings', async (req, res) => {
  res.json(await saveSettings(req.body || {}));
});

export default router;
