import { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { refreshLineUrl } from './lineUrl.js';
import Announcements from './components/Announcements.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import BookForm from './pages/BookForm.jsx';
import BookSuccess from './pages/BookSuccess.jsx';
import CheckQueue from './pages/CheckQueue.jsx';
import Contact from './pages/Contact.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  // จำลิงก์ LINE ไว้ ปุ่มติดต่อจะใช้ได้แม้เซิร์ฟเวอร์ล่มภายหลัง
  useEffect(() => { refreshLineUrl(); }, []);

  return (
    <div className="app">
      {!isAdmin && (
        <header className="topbar">
          <Link to="/" className="brand">
            <img src="/logo-sm.jpeg" alt="" width="40" height="40" className="brand-logo" />
            <span className="brand-text">
              <strong>Appde Premium</strong>
              <small>จองคิวแจ้งปัญหาแอป</small>
            </span>
          </Link>
        </header>
      )}
      <main className="container">
        {!isAdmin && <Announcements />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<BookForm />} />
          <Route path="/success" element={<BookSuccess />} />
          <Route path="/check" element={<CheckQueue />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="card center">
      <h2>ไม่พบหน้านี้</h2>
      <Link to="/" className="btn btn-primary">กลับหน้าหลัก</Link>
    </div>
  );
}
