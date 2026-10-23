/** ตัวโหลด (แว่นขยายวน) พร้อมข้อความ — ใช้ตอนรอข้อมูลในหน้า */
export default function Loader({ label = 'กำลังโหลด…' }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className="loader" aria-hidden="true" />
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
}

/** ม่านบังทั้งจอระหว่างรอ (เช่น กดลงคิว) กันกดซ้ำ */
export function LoadingOverlay({ show, label }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-box">
        <Loader label={label} />
      </div>
    </div>
  );
}
