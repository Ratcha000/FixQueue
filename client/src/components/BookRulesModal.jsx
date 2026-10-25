import { useEffect } from 'react';

const Hl = ({ children }) => <span className="rules-hl">{children}</span>;

/** ป๊อปอัป "ก่อนลงคิว อ่านก่อนนะ" แสดงก่อนเปิดฟอร์มลงคิว */
export default function BookRulesModal({ onAccept }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="modal-backdrop rules-backdrop">
      <div className="modal rules-modal" role="dialog" aria-modal="true" aria-labelledby="rules-title">
        <h2 id="rules-title" className="rules-title">ก่อนลงคิว อ่านก่อนนะ</h2>
        <ol className="rules-list">
          <li>เลือก<Hl>วันที่</Hl>ที่ต้องการลงคิว</li>
          <li>ใส่<Hl>ชื่อไลน์</Hl>ให้ตรงกับที่ทักร้าน</li>
          <li>ใส่<Hl>อีเมล</Hl>ที่ใช้กับ YouTube</li>
          <li>ใส่<Hl>หัวแฟม</Hl></li>
          <li>ใส่<Hl>วันหมดรอบบิล</Hl></li>
          <li>เลือก<Hl>แพคเกจ</Hl> 3, 6 หรือ 12 เดือน</li>
          <li>จด<Hl>รหัสพิน 4 หลักไว้</Hl>เช็คสถานะ</li>
        </ol>
        <p className="rules-note">ข้อมูลผิดอาจทำให้คิวล่าช้า ตรวจสอบอีกครั้งก่อนกดลงคิว</p>
        <button type="button" className="btn btn-primary btn-block rules-btn" onClick={onAccept} autoFocus>
          เข้าใจแล้ว เริ่มกรอก
        </button>
      </div>
    </div>
  );
}
