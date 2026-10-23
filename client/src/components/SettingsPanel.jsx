import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { thaiDate } from '../format.js';
import ErrorAlert from './ErrorAlert.jsx';

const MAX_ANNOUNCEMENTS = 3;

export default function SettingsPanel({ onClose, onUnauthorized }) {
  const [s, setS] = useState(null);
  const [newClosed, setNewClosed] = useState('');
  const [newAnn, setNewAnn] = useState('');
  const [capDate, setCapDate] = useState('');
  const [capValue, setCapValue] = useState('');
  const [msg, setMsg] = useState('');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/admin/settings').then(setS).catch((e) => (e.status === 401 ? onUnauthorized() : setLoadError(e)));
  }, [onUnauthorized]);

  if (!s) return <div className="card"><div className="skeleton" style={{ height: 160 }} /><ErrorAlert error={loadError} /></div>;

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      setS(await api.put('/api/admin/settings', s));
      setMsg('บันทึกแล้ว');
    } catch (e) {
      if (e.status === 401) onUnauthorized();
      else setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!confirm('ย้ายคิวที่แก้ไขเสร็จแล้วและเก่ากว่า 90 วัน ไปเก็บในชีต Archive?')) return;
    setMsg('');
    try {
      const r = await api.post('/api/admin/archive');
      setMsg(`ย้ายแล้ว ${r.moved} รายการ`);
    } catch (e) {
      if (e.status === 401) onUnauthorized();
      else setMsg(e.message);
    }
  };

  const addAnnouncement = () => {
    const text = newAnn.trim();
    if (!text || s.announcements.length >= MAX_ANNOUNCEMENTS) return;
    setS({ ...s, announcements: [...s.announcements, text] });
    setNewAnn('');
  };

  const addClosed = () => {
    if (!newClosed || s.closed_dates.includes(newClosed)) return;
    setS({ ...s, closed_dates: [...s.closed_dates, newClosed].sort() });
    setNewClosed('');
  };

  const addCap = () => {
    if (!capDate || capValue === '') return;
    setS({ ...s, caps: { ...s.caps, [capDate]: Number(capValue) } });
    setCapDate('');
    setCapValue('');
  };

  const removeCap = (d) => {
    const caps = { ...s.caps };
    delete caps[d];
    setS({ ...s, caps });
  };

  return (
    <section className="card settings">
      <div className="settings-head">
        <h2>ตั้งค่า</h2>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="ปิด">✕</button>
      </div>

      <div className="settings-grid">
        <label className="field">
          <span>จำนวนคิวต่อวัน (ค่าเริ่มต้น)</span>
          <input type="number" min="0" max="999" value={s.default_capacity} onChange={(e) => setS({ ...s, default_capacity: e.target.value })} />
        </label>
        <label className="field">
          <span>เปิดให้จองล่วงหน้า (วัน)</span>
          <input type="number" min="0" max="365" value={s.max_days_ahead} onChange={(e) => setS({ ...s, max_days_ahead: e.target.value })} />
        </label>
        <label className="field span-2">
          <span>ลิงก์ LINE ร้าน</span>
          <input type="url" value={s.line_url} onChange={(e) => setS({ ...s, line_url: e.target.value })} placeholder="https://line.me/R/ti/p/@..." />
        </label>
      </div>

      <h3>ประกาศ (แสดงด้านบนหน้าลูกค้า สูงสุด {MAX_ANNOUNCEMENTS} ประกาศ)</h3>
      <div className="inline-add">
        <textarea
          rows={2}
          maxLength={300}
          value={newAnn}
          onChange={(e) => setNewAnn(e.target.value)}
          placeholder={s.announcements.length >= MAX_ANNOUNCEMENTS ? 'ครบ 3 ประกาศแล้ว ลบอันเก่าก่อน' : 'เช่น วันที่ 1 พ.ย. ปิดปรับปรุงระบบ'}
          disabled={s.announcements.length >= MAX_ANNOUNCEMENTS}
          style={{ flex: '1 1 240px', minHeight: 0 }}
        />
        <button type="button" className="btn btn-sm btn-outline" onClick={addAnnouncement} disabled={!newAnn.trim() || s.announcements.length >= MAX_ANNOUNCEMENTS}>เพิ่ม</button>
      </div>
      <div className="ann-list">
        {s.announcements.length === 0 && <span className="muted small">ไม่มี</span>}
        {s.announcements.map((text, i) => (
          <div key={i} className="announcement announcement-admin">
            <p className="pre">{text}</p>
            <button type="button" aria-label="ลบประกาศ" onClick={() => setS({ ...s, announcements: s.announcements.filter((_, j) => j !== i) })}>✕</button>
          </div>
        ))}
      </div>

      <h3>วันปิดรับคิว</h3>
      <div className="inline-add">
        <input type="date" value={newClosed} onChange={(e) => setNewClosed(e.target.value)} />
        <button type="button" className="btn btn-sm btn-outline" onClick={addClosed}>เพิ่ม</button>
      </div>
      <div className="chips">
        {s.closed_dates.length === 0 && <span className="muted small">ไม่มี</span>}
        {s.closed_dates.map((d) => (
          <span key={d} className="chip">
            {thaiDate(d)}
            <button type="button" aria-label="ลบ" onClick={() => setS({ ...s, closed_dates: s.closed_dates.filter((x) => x !== d) })}>✕</button>
          </span>
        ))}
      </div>

      <h3>จำนวนคิวเฉพาะวัน</h3>
      <div className="inline-add">
        <input type="date" value={capDate} onChange={(e) => setCapDate(e.target.value)} />
        <input type="number" min="0" max="999" placeholder="จำนวน" value={capValue} onChange={(e) => setCapValue(e.target.value)} style={{ width: 100 }} />
        <button type="button" className="btn btn-sm btn-outline" onClick={addCap}>เพิ่ม</button>
      </div>
      <div className="chips">
        {Object.keys(s.caps).length === 0 && <span className="muted small">ไม่มี</span>}
        {Object.entries(s.caps).sort().map(([d, v]) => (
          <span key={d} className="chip">
            {thaiDate(d)}: {v} คิว
            <button type="button" aria-label="ลบ" onClick={() => removeCap(d)}>✕</button>
          </span>
        ))}
      </div>

      <p className="muted small">แก้ตัวเลือกแอปและปัญหาได้ที่ชีต “Options” ใน Google Sheet</p>
      <p className="muted small">
        คิวที่เสร็จแล้วและเก่ากว่า 90 วันจะถูกย้ายไปชีต “Archive” อัตโนมัติวันละครั้ง (ข้อมูลไม่หาย แค่เช็คคิวด้วย PIN ไม่ได้แล้ว){' '}
        <button type="button" className="btn btn-sm btn-ghost" onClick={archive}>ย้ายตอนนี้</button>
      </p>

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </section>
  );
}
