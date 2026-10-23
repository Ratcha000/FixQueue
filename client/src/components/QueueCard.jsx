import { useState } from 'react';
import { copyText, thaiDate, thaiDateTime } from '../format.js';
import StatusBadge from './StatusBadge.jsx';

export default function QueueCard({ queue: q, busy, onStart, onFinish, onRevert }) {
  const [copied, setCopied] = useState('');

  const copy = async (which, text) => {
    if (text && (await copyText(text))) {
      setCopied(which);
      setTimeout(() => setCopied(''), 1500);
    }
  };

  return (
    <article className={`qcard qcard-${q.status}`}>
      <div className="qcard-head">
        <span className="mono qcode">{q.code}</span>
        <StatusBadge status={q.status} />
      </div>
      <p className="qcard-title"><b>{q.app}</b> · {q.problem}</p>
      {q.detail && <p className="qcard-detail pre">{q.detail}</p>}
      <dl className="qcard-meta">
        <dt>ชื่อ LINE</dt><dd>{q.line_name}</dd>
        <dt>อีเมลที่มีปัญหา</dt><dd className="break">{q.problem_email}</dd>
        <dt>ชื่อ family</dt><dd>{q.family_name || '-'}</dd>
        <dt>เมลลูกค้า</dt><dd className="break">{q.notify_email || '-'}</dd>
        <dt>หมดรอบบิล</dt><dd>{q.bill_due ? thaiDate(q.bill_due) : '-'}{q.billing_cycle ? ` · ${q.billing_cycle}` : ''}</dd>
        <dt>ลงคิว</dt><dd>{thaiDateTime(q.created_at)}</dd>
      </dl>
      <div className="qcard-actions">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => copy('problem', q.problem_email)}>
          {copied === 'problem' ? 'คัดลอกแล้ว ✓' : 'คัดลอกเมลที่มีปัญหา'}
        </button>
        {q.family_name && (
          <button type="button" className="btn btn-sm btn-outline" onClick={() => copy('family', q.family_name)}>
            {copied === 'family' ? 'คัดลอกแล้ว ✓' : 'คัดลอกชื่อ family'}
          </button>
        )}
        {q.status === 'waiting' && (
          <button type="button" className="btn btn-sm btn-progress" onClick={onStart} disabled={busy}>เริ่มแก้ไข</button>
        )}
        {q.status !== 'done' ? (
          <button type="button" className="btn btn-sm btn-done" onClick={onFinish} disabled={busy}>แก้ไขเสร็จแล้ว+แจ้งลูกค้า</button>
        ) : (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onFinish} disabled={busy}>ส่งอีเมลอีกครั้ง</button>
        )}
        {q.status !== 'waiting' && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onRevert} disabled={busy}>↩ ย้อนสถานะ</button>
        )}
      </div>
    </article>
  );
}
