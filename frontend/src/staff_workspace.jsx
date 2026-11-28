import React, { useEffect, useState } from 'react';
import { api } from './store_api.js';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
const monthNow = () => today().slice(0, 7);
const dateKey = value => String(value || '').slice(0, 10);
const stamp = value => value ? new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }) : '—';
const shiftName = { morning: 'Sáng', afternoon: 'Chiều', full: 'Cả ngày' };
export default function StaffWorkspace({ self = false, currentUser = null }) {
  const [state, setState] = useState({ users: [], work_shifts: [] });
  const [monthlyShifts, setMonthlyShifts] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [month, setMonth] = useState(monthNow());
  const [form, setForm] = useState({ work_date: today(), shift: 'morning', starts_at: '08:00', ends_at: '12:00' });
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async () => { const data = await api('/api/state'); setState(data); if (self) setEmployeeId(String(currentUser?.id || data.user?.id || '')); else setEmployeeId(current => current || String(data.users?.find(u => u.role === 'employee')?.id || '')); };
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  const loadMonth = async () => { if (!employeeId || !month) { setMonthlyShifts([]); return; } setMonthlyShifts(await api(`/api/shifts?month=${encodeURIComponent(month)}&employee_id=${encodeURIComponent(employeeId)}`)); };
  useEffect(() => { loadMonth().catch(e => setError(e.message)); }, [employeeId, month]);
  const act = async (action, body) => { setError(''); setNotice(''); try { const result = await api(`/api/action/${action}`, body); setNotice(result.message || 'Đã lưu.'); await load(); await loadMonth(); } catch(e) { setError(e.message); } };
  const employees = (state.users || []).filter(u => u.role === 'employee');
  const selected = employees.find(u => String(u.id) === employeeId);
  const shifts = monthlyShifts;
  const changeShift = shift => setForm(f => ({ ...f, shift, starts_at: shift === 'afternoon' ? '13:00' : '08:00', ends_at: shift === 'morning' ? '12:00' : '17:00' }));
  return <div className="work-card"><div className="work-toolbar"><div><h2>{self ? 'Chấm công của tôi' : 'Lịch làm theo nhân viên'}</h2><p>{self ? 'Lịch và công trong tháng của bạn.' : 'Chọn nhân viên để xếp ca và xem chấm công theo tháng.'}</p></div><div className="staff-toolbar-actions"><label>Tháng <input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label><button onClick={() => { load().then(loadMonth).catch(e => setError(e.message)); }}>Làm mới</button></div></div>
    {error && <div className="form-error">{error}</div>}{notice && <div className="form-success">{notice}</div>}
    {!self && <div className="employee-picker">{employees.map(u => <button key={u.id} className={employeeId === String(u.id) ? 'chosen' : ''} onClick={() => setEmployeeId(String(u.id))}><strong>{u.name}</strong><small>{u.phone}</small></button>)}{!employees.length && <p>Chưa có nhân viên. Hãy duyệt tài khoản ở phần trên.</p>}</div>}
    {(self || selected) && <><h3>{self ? currentUser?.name : selected?.name} · {month}</h3>{self && <div className="self-clock-panel"><div><strong>Chấm công hôm nay · {today()}</strong><p>{shifts.some(s => dateKey(s.work_date) === today()) ? 'Chấm giờ vào/ra cho ca đã được xếp.' : 'Chưa được xếp ca hôm nay. Bạn vẫn có thể chấm công; chủ cửa hàng sẽ thấy giờ này.'}</p></div><button className="primary" onClick={() => act('shift.clock', {})}>Chấm giờ vào / ra</button></div>}{!self && <form className="work-form assignment-form" onSubmit={e => { e.preventDefault(); act('shift.assign', { ...form, employee_id: Number(employeeId) }); }}><label>Ngày làm<input type="date" required value={form.work_date} onChange={e => setForm({ ...form, work_date: e.target.value })} /></label><label>Ca làm<select value={form.shift} onChange={e => changeShift(e.target.value)}><option value="morning">Sáng</option><option value="afternoon">Chiều</option><option value="full">Cả ngày</option></select></label><label>Giờ bắt đầu<input type="time" required value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></label><label>Giờ kết thúc<input type="time" required value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></label><button className="primary">Lưu ca làm</button></form>}
      <div className="shift-summary"><strong>{shifts.length}</strong> ca làm · <strong>{shifts.reduce((sum, s) => sum + Number(s.credit || 0), 0)}</strong> công đã chấm</div><div className="shift-list">{shifts.map(s => <article key={s.id} className="shift-row"><div><strong>{dateKey(s.work_date)} · Ca {shiftName[s.shift]}</strong><p>{String(s.starts_at).slice(0,5)}–{String(s.ends_at).slice(0,5)}</p><small>Giờ vào: {stamp(s.check_in)} · Giờ ra: {stamp(s.check_out)} · Công: {s.credit}</small></div>{self ? (!s.check_out && dateKey(s.work_date) === today() && <button className="primary" onClick={() => act('shift.clock', { id: s.id })}>{s.check_in ? 'Chấm giờ ra' : 'Chấm giờ vào'}</button>) : !s.check_in && <button onClick={() => act('shift.remove', { id: s.id })}>Xóa ca</button>}</article>)}{!shifts.length && <p>{self ? 'Chưa có ca trong tháng. Bấm “Chấm giờ vào / ra” để ghi nhận công hôm nay.' : 'Tháng này nhân viên chưa có lịch làm.'}</p>}</div>
      <p className="work-hint">Chấm công dùng giờ máy chủ. Đến từ nửa sau ca làm được tính 0,5 công; ca cả ngày đến từ 13:00 được tính 0,5 công.</p></>}
  </div>;
}
