import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api.js';

/** ประกาศจากแอดมิน แสดงด้านบนทุกหน้าของลูกค้า */
export default function Announcements() {
  const { pathname } = useLocation();
  const [items, setItems] = useState([]);

  // โหลดใหม่ทุกครั้งที่เปลี่ยนหน้า (เซิร์ฟเวอร์พักข้อมูลไว้ จึงไม่ช้า)
  useEffect(() => {
    let alive = true;
    api.get('/api/announcements')
      .then((list) => alive && setItems(Array.isArray(list) ? list : []))
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  if (!items.length) return null;

  return (
    <section className="announcements" aria-label="ประกาศจากร้าน">
      {items.map((text, i) => (
        <div key={i} className="announcement" role="status">
          <svg className="announcement-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M12 7v6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="12" cy="16.8" r="1.4" fill="currentColor" />
          </svg>
          <p className="pre">{text}</p>
        </div>
      ))}
    </section>
  );
}
