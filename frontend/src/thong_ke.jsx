import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  UserCheck,
  ShoppingCart,
  Wallet,
  BookOpen,
  Award,
  AlertTriangle
} from 'lucide-react';

const formatMoney = (value) =>
  new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';

const getValue = (object, keys, fallback = 0) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }
  return fallback;
};

const isCancelled = (invoice) => {
  const status = String(
    getValue(invoice, ['status', 'trangThai'], '')
  ).toLowerCase();

  return status.includes('hủy') || status.includes('cancel');
};

const getInvoiceTotal = (invoice) =>
  Number(getValue(invoice, [
    'total',
    'tongTien',
    'totalAmount',
    'amount',
    'thanhTien'
  ], 0)) || 0;

const getBookStock = (book) =>
  Number(getValue(book, [
    'quantity',
    'stock',
    'soLuongTon',
    'tonKho',
    'soLuong'
  ], 0)) || 0;

const getDate = (object) => {
  const value = getValue(object, [
    'createdAt',
    'date',
    'ngayTao',
    'invoiceDate',
    'ngayBan'
  ], null);

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#f7d6de] shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-[#d81b60] mt-2">
            {value}
          </h3>
          <p className="text-xs text-gray-400 mt-2">{description}</p>
        </div>
        <div className="bg-[#fff0f3] p-3 rounded-xl">
          <Icon size={25} className="text-[#ff5e83]" />
        </div>
      </div>
    </div>
  );
}

