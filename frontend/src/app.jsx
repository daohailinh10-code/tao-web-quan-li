import React, { useEffect, useState } from 'react';
import { BarChart3, BookOpen, CalendarCheck, ChevronRight, CircleHelp, KeyRound, LogOut, Menu, ShoppingCart, UserCheck, Users, X } from 'lucide-react';
import BookWorkspace from './book_workspace.jsx';
import SalesWorkspace from './sales_workspace.jsx';
import StaffWorkspace from './staff_workspace.jsx';
import QuanLyKhachHang from './quan_li_khach_hang.jsx';
import ThongKe from './thong_ke.jsx';
import './app.css';

const sections = [
  { id: 'sach', label: 'Quản lý sách', description: 'Danh mục, giá bán và tồn kho', icon: BookOpen },
  { id: 'banhang', label: 'Bán hàng', description: 'Đơn hàng và nhập hàng', icon: ShoppingCart },
  { id: 'khachhang', label: 'Khách hàng', description: 'Thông tin và thành viên', icon: Users },
  { id: 'nhanvien', label: 'Nhân viên', description: 'Nhân sự và ca làm', icon: UserCheck },
  { id: 'thongke', label: 'Thống kê', description: 'Tổng quan hoạt động', icon: BarChart3 }
  ,{ id: 'chamcong', label: 'Chấm công', description: 'Nhiệm vụ, giờ vào và giờ ra', icon: CalendarCheck },
  { id: 'matkhau', label: 'Đổi mật khẩu', description: 'Bảo vệ tài khoản của bạn', icon: KeyRound }
];

const request = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'x-app-request': 'nhom31' },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Không thể kết nối với máy chủ.');
  return data;
};

function Login({ onLogin, initialError }) {
  const [registering, setRegistering] = useState(false);
  const [loginRole, setLoginRole] = useState('owner');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (registering) {
        const data = await request('/api/register', { method: 'POST', body: JSON.stringify({ name: name.trim(), phone: phone.trim(), password }) });
        setNotice(data.message);
        setRegistering(false);
        setLoginRole('employee');
        setPassword('');
        return;
      }
      const data = await request('/api/login', {
        method: 'POST', body: JSON.stringify({ phone: phone.trim(), password })
      });
      if (data.user?.role !== loginRole) {
        await request('/api/logout', { method: 'POST' });
        if (data.user?.role === 'customer') throw new Error('Tài khoản khách hàng không dùng được tại khu vực quản lý.');
        throw new Error(loginRole === 'owner' ? 'Tài khoản này không có quyền quản lý. Hãy chọn đăng nhập Nhân viên.' : 'Đây là tài khoản quản lý. Hãy chọn đăng nhập Quản lý.');
      }
      onLogin(data.user);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-intro">
        <div className="login-brand"><BookOpen size={26} /> <span>PinkBook<span className="brand-light"> Manager</span></span></div>
        <div className="login-copy">
          <span className="eyebrow">KHÔNG GIAN QUẢN LÝ CỬA HÀNG SÁCH</span>
          <h1>Mỗi cuốn sách,<br />một hành trình mới.</h1>
          <p>Quản lý danh mục, bán hàng và đội ngũ của bạn trong một không gian gọn gàng, dễ sử dụng.</p>
        </div>
        <div className="login-art" aria-hidden="true"><span /><span /><span /></div>
        <div className="login-foot">PinkBook · Nhóm 33</div>
      </div>
      <div className="login-form-wrap">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mobile-brand"><BookOpen size={22} /> PinkBook Manager</div>
          <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
          <h2>{registering ? 'Đăng ký nhân viên' : `Đăng nhập ${loginRole === 'owner' ? 'chủ cửa hàng / quản lý' : 'nhân viên'}`}</h2>
          <p>{registering ? 'Tạo tài khoản nhân viên. Quản lý sẽ duyệt và cấp quyền trước khi bạn đăng nhập.' : 'Chọn đúng vai trò, sau đó nhập số điện thoại và mật khẩu.'}</p>
          {!registering && <div className="role-switch" role="group" aria-label="Vai trò đăng nhập"><button type="button" className={loginRole === 'owner' ? 'selected' : ''} aria-pressed={loginRole === 'owner'} onClick={() => { setLoginRole('owner'); setError(''); setNotice(''); }}>Chủ cửa hàng / Quản lý</button><button type="button" className={loginRole === 'employee' ? 'selected' : ''} aria-pressed={loginRole === 'employee'} onClick={() => { setLoginRole('employee'); setError(''); setNotice(''); }}>Nhân viên</button></div>}
          {registering && <><label htmlFor="register-name">Họ và tên</label><input id="register-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nhập họ và tên" required /></>}
          <label htmlFor="login-phone">Số điện thoại</label>
          <input id="login-phone" type="tel" inputMode="tel" autoComplete="username" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại" required />
          <label htmlFor="login-password">Mật khẩu</label>
          <input id="login-password" type="password" minLength={registering ? 10 : undefined} autoComplete={registering ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu" required />
          {(error || initialError) && <div className="form-error" role="alert">{error || initialError}</div>}
          {notice && <div className="form-success" role="status">{notice}</div>}
          <button className="login-submit" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : registering ? 'Gửi đăng ký' : 'Đăng nhập'} <ChevronRight size={18} /></button>
          <button className="auth-switch" type="button" onClick={() => { setRegistering(!registering); setError(''); setNotice(''); }}>{registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản nhân viên? Đăng ký'}</button>
          {!registering && <button className="demo-login" type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const data = await request('/api/demo-login', { method: 'POST' }); onLogin(data.user); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }}>Dùng thử giao diện nhân viên</button>}
          <div className="login-help"><CircleHelp size={16} /> {loginRole === 'owner' && !registering ? <>Tài khoản quản lý: <strong>0901234567</strong>. Dùng mật khẩu bạn đã đặt; mật khẩu khởi tạo chỉ áp dụng khi chưa đổi.</> : 'Tài khoản nhân viên cần được quản lý duyệt trước khi đăng nhập.'}</div>
        </form>
      </div>
    </div>
  );
}

