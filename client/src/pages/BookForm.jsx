import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { thaiDate } from '../format.js';
import ErrorAlert from '../components/ErrorAlert.jsx';

const OTHER = '__other__';
const CYCLES = ['1 เดือน', '3 เดือน', '6 เดือน', '12 เดือน'];

export default function BookForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [options, setOptions] = useState([]);
  const [dates, setDates] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    app: '', appOther: '', problem: '', problemOther: '', date: params.get('date') || '', detail: '',
    line_name: '', problem_email: '', family_name: '', notify_email: '',
    bill_due: '', cycle: '', cycleOther: '',
  });

  useEffect(() => {
    Promise.all([api.get('/api/options'), api.get('/api/available-dates')])
      .then(([opts, ds]) => {
        setOptions(opts);
        setDates(ds);
        setForm((f) => ({ ...f, date: ds.some((d) => d.date === f.date) ? f.date : ds[0]?.date || '' }));
      })
      .catch(setLoadError);
  }, []);

  const problems = useMemo(
    () => options.find((o) => o.app === form.app)?.problems || [],
    [options, form.app],
  );

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === 'app' ? { problem: '', problemOther: '' } : {}) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    const app = form.app === OTHER ? form.appOther.trim() : form.app;
    const problem = form.problem === OTHER || form.app === OTHER ? form.problemOther.trim() : form.problem;
    const billing_cycle = form.cycle === OTHER ? form.cycleOther.trim() : form.cycle;
    if (!app || !problem) {
      setError('กรุณาเลือกแอปและปัญหา หรือพิมพ์ในช่อง "อื่นๆ"');
      return;
    }
    if (!billing_cycle) {
      setError('กรุณาเลือกรอบเดือน หรือพิมพ์ในช่อง "อื่นๆ"');
      return;
    }
    setSubmitting(true);
    try {
      const result = await api.post('/api/queue', {
        app, problem, date: form.date, detail: form.detail,
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

  if (loadError) {
    return (
      <div className="card form-card">
        <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
        <ErrorAlert error={loadError} />
      </div>
    );
  }
  if (!dates) return <div className="card"><div className="skeleton" style={{ height: 320 }} /></div>;

  const appIsOther = form.app === OTHER;

  return (
    <div className="card form-card">
      <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
      <h1>ลงคิวแจ้งปัญหา</h1>

      {dates.length === 0 ? (
        <p className="alert alert-warn">ขออภัย ตอนนี้คิวเต็มทุกวัน กรุณาติดต่อแอดมิน</p>
      ) : (
        <form onSubmit={submit} className="form">
          <fieldset className="form-section">
            <legend>ปัญหาที่พบ</legend>
            <label className="field">
              <span>แอปที่มีปัญหา *</span>
              <select value={form.app} onChange={set('app')} required>
                <option value="" disabled>— เลือกแอป —</option>
                {options.map((o) => <option key={o.app} value={o.app}>{o.app}</option>)}
                <option value={OTHER}>อื่นๆ (พิมพ์เอง)</option>
              </select>
            </label>
            {appIsOther && (
              <label className="field">
                <span>ชื่อแอป *</span>
                <input value={form.appOther} onChange={set('appOther')} maxLength={100} required placeholder="เช่น Disney+" />
              </label>
            )}

            {form.app && !appIsOther && (
              <label className="field">
                <span>ปัญหา *</span>
                <select value={form.problem} onChange={set('problem')} required>
                  <option value="" disabled>— เลือกปัญหา —</option>
                  {problems.map((p) => <option key={p} value={p}>{p}</option>)}
                  <option value={OTHER}>อื่นๆ (พิมพ์เอง)</option>
                </select>
              </label>
            )}
            {(appIsOther || form.problem === OTHER) && (
              <label className="field">
                <span>ระบุปัญหา *</span>
                <input value={form.problemOther} onChange={set('problemOther')} maxLength={200} required placeholder="อธิบายปัญหาสั้นๆ" />
              </label>
            )}

            <label className="field">
              <span>รายละเอียดเพิ่มเติม</span>
              <textarea value={form.detail} onChange={set('detail')} rows={4} maxLength={2000} placeholder="เช่น เกิดขึ้นตั้งแต่เมื่อไหร่ ขึ้นข้อความอะไร" />
            </label>
          </fieldset>

          <fieldset className="form-section">
            <legend>วันที่ต้องการ</legend>
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
              <span>ชื่อ family *</span>
              <input value={form.family_name} onChange={set('family_name')} maxLength={100} required />
            </label>
            <label className="field">
              <span>อีเมลของลูกค้าเอง (สำหรับแจ้งความคืบหน้า) *</span>
              <input type="email" value={form.notify_email} onChange={set('notify_email')} maxLength={200} required inputMode="email" autoCapitalize="off" autoComplete="email" />
              <small className="muted">แอดมินจะแจ้งสถานะการแก้ไขทางอีเมลนี้</small>
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
