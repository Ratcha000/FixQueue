import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { refreshLineUrl } from '../lineUrl.js';
import Icon from '../components/Icon.jsx';
import Loader from '../components/Loader.jsx';

export default function Contact() {
  const [lineUrl, setLineUrl] = useState(null);

  useEffect(() => {
    refreshLineUrl().then(setLineUrl);
  }, []);

  return (
    <div className="card form-card center">
      <Link to="/" className="back-link">‹ กลับหน้าหลัก</Link>
      <Icon name="messenger" className="contact-icon" />
      <h1>ติดต่อแอดมิน</h1>
      <p className="muted">สอบถามเพิ่มเติม หรือแจ้งปัญหาเร่งด่วน ทักแชท LINE ของร้านได้เลย</p>
      {lineUrl === null ? (
        <Loader label="" />
      ) : lineUrl ? (
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block">
          เปิด LINE ร้าน
        </a>
      ) : (
        <p className="alert alert-warn">ยังไม่ได้ตั้งค่าลิงก์ LINE</p>
      )}
    </div>
  );
}
