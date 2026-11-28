import React, { useMemo, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';

const blank = { name: '', phone: '', email: '', address: '', password: '' };

export default function QuanLyKhachHang({ customers = [], refreshPeople, request, canManage }) {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const filtered = useMemo(() => customers.filter(customer => `${customer.name} ${customer.phone} ${customer.email || ''}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))), [customers, search]);

  const edit = customer => {
    setEditing(customer);
    setForm({ name: customer.name || '', phone: customer.phone || '', email: customer.email || '', address: customer.address || '', password: '' });
    setError(''); setMessage('');
  };
  const save = async event => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await request('/api/action/customer.save', { method: 'POST', body: JSON.stringify({ ...form, id: editing?.id, version: editing?.version }) });
      await refreshPeople();
      setEditing(null); setForm(blank);
      setMessage('Đã lưu thông tin khách hàng.');
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  };

  return <div className="customer-page">
    <div className="customer-toolbar"><div><h2>Tra cứu & cập nhật khách hàng</h2><p>Thông tin được lưu trong cơ sở dữ liệu cửa hàng.</p></div>{canManage && <button onClick={() => { setEditing({ id: null }); setForm(blank); setError(''); setMessage(''); }}><UserPlus size={17} /> Thêm khách hàng</button>}</div>
    <div className="customer-search"><Search size={18} /><input aria-label="Tìm khách hàng" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên, số điện thoại hoặc email" /></div>
    {message && <div className="form-success" role="status">{message}</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="customer-table-wrap"><table><thead><tr><th>Họ tên</th><th>Số điện thoại</th><th>Email</th><th>Địa chỉ</th><th></th></tr></thead><tbody>{filtered.map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.phone}</td><td>{customer.email || '—'}</td><td>{customer.address || '—'}</td><td>{canManage && <button onClick={() => edit(customer)}>Cập nhật</button>}</td></tr>)}{filtered.length === 0 && <tr><td colSpan="5" className="customer-empty">{search ? 'Không tìm thấy khách hàng phù hợp.' : 'Chưa có khách hàng trong hệ thống.'}</td></tr>}</tbody></table></div>
    {editing && canManage && <form className="customer-form" onSubmit={save}>
      <div><h3>{editing.id ? 'Cập nhật khách hàng' : 'Thêm khách hàng'}</h3><button type="button" onClick={() => { setEditing(null); setError(''); }}>Đóng</button></div>
      <label>Họ và tên<input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required maxLength={100} /></label>
      <label>Số điện thoại<input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required /></label>
      <label>Email<input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
      <label>Địa chỉ<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} maxLength={500} /></label>
      {!editing.id && <label>Mật khẩu tài khoản khách hàng<input type="password" minLength={10} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></label>}
      <button type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu khách hàng'}</button>
    </form>}
  </div>;
}
