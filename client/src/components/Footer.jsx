import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLineUrl, refreshLineUrl } from '../lineUrl.js';

/** ส่วนท้ายของหน้าลูกค้า */
export default function Footer() {
  const [lineUrl, setLineUrl] = useState(getLineUrl);

  useEffect(() => {
    let alive = true;
    refreshLineUrl().then((url) => alive && setLineUrl(url));
    return () => { alive = false; };
  }, []);

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo-sm.jpeg" alt="" width="44" height="44" className="footer-logo" />
          <div>
            <strong>Appde Premium</strong>
            <p className="muted small">จองคิวแจ้งปัญหาการใช้งานแอป</p>
          </div>
        </div>

        {lineUrl && (
          <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="footer-line">
            LINE @appdepremium
          </a>
        )}
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Appde Premium</p>
    </footer>
  );
}
