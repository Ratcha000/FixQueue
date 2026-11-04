import { useState } from 'react';
import { copyText } from '../format.js';

/** ไอคอนคัดลอกต่อท้ายข้อความ กดแล้วเปลี่ยนเป็นเครื่องหมายถูกชั่วครู่ */
export default function CopyIconButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const title = copied ? 'คัดลอกแล้ว' : `คัดลอก${label}`;

  const copy = async () => {
    if (text && (await copyText(text))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button type="button" className="row-icon-btn" aria-label={title} title={title} onClick={copy}>
      {copied ? (
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </svg>
      )}
    </button>
  );
}
