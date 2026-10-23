import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { copyText, thaiDate, thaiDateTime } from '../format.js';

function loadQueue(state) {
  if (state?.pin) return state;
  try { return JSON.parse(sessionStorage.getItem('lastQueue')); } catch { return null; }
}

export default function BookSuccess() {
  const { state } = useLocation();
  const q = loadQueue(state);
  const [copied, setCopied] = useState(false);

  if (!q) {
    return (
      <div className="card center">
        <p>ไม่พบข้อมูลการลงคิว</p>
        <Link to="/" className="btn btn-primary">กลับหน้าหลัก</Link>
      </div>
    );
  }

  const copy = async () => {
    if (await copyText(q.pin)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card success-card">
      <div className="success-icon" aria-hidden>✓</div>
      <h1>ลงคิวสำเร็จ</h1>
      <p className="muted">เลขเช็คคิวของคุณคือ</p>
      <div className="pin-display">{q.pin}</div>
      <button type="button" className="btn btn-outline" onClick={copy}>
        {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกเลข'}
      </button>
      <p className="alert alert-warn">กรุณาจดหรือแคปหน้าจอนี้ไว้ ใช้เลข 4 หลักนี้เพื่อเช็คคิว</p>

      <dl className="detail-list">
        <dt>รหัสคิว</dt><dd className="mono">{q.code}</dd>
        <dt>วันที่นัด</dt><dd>{thaiDate(q.date, { weekday: true })}</dd>
        <dt>ลงคิวเมื่อ</dt><dd>{thaiDateTime(q.created_at)}</dd>
        <dt>แอป</dt><dd>{q.app}</dd>
        <dt>ปัญหา</dt><dd>{q.problem}</dd>
        {q.detail && (<><dt>รายละเอียด</dt><dd className="pre">{q.detail}</dd></>)}
        <dt>ชื่อ LINE</dt><dd>{q.line_name}</dd>
        <dt>อีเมลที่มีปัญหา</dt><dd className="break">{q.problem_email}</dd>
        <dt>ชื่อ family</dt><dd>{q.family_name}</dd>
        <dt>อีเมลลูกค้า</dt><dd className="break">{q.notify_email}</dd>
        <dt>วันหมดรอบบิล</dt><dd>{thaiDate(q.bill_due)}</dd>
        <dt>รอบเดือน</dt><dd>{q.billing_cycle}</dd>
      </dl>

      <div className="btn-row">
        <Link to="/check" className="btn btn-primary">เช็คคิว</Link>
        <Link to="/" className="btn btn-ghost">กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}
