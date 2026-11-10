import { AnnouncementBoard } from './Announcements.jsx';

const MAX_PINK = 3;
const MAX_ROWS = 4;
const TEXT_MAX = 200;

const emptyPink = () => ({ badge: '', title: '', desc: '', rows: [] });

/** แก้ไขประกาศ: หัวกล่อง, การ์ดชมพู (สูงสุด 3), การ์ดเวลาสีเขียว (1 ใบ) */
export default function AnnouncementEditor({ value, onChange }) {
  const { heading, pink, time } = value;
  const set = (patch) => onChange({ ...value, ...patch });
  const setPink = (i, card) => set({ pink: pink.map((c, j) => (j === i ? card : c)) });

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= pink.length) return;
    const next = [...pink];
    [next[i], next[j]] = [next[j], next[i]];
    set({ pink: next });
  };

  const removePink = (i) => {
    if (!confirm('ลบประกาศนี้?')) return;
    set({ pink: pink.filter((_, j) => j !== i) });
  };

  return (
    <div className="ann-editor">
      <h3>ประกาศ (แสดงด้านบนหน้าลูกค้า)</h3>
      <div className="settings-grid">
        <label className="field">
          <span>หัวกล่อง</span>
          <input maxLength={TEXT_MAX} value={heading.title} onChange={(e) => set({ heading: { ...heading, title: e.target.value } })} placeholder="ประกาศจากแอดมิน" />
        </label>
        <label className="field">
          <span>คำโปรย</span>
          <input maxLength={TEXT_MAX} value={heading.subtitle} onChange={(e) => set({ heading: { ...heading, subtitle: e.target.value } })} placeholder="กรุณาอ่านก่อนลงคิวนะคะ" />
        </label>
      </div>

      <div className="ann-section-head">
        <h4>ประกาศทั่วไป (สีชมพู) {pink.length}/{MAX_PINK}</h4>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => set({ pink: [...pink, emptyPink()] })} disabled={pink.length >= MAX_PINK}>
          + เพิ่มประกาศ
        </button>
      </div>
      {pink.length === 0 && <p className="muted small">ไม่มี</p>}
      {pink.map((c, i) => (
        <div key={i} className="ann-edit-card ann-edit-pink">
          <div className="ann-edit-top">
            <strong>ประกาศที่ {i + 1}</strong>
            <span className="ann-edit-actions">
              <button type="button" className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น">↑</button>
              <button type="button" className="icon-btn" onClick={() => move(i, 1)} disabled={i === pink.length - 1} aria-label="เลื่อนลง">↓</button>
              <button type="button" className="icon-btn ann-del" onClick={() => removePink(i)} aria-label="ลบประกาศ">✕</button>
            </span>
          </div>
          <label className="field">
            <span>หัวข้อ (ในวงรี)</span>
            <input maxLength={TEXT_MAX} value={c.badge} onChange={(e) => setPink(i, { ...c, badge: e.target.value })} placeholder="เช่น กรณีหลุดพรี" />
          </label>
          <label className="field">
            <span>ข้อความหลัก (ตัวใหญ่ กด Enter เพื่อขึ้นบรรทัดใหม่)</span>
            <textarea rows={2} maxLength={TEXT_MAX} value={c.title} onChange={(e) => setPink(i, { ...c, title: e.target.value })} placeholder={'เช่น "โดนยกเลิกจากระบบ"\nรอเคลมตามคิว'} />
          </label>
          <label className="field">
            <span>คำอธิบาย (ตัวเล็ก)</span>
            <input maxLength={TEXT_MAX} value={c.desc} onChange={(e) => setPink(i, { ...c, desc: e.target.value })} placeholder="ไม่ใส่ก็ได้" />
          </label>
          <RowsEditor rows={c.rows} onChange={(rows) => setPink(i, { ...c, rows })} />
        </div>
      ))}

      <div className="ann-section-head">
        <h4>การ์ดเวลา (สีเขียว)</h4>
        <label className="ann-toggle">
          <input type="checkbox" checked={time.show} onChange={(e) => set({ time: { ...time, show: e.target.checked } })} />
          แสดง
        </label>
      </div>
      {time.show && (
        <div className="ann-edit-card ann-edit-green">
          <div className="settings-grid">
            <label className="field">
              <span>หัวข้อ (ในวงรี)</span>
              <input maxLength={TEXT_MAX} value={time.badge} onChange={(e) => set({ time: { ...time, badge: e.target.value } })} placeholder="เวลาเริ่มแก้ไข" />
            </label>
            <label className="field">
              <span>เวลา (ตัวใหญ่)</span>
              <input maxLength={TEXT_MAX} value={time.time} onChange={(e) => set({ time: { ...time, time: e.target.value } })} placeholder="16.00 น." />
            </label>
          </div>
          <label className="field">
            <span>คำอธิบาย (ตัวเล็ก)</span>
            <input maxLength={TEXT_MAX} value={time.desc} onChange={(e) => set({ time: { ...time, desc: e.target.value } })} placeholder="แอดมินเริ่มแก้ไขตามลำดับคิว" />
          </label>
          <RowsEditor rows={time.rows} onChange={(rows) => set({ time: { ...time, rows } })} />
        </div>
      )}

      <h4>ตัวอย่าง</h4>
      <div className="ann-preview">
        {pink.length || time.show
          ? <AnnouncementBoard heading={heading} pink={pink} time={time} />
          : <p className="muted small">ไม่มีประกาศ (หน้าลูกค้าจะไม่แสดงกล่องประกาศ)</p>}
      </div>
    </div>
  );
}

function RowsEditor({ rows, onChange }) {
  const setRow = (i, row) => onChange(rows.map((r, j) => (j === i ? row : r)));
  return (
    <div className="ann-rows-edit">
      <span className="small muted">แถวข้อมูล (ซ้าย | ขวา)</span>
      {rows.map((r, i) => (
        <div key={i} className="ann-row-edit">
          <input maxLength={TEXT_MAX} value={r.label} onChange={(e) => setRow(i, { ...r, label: e.target.value })} placeholder="เช่น เร็วสุด" aria-label="ข้อความซ้าย" />
          <input maxLength={TEXT_MAX} value={r.value} onChange={(e) => setRow(i, { ...r, value: e.target.value })} placeholder="เช่น ไม่เกินวันที่ลงคิว" aria-label="ข้อความขวา" />
          <button type="button" className="icon-btn ann-del" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="ลบแถว">✕</button>
        </div>
      ))}
      {rows.length < MAX_ROWS && (
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange([...rows, { label: '', value: '' }])}>+ เพิ่มแถว</button>
      )}
    </div>
  );
}