function EmptyData({ message }) {
  return (
    <div className="text-center py-12 bg-white rounded-2xl border border-[#f7d6de]">
      <BarChart3 size={40} className="mx-auto text-[#ff9bb2] mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default function ThongKe({
  books = [],
  invoices = [],
  customers = [],
  employees = []
}) {
  const [subTab, setSubTab] = useState('banhang');

  const validInvoices = useMemo(
    () => invoices.filter(invoice => !isCancelled(invoice)),
    [invoices]
  );

  const now = new Date();

  const monthlyInvoices = validInvoices.filter(invoice => {
    const date = getDate(invoice);
    return date &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  });

  const monthlyRevenue = monthlyInvoices.reduce(
    (sum, invoice) => sum + getInvoiceTotal(invoice), 0
  );

  const totalRevenue = validInvoices.reduce(
    (sum, invoice) => sum + getInvoiceTotal(invoice), 0
  );

  const totalBooks = books.reduce(
    (sum, book) => sum + getBookStock(book), 0
  );

  const lowStockBooks = books.filter(
    book => getBookStock(book) <= 5
  );

  const newCustomers = customers.filter(customer => {
    const date = getDate(customer);
    return date &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();
  });

  const tabs = [
    { id: 'banhang', label: 'Bán hàng', icon: ShoppingCart },
    { id: 'kho', label: 'Kho sách', icon: Package },
    { id: 'khachhang', label: 'Khách hàng', icon: Users },
    { id: 'nhanvien', label: 'Nhân viên', icon: UserCheck }
  ];

  const tabClass = (id) =>
    `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
      subTab === id
        ? 'bg-[#ff5e83] text-white shadow-sm'
        : 'bg-[#fff0f3] text-[#d81b60] hover:bg-[#ffe0e8]'
    }`;

  return (
    <div className="space-y-6">

      {/* TIÊU ĐỀ */}
      <div className="bg-white p-5 rounded-2xl border border-[#f7d6de]">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-[#fff0f3] p-3 rounded-xl">
            <BarChart3 className="text-[#d81b60]" size={27} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#d81b60]">
              Báo Cáo & Thống Kê
            </h2>
            <p className="text-sm text-gray-500">
              Theo dõi tình hình hoạt động của cửa hàng sách
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={tabClass(tab.id)}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* THỐNG KÊ BÁN HÀNG */}
      {subTab === 'banhang' && (
        <div className="space-y-5">
          <h3 className="font-bold text-lg text-gray-700">
            Tổng quan bán hàng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Doanh thu tháng này"
              value={formatMoney(monthlyRevenue)}
              description="Doanh thu trong tháng hiện tại"
              icon={Wallet}
            />
            <StatCard
              title="Tổng doanh thu"
              value={formatMoney(totalRevenue)}
              description="Tất cả hóa đơn hợp lệ"
              icon={TrendingUp}
            />
            <StatCard
              title="Số hóa đơn"
              value={validInvoices.length}
              description="Không tính hóa đơn đã hủy"
              icon={ShoppingCart}
            />
            <StatCard
              title="Hóa đơn tháng này"
              value={monthlyInvoices.length}
              description="Số đơn trong tháng hiện tại"
              icon={BarChart3}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#f7d6de]">
            <h3 className="font-bold text-gray-700 mb-4">
              Danh sách hóa đơn gần đây
            </h3>

            {validInvoices.length === 0 ? (
              <EmptyData message="Chưa có dữ liệu bán hàng." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#fff0f3] text-[#d81b60]">
                    <tr>
                      <th className="p-3">Mã hóa đơn</th>
                      <th className="p-3">Khách hàng</th>
                      <th className="p-3">Ngày bán</th>
                      <th className="p-3 text-right">Tổng tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validInvoices.slice(-8).reverse().map((invoice, index) => (
                      <tr key={invoice.id || invoice.maHD || index}
                        className="border-b border-gray-100">
                        <td className="p-3">
                          {getValue(invoice, ['id', 'maHD', 'invoiceId'], '---')}
                        </td>
                        <td className="p-3">
                          {getValue(invoice, ['customerName', 'tenKhachHang'], 'Khách lẻ')}
                        </td>
                        <td className="p-3">
                          {getDate(invoice)?.toLocaleDateString('vi-VN') || '---'}
                        </td>
                        <td className="p-3 text-right font-semibold text-[#d81b60]">
                          {formatMoney(getInvoiceTotal(invoice))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THỐNG KÊ KHO SÁCH */}
      {subTab === 'kho' && (
        <div className="space-y-5">
          <h3 className="font-bold text-lg text-gray-700">
            Tổng quan kho sách
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Số đầu sách"
              value={books.length}
              description="Tổng số loại sách"
              icon={BookOpen}
            />
            <StatCard
              title="Tổng sách tồn kho"
              value={totalBooks.toLocaleString('vi-VN')}
              description="Tổng số lượng sách còn lại"
              icon={Package}
            />
            <StatCard
              title="Sách sắp hết"
              value={lowStockBooks.length}
              description="Sách còn không quá 5 cuốn"
              icon={AlertTriangle}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#f7d6de]">
            <h3 className="font-bold text-gray-700 mb-4">
              Chi tiết tồn kho
            </h3>

            {books.length === 0 ? (
              <EmptyData message="Chưa có dữ liệu kho sách." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#fff0f3] text-[#d81b60]">
                    <tr>
                      <th className="p-3">Tên sách</th>
                      <th className="p-3">Mã sách</th>
                      <th className="p-3 text-center">Số lượng tồn</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.map((book, index) => {
                      const stock = getBookStock(book);
                      return (
                        <tr key={book.id || book.maSach || index}
                          className="border-b border-gray-100">
                          <td className="p-3 font-medium">
                            {getValue(book, ['name', 'tenSach', 'title'], 'Chưa có tên')}
                          </td>
                          <td className="p-3">
                            {getValue(book, ['id', 'maSach'], '---')}
                          </td>
                          <td className="p-3 text-center">{stock}</td>
                          <td className="p-3 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              stock <= 5
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-600'
                            }`}>
                              {stock <= 5 ? 'Sắp hết hàng' : 'Còn hàng'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THỐNG KÊ KHÁCH HÀNG */}
      {subTab === 'khachhang' && (
        <div className="space-y-5">
          <h3 className="font-bold text-lg text-gray-700">
            Tổng quan khách hàng
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Tổng khách hàng"
              value={customers.length}
              description="Số khách hàng trong hệ thống"
              icon={Users}
            />
            <StatCard
              title="Khách hàng mới"
              value={newCustomers.length}
              description="Khách đăng ký trong tháng này"
              icon={UserCheck}
            />
            <StatCard
              title="Tổng điểm tích lũy"
              value={customers.reduce((sum, customer) =>
                sum + Number(getValue(customer, ['points', 'diem'], 0) || 0), 0
              ).toLocaleString('vi-VN')}
              description="Điểm của tất cả khách hàng"
              icon={Award}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#f7d6de]">
            <h3 className="font-bold text-gray-700 mb-4">
              Danh sách khách hàng
            </h3>

            {customers.length === 0 ? (
              <EmptyData message="Chưa có dữ liệu khách hàng." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#fff0f3] text-[#d81b60]">
                    <tr>
                      <th className="p-3">Mã khách hàng</th>
                      <th className="p-3">Họ tên</th>
                      <th className="p-3">Số điện thoại</th>
                      <th className="p-3 text-center">Điểm tích lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer, index) => (
                      <tr key={customer.id || index}
                        className="border-b border-gray-100">
                        <td className="p-3">
                          {getValue(customer, ['id', 'maKH'], '---')}
                        </td>
                        <td className="p-3 font-medium">
                          {getValue(customer, ['name', 'ten'], '---')}
                        </td>
                        <td className="p-3">
                          {getValue(customer, ['phone', 'sdt'], '---')}
                        </td>
                        <td className="p-3 text-center font-semibold text-[#d81b60]">
                          {getValue(customer, ['points', 'diem'], 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THỐNG KÊ NHÂN VIÊN */}
      {subTab === 'nhanvien' && (
        <div className="space-y-5">
          <h3 className="font-bold text-lg text-gray-700">
            Tổng quan nhân viên
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Tổng nhân viên"
              value={employees.length}
              description="Số nhân viên trong hệ thống"
              icon={Users}
            />
            <StatCard
              title="Hóa đơn đã xử lý"
              value={validInvoices.length}
              description="Tổng hóa đơn bán hàng hợp lệ"
              icon={ShoppingCart}
            />
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#f7d6de]">
            <h3 className="font-bold text-gray-700 mb-4">
              Danh sách nhân viên
            </h3>

            {employees.length === 0 ? (
              <EmptyData message="Chưa có dữ liệu nhân viên." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#fff0f3] text-[#d81b60]">
                    <tr>
                      <th className="p-3">Mã nhân viên</th>
                      <th className="p-3">Họ tên</th>
                      <th className="p-3">Chức vụ</th>
                      <th className="p-3">Số điện thoại</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((employee, index) => (
                      <tr key={employee.id || employee.maNV || index}
                        className="border-b border-gray-100">
                        <td className="p-3">
                          {getValue(employee, ['id', 'maNV'], '---')}
                        </td>
                        <td className="p-3 font-medium">
                          {getValue(employee, ['name', 'ten', 'hoTen'], '---')}
                        </td>
                        <td className="p-3">
                          {getValue(employee, ['position', 'chucVu'], '---')}
                        </td>
                        <td className="p-3">
                          {getValue(employee, ['phone', 'sdt'], '---')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
