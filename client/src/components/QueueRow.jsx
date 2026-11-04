import { useEffect, useRef, useState } from 'react';
import { thaiDate } from '../format.js';
import CopyIconButton from './CopyIconButton.jsx';

function EditIconButton({ label, onClick }) {
  return (
    <button type="button" className="row-icon-btn" aria-label={`แก้ไข${label}`} title={`แก้ไข${label}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" />
        <path d="M14 8l3 3" />
      </svg>
    </button>
  );
}

/** หัวตารางของแถวคิว (แสดงเฉพาะจอใหญ่) */
export function QueueRowsHead() {
  return (
    <div className="qrow-grid qrows-head" aria-hidden="true">
      <span>คิว</span>
      <span>อีเมลที่มีปัญหา</span>
      <span>หัวแฟม</span>
      <span>หมดรอบบิล</span>
      <span>ลงคิว</span>
      <span />
    </div>
  );
}

/** แถวคิวแนวนอนของสถานะ "กำลังแก้ไข" กดดินสอแล้วแก้ข้อมูลในแถวเดิมได้ */
export default function QueueRow({ queue: q, busy, onFinish, onRevert, onSave }) {
  const [draft, setDraft] = useState(null); // null = ไม่ได้แก้ไขอยู่
  const [focusField, setFocusField] = useState('problem_email');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef(null);
  const familyRef = useRef(null);
  const editing = draft !== null;

  useEffect(() => {
    if (editing) (focusField === 'family_name' ? familyRef : emailRef).current?.focus();
    // โฟกัสแค่ตอนเปิดแก้ไข ไม่ใช่ทุกครั้งที่พิมพ์
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const startEdit = (field) => {
    setFocusField(field);
    setError('');
    setDraft({ problem_email: q.problem_email, family_name: q.family_name });
  };
  const cancel = () => { setDraft(null); setError(''); };
  const set = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    const next = { problem_email: draft.problem_email.trim(), family_name: draft.family_name.trim() };
    if (next.problem_email === q.problem_email && next.family_name === q.family_name) {
      cancel();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(next);
      setDraft(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const info = (
    <>
      <div className="qrow-cell">
        <span className="qrow-label">หมดรอบบิล</span>
        <span>{q.bill_due ? thaiDate(q.bill_due) : '-'}{q.billing_cycle ? ` · ${q.billing_cycle}` : ''}</span>
      </div>
      <div className="qrow-cell">
        <span className="qrow-label">ลงคิว</span>
        <span>{q.created_at ? `${q.created_at.slice(11, 16)} น.` : '-'}</span>
      </div>
    </>
  );
  const code = (
    <>
      <span className="mono qrow-code">{q.code}</span>
      {q.line_name && <span className="muted small">{q.line_name}</span>}
    </>
  );
  const legacy = [q.app, q.problem, q.detail].filter(Boolean).join(' · ');

  if (editing) {
    return (
      <form className="qrow is-editing" onSubmit={save} onKeyDown={(e) => e.key === 'Escape' && cancel()}>
        <div className="qrow-grid">
          <div className="qrow-cell">{code}</div>
          <label className="qrow-cell">
            <span className="qrow-label">อีเมลที่มีปัญหา</span>
            <input
              ref={emailRef}
              type="email"
              value={draft.problem_email}
              onChange={set('problem_email')}
              maxLength={200}
              required
              inputMode="email"
              autoCapitalize="off"
              aria-label="อีเมลที่มีปัญหา"
            />
          </label>
          <label className="qrow-cell">
            <span className="qrow-label">หัวแฟม</span>
            <input
              ref={familyRef}
              value={draft.family_name}
              onChange={set('family_name')}
              maxLength={100}
              required
              autoCapitalize="off"
              aria-label="หัวแฟม"
            />
          </label>
          {info}
          <div className="qrow-actions">
            <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก…' : 'บันทึก'}
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={cancel} disabled={saving}>ยกเลิก</button>
          </div>
        </div>
        {error && <p className="qrow-error" role="alert">{error}</p>}
      </form>
    );
  }

  return (
    <article className="qrow">
      <div className="qrow-grid">
        <div className="qrow-cell">{code}</div>
        <div className="qrow-cell">
          <span className="qrow-label">อีเมลที่มีปัญหา</span>
          <span className="break">
            {q.problem_email}
            <span className="qrow-icons">
              <CopyIconButton text={q.problem_email} label="อีเมลที่มีปัญหา" />
              <EditIconButton label="อีเมลที่มีปัญหา" onClick={() => startEdit('problem_email')} />
            </span>
          </span>
        </div>
        <div className="qrow-cell">
          <span className="qrow-label">หัวแฟม</span>
          <span className="break">
            {q.family_name || '-'}
            <span className="qrow-icons">
              {q.family_name && <CopyIconButton text={q.family_name} label="หัวแฟม" />}
              <EditIconButton label="หัวแฟม" onClick={() => startEdit('family_name')} />
            </span>
          </span>
        </div>
        {info}
        <div className="qrow-actions">
          <button type="button" className="btn btn-sm btn-done" onClick={onFinish} disabled={busy}>แก้ไขเสร็จแล้ว</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onRevert} disabled={busy}>↩ ย้อนสถานะ</button>
        </div>
      </div>
      {legacy && <p className="qrow-note muted small pre">{legacy}</p>}
    </article>
  );
}
