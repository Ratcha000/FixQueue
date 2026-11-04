import { thaiDate, thaiDateTime } from '../format.js';
import CopyFormButton from './CopyFormButton.jsx';
import CopyIconButton from './CopyIconButton.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function QueueCard({ queue: q, busy, showDate, onStart, onFinish, onNotify, onHandled, onRevert, onDelete }) {
  const handled = q.handled === '1';
  return (
    <article className={`qcard qcard-${q.status}${q.status === 'done' && handled ? ' is-handled' : ''}`}>
      <div className="qcard-head">
        <span className="mono qcode">{q.code}</span>
        <span className="qcard-badges">
          {q.archived && <span className="badge badge-archived">เก็บถาวร</span>}
          <StatusBadge status={q.status} />
        </span>
      </div>
      {q.status === 'done' && (
        <label className="qcard-handled">
          <input
            type="checkbox"
            checked={handled}
            disabled={!!q.archived}
            onChange={(e) => onHandled(e.target.checked)}
          />
          <span>ทำแล้ว</span>
        </label>
      )}
      {showDate && <p className="qcard-date">วันนัด {thaiDate(q.date, { weekday: true })}</p>}
      {(q.app || q.problem) && <p className="qcard-title"><b>{q.app}</b>{q.app && q.problem ? ' · ' : ''}{q.problem}</p>}
      {q.detail && <p className="qcard-detail pre">{q.detail}</p>}
      <dl className="qcard-meta">
        {q.line_name && (<><dt>ชื่อ LINE</dt><dd>{q.line_name}</dd></>)}
        <dt>อีเมลที่มีปัญหา</dt>
        <dd className="break">{q.problem_email}<CopyIconButton text={q.problem_email} label="อีเมลที่มีปัญหา" /></dd>
        <dt>หัวแฟม</dt>
        <dd className="break">{q.family_name || '-'}{q.family_name && <CopyIconButton text={q.family_name} label="หัวแฟม" />}</dd>
        {q.notify_email && (<>
          <dt>เมลลูกค้า</dt>
          <dd className="break">{q.notify_email}<CopyIconButton text={q.notify_email} label="เมลลูกค้า" /></dd>
        </>)}
        <dt>หมดรอบบิล</dt><dd>{q.bill_due ? thaiDate(q.bill_due) : '-'}{q.billing_cycle ? ` · ${q.billing_cycle}` : ''}</dd>
        <dt>ลงคิว</dt><dd>{thaiDateTime(q.created_at)}</dd>
      </dl>
      <div className="qcard-actions">
        {q.status === 'done' && <CopyFormButton queue={q} />}
        {q.status === 'waiting' && !q.archived && (
          <button type="button" className="btn btn-sm btn-progress" onClick={onStart} disabled={busy}>เริ่มแก้ไข</button>
        )}
        {q.status === 'in_progress' && (
          <button type="button" className="btn btn-sm btn-done" onClick={onFinish} disabled={busy}>แก้ไขเสร็จแล้ว</button>
        )}
        {q.status === 'done' && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onNotify} disabled={busy}>ส่งอีเมลแจ้งลูกค้า</button>
        )}
        {q.status === 'in_progress' && !q.archived && (
          <button type="button" className="btn btn-sm btn-ghost" onClick={onRevert} disabled={busy}>↩ ย้อนสถานะ</button>
        )}
        {q.status === 'waiting' && !q.archived && (
          <button type="button" className="btn btn-sm btn-danger" onClick={onDelete} disabled={busy}>ลบ</button>
        )}
      </div>
    </article>
  );
}
