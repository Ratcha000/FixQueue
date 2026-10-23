import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { STATUS_LABEL, thaiDate } from '../format.js';
import QueueCard from '../components/QueueCard.jsx';
import NotifyModal from '../components/NotifyModal.jsx';
import SettingsPanel from '../components/SettingsPanel.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import Loader, { LoadingOverlay } from '../components/Loader.jsx';

const COLUMNS = ['waiting', 'in_progress', 'done'];

function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'ระบบหลังบ้าน';
    return () => { meta.remove(); document.title = prevTitle; };
  }, []);
}

export default function Admin() {
  useNoIndex();
  const [auth, setAuth] = useState(null); // null = กำลังตรวจ
  const [today, setToday] = useState('');
  const logout = useCallback(() => setAuth(false), []);

  useEffect(() => {
    api.get('/api/admin/me')
      .then((d) => { setToday(d.today); setAuth(true); })
      .catch(() => setAuth(false));
  }, []);

  if (auth === null) return <Loader />;
  if (!auth) {
    return (
      <AdminLogin
        onSuccess={() => api.get('/api/admin/me').then((d) => { setToday(d.today); setAuth(true); })}
      />
    );
  }
  return <Dashboard today={today} onLogout={logout} />;
}

function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/api/admin/login', { password });
      await onSuccess();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card form-card login-card">
      <LoadingOverlay show={loading} label="กำลังตรวจสอบ…" />
      <h1>เข้าสู่ระบบ</h1>
      <form onSubmit={submit} className="form">
        <label className="field">
          <span>รหัสผ่าน</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required autoFocus />
        </label>
        <ErrorAlert error={error} />
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({ today, onLogout }) {
  const [date, setDate] = useState(today);
  const [queues, setQueues] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(''); // code ที่กำลังอัปเดต
  const [notifyFor, setNotifyFor] = useState(null);
  const [tab, setTab] = useState('waiting'); // ใช้บนมือถือ
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    try {
      setQueues(await api.get(`/api/admin/queues?date=${date}`));
      setError(null);
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err);
    }
  }, [date, onLogout]);

  useEffect(() => {
    setQueues(null);
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const setStatus = async (code, status) => {
    setBusy(code);
    try {
      const updated = await api.patch(`/api/admin/queues/${encodeURIComponent(code)}`, { status });
      setQueues((qs) => qs.map((q) => (q.code === code ? updated : q)));
    } catch (err) {
      if (err.status === 401) onLogout();
      else alert(err.message);
    } finally {
      setBusy('');
    }
  };

  const logout = async () => {
    await api.post('/api/admin/logout').catch(() => {});
    onLogout();
  };

  const grouped = Object.fromEntries(COLUMNS.map((s) => [s, (queues || []).filter((q) => q.status === s)]));

  return (
    <div className="admin">
      <LoadingOverlay show={!!busy} label="กำลังอัปเดตสถานะ…" />
      <header className="admin-head">
        <div>
          <h1>จัดการคิว</h1>
          <p className="muted">{thaiDate(date, { weekday: true })}{date === today ? ' (วันนี้)' : ''}</p>
        </div>
        <div className="admin-tools">
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="เลือกวันที่" />
          {date !== today && <button type="button" className="btn btn-ghost" onClick={() => setDate(today)}>วันนี้</button>}
          <button type="button" className="btn btn-ghost" onClick={load}>รีเฟรช</button>
          <button type="button" className="btn btn-ghost" onClick={() => setShowSettings((s) => !s)}>ตั้งค่า</button>
          <button type="button" className="btn btn-ghost" onClick={logout}>ออกจากระบบ</button>
        </div>
      </header>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} onUnauthorized={onLogout} />}

      <ErrorAlert error={error} />

      <div className="admin-tabs" role="tablist">
        {COLUMNS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={tab === s}
            className={`tab tab-${s}${tab === s ? ' is-active' : ''}`}
            onClick={() => setTab(s)}
          >
            {STATUS_LABEL[s]} <b>{grouped[s].length}</b>
          </button>
        ))}
      </div>

      {queues === null ? (
        <Loader label="กำลังโหลดรายการคิว…" />
      ) : (
        <div className="board">
          {COLUMNS.map((s) => (
            <section key={s} className={`column column-${s}${tab === s ? ' is-active' : ''}`}>
              <h2 className="column-title">
                {STATUS_LABEL[s]} <span className="count">{grouped[s].length}</span>
              </h2>
              {grouped[s].length === 0 && <p className="muted empty">ไม่มีรายการ</p>}
              {grouped[s].map((q) => (
                <QueueCard
                  key={q.code}
                  queue={q}
                  busy={busy === q.code}
                  onStart={() => setStatus(q.code, 'in_progress')}
                  onFinish={() => setNotifyFor(q)}
                  onRevert={() => setStatus(q.code, q.status === 'done' ? 'in_progress' : 'waiting')}
                />
              ))}
            </section>
          ))}
        </div>
      )}

      {notifyFor && (
        <NotifyModal
          queue={notifyFor}
          onClose={() => setNotifyFor(null)}
          onSent={() => {
            if (notifyFor.status !== 'done') setStatus(notifyFor.code, 'done');
            setNotifyFor(null);
          }}
        />
      )}
    </div>
  );
}
