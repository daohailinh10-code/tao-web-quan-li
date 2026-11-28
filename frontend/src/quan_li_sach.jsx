
import React, { useState } from 'react';
import { Plus, Search, Tag, FileX, Edit, Trash2 } from 'lucide-react';

export default function QuanLySach() {
  const [subTab, setSubTab] = useState('xem');

  // DANH SÁCH SÁCH CHUNG
  const [books, setBooks] = useState([
    {
      id: 1,
      code: 'BK001',
      name: 'Nhà Giả Kim',
      category: 'Văn học',
      author: 'Paulo Coelho',
      importPrice: 50000,
      price: 79000,
      quantity: 45
    },
    {
      id: 2,
      code: 'BK002',
      name: 'Đắc Nhân Tâm',
      category: 'Kỹ năng',
      author: 'Dale Carnegie',
      importPrice: 60000,
      price: 86000,
      quantity: 12
    }
  ]);

  // TÌM KIẾM
  const [searchText, setSearchText] = useState('');

  // FORM THÊM / CẬP NHẬT SÁCH
  const emptyForm = {
    code: '',
    name: '',
    category: '',
    author: '',
    importPrice: '',
    price: '',
    quantity: ''
  };

  const [form, setForm] = useState(emptyForm);

  // LƯU MÃ SÁCH ĐANG CHỈNH SỬA
  const [editingId, setEditingId] = useState(null);

  // GIÁ BÁN ĐANG CHỈNH SỬA
  const [priceDrafts, setPriceDrafts] = useState({});

  // FORM XUẤT HỦY
  const [cancelForm, setCancelForm] = useState({
    bookId: '',
    quantity: '1',
    reason: ''
  });

  // LỊCH SỬ PHIẾU XUẤT HỦY
  const [cancelHistory, setCancelHistory] = useState([]);

  // ĐỊNH DẠNG TIỀN
  const formatMoney = (value) =>
    Number(value).toLocaleString('vi-VN') + 'đ';

  // CẬP NHẬT FORM
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // TÌM KIẾM SÁCH THEO TÊN, MÃ HOẶC TÁC GIẢ
  const filteredBooks = books.filter(book => {
    const keyword = searchText.trim().toLowerCase();

    return (
      book.name.toLowerCase().includes(keyword) ||
      book.code.toLowerCase().includes(keyword) ||
      book.author.toLowerCase().includes(keyword) ||
      book.category.toLowerCase().includes(keyword)
    );
  });

  // THÊM / CẬP NHẬT SÁCH
  const handleSaveBook = (e) => {
    e.preventDefault();

    const quantity = Number(form.quantity);
    const importPrice = Number(form.importPrice);
    const price = Number(form.price);

    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      !form.author.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 0 ||
      !Number.isFinite(importPrice) ||
      importPrice <= 0 ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      alert('Vui lòng nhập đầy đủ thông tin hợp lệ!');
      return;
    }

    const duplicate = books.find(
      book =>
        book.code.toLowerCase() === form.code.trim().toLowerCase() &&
        book.id !== editingId
    );

    if (duplicate) {
      alert('Mã sách đã tồn tại! Vui lòng sử dụng mã khác.');
      return;
    }

    if (editingId !== null) {
      // CẬP NHẬT SÁCH CŨ
      setBooks(prev =>
        prev.map(book =>
          book.id === editingId
            ? {
                ...book,
                code: form.code.trim(),
                name: form.name.trim(),
                category: form.category.trim(),
                author: form.author.trim(),
                importPrice,
                price,
                quantity
              }
            : book
        )
      );

      alert('Cập nhật thông tin sách thành công!');
    } else {
      // THÊM SÁCH MỚI
      const newBook = {
        id: Date.now(),
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        author: form.author.trim(),
        importPrice,
        price,
        quantity
      };

      setBooks(prev => [...prev, newBook]);

      alert('Thêm sách mới thành công! Sách đã được lưu vào danh sách.');
    }

    setForm(emptyForm);
    setEditingId(null);
  };

  // CHỌN SÁCH ĐỂ CHỈNH SỬA
  const handleEditBook = (book) => {
    setForm({
      code: book.code,
      name: book.name,
      category: book.category,
      author: book.author,
      importPrice: String(book.importPrice),
      price: String(book.price),
      quantity: String(book.quantity)
    });

    setEditingId(book.id);
    setSubTab('them');
  };

  // HỦY CHẾ ĐỘ CHỈNH SỬA
  const handleResetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  // THIẾT LẬP GIÁ SÁCH
  const handleUpdatePrice = (bookId) => {
    const newPrice = Number(priceDrafts[bookId]);

    if (
      !Number.isFinite(newPrice) ||
      newPrice <= 0 ||
      !Number.isInteger(newPrice)
    ) {
      alert('Giá bán phải là số nguyên lớn hơn 0!');
      return;
    }

    setBooks(prev =>
      prev.map(book =>
        book.id === bookId
          ? { ...book, price: newPrice }
          : book
      )
    );

    setPriceDrafts(prev => ({
      ...prev,
      [bookId]: ''
    }));

    alert('Cập nhật giá bán thành công!');
  };

  // XÓA SÁCH KHỎI DANH SÁCH
  const handleDeleteBook = (bookId) => {
    const book = books.find(item => item.id === bookId);

    if (!book) return;

    if (!window.confirm(
      `Bạn có chắc chắn muốn xóa sách "${book.name}" khỏi danh sách?`
    )) {
      return;
    }

    setBooks(prev => prev.filter(item => item.id !== bookId));

    alert('Đã xóa sách khỏi danh sách!');
  };

  // TẠO PHIẾU XUẤT HỦY
  const handleCancelBook = (e) => {
    e.preventDefault();

    const book = books.find(
      item => item.id === Number(cancelForm.bookId)
    );

    const quantity = Number(cancelForm.quantity);

    if (!book) {
      alert('Vui lòng chọn sách cần xuất hủy!');
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      alert('Số lượng hủy phải lớn hơn 0!');
      return;
    }

    if (quantity > book.quantity) {
      alert(`Kho chỉ còn ${book.quantity} cuốn sách này!`);
      return;
    }

    if (!cancelForm.reason.trim()) {
      alert('Vui lòng nhập lý do xuất hủy!');
      return;
    }

    if (!window.confirm(
      `Xác nhận xuất hủy ${quantity} cuốn "${book.name}"?`
    )) {
      return;
    }

    // TRỪ SỐ LƯỢNG TRONG KHO
    setBooks(prev =>
      prev.map(item =>
        item.id === book.id
          ? {
              ...item,
              quantity: item.quantity - quantity
            }
          : item
      )
    );

    // LƯU PHIẾU XUẤT HỦY
    const newCancel = {
      id: 'PH' + Date.now(),
      code: book.code,
      name: book.name,
      quantity,
      reason: cancelForm.reason.trim(),
      date: new Date().toLocaleDateString('vi-VN')
    };

    setCancelHistory(prev => [newCancel, ...prev]);

    setCancelForm({
      bookId: '',
      quantity: '1',
      reason: ''
    });

    alert('Xuất hủy thành công! Số lượng sách đã được trừ khỏi kho.');
  };

  return (
    <div className="space-y-6">

      {/* TIÊU ĐỀ VÀ THANH CHỨC NĂNG */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-[#f7d6de] gap-3">

        <h2 className="text-xl font-bold text-[#d81b60]">
          Phân Hệ Quản Lý Sách
        </h2>

        <div className="flex flex-wrap gap-2">

          {[
            ['xem', 'Xem & Tra Cứu'],
            ['them', 'Thêm / Cập Nhật Sách'],
            ['gia', 'Thiết Lập Giá Sách'],
            ['huy', 'Phiếu Xuất Hủy']
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

      {/* 1. XEM VÀ TRA CỨU SÁCH */}
      {subTab === 'xem' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

          <div className="flex flex-wrap justify-between items-center gap-3">

            <h3 className="font-bold text-sm text-[#d81b60]">
              Danh Sách Tra Cứu Sách Trong Kho
            </h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Nhập tên sách, mã sách, tác giả..."
                className="px-3 py-2 border border-[#f7d6de] rounded-xl text-xs w-64 outline-none"
              />

              <button
                onClick={() => setSearchText('')}
                className="bg-[#ff5e83] text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                Tất cả
              </button>
            </div>

          </div>

          <p className="text-xs text-gray-500">
            Tìm thấy {filteredBooks.length} sách.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-[#f7d6de] text-[#806e72]">
                  <th className="py-3">Mã Sách</th>
                  <th>Tên Sách</th>
                  <th>Thể Loại</th>
                  <th>Tác Giả</th>
                  <th>Giá Bán</th>
                  <th>Tồn Kho</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f7e8ec]">

                {filteredBooks.map(book => (
                  <tr key={book.id}>

                    <td className="py-3 font-bold">
                      #{book.code}
                    </td>

                    <td className="font-semibold">
                      {book.name}
                    </td>

                    <td>
                      <span className="bg-[#ffe0e6] text-[#ff5e83] px-2 py-1 rounded-full">
                        {book.category}
                      </span>
                    </td>

                    <td>{book.author}</td>

                    <td className="font-semibold text-[#d81b60]">
                      {formatMoney(book.price)}
                    </td>

                    <td>{book.quantity}</td>

                    <td>
                      <div className="flex gap-2">

                        <button
                          onClick={() => handleEditBook(book)}
                          className="text-blue-500"
                          title="Chỉnh sửa"
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-red-500"
                          title="Xóa sách"
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

                {filteredBooks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-400">
                      Không tìm thấy sách phù hợp!
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. THÊM / CẬP NHẬT SÁCH */}
      {subTab === 'them' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 max-w-3xl">

          <h3 className="font-bold text-sm text-[#d81b60]">
            {editingId !== null
              ? 'Cập Nhật Thông Tin Sách'
              : 'Thêm Sách Mới'}
          </h3>

          <form
            onSubmit={handleSaveBook}
            className="space-y-4 text-xs"
          >

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="block font-semibold mb-1">
                  Mã Sách
                </label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleFormChange}
                  placeholder="VD: BK003"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Tên Sách
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Nhập tên sách..."
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Thể Loại
                </label>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  placeholder="VD: Văn học"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Tác Giả
                </label>
                <input
                  name="author"
                  value={form.author}
                  onChange={handleFormChange}
                  placeholder="Tên tác giả..."
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Giá Nhập (VNĐ)
                </label>
                <input
                  type="number"
                  name="importPrice"
                  min="1"
                  value={form.importPrice}
                  onChange={handleFormChange}
                  placeholder="Nhập giá nhập"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Giá Bán (VNĐ)
                </label>
                <input
                  type="number"
                  name="price"
                  min="1"
                  value={form.price}
                  onChange={handleFormChange}
                  placeholder="Nhập giá bán"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block font-semibold mb-1">
                  Số Lượng Tồn Kho
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={handleFormChange}
                  placeholder="Nhập số lượng sách"
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

            </div>

            <div className="flex gap-2">

              <button
                type="submit"
                className="bg-[#ff5e83] text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <Plus size={16} />
                {editingId !== null ? 'Lưu Cập Nhật' : 'Lưu Thông Tin Sách'}
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="bg-gray-100 text-gray-600 px-5 py-3 rounded-xl font-bold"
              >
                Làm Mới
              </button>

            </div>
          </form>
        </div>
      )}

      {/* 3. THIẾT LẬP GIÁ SÁCH */}
      {subTab === 'gia' && (
        <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

          <div className="flex items-center gap-2">
            <Tag className="text-[#d81b60]" size={18} />

            <h3 className="font-bold text-sm text-[#d81b60]">
              Thiết Lập Giá Bán Sách
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">

              <thead>
                <tr className="border-b border-[#f7d6de] text-[#806e72]">
                  <th className="py-3">Mã Sách</th>
                  <th>Tên Sách</th>
                  <th>Giá Nhập</th>
                  <th>Giá Bán Hiện Tại</th>
                  <th>Giá Bán Mới</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>

              <tbody>

                {books.map(book => (
                  <tr key={book.id} className="border-b border-[#f7e8ec]">

                    <td className="py-3 font-bold">
                      #{book.code}
                    </td>

                    <td className="font-semibold">
                      {book.name}
                    </td>

                    <td>{formatMoney(book.importPrice)}</td>

                    <td className="text-[#d81b60] font-bold">
                      {formatMoney(book.price)}
                    </td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={priceDrafts[book.id] ?? ''}
                        placeholder={String(book.price)}
                        onChange={e =>
                          setPriceDrafts(prev => ({
                            ...prev,
                            [book.id]: e.target.value
                          }))
                        }
                        className="p-2 border border-[#f7d6de] rounded-lg w-28 outline-none"
                      />
                    </td>

                    <td>
                      <button
                        onClick={() => handleUpdatePrice(book.id)}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg text-[10px] font-bold"
                      >
                        Cập nhật giá
                      </button>
                    </td>

                  </tr>
                ))}

                {books.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-400">
                      Chưa có sách trong danh sách!
                    </td>
                  </tr>
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. PHIẾU XUẤT HỦY */}
      {subTab === 'huy' && (
        <div className="space-y-5">

          <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4 max-w-2xl">

            <h3 className="font-bold text-sm text-[#d81b60]">
              <FileX className="inline mr-2" size={17} />
              Tạo Phiếu Xuất Hủy Sách Lỗi / Hỏng
            </h3>

            <form
              onSubmit={handleCancelBook}
              className="space-y-4 text-xs"
            >

              <div>
                <label className="block font-semibold mb-2">
                  Chọn Sách Cần Hủy
                </label>

                <select
                  value={cancelForm.bookId}
                  onChange={e => {
                    setCancelForm(prev => ({
                      ...prev,
                      bookId: e.target.value
                    }));
                  }}
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                >
                  <option value="">-- Chọn sách --</option>

                  {books.filter(book => book.quantity > 0).map(book => (
                    <option key={book.id} value={book.id}>
                      #{book.code} - {book.name} (Còn {book.quantity} cuốn)
                    </option>
                  ))}
                </select>
              </div>

              {cancelForm.bookId && (
                <div className="bg-[#fff0f3] p-3 rounded-xl">
                  <p className="text-gray-600">
                    Sách hiện có trong kho:
                    <strong className="text-[#d81b60] ml-2">
                      {books.find(
                        book => book.id === Number(cancelForm.bookId)
                      )?.quantity || 0} cuốn
                    </strong>
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-2">
                  Số Lượng Hủy
                </label>

                <input
                  type="number"
                  min="1"
                  max={
                    books.find(
                      book => book.id === Number(cancelForm.bookId)
                    )?.quantity || 1
                  }
                  step="1"
                  value={cancelForm.quantity}
                  onChange={e =>
                    setCancelForm(prev => ({
                      ...prev,
                      quantity: e.target.value
                    }))
                  }
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Lý Do Hủy
                </label>

                <textarea
                  value={cancelForm.reason}
                  onChange={e =>
                    setCancelForm(prev => ({
                      ...prev,
                      reason: e.target.value
                    }))
                  }
                  placeholder="VD: Sách bị rách bìa, ướt trang, in lỗi..."
                  className="w-full p-3 border border-[#f7d6de] rounded-xl outline-none h-24"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={books.every(book => book.quantity === 0)}
                className="bg-red-600 disabled:bg-gray-300 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2"
              >
                <FileX size={16} />
                Xác Nhận Xuất Hủy
              </button>

            </form>
          </div>

          {/* LỊCH SỬ XUẤT HỦY */}
          <div className="bg-white p-6 rounded-2xl border border-[#f7d6de] space-y-4">

            <h3 className="font-bold text-sm text-[#d81b60]">
              Lịch Sử Phiếu Xuất Hủy
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead>
                  <tr className="border-b border-[#f7d6de] text-[#806e72]">
                    <th className="py-3">Mã Phiếu</th>
                    <th>Ngày Hủy</th>
                    <th>Mã Sách</th>
                    <th>Tên Sách</th>
                    <th>Số Lượng Hủy</th>
                    <th>Lý Do</th>
                  </tr>
                </thead>

                <tbody>

                  {cancelHistory.map(item => (
                    <tr key={item.id} className="border-b border-[#f7e8ec]">

                      <td className="py-3 font-bold">
                        {item.id}
                      </td>

                      <td>{item.date}</td>

                      <td>#{item.code}</td>

                      <td className="font-semibold">
                        {item.name}
                      </td>

                      <td className="text-red-600 font-bold">
                        {item.quantity}
                      </td>

                      <td>{item.reason}</td>

                    </tr>
                  ))}

                  {cancelHistory.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-gray-400">
                        Chưa có phiếu xuất hủy nào!
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
