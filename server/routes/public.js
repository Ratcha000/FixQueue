import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getOptions, getCalendar, getAvailableDates, getTodaySummary, createQueue, findByPin, getSettings,
} from '../queue.js';
import { thisMonth } from '../time.js';

const router = Router();

const checkLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  message: { error: 'เช็คคิวบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});
const bookLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  message: { error: 'ลงคิวบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
});

router.get('/options', async (req, res) => {
  res.json(await getOptions());
});

router.get('/calendar', async (req, res) => {
  const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : thisMonth();
  res.json(await getCalendar(month));
});

router.get('/available-dates', async (req, res) => {
  res.json(await getAvailableDates());
});

router.get('/today', async (req, res) => {
  res.json(await getTodaySummary());
});

router.post('/queue', bookLimiter, async (req, res) => {
  const q = await createQueue(req.body || {});
  res.status(201).json({
    code: q.code, pin: q.pin, date: q.date, app: q.app, problem: q.problem, detail: q.detail,
    line_name: q.line_name, problem_email: q.problem_email, family_name: q.family_name,
    notify_email: q.notify_email, bill_due: q.bill_due, billing_cycle: q.billing_cycle,
    status: q.status, created_at: q.created_at,
  });
});

router.post('/queue/check', checkLimiter, async (req, res) => {
  res.json(await findByPin(String(req.body?.pin ?? '').trim()));
});

router.get('/announcements', async (req, res) => {
  const { announcements } = await getSettings();
  res.json(announcements);
});

router.get('/contact', async (req, res) => {
  const { line_url } = await getSettings();
  res.json({ line_url });
});

export default router;
