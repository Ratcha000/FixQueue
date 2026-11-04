import { useState } from 'react';
import { copyText, thaiDate } from '../format.js';

/** คัดลอกอีเมลที่มีปัญหา หัวแฟม และวันหมดรอบบิลของคิวในครั้งเดียว */
export default function CopyFormButton({ queue: q }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = [
      `อีเมลที่มีปัญหา: ${q.problem_email || '-'}`,
      `หัวแฟม: ${q.family_name || '-'}`,
      `วันหมดรอบบิล: ${q.bill_due ? thaiDate(q.bill_due) : '-'}`,
    ].join('\n');
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button type="button" className="btn btn-sm btn-ghost" onClick={copy}>
      {copied ? 'คัดลอกแล้ว ✓' : 'คัดลอกฟอร์ม'}
    </button>
  );
}
