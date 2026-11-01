import React, { useState } from 'react';
import { Truck, FileText, Package, Trash2, Plus } from 'lucide-react';

export default function QuanLyBanHang(props) {
  // Nhận dữ liệu khách hàng dùng chung từ App.jsx.
  const customers = props.customers || [];
  const setCustomers = props.setCustomers;
  const customerList = customers;
  const [subTab, setSubTab] = useState('pos');

  // DANH SÁCH SÁCH TRONG KHO
  const [books, setBooks] = useState([
    {
      id: 1,
      code: 'S001',
      name: 'Nhà Giả Kim',
      category: 'Văn học',
      importPrice: 50000,
      price: 79000,
      quantity: 20
    },
    {
      id: 2,
      code: 'S002',
      name: 'Đắc Nhân Tâm',
      category: 'Kỹ năng sống',
      importPrice: 60000,
      price: 95000,
      quantity: 15,
    },
    {
      id: 3,
      code: 'S003',
      name: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
      category: 'Kỹ năng sống',
      importPrice: 55000,
      price: 85000,
      quantity: 10
    }
  ]);

  // GIỎ HÀNG
  const [cart, setCart] = useState([]);

  // KHÁCH HÀNG ĐƯỢC CHỌN KHI BÁN HÀNG
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // TÌM KIẾM SÁCH
  const [searchBook, setSearchBook] = useState('');

  // FORM NHẬP HÀNG
  const [newBook, setNewBook] = useState({
    code: '',
    name: '',
    category: '',
    importPrice: '',
    price: '',
    quantity: ''
  });

  // LỊCH SỬ HÓA ĐƠN
  const [invoices, setInvoices] = useState([]);

  // TÍNH TỔNG TIỀN
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ĐỊNH DẠNG TIỀN
  const formatMoney = (value) =>
    Number(value).toLocaleString('vi-VN') + 'đ';

  // CẬP NHẬT FORM NHẬP HÀNG
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewBook(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // NHẬP HÀNG VÀO KHO
  const handleImport = (e) => {
    e.preventDefault();

    const quantity = Number(newBook.quantity);
    const importPrice = Number(newBook.importPrice);
    const price = Number(newBook.price);

    if (
      !newBook.code.trim() ||
      !newBook.name.trim() ||
      !newBook.category.trim() ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(importPrice) ||
      importPrice <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ!');
      return;
    }

    const existingBook = books.find(
      book => book.code.toLowerCase() === newBook.code.trim().toLowerCase()
    );

    if (existingBook) {
      // Nếu sách đã tồn tại thì cộng thêm số lượng
      setBooks(prev =>
        prev.map(book =>
          book.id === existingBook.id
            ? {
                ...book,
                quantity: book.quantity + quantity,
                importPrice: importPrice
              }
            : book
        )
      );

      alert('Nhập hàng thành công! Số lượng sách đã được cộng vào kho.');
    } else {
      // Nếu là sách mới thì thêm vào kho
      setBooks(prev => [
        ...prev,
        {
          id: Date.now(),
          code: newBook.code.trim(),
          name: newBook.name.trim(),
          category: newBook.category.trim(),
          importPrice,
          price,
          quantity
        }
      ]);

      alert('Thêm sách mới vào kho thành công!');
    }

    setNewBook({
      code: '',
      name: '',
      category: '',
      importPrice: '',
      price: '',
      quantity: ''
    });
  };

  // THÊM SÁCH VÀO GIỎ HÀNG
  const handleAddToCart = () => {
    if (!searchBook.trim()) {
      alert('Vui lòng nhập mã sách hoặc tên sách!');
      return;
    }

    const book = books.find(item =>
      item.code.toLowerCase() === searchBook.trim().toLowerCase() ||
      item.name.toLowerCase().includes(searchBook.trim().toLowerCase())
    );

    if (!book) {
      alert('Không tìm thấy sách trong kho!');
      return;
    }

    if (book.quantity <= 0) {
      alert('Sách đã hết hàng!');
      return;
    }

    const existing = cart.find(item => item.id === book.id);

    if (existing) {
      if (existing.quantity + 1 > book.quantity) {
        alert('Số lượng sách trong kho không đủ!');
        return;
      }

      setCart(prev =>
        prev.map(item =>
          item.id === book.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart(prev => [
        ...prev,
        {
          ...book,
          quantity: 1
        }
      ]);
    }

    setSearchBook('');
  };

  // THAY ĐỔI SỐ LƯỢNG TRONG GIỎ
  const handleQuantityChange = (id, value) => {
    if (value === '') return;

    const quantity = Number(value);
    const book = books.find(item => item.id === id);

    if (!book) {
      alert('Không tìm thấy sách trong kho!');
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      alert('Số lượng phải lớn hơn 0!');
      return;
    }

    if (quantity > book.quantity) {
      alert(`Kho chỉ còn ${book.quantity} cuốn sách này!`);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity }
          : item
      )
    );
  };

  // XÓA SÁCH KHỎI GIỎ HÀNG
  const handleRemoveCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // THANH TOÁN VÀ TRỪ SỐ LƯỢNG TRONG KHO
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng đang trống!');
      return;
    }

    // Kiểm tra lại tồn kho trước khi thanh toán
    const invalidBook = cart.find(item => {
      const book = books.find(b => b.id === item.id);
      return !book || item.quantity > book.quantity;
    });

    if (invalidBook) {
      alert('Số lượng sách trong kho không đủ!');
      return;
    }

    // Tính và xác thực khách hàng trước khi thay đổi tồn kho.
    // Chỉ cộng điểm khi đã chọn khách hàng và thanh toán thành công.
    const selectedCustomer = customerList.find(
      customer => String(customer.id) === String(selectedCustomerId)
    );

    if (selectedCustomerId && !selectedCustomer) {
      alert('Khách hàng đã chọn không còn tồn tại. Vui lòng chọn lại!');
      return;
    }

    // Chỉ ghi nhận điểm khi component nhận được hàm cập nhật khách hàng.
    const canUpdateCustomers = typeof setCustomers === 'function';
    const earnedPoints = selectedCustomer && canUpdateCustomers
      ? Math.floor(total / 10000)
      : 0;

    // Chỉ trừ tồn kho sau khi tất cả dữ liệu thanh toán đã hợp lệ.
    setBooks(prev =>
      prev.map(book => {
        const soldBook = cart.find(item => item.id === book.id);
        return soldBook
          ? { ...book, quantity: book.quantity - soldBook.quantity }
          : book;
      })
    );

    if (selectedCustomer && canUpdateCustomers && earnedPoints > 0) {
      setCustomers(prev =>
        prev.map(customer =>
          String(customer.id) === String(selectedCustomerId)
            ? { ...customer, points: (Number(customer.points) || 0) + earnedPoints }
            : customer
        )
      );
    }

    // Tạo hóa đơn và lưu thông tin điểm để có thể hoàn lại khi hủy
    const invoice = {
      id: 'HD' + Date.now(),
      date: new Date().toLocaleDateString('vi-VN'),
      items: cart,
      total,
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : 'Khách lẻ',
      earnedPoints,
      status: 'Đã thanh toán'
    };

    setInvoices(prev => [invoice, ...prev]);

    alert('Thanh toán thành công! Số lượng sách đã được trừ khỏi kho.');

    setCart([]);
    setSelectedCustomerId('');
  };

  // HỦY HÓA ĐƠN VÀ HOÀN LẠI SỐ LƯỢNG SÁCH
  const handleCancelInvoice = (invoiceId) => {
    const invoice = invoices.find(item => item.id === invoiceId);

    if (!invoice || invoice.status === 'Đã hủy') return;

    if (!window.confirm('Bạn có chắc chắn muốn hủy hóa đơn này?')) {
      return;
    }

    // Hoàn lại điểm đã cộng cho khách nếu hóa đơn có gắn khách hàng
    if (
      invoice.customerId !== null &&
      invoice.customerId !== undefined &&
      invoice.earnedPoints > 0 &&
      typeof setCustomers === 'function'
    ) {
      setCustomers(prev =>
        prev.map(customer =>
          String(customer.id) === String(invoice.customerId)
            ? {
                ...customer,
                points: Math.max(0, (Number(customer.points) || 0) - invoice.earnedPoints)
              }
            : customer
        )
      );
    }

    // Hoàn trả sách vào kho
    setBooks(prev =>
      prev.map(book => {
        const returnedBook = invoice.items.find(
          item => item.id === book.id
        );

        return returnedBook
          ? {
              ...book,
              quantity: book.quantity + returnedBook.quantity
            }
          : book;
      })
    );

    setInvoices(prev =>
      prev.map(item =>
        item.id === invoiceId
          ? { ...item, status: 'Đã hủy' }
          : item
      )
    );

    alert('Đã hủy hóa đơn và hoàn lại số lượng sách vào kho!');
  };

  // XÓA SÁCH KHỎI DANH MỤC KHO
  const handleDeleteBook = (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sách này khỏi kho?')) {
      return;
    }

    setBooks(prev => prev.filter(book => book.id !== id));
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // TỔNG SỐ LƯỢNG SÁCH
  const totalBooks = books.reduce(
    (sum, book) => sum + book.quantity,
    0
  );

  return (
    <div className="space-y-6">

      {/* TIÊU ĐỀ VÀ DANH MỤC */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de] gap-3">
        <h2 className="text-xl font-bold text-[#d81b60]">
          Phân Hệ Quản Lý Bán Hàng
        </h2>

        <div className="flex flex-wrap gap-2">
          {[
            ['pos', 'Bán Ra (POS)'],
            ['nhap', 'Nhập Hàng'],
            ['kho', 'Kho Sách'],
            ['ncc', 'Nhà Cung Cấp'],
            ['hdban', 'Hóa Đơn Bán Hàng']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold ${
                subTab === id
                  ? 'bg-[#ff5e83] text-white'
                  : 'bg-[#fff0f3] text-[#ff5e83]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= BÁN HÀNG POS ================= */}
      {subTab === 'pos' && (
        <div className="grid grid-cols-3 gap-6">

          <div className="col-span-2 bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

            <h3 className="font-bold text-sm text-[#d81b60]">
              Tạo Đơn Bán Hàng Mới
            </h3>

            <div className="flex gap-2">
              <input
                value={searchBook}
                onChange={e => setSearchBook(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddToCart();
                }}
                placeholder="Nhập mã sách hoặc tên sách..."
                className="flex-1 p-3 border border-[#f7d6de] rounded-xl text-xs outline-none"
              />

              <button
                onClick={handleAddToCart}
                className="bg-[#ff5e83] text-white px-4 rounded-xl text-xs font-bold"
              >
                <Plus size={14} className="inline mr-1" />
                Thêm Vào Giỏ
              </button>
            </div>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#f7d6de] text-[#806e72]">
                  <th className="py-3">Mã sách</th>
                  <th>Sách</th>
                  <th>Đơn Giá</th>
                  <th>SL</th>
                  <th>Thành Tiền</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {cart.map(item => (
                  <tr key={item.id} className="border-b border-[#f7e8ec]">
                    <td className="py-3">{item.code}</td>
                    <td className="font-semibold">{item.name}</td>
                    <td>{formatMoney(item.price)}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={books.find(b => b.id === item.id)?.quantity || 1}
                        step="1"
                        value={item.quantity}
                        onChange={e =>
                          handleQuantityChange(item.id, e.target.value)
                        }
                        onKeyDown={e => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="w-14 border p-1 rounded text-center"
                      />
                    </td>
                    <td className="font-bold text-[#d81b60]">
                      {formatMoney(item.price * item.quantity)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveCart(item.id)}
                        className="text-red-500"
                        title="Xóa khỏi giỏ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}

                {cart.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      Chưa có sách trong giỏ hàng
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* THANH TOÁN */}
          <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 text-xs">

            <h3 className="font-bold text-sm text-[#d81b60]">
              Thanh Toán
            </h3>

            <div className="space-y-2">
              <label className="block font-semibold">Khách hàng</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 border border-[#f7d6de] rounded-xl outline-none"
              >
                <option value="">Khách lẻ (không tích điểm)</option>
                {customerList.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone || 'Chưa có SĐT'}
                  </option>
                ))}
              </select>
              {selectedCustomerId && (
                <p className="text-[11px] text-[#d81b60]">
                  {typeof setCustomers === 'function'
                    ? `Dự kiến tích: ${Math.floor(total / 10000)} điểm (10.000đ = 1 điểm)`
                    : 'Chưa kết nối cập nhật điểm khách hàng trong App.jsx.'}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Số loại sách:</span>
                <strong>{cart.length}</strong>
              </div>

              <div className="flex justify-between">
                <span>Tổng số lượng:</span>
                <strong>
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <strong>{formatMoney(total)}</strong>
              </div>

              <div className="flex justify-between">
                <span>Giảm giá:</span>
                <span>0đ</span>
              </div>

              <div className="flex justify-between text-red-600 font-bold border-t pt-3">
                <span>Khách cần trả:</span>
                <span className="text-base">{formatMoney(total)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-[#ff5e83] disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm shadow-md"
            >
              THANH TOÁN
            </button>
          </div>
        </div>
      )}

      {/* ================= NHẬP HÀNG ================= */}
      {subTab === 'nhap' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-5">

          <div className="flex items-center gap-2">
            <Truck className="text-[#d81b60]" />
            <h3 className="font-bold text-sm text-[#d81b60]">
              QUẢN LÝ NHẬP HÀNG
            </h3>
          </div>

          <form onSubmit={handleImport} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Mã sách
                </label>
                <input
                  name="code"
                  value={newBook.code}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: S004"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Tên sách
                </label>
                <input
                  name="name"
                  value={newBook.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên sách"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Thể loại sách
                </label>
                <select
                  name="category"
                  value={newBook.category}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                >
                  <option value="">-- Chọn thể loại --</option>
                  <option value="Văn học">Văn học</option>
                  <option value="Kinh tế">Kinh tế</option>
                  <option value="Kỹ năng sống">Kỹ năng sống</option>
                  <option value="Thiếu nhi">Thiếu nhi</option>
                  <option value="Giáo dục">Giáo dục</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Khoa học">Khoa học</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Số lượng nhập
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  step="1"
                  value={newBook.quantity}
                  onChange={handleInputChange}
                  placeholder="Nhập số lượng"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Giá nhập (VNĐ)
                </label>
                <input
                  type="number"
                  name="importPrice"
                  min="1"
                  value={newBook.importPrice}
                  onChange={handleInputChange}
                  placeholder="Nhập giá nhập"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">
                  Giá bán (VNĐ)
                </label>
                <input
                  type="number"
                  name="price"
                  min="1"
                  value={newBook.price}
                  onChange={handleInputChange}
                  placeholder="Nhập giá bán"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl text-xs"
                  required
                />
              </div>

            </div>

            <button
              type="submit"
              className="bg-[#ff5e83] text-white px-6 py-3 rounded-xl text-xs font-bold"
            >
              <Plus size={14} className="inline mr-1" />
              XÁC NHẬN NHẬP HÀNG
            </button>
          </form>

          <div className="border-t border-[#f7d6de] pt-5">
            <h3 className="font-bold text-sm text-[#d81b60] mb-3">
              Thông Tin Kho Hiện Tại
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#fff0f3] p-4 rounded-xl">
                <p className="text-xs text-gray-500">Tổng đầu sách</p>
                <h2 className="text-2xl font-bold text-[#d81b60]">
                  {books.length}
                </h2>
              </div>

              <div className="bg-[#fff0f3] p-4 rounded-xl">
                <p className="text-xs text-gray-500">Tổng số lượng sách</p>
                <h2 className="text-2xl font-bold text-[#d81b60]">
                  {totalBooks}
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= KHO SÁCH ================= */}
      {subTab === 'kho' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-[#d81b60]">
              <Package className="inline mr-2" size={17} />
              DANH SÁCH SÁCH TRONG KHO
            </h3>

            <span className="text-xs font-semibold text-[#d81b60]">
              Tổng: {totalBooks} cuốn
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]">
                <th className="py-3">Mã sách</th>
                <th>Tên sách</th>
                <th>Thể loại</th>
                <th>Giá nhập</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {books.map(book => (
                <tr key={book.id} className="border-b border-[#f7e8ec]">
                  <td className="py-3 font-bold">{book.code}</td>
                  <td className="font-semibold">{book.name}</td>
                  <td>{book.category}</td>
                  <td>{formatMoney(book.importPrice)}</td>
                  <td>{formatMoney(book.price)}</td>
                  <td className="font-bold">{book.quantity}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full ${
                      book.quantity === 0
                        ? 'bg-red-100 text-red-600'
                        : book.quantity <= 5
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {book.quantity === 0
                        ? 'Hết hàng'
                        : book.quantity <= 5
                        ? 'Sắp hết'
                        : 'Còn hàng'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="text-red-500"
                      title="Xóa sách"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}

              {books.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center py-6 text-gray-400">
                    Kho chưa có sách
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= NHÀ CUNG CẤP ================= */}
      {subTab === 'ncc' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

          <h3 className="font-bold text-sm text-[#d81b60]">
            Danh Sách Nhà Cung Cấp Sách
          </h3>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]">
                <th>Mã NCC</th>
                <th>Tên Nhà Cung Cấp</th>
                <th>Số Điện Thoại</th>
                <th>Địa Chỉ</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="py-3 font-bold">#NCC01</td>
                <td>NXB Trẻ</td>
                <td>02839316289</td>
                <td>TP. Hồ Chí Minh</td>
              </tr>
              <tr>
                <td className="py-3 font-bold">#NCC02</td>
                <td>NXB Kim Đồng</td>
                <td>02439434730</td>
                <td>Hà Nội</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ================= HÓA ĐƠN BÁN HÀNG ================= */}
      {subTab === 'hdban' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

          <h3 className="font-bold text-sm text-[#d81b60]">
            <FileText className="inline mr-2" size={17} />
            LỊCH SỬ HÓA ĐƠN BÁN HÀNG
          </h3>

          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#f7d6de] text-[#806e72]">
                <th className="py-3">Mã HD</th>
                <th>Ngày Bán</th>
                <th>Sản Phẩm</th>
                <th>Khách Hàng</th>
                <th>Tổng Tiền</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>

            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice.id} className="border-b border-[#f7e8ec]">
                  <td className="py-3 font-bold">{invoice.id}</td>
                  <td>{invoice.date}</td>
                  <td>
                    {invoice.items.map(item => item.name).join(', ')}
                  </td>
                  <td>
                    <div>{invoice.customerName || 'Khách lẻ'}</div>
                    {invoice.earnedPoints > 0 && (
                      <span className="text-green-600">
                        +{invoice.earnedPoints} điểm
                      </span>
                    )}
                  </td>
                  <td className="font-semibold">
                    {formatMoney(invoice.total)}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full ${
                      invoice.status === 'Đã thanh toán'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    {invoice.status === 'Đã thanh toán' && (
                      <button
                        onClick={() => handleCancelInvoice(invoice.id)}
                        className="text-red-500 font-semibold"
                      >
                        Hủy hóa đơn
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-400">
                    Chưa có hóa đơn bán hàng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
