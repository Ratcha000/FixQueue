/** ไอคอนจากไฟล์ใน client/public (เช่น name="calendar" → /calendar.png) สีตาม currentColor */
export default function Icon({ name, className = '' }) {
  return <span className={`icon ${className}`} style={{ '--icon': `url(/${name}.png)` }} aria-hidden="true" />;
}
