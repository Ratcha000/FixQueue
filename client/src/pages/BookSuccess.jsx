import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { copyText, queueNo, thaiDate, thaiDateTime } from '../format.js';
import { lineMessageUrl } from '../lineUrl.js';

function loadQueue(state) {
  if (state?.pin) return state;
  try { return JSON.parse(sessionStorage.getItem('lastQueue')); } catch { return null; }
}

export default function BookSuccess() {
  const { state } = useLocation();
  const q = loadQueue(state);
  const [copied, setCopied] = useState(false);
  const [lineCopied, setLineCopied] = useState(false);

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

  const lineMsg = [
    `เลขเช็คคิว: ${q.pin}`,
    `เลขคิว: ${queueNo(q.code)} (${q.code})`,
    `วันที่นัด: ${thaiDate(q.date, { weekday: true })}`,
  ].join('\n');
  const lineHref = lineMessageUrl(lineMsg);

  // คัดลอกข้อความไว้ด้วย เผื่อช่องแชทไม่มีข้อความขึ้นมา (ไม่ await เพื่อให้เปิด LINE ได้ทันที)
  const sendToLine = () => {
    copyText(lineMsg).then((ok) => ok && setLineCopied(true));
  };

  return (
    <div className="card success-card">
      <div className="success-icon" aria-hidden>✓</div>
      <h1>ลงคิวสำเร็จ</h1>
      <p className="muted">เลขเช็คคิวของคุณคือ</p>
      <div className="pin-display">{q.pin}</div>
      {lineHref && (
        <>
          <a className="btn btn-line btn-block" href={lineHref} target="_blank" rel="noopener noreferrer" onClick={sendToLine}>
            ส่งเลขคิวไปที่ LINE ร้าน
          </a>
          <p className="line-hint muted small">
            {lineCopied
              ? 'คัดลอกข้อความไว้แล้ว ถ้าช่องแชทว่าง ให้กดวางแล้วส่งได้เลย'
              : 'ส่งเลขนี้ให้แอดมินในแชท LINE เพื่อเก็บไว้ไม่ให้หาย และถามสถานะได้ทุกเมื่อ'}
          </p>
        </>
      )}
      <button type="button" className="btn btn-outline" onClick={copy}>
        {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกเลข'}
      </button>
      <p className="alert alert-warn">กรุณาจดหรือแคปหน้าจอนี้ไว้ ใช้เลข 4 หลักนี้เพื่อเช็คคิว</p>

      <dl className="detail-list">
        <dt>เลขคิว</dt><dd className="queue-no">{queueNo(q.code)}</dd>
        <dt>วันที่นัด</dt><dd>{thaiDate(q.date, { weekday: true })}</dd>
        <dt>รหัสคิว</dt><dd className="mono">{q.code}</dd>
        <dt>ลงคิวเมื่อ</dt><dd>{thaiDateTime(q.created_at)}</dd>
        {q.app && (<><dt>แอป</dt><dd>{q.app}</dd></>)}
        {q.problem && (<><dt>ปัญหา</dt><dd>{q.problem}</dd></>)}
        {q.detail && (<><dt>รายละเอียด</dt><dd className="pre">{q.detail}</dd></>)}
        <dt>อีเมลที่มีปัญหา</dt><dd className="break">{q.problem_email}</dd>
        <dt>ชื่อ family</dt><dd>{q.family_name}</dd>
        <dt>วันหมดรอบบิล</dt><dd>{thaiDate(q.bill_due)}</dd>
      </dl>

      <div className="btn-row">
        <Link to="/check" className="btn btn-primary">เช็คคิว</Link>
        <Link to="/" className="btn btn-ghost">กลับหน้าหลัก</Link>
      </div>
    </div>
  );
}
