import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { MONTHS_FULL, thaiDate } from '../format.js';
import ErrorAlert from './ErrorAlert.jsx';
import Loader from './Loader.jsx';

const WEEK_HEAD = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

function shiftMonth(month, n) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export default function Calendar() {
  const navigate = useNavigate();
  const [month, setMonth] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    api.get(`/api/calendar${month ? `?month=${month}` : ''}`)
      .then((d) => {
        if (!alive) return;
        setData(d);
        if (!month) setMonth(d.today.slice(0, 7));
      })
      .catch((e) => alive && setError(e));
    return () => { alive = false; };
  }, [month]);

  if (error) return <ErrorAlert error={error} />;
  if (!data || !month) return <Loader label="กำลังโหลดปฏิทิน…" />;

  const thisMonth = data.today.slice(0, 7);
  const [y, m] = month.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lastDay = data.days[data.days.length - 1];
  const canGoNext = lastDay && lastDay.state !== 'out';

  const pick = (day) => {
    if (day.state === 'past' || day.state === 'out') return;
    setSelected(day);
  };

  return (
    <div className="calendar">
      <div className="cal-head">
        <button
          type="button"
          className="icon-btn"
          aria-label="เดือนก่อนหน้า"
          disabled={month <= thisMonth}
          onClick={() => { setSelected(null); setMonth(shiftMonth(month, -1)); }}
        >‹</button>
        <h3>{MONTHS_FULL[m - 1]} {y + 543}</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label="เดือนถัดไป"
          disabled={!canGoNext}
          onClick={() => { setSelected(null); setMonth(shiftMonth(month, 1)); }}
        >›</button>
      </div>

      <div className="cal-grid" role="grid">
        {WEEK_HEAD.map((w) => <div key={w} className="cal-weekday">{w}</div>)}
        {Array.from({ length: firstWeekday }, (_, i) => <div key={`e${i}`} />)}
        {data.days.map((day) => {
          const n = Number(day.date.slice(8));
          const disabled = day.state === 'past' || day.state === 'out';
          return (
            <button
              type="button"
              key={day.date}
              className={`cal-day is-${day.state}${day.today ? ' is-today' : ''}${selected?.date === day.date ? ' is-selected' : ''}`}
              disabled={disabled}
              onClick={() => pick(day)}
            >
              <span className="cal-num">{n}</span>
              {!disabled && <DayBadge day={day} />}
            </button>
          );
        })}
      </div>

      <div className="cal-legend">
        <span><i className="dot dot-open" />ว่าง</span>
        <span><i className="dot dot-full" />เต็ม</span>
        <span><i className="dot dot-closed" />ปิดรับ</span>
      </div>

      {selected && (
        <div className="cal-detail">
          <div>
            <strong>{thaiDate(selected.date, { weekday: true })}{selected.today ? ' (วันนี้)' : ''}</strong>
            {selected.state === 'closed' ? (
              <p className="muted">วันนี้ปิดรับคิว</p>
            ) : selected.today ? (
              <div className="stat-row">
                <span className="stat"><b>{selected.free}</b>คิวว่าง</span>
                <span className="stat stat-progress"><b>{selected.in_progress}</b>กำลังแก้ไข</span>
                <span className="stat stat-done"><b>{selected.done}</b>แก้ไขเสร็จแล้ว</span>
              </div>
            ) : (
              <p className="muted">คิวว่าง {selected.free} คิว</p>
            )}
          </div>
          {selected.state === 'open' && (
            <button type="button" className="btn btn-primary" onClick={() => navigate(`/book?date=${selected.date}`)}>
              จองวันนี้
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DayBadge({ day }) {
  if (day.state === 'closed') return <span className="cal-badge">ปิด</span>;
  if (day.state === 'full') return <span className="cal-badge">เต็ม</span>;
  return (
    <span className="cal-badge">
      <span className="long">ว่าง </span>{day.free}
    </span>
  );
}
