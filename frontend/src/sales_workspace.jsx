import React, { useEffect, useState } from 'react';
import { api, moneyText } from './store_api.js';

export default function SalesWorkspace() {
  const [data, setData] = useState({ products: [], pos_customers: [] });
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState('');
  const [buyerMode, setBuyerMode] = useState('guest');
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => setData(await api('/api/state'));
  useEffect(() => { load().catch(e => setError(e.message)); }, []);

  const books = data.products || [];
  const customers = data.pos_customers || [];
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const name = buyerName.trim();
  const phone = buyerPhone.trim();
  const samePhone = customers.find(c => c.phone === phone);
  const customer = samePhone && samePhone.name.trim().toLocaleLowerCase('vi') === name.toLocaleLowerCase('vi') ? samePhone : null;
  const nameMismatch = samePhone && !customer;
  const validMember = name.length > 0 && /^\d{9,15}$/.test(phone.replace(/[\s+()-]/g, '')) && !nameMismatch;
  const earnedPoints = buyerMode === 'member' ? Math.floor(total * 0.05) : 0;

  const add = book => {
    setError('');
    const old = cart.find(item => item.id === book.id);
    if ((old?.quantity || 0) >= book.available) { setError('Không đủ sách tồn kho.'); return; }
    setCart(old ? cart.map(item => item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item) : [...cart, { id: book.id, name: book.name, price: book.price, quantity: 1 }]);
    setQuery('');
  };
  const pay = async () => {
    setError(''); setNotice('');
    if (buyerMode === 'member' && !validMember) { setError('Hãy nhập đúng cả họ tên và số điện thoại khách tích điểm.'); return; }
    try {
      const result = await api('/api/action/pos.sale', {
        ...(buyerMode === 'member' ? { buyer_name: name, buyer_phone: phone } : {}),
        lines: cart.map(item => ({ product_id: item.id, quantity: item.quantity }))
      });
      setCart([]);
      setNotice(`Hóa đơn #${result.id} đã thanh toán ${moneyText(result.total)}.${buyerMode === 'member' ? ` Khách nhận ${result.earned} điểm.` : ''}`);
      await load();
    } catch (cause) { setError(cause.message); }
  };

  return <div className="sales-layout">
    <section className="work-card">
      <h2>Bán sách tại quầy</h2>
      {error && <div className="form-error">{error}</div>}{notice && <div className="form-success">{notice}</div>}
      <input className="work-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm mã hoặc tên sách để thêm vào giỏ" />
      {query && <div className="search-results">{books.filter(b => b.available > 0 && `${b.sku} ${b.name}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8).map(b => <button key={b.id} onClick={() => add(b)}>{b.name} · {moneyText(b.price)} · Còn {b.available} cuốn</button>)}</div>}
      <div className="cart-list">{cart.map(item => <div key={item.id}>
        <strong>{item.name}</strong><span>{moneyText(item.price)}</span>
        <input aria-label={`Số lượng ${item.name}`} type="number" min="1" max={books.find(b => b.id === item.id)?.available || 1} value={item.quantity} onChange={e => { const max = books.find(b => b.id === item.id)?.available || 1; setCart(cart.map(line => line.id === item.id ? { ...line, quantity: Math.max(1, Math.min(max, Number(e.target.value) || 1)) } : line)); }} />
        <button aria-label={`Xóa ${item.name}`} onClick={() => setCart(cart.filter(line => line.id !== item.id))}>×</button>
      </div>)}{!cart.length && <p>Giỏ hàng đang trống.</p>}</div>
    </section>
    <section className="work-card payment-card">
      <h2>Thanh toán</h2>
      <div className="buyer-mode"><button className={buyerMode === 'guest' ? 'chosen' : ''} onClick={() => setBuyerMode('guest')}>Khách lẻ</button><button className={buyerMode === 'member' ? 'chosen' : ''} onClick={() => setBuyerMode('member')}>Khách tích điểm</button></div>
      {buyerMode === 'member' ? <>
        <label>Họ và tên khách hàng<input required autoComplete="name" value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Nhập họ và tên" /></label>
        <label>Số điện thoại<input required type="tel" inputMode="tel" autoComplete="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} placeholder="Nhập số điện thoại" /></label>
        {nameMismatch && <div className="form-error">Tên chưa khớp với khách đã đăng ký bằng số điện thoại này.</div>}
        <div className="customer-receipt"><p><span>Điểm hiện có</span><strong>{customer?.points || 0}</strong></p><p><span>Điểm nhận sau hóa đơn (5%)</span><strong>+{earnedPoints}</strong></p></div>
        {!samePhone && validMember && <p className="work-hint">Khách mới sẽ được tạo hồ sơ tích điểm khi thanh toán.</p>}
      </> : <p className="work-hint">Khách lẻ không tích điểm.</p>}
      <p className="grand-total">Tổng thanh toán <strong>{moneyText(total)}</strong></p>
      <button className="primary" disabled={!cart.length || (buyerMode === 'member' && !validMember)} onClick={pay}>Thanh toán</button>
      <p className="work-hint">Khách tích điểm nhận số điểm bằng 5% giá trị sách đã mua (làm tròn xuống).</p>
    </section>
  </div>;
}
