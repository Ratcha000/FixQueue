import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { thaiDate, thaiDateTime } from '../format.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

export default function CheckQueue() {
  const [pin, setPin] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      setResult(await api.post('/api/queue/check', { pin }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card">
      <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
      <h1>เช็คคิว</h1>
      <form onSubmit={submit} className="pin-form">
        <label className="field">
          <span>กรอกเลขคิว 4 หลัก</span>
          <input
            className="pin-input"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            autoComplete="off"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="••••"
            required
          />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={pin.length !== 4 || loading}>
          {loading ? 'กำลังค้นหา…' : 'ตรวจสอบ'}
        </button>
      </form>

      <ErrorAlert error={error} />

      {result && (
        <div className="result">
          <div className="result-head">
            <span className="mono">{result.code}</span>
            <StatusBadge status={result.status} />
          </div>
          {result.status !== 'done' && (
            <p className="muted">
              {result.ahead > 0 ? `มีคิวก่อนหน้าคุณอีก ${result.ahead} คิว` : 'คุณเป็นคิวถัดไป'}
            </p>
          )}
          <dl className="detail-list">
            <dt>วันที่นัด</dt><dd>{thaiDate(result.date, { weekday: true })}</dd>
            <dt>ลงคิวเมื่อ</dt><dd>{thaiDateTime(result.created_at)}</dd>
            <dt>แอป</dt><dd>{result.app}</dd>
            <dt>ปัญหา</dt><dd>{result.problem}</dd>
            {result.detail && (<><dt>รายละเอียด</dt><dd className="pre">{result.detail}</dd></>)}
            <dt>ชื่อ LINE</dt><dd>{result.line_name}</dd>
            <dt>อีเมลที่มีปัญหา</dt><dd className="break">{result.problem_email}</dd>
            <dt>วันหมดรอบบิล</dt><dd>{thaiDate(result.bill_due)}</dd>
            <dt>รอบเดือน</dt><dd>{result.billing_cycle}</dd>
            <dt>อัปเดตล่าสุด</dt><dd>{thaiDateTime(result.updated_at)}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
