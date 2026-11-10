import { STATUS_LABEL } from '../format.js';

/** ข้อความและไอคอนของแต่ละสถานะ (แก้ข้อความได้ที่นี่) */
const STATUS_VIEW = {
  waiting: {
    icon: <HourglassIcon />,
    title: 'รอคิวแก้ไข',
    lines: (ahead) => [
      ahead > 0 ? `มีคิวก่อนหน้าคุณอีก ${ahead} คิว` : 'คุณเป็นคิวถัดไป',
      'แอดมินจะเริ่มแก้ไขตามลำดับคิว',
    ],
  },
  in_progress: {
    icon: <GearIcon />,
    title: 'กำลังแก้ไข',
    lines: () => ['แอดมินกำลังดำเนินการแก้ไขให้อยู่', 'กรุณารอสักครู่ '],
  },
  done: {
    icon: <CheckIcon />,
    title: 'แก้ไขเสร็จเรียบร้อย',
    lines: () => ['ที่ร้านส่งคำเชิญไปในเมลเรียบร้อย', 'แอดมินกำลังทยอยส่งรอบบิลและหัวแฟมใหม่ให้'],
  },
};

/** กล่องสถานะใหญ่ในหน้าเช็คคิว */
export default function StatusHero({ status, ahead = 0 }) {
  const view = STATUS_VIEW[status];
  if (!view) return null;
  return (
    <div className={`status-hero status-hero-${status}`} role="status">
      <span className="status-hero-pill">{STATUS_LABEL[status]}</span>
      <div className="status-hero-icon" aria-hidden="true">{view.icon}</div>
      <h2>{view.title}</h2>
      {view.lines(ahead).map((t, i) => <p key={i}>{t}</p>)}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24">
      <path d="M5 12.5 10 17.5 19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 21h12" />
      <path d="M7 3c0 4.5 5 6 5 9s-5 4.5-5 9M17 3c0 4.5-5 6-5 9s5 4.5 5 9" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="spin" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
    </svg>
  );
}
