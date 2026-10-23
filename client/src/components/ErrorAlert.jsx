import { getLineUrl } from '../lineUrl.js';

/** แสดงข้อความ error ถ้าระบบขัดข้อง (network) จะมีปุ่มไป LINE ร้าน */
export default function ErrorAlert({ error }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  const lineUrl = error.network ? getLineUrl() : '';

  return (
    <div className="alert alert-error" role="alert">
      <p className="alert-text">{message}</p>
      {error.network && lineUrl && (
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="btn btn-line btn-block">
          ติดต่อแอดมินทาง LINE
        </a>
      )}
    </div>
  );
}
