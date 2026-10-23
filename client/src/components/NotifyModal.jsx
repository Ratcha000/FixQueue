import { useEffect, useState } from 'react';
import { thaiDate } from '../format.js';

function template(q) {
  return {
    subject: `แจ้งผลการแก้ไขปัญหา ${q.app} — คิว ${q.code}`,
    body: [
      `สวัสดีคุณ${q.line_name}`,
      '',
      `ทางร้านได้แก้ไขปัญหาที่คุณแจ้งไว้เรียบร้อยแล้ว`,
      '',
      `รหัสคิว: ${q.code}`,
      `วันที่: ${thaiDate(q.date)}`,
      `แอป: ${q.app}`,
      `ปัญหา: ${q.problem}`,
      `อีเมลที่แก้ไข: ${q.problem_email}`,
      '',
      'กรุณาลองเข้าใช้งานอีกครั้ง หากยังพบปัญหาสามารถติดต่อแอดมินทาง LINE ได้เลย',
      '',
      'ขอบคุณที่ใช้บริการ',
    ].join('\n'),
  };
}

export default function NotifyModal({ queue, onClose, onSent }) {
  const [subject, setSubject] = useState(() => template(queue).subject);
  const [body, setBody] = useState(() => template(queue).body);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // แจ้งไปที่อีเมลของลูกค้าเอง (คิวเก่าที่ไม่มีช่องนี้ ใช้อีเมลที่มีปัญหาแทน)
  const to = queue.notify_email || queue.problem_email;
  const enc = encodeURIComponent;
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${enc(to)}&su=${enc(subject)}&body=${enc(body)}`;
  const mailtoUrl = `mailto:${to}?subject=${enc(subject)}&body=${enc(body)}`;

  // เปิด Gmail ก่อน (ต้องเปิดตอนกดทันที ไม่งั้นเบราว์เซอร์บล็อกป๊อปอัป) แล้วค่อยอัปเดตสถานะ
  const send = () => {
    window.open(gmailUrl, '_blank', 'noopener');
    onSent();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="notify-title">
        <h2 id="notify-title">แจ้งลูกค้าว่าแก้ไขเสร็จแล้ว</h2>
        <div className="form">
          <label className="field">
            <span>ถึง</span>
            <input value={to} readOnly />
          </label>
          <label className="field">
            <span>หัวข้อ</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="field">
            <span>ข้อความ</span>
            <textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
        </div>
        <p className="muted small">
          กดส่งแล้วระบบจะเปิด Gmail ที่กรอกข้อมูลไว้ให้ แล้วกดส่งใน Gmail อีกครั้ง สถานะคิวจะเปลี่ยนเป็น “แก้ไขเสร็จแล้ว”
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>ยกเลิก</button>
          <a href={mailtoUrl} className="btn btn-outline" onClick={onSent}>เปิดแอปอีเมล</a>
          <button type="button" className="btn btn-done" onClick={send}>ส่งผ่าน Gmail</button>
        </div>
      </div>
    </div>
  );
}
