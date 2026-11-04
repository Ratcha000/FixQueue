import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import QueueForm from '../components/QueueForm.jsx';
import TodayQueues from '../components/TodayQueues.jsx';

export default function Home() {
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
      </nav>

      <div className="home-grid">
        <QueueForm embedded />
        <TodayQueues />
      </div>
    </>
  );
}
