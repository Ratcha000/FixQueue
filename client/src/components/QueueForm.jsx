import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { thaiDate } from '../format.js';
import ErrorAlert from './ErrorAlert.jsx';
import Loader, { LoadingOverlay } from './Loader.jsx';

const GMAIL_RE = /^[a-z0-9][a-z0-9.+]*@gmail\.com$/i;
const GMAIL_MSG = 'ต้องเป็นอีเมล @gmail.com เช่น example@gmail.com';

/** จัดรูปอีเมล: ตัดช่องว่าง ตัวเล็ก และเติม @gmail.com ให้ถ้าลืมใส่ @ */
function normalizeGmail(v) {
  const t = v.replace(/\s+/g, '').toLowerCase();
  if (t && !t.includes('@')) return `${t}@gmail.com`;
  return t;
}

/** ฟอร์มลงคิว ใช้ทั้งหน้า /book และหน้าหลัก (embedded = ฝังในหน้าหลัก) */
export default function QueueForm({ embedded = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [dates, setDates] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: params.get('date') || '',
    problem_email: '', family_name: '', bill_due: '',
  });

  useEffect(() => {
    api.get('/api/available-dates')
      .then((ds) => {
        setDates(ds);
        setForm((f) => ({ ...f, date: ds.some((d) => d.date === f.date) ? f.date : ds[0]?.date || '' }));
      })
      .catch(setLoadError);
  }, []);

  const [touched, setTouched] = useState({});
  const gmailError = (key) => (touched[key] && form[key] && !GMAIL_RE.test(form[key]) ? GMAIL_MSG : '');

  // ออกจากช่องอีเมล: จัดรูปให้ และเริ่มแสดงข้อความเตือนถ้ายังผิด
  const blurGmail = (key) => () => {
    setForm((f) => ({ ...f, [key]: normalizeGmail(f[key]) }));
    setTouched((t) => ({ ...t, [key]: true }));
  };

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const problem_email = normalizeGmail(form.problem_email);
    const family_name = normalizeGmail(form.family_name);
    setForm((f) => ({ ...f, problem_email, family_name }));
    setTouched({ problem_email: true, family_name: true });
    if (!GMAIL_RE.test(problem_email) || !GMAIL_RE.test(family_name)) {
      setError({ message: `อีเมลที่มีปัญหาและหัวแฟม${GMAIL_MSG}` });
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.post('/api/queue', {
        date: form.date,
        problem_email,
        family_name,
        bill_due: form.bill_due,
      });
      try { sessionStorage.setItem('lastQueue', JSON.stringify(result)); } catch { /* ไม่เป็นไร */ }
      navigate('/success', { state: result, replace: !embedded });
    } catch (err) {
      setError(err);
      if (err.status === 409) api.get('/api/available-dates').then(setDates).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = !embedded && <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>;
  const title = embedded ? <h2>ลงคิวแจ้งปัญหา</h2> : <h1>ลงคิวแจ้งปัญหา</h1>;

  if (loadError) {
    return (
      <div className="card form-card">
        {backLink}
        {embedded && title}
        <ErrorAlert error={loadError} />
      </div>
    );
  }
  if (!dates) {
    return (
      <div className="card form-card">
        {embedded && title}
        <Loader label="กำลังโหลดแบบฟอร์ม…" />
      </div>
    );
  }

  return (
    <div className="card form-card">
      <LoadingOverlay show={submitting} label="กำลังลงคิว กรุณารอสักครู่…" />
      {backLink}
      {title}

      {dates.length === 0 ? (
        <p className="alert alert-warn">ขออภัย ตอนนี้คิวเต็มทุกวัน กรุณาติดต่อแอดมิน</p>
      ) : (
        <form onSubmit={submit} className="form">
          <fieldset className="form-section">
            <legend>ข้อมูลติดต่อ</legend>
            <label className="field">
              <span>อีเมลที่มีปัญหา *</span>
              <input type="email" value={form.problem_email} onChange={set('problem_email')} onBlur={blurGmail('problem_email')} maxLength={200} required inputMode="email" autoCapitalize="off" autoCorrect="off" spellCheck={false}  aria-invalid={!!gmailError('problem_email')} />
              {gmailError('problem_email')
                ? <small className="field-error">{gmailError('problem_email')}</small>
                : <small className="muted">อีเมลที่ใช้กับ YouTube </small>}
            </label>
            <label className="field">
              <span>หัวแฟม (อีเมล family)*</span>
              <input type="email" value={form.family_name} onChange={set('family_name')} onBlur={blurGmail('family_name')} maxLength={100} required inputMode="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-invalid={!!gmailError('family_name')} />
              {gmailError('family_name')
                ? <small className="field-error">{gmailError('family_name')}</small>
                : <small className="muted"></small>}
            </label>
            <label className="field">
              <span>วันหมดรอบบิล *</span>
              <input type="date" value={form.bill_due} onChange={set('bill_due')} required />
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend>วันที่ต้องการลงคิว</legend>
            <label className="field">
              <span>วันที่ *</span>
              <select value={form.date} onChange={set('date')} required>
                {dates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {thaiDate(d.date, { weekday: true })} — ว่าง {d.free} คิว
                  </option>
                ))}
              </select>
            </label>
          </fieldset>

          <ErrorAlert error={error} />

          <p className="muted small">ข้อมูลผิดอาจทำให้คิวล่าช้า ตรวจสอบอีกครั้งก่อนกดลงคิว</p>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'กำลังลงคิว…' : 'ยืนยันลงคิว'}
          </button>
        </form>
      )}
    </div>
  );
}