function ChangePassword({ onChanged }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setError('');
    if (newPassword !== confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setBusy(true);
    try {
      await request('/api/action/password.change', { method: 'POST', body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) });
      onChanged();
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  };
  return <section className="work-card password-panel"><h2>Đổi mật khẩu tài khoản</h2><p>Mật khẩu mới cần ít nhất 10 ký tự. Sau khi đổi, bạn đăng nhập lại bằng mật khẩu mới.</p><form onSubmit={submit}><label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} /></label><label>Mật khẩu mới<input type="password" autoComplete="new-password" minLength={10} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label><label>Nhập lại mật khẩu mới<input type="password" autoComplete="new-password" minLength={10} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="primary" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu mật khẩu mới'}</button></form></section>;
}

function AccountApproval({ accounts, refreshPeople, request }) {
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const employees = accounts.filter(account => account.role === 'employee');
  const setActive = async (account, active) => {
    setBusyId(account.id);
    setError('');
    try {
      await request('/api/action/user.active', { method: 'POST', body: JSON.stringify({ id: account.id, version: account.version, active, reason: active ? 'Duyệt đăng ký nhân viên' : 'Khóa tài khoản nhân viên' }) });
      await refreshPeople();
    } catch (cause) { setError(cause.message); }
    finally { setBusyId(null); }
  };
  return <section className="accounts-panel">
    <h2>Tài khoản nhân viên</h2><p>Chủ cửa hàng duyệt tài khoản. Mọi nhân viên đều sử dụng các mục Sách, Bán hàng và Khách hàng.</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    {employees.length === 0 ? <p>Chưa có tài khoản nhân viên.</p> : employees.map(account => <div className="account-row" key={account.id}>
      <div><strong>{account.name}</strong><span>{account.phone} · {account.active ? 'Đang hoạt động' : 'Chờ duyệt / đã khóa'}</span></div>
      <div className="account-actions"><button disabled={busyId === account.id} onClick={() => setActive(account, !account.active)}>{account.active ? 'Khóa' : 'Duyệt tài khoản'}</button></div>
    </div>)}
  </section>;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('sach');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [books, setBooks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [accounts, setAccounts] = useState([]);

  const refreshPeople = async () => {
    const data = await request('/api/state');
    setCustomers(data.customers || []);
    setAccounts(data.users || []);
    setBooks(data.products || []);
    setInvoices(data.orders || []);
    setEmployees((data.users || []).filter(user => user.role === 'employee'));
    return data;
  };

  useEffect(() => {
    let alive = true;
    request('/api/state').then(data => {
      if (alive) {
        setCurrentUser(['owner', 'employee'].includes(data.user?.role) ? data.user : null);
        setCustomers(data.customers || []);
        setAccounts(data.users || []);
        setBooks(data.products || []);
        setInvoices(data.orders || []);
        setEmployees((data.users || []).filter(user => user.role === 'employee'));
      }
    }).catch(error => {
      if (alive) setAuthError(error.message);
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const logout = async () => {
    setSigningOut(true);
    setAuthError('');
    try {
      await request('/api/logout', { method: 'POST' });
      setCurrentUser(null);
      setActiveTab('sach');
      setMenuOpen(false);
      setBooks([]);
      setCustomers([]);
      setInvoices([]);
      setEmployees([]);
      setAccounts([]);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) return <div className="app-loading"><BookOpen size={32} /> Đang mở PinkBook…</div>;
  if (!currentUser) return <Login initialError={authError} onLogin={async user => { setCurrentUser(user); setAuthError(''); try { await refreshPeople(); } catch (error) { setAuthError(error.message); } }} />;

  const visibleSections = currentUser.role === 'owner' ? sections.filter(section => section.id !== 'chamcong') : sections.filter(section => section.id !== 'nhanvien' && (!currentUser.demo || section.id !== 'matkhau'));
  const active = visibleSections.find(section => section.id === activeTab) || visibleSections[0];
  if (!active) return <div className="app-loading">Tài khoản chưa được cấp quyền. Vui lòng liên hệ quản lý. <button onClick={logout}>Đăng xuất</button></div>;
  const initials = currentUser.name?.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase() || 'PB';
  const ActiveIcon = active.icon;

  return (
    <div className="app-shell">
      {menuOpen && <button className="mobile-scrim" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <div className="brand"><div className="brand-mark"><BookOpen size={23} strokeWidth={2.2} /></div><div><strong>PinkBook</strong><small>MANAGER</small></div></div>
          <button className="mobile-close" aria-label="Đóng menu" onClick={() => setMenuOpen(false)}><X size={20} /></button>
        </div>
        <div className="nav-caption">KHÔNG GIAN LÀM VIỆC</div>
        <nav className="side-nav" aria-label="Điều hướng chính">
          {visibleSections.map(section => {
            const Icon = section.icon;
            return <button key={section.id} className={`nav-item ${activeTab === section.id ? 'is-active' : ''}`} aria-current={activeTab === section.id ? 'page' : undefined} onClick={() => { setActiveTab(section.id); setMenuOpen(false); if (section.id === 'thongke') refreshPeople().catch(error => setAuthError(error.message)); }}><Icon size={19} strokeWidth={1.9} /><span>{section.label}</span>{activeTab === section.id && <ChevronRight size={16} className="nav-arrow" />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><BookOpen size={19} /><div><strong>Một ngày bán sách tốt</strong><span>bắt đầu từ một góc làm việc ngăn nắp.</span></div></div>
          <button className="logout-button" onClick={logout} disabled={signingOut}><LogOut size={18} /> {signingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}</button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-leading"><button className="menu-button" aria-label="Mở menu" onClick={() => setMenuOpen(true)}><Menu size={22} /></button><span>Không gian quản lý</span><ChevronRight size={15} /><strong>{active.label}</strong></div>
          <div className="user-chip"><div className="avatar">{initials}</div><div><strong>{currentUser.name}</strong><span>{currentUser.role === 'owner' ? 'Chủ cửa hàng / Quản lý' : 'Nhân viên'}</span></div></div>
        </header>
        <main className="main-content">
          <div className="page-heading"><div><span className="eyebrow">PINKBOOK / QUẢN LÝ</span><h1>{active.label}</h1><p>{active.description}</p></div><div className="heading-icon"><ActiveIcon size={26} strokeWidth={1.8} /></div></div>
          {authError && <div className="form-error workspace-error" role="alert">{authError}</div>}
          {currentUser.demo && <div className="demo-banner">Bạn đang xem bản dùng thử nhân viên. Thao tác lưu dữ liệu và thanh toán được khóa; hãy đăng ký tài khoản để sử dụng thật.</div>}
          {active.id === 'sach' && <BookWorkspace user={currentUser} />}
          {active.id === 'banhang' && <SalesWorkspace demo={currentUser.demo} />}
          {active.id === 'khachhang' && <QuanLyKhachHang customers={customers} refreshPeople={refreshPeople} request={request} canManage={!currentUser.demo} />}
          {active.id === 'nhanvien' && <><AccountApproval accounts={accounts} refreshPeople={refreshPeople} request={request} /><StaffWorkspace /></>}
          {active.id === 'chamcong' && <StaffWorkspace self currentUser={currentUser} />}
          {active.id === 'thongke' && <ThongKe books={books} invoices={invoices} customers={customers} employees={employees} />}
          {active.id === 'matkhau' && <ChangePassword onChanged={() => { setCurrentUser(null); setActiveTab('sach'); setAuthError('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'); }} />}
        </main>
      </div>
    </div>
  );
}
