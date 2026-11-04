import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { STATUS_LABEL, thaiDate } from '../format.js';
import ErrorAlert from './ErrorAlert.jsx';
import Loader from './Loader.jsx';
import StatusBadge from './StatusBadge.jsx';

const FILTERS = ['waiting', 'in_progress', 'done'];
const REFRESH_MS = 30_000;

export default function TodayQueues() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('waiting');

  useEffect(() => {
    let alive = true;
    const load = () => api.get('/api/today/queues')
      .then((d) => { if (alive) { setData(d); setError(null); } })
      .catch((e) => { if (alive) setError(e); });
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const queues = data?.queues || [];
  const countOf = (s) => queues.filter((q) => q.status === s).length;
  const shown = queues.filter((q) => q.status === filter);

  return (
    <section className="card today-queues">
      <h2>คิววันนี้{data ? ` · ${thaiDate(data.date)}` : ''}</h2>
      {/* ถ้ารีเฟรชพลาดแต่มีข้อมูลเดิมอยู่ ให้แสดงข้อมูลเดิมต่อ แล้วโหลดใหม่รอบถัดไป */}
      {!data && error && <ErrorAlert error={error} />}
      {!data && !error && <Loader label="กำลังโหลดคิววันนี้…" />}
      {data && (
        <>
          <div className="today-tabs" role="group" aria-label="กรองตามสถานะ">
            {FILTERS.map((s) => (
              <button
                type="button"
                key={s}
                className={`tab tab-${s}${filter === s ? ' is-active' : ''}`}
                aria-pressed={filter === s}
                onClick={() => setFilter(s)}
              >
                {STATUS_LABEL[s]} ({countOf(s)})
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="muted today-empty">
              {queues.length === 0 ? 'วันนี้ยังไม่มีคิว' : 'ไม่มีคิวในสถานะนี้'}
            </p>
          ) : (
            <ul className="today-list">
              {shown.map((q) => (
                <li key={q.label} className="today-row">
                  <span className="mono today-label">{q.label}</span>
                  <span className="mono today-email">{q.email}</span>
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
