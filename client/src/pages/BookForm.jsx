import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { thaiDate } from '../format.js';
import ErrorAlert from '../components/ErrorAlert.jsx';
import Loader, { LoadingOverlay } from '../components/Loader.jsx';
import BookRulesModal from '../components/BookRulesModal.jsx';

const OTHER = '__other__';
const CYCLES = ['3 เดือน', '6 เดือน', '12 เดือน'];

export default function BookForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [dates, setDates] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false); // อ่านข้อแนะนำก่อนลงคิวแล้ว
  const [form, setForm] = useState({
    date: params.get('date') || '',
    line_name: '', problem_email: '', family_name: '', notify_email: '',
    bill_due: '', cycle: '', cycleOther: '',
  });

  useEffect(() => {
    api.get('/api/available-dates')
      .then((ds) => {
        setDates(ds);
        setForm((f) => ({ ...f, date: ds.some((d) => d.date === f.date) ? f.date : ds[0]?.date || '' }));
      })
      .catch(setLoadError);
  }, []);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const billing_cycle = form.cycle === OTHER ? form.cycleOther.trim() : form.cycle;
    if (!billing_cycle) {
      setError('กรุณาเลือกรอบเดือน หรือพิมพ์ในช่อง "อื่นๆ"');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post('/api/queue', {
        date: form.date,
        line_name: form.line_name,
        problem_email: form.problem_email,
        family_name: form.family_name,
        notify_email: form.notify_email,
        bill_due: form.bill_due,
        billing_cycle,
      });
      try { sessionStorage.setItem('lastQueue', JSON.stringify(result)); } catch { /* ไม่เป็นไร */ }
      navigate('/success', { state: result, replace: true });
    } catch (err) {
      setError(err);
      if (err.status === 409) api.get('/api/available-dates').then(setDates).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  // แสดงข้อแนะนำก่อน (ระหว่างนี้ข้อมูลฟอร์มโหลดอยู่เบื้องหลัง)
  if (!accepted) return <BookRulesModal onAccept={() => setAccepted(true)} />;

  if (loadError) {
    return (
      <div className="card form-card">
        <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
        <ErrorAlert error={loadError} />
      </div>
    );
  }
  if (!dates) return <div className="card form-card"><Loader label="กำลังโหลดแบบฟอร์ม…" /></div>;

  return (
    <div className="card form-card">
      <LoadingOverlay show={submitting} label="กำลังลงคิว กรุณารอสักครู่…" />
      <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
      <h1>ลงคิวแจ้งปัญหา</h1>

      {dates.length === 0 ? (
        <p className="alert alert-warn">ขออภัย ตอนนี้คิวเต็มทุกวัน กรุณาติดต่อแอดมิน</p>
      ) : (
        <form onSubmit={submit} className="form">
          <fieldset className="form-section">
            <legend>ข้อมูลติดต่อ</legend>
            <label className="field">
              <span>ชื่อ LINE ลูกค้า *</span>
              <input value={form.line_name} onChange={set('line_name')} maxLength={100} required placeholder="ชื่อที่แสดงใน LINE" />
            </label>
            <label className="field">
              <span>อีเมลที่มีปัญหา *</span>
              <input type="email" value={form.problem_email} onChange={set('problem_email')} maxLength={200} required inputMode="email" autoCapitalize="off" />
            </label>
            <label className="field">
              <span>หัวแฟม (อีเมล family)*</span>
              <input value={form.family_name} onChange={set('family_name')} maxLength={100} required />
            </label>
            <div className="field-row">
              <label className="field">
                <span>วันหมดรอบบิล *</span>
                <input type="date" value={form.bill_due} onChange={set('bill_due')} required />
              </label>
              <label className="field">
                <span>รอบเดือน *</span>
                <select value={form.cycle} onChange={set('cycle')} required>
                  <option value="" disabled>— เลือกรอบ —</option>
                  {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value={OTHER}>อื่นๆ (พิมพ์เอง)</option>
                </select>
              </label>
            </div>
            {form.cycle === OTHER && (
              <label className="field">
                <span>ระบุรอบเดือน *</span>
                <input value={form.cycleOther} onChange={set('cycleOther')} maxLength={50} required placeholder="เช่น 2 เดือน" />
              </label>
            )}
            <label className="field">
              <span>อีเมลของลูกค้าเอง (สำหรับแจ้งความคืบหน้า) <small className="muted">ไม่บังคับ</small></span>
              <input type="email" value={form.notify_email} onChange={set('notify_email')} maxLength={200} inputMode="email" autoCapitalize="off" autoComplete="email" />
              <small className="muted">ถ้ากรอก แอดมินจะแจ้งสถานะการแก้ไขทางอีเมลนี้</small>
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

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'กำลังลงคิว…' : 'ยืนยันลงคิว'}
          </button>
        </form>
      )}
    </div>
  );
}
