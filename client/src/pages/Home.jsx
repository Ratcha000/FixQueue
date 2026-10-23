import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { thaiDate } from '../format.js';
import Calendar from '../components/Calendar.jsx';
import Icon from '../components/Icon.jsx';

export default function Home() {
  const calRef = useRef(null);
  const [today, setToday] = useState(null);

  useEffect(() => {
    api.get('/api/today').then(setToday).catch(() => {});
  }, []);

  const scrollToCalendar = () => calRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <>
      <section className="hero">
        <h1>แจ้งปัญหาการใช้งานแอป</h1>
        <p>ลงคิวออนไลน์ รับเลขคิว 4 หลัก แล้วเช็คสถานะได้ตลอด</p>
      </section>

      <nav className="menu-grid">
        <Link to="/book" className="menu-btn menu-primary">
          <Icon name="contact-form" className="menu-icon" />
          <span>ลงคิว</span>
        </Link>
        <Link to="/check" className="menu-btn">
          <Icon name="magnifier" className="menu-icon" />
          <span>เช็คคิว</span>
        </Link>
        <Link to="/contact" className="menu-btn">
          <Icon name="messenger" className="menu-icon" />
          <span>ติดต่อแอดมิน</span>
        </Link>
        <button type="button" className="menu-btn" onClick={scrollToCalendar}>
          <Icon name="calendar" className="menu-icon" />
          <span>คิววันนี้</span>
        </button>
      </nav>

      {today && (
        <section className="card today-card">
          <h2>คิววันนี้ · {thaiDate(today.date)}</h2>
          <div className="stat-row">
            <span className="stat"><b>{today.free}</b>คิวว่าง</span>
            <span className="stat stat-waiting"><b>{today.waiting}</b>รอแก้ไข</span>
            <span className="stat stat-progress"><b>{today.in_progress}</b>กำลังแก้ไข</span>
            <span className="stat stat-done"><b>{today.done}</b>แก้ไขเสร็จแล้ว</span>
          </div>
        </section>
      )}

      <section className="card" ref={calRef} id="calendar">
        <h2>ปฏิทินคิว</h2>
        <p className="muted small">กดที่วันเพื่อดูคิวว่างและจองล่วงหน้า</p>
        <Calendar />
      </section>
    </>
  );
}
