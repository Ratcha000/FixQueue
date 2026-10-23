import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const COOKIE = 'admin_token';
const TTL_HOURS = 12;

function secret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || typeof input !== 'string') return false;
  // เทียบแบบเวลาคงที่ กันการเดาจากเวลาตอบกลับ
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

export function setSession(res) {
  const token = jwt.sign({ role: 'admin' }, secret(), { expiresIn: `${TTL_HOURS}h` });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TTL_HOURS * 3600 * 1000,
    path: '/',
  });
}

export function clearSession(res) {
  res.clearCookie(COOKIE, { path: '/' });
}

export function requireAdmin(req, res, next) {
  try {
    const payload = jwt.verify(req.cookies?.[COOKIE] || '', secret());
    if (payload.role !== 'admin') throw new Error('bad role');
    next();
  } catch {
    res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  }
}
