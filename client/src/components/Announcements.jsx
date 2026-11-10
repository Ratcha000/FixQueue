import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';

/** ประกาศจากแอดมิน แสดงด้านบนทุกหน้าของลูกค้า */
export default function Announcements() {
  const { pathname } = useLocation();
  const [data, setData] = useState(null);

  // โหลดใหม่ทุกครั้งที่เปลี่ยนหน้า (เซิร์ฟเวอร์พักข้อมูลไว้ จึงไม่ช้า)
  useEffect(() => {
    let alive = true;
    api.get('/api/announcements')
      .then((d) => alive && setData(d && typeof d === 'object' && !Array.isArray(d) ? d : null))
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  return data ? <AnnouncementBoard {...data} /> : null;
}

/** กล่องประกาศ (ใช้ทั้งหน้าลูกค้าและตัวอย่างในหน้าตั้งค่า) */
export function AnnouncementBoard({ heading, pink = [], time }) {
  const showTime = !!time?.show;
  if (!pink.length && !showTime) return null;

  return (
    <section className="ann-board" aria-label={heading?.title || 'ประกาศจากร้าน'}>
      {heading?.title && <h2 className="ann-title">{heading.title}</h2>}
      {heading?.subtitle && <span className="ann-pill">{heading.subtitle}</span>}
      <div className="ann-grid">
        {pink.map((c, i) => (
          <article key={i} className="ann-card ann-pink" role="status">
            {c.badge && <span className="ann-badge"><WarnIcon />{c.badge}</span>}
            {c.title && <p className="ann-headline pre">{c.title}</p>}
            {c.desc && <p className="ann-desc pre">{c.desc}</p>}
            <Rows rows={c.rows} />
          </article>
        ))}
        {showTime && (
          <article className="ann-card ann-green" role="status">
            {time.badge && <span className="ann-badge"><ClockIcon />{time.badge}</span>}
            {time.time && <p className="ann-time">{time.time}</p>}
            {time.desc && <p className="ann-desc pre">{time.desc}</p>}
            <Rows rows={time.rows} />
          </article>
        )}
      </div>
    </section>
  );
}

function Rows({ rows }) {
  if (!rows?.length) return null;
  return (
    <ul className="ann-rows">
      {rows.map((r, i) => (
        <li key={i}><span>{r.label}</span><strong>{r.value}</strong></li>
      ))}
    </ul>
  );
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
