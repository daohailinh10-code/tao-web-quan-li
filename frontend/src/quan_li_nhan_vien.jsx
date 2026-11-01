
import React, { useState } from 'react';
import { UserCheck, Calendar, DollarSign, Plus, Search, Pencil, Trash2, X, Save, Clock } from 'lucide-react';

export default function QuanLyNhanVien() {
  const [subTab, setSubTab] = useState('tt');

  const [employees, setEmployees] = useState([
    {
      id: 'NV01',
      name: 'Trần Thị B',
      phone: '0987654321',
      address: 'Hà Nội',
      position: 'Thu ngân',
      startDate: '2026-01-10',
      baseSalary: 6000000,
      allowance: 500000,
      bonus: 0
    },
    {
      id: 'NV02',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      address: 'Hà Nội',
      position: 'Nhân viên bán hàng',
      startDate: '2026-02-01',
      baseSalary: 5500000,
      allowance: 300000,
      bonus: 200000
    }
  ]);

  const [attendance, setAttendance] = useState([
    {
      id: 1,
      employeeId: 'NV01',
      date: '2026-10-01',
      shift: 'Ca sáng',
      start: '08:00',
      end: '12:00',
      status: 'Có mặt'
    },
    {
      id: 2,
      employeeId: 'NV01',
      date: '2026-10-02',
      shift: 'Ca chiều',
      start: '13:00',
      end: '17:00',
      status: 'Có mặt'
    }
  ]);

  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    id: '',
    name: '',
    phone: '',
    address: '',
    position: 'Nhân viên bán hàng',
    startDate: '',
    baseSalary: '',
    allowance: 0,
    bonus: 0
  });

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: new Date().toISOString().slice(0, 10),
    shift: 'Ca sáng',
    start: '08:00',
    end: '12:00',
    status: 'Có mặt'
  });

  const [editingAttendance, setEditingAttendance] = useState(null);

  const money = (value) =>
    Number(value || 0).toLocaleString('vi-VN') + 'đ';

  const inputClass =
    'w-full border border-[#f7d6de] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#ff5e83]';

  const btnClass =
    'px-4 py-2 rounded-xl text-sm font-semibold transition';

  const resetForm = () => {
    setForm({
      id: '',
      name: '',
      phone: '',
      address: '',
      position: 'Nhân viên bán hàng',
      startDate: '',
      baseSalary: '',
      allowance: 0,
      bonus: 0
    });
    setEditing(null);
    setShowForm(false);
  };

  // THÊM / SỬA NHÂN VIÊN
  const saveEmployee = (e) => {
    e.preventDefault();

    if (!form.id.trim() || !form.name.trim()) {
      alert('Vui lòng nhập mã và họ tên nhân viên!');
      return;
    }

    if (Number(form.baseSalary) < 0) {
      alert('Lương cơ bản không hợp lệ!');
      return;
    }

    const duplicate = employees.some(
      emp => emp.id.toLowerCase() === form.id.trim().toLowerCase()
        && emp.id !== editing
    );

    if (duplicate) {
      alert('Mã nhân viên đã tồn tại!');
      return;
    }

    const employee = {
      ...form,
      id: form.id.trim(),
      name: form.name.trim(),
      baseSalary: Number(form.baseSalary),
      allowance: Number(form.allowance),
      bonus: Number(form.bonus)
    };

    if (editing) {
      setEmployees(prev =>
        prev.map(emp => emp.id === editing ? employee : emp)
      );
    } else {
      setEmployees(prev => [...prev, employee]);
    }

    resetForm();
  };

  const editEmployee = (emp) => {
    setForm({ ...emp });
    setEditing(emp.id);
    setShowForm(true);
  };

  const deleteEmployee = (id) => {
    const hasAttendance = attendance.some(a => a.employeeId === id);

    if (hasAttendance) {
      alert('Nhân viên đã có dữ liệu chấm công. Không thể xóa!');
      return;
    }

    if (window.confirm('Bạn có chắc muốn xóa nhân viên này?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
    }
  };

  const filteredEmployees = employees.filter(emp =>
    [emp.id, emp.name, emp.phone, emp.position]
      .some(value => String(value).toLowerCase().includes(search.toLowerCase()))
  );

  // CHẤM CÔNG
  const saveAttendance = (e) => {
    e.preventDefault();

    if (!attendanceForm.employeeId) {
      alert('Vui lòng chọn nhân viên!');
      return;
    }

    if (attendanceForm.end <= attendanceForm.start) {
      alert('Giờ kết thúc phải sau giờ bắt đầu!');
      return;
    }

    const duplicate = attendance.some(a =>
      a.employeeId === attendanceForm.employeeId &&
      a.date === attendanceForm.date &&
      a.shift === attendanceForm.shift &&
      a.id !== editingAttendance
    );

    if (duplicate) {
      alert('Nhân viên đã có lịch chấm công cho ca này!');
      return;
    }

    if (editingAttendance !== null) {
      setAttendance(prev =>
        prev.map(a =>
          a.id === editingAttendance
            ? { ...attendanceForm, id: editingAttendance }
            : a
        )
      );
    } else {
      setAttendance(prev => [
        ...prev,
        { ...attendanceForm, id: Date.now() }
      ]);
    }

    setEditingAttendance(null);
    setAttendanceForm({
      employeeId: '',
      date: new Date().toISOString().slice(0, 10),
      shift: 'Ca sáng',
      start: '08:00',
      end: '12:00',
      status: 'Có mặt'
    });
  };

  const editAttendance = (item) => {
    setAttendanceForm({
      employeeId: item.employeeId,
      date: item.date,
      shift: item.shift,
      start: item.start,
      end: item.end,
      status: item.status
    });
    setEditingAttendance(item.id);
  };

  const deleteAttendance = (id) => {
    if (window.confirm('Xóa lịch chấm công này?')) {
      setAttendance(prev => prev.filter(a => a.id !== id));
    }
  };

  // TÍNH LƯƠNG
  const getWorkDays = (id) =>
    attendance.filter(a =>
      a.employeeId === id && a.status === 'Có mặt'
    ).length;

  const getSalary = (emp) => {
    const workDays = getWorkDays(emp.id);
    const dailySalary = Number(emp.baseSalary) / 26;

    return {
      workDays,
      total: Math.round(
        dailySalary * workDays +
        Number(emp.allowance || 0) +
        Number(emp.bonus || 0)
      )
    };
  };

  const tabs = [
    { id: 'tt', label: 'Thông Tin Nhân Viên', icon: UserCheck },
    { id: 'lich', label: 'Lịch Làm & Chấm Công', icon: Calendar },
    { id: 'luong', label: 'Quản Lý Lương', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">

      {/* TIÊU ĐỀ VÀ TAB */}
      <div className="bg-white p-4 rounded-2xl border border-[#f7d6de] space-y-4">
        <h2 className="text-xl font-bold text-[#d81b60]">
          Phân Hệ Quản Lý Nhân Viên
        </h2>

        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`${btnClass} flex items-center gap-2 ${
                  subTab === tab.id
                    ? 'bg-[#ff5e83] text-white'
                    : 'bg-[#fff0f3] text-[#ff5e83]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. THÔNG TIN NHÂN VIÊN */}
      {subTab === 'tt' && (
        <div className="bg-white p-5 rounded-2xl border border-[#f7d6de] space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h3 className="font-bold text-[#d81b60]">
              Danh Sách Nhân Viên ({employees.length})
            </h3>

            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className={`${btnClass} bg-[#ff5e83] text-white flex gap-2 items-center`}
            >
              <Plus size={16} /> Thêm nhân viên
            </button>
          </div>

          <div className="relative">
            <Search size={17} className="absolute left-3 top-3 text-gray-400" />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Tìm theo mã, tên, số điện thoại, chức vụ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {showForm && (
            <form
              onSubmit={saveEmployee}
              className="p-4 bg-[#fff8fa] rounded-xl border border-[#f7d6de] space-y-3"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-[#d81b60]">
                  {editing ? 'Cập nhật nhân viên' : 'Thêm nhân viên mới'}
                </h4>
                <button type="button" onClick={resetForm}>
                  <X size={19} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  className={inputClass}
                  placeholder="Mã nhân viên"
                  value={form.id}
                  disabled={!!editing}
                  onChange={e => setForm({ ...form, id: e.target.value })}
                  required
                />

                <input
                  className={inputClass}
                  placeholder="Họ và tên"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />

                <input
                  className={inputClass}
                  placeholder="Số điện thoại"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  className={inputClass}
                  placeholder="Địa chỉ"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                />

                <select
                  className={inputClass}
                  value={form.position}
                  onChange={e => setForm({ ...form, position: e.target.value })}
                >
                  <option>Nhân viên bán hàng</option>
                  <option>Thu ngân</option>
                  <option>Thủ kho</option>
                  <option>Quản lý</option>
                </select>

                <input
                  type="date"
                  className={inputClass}
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                />

                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="Lương cơ bản"
                  value={form.baseSalary}
                  onChange={e => setForm({ ...form, baseSalary: e.target.value })}
                  required
                />

                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="Phụ cấp"
                  value={form.allowance}
                  onChange={e => setForm({ ...form, allowance: e.target.value })}
                />

                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  placeholder="Thưởng"
                  value={form.bonus}
                  onChange={e => setForm({ ...form, bonus: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className={`${btnClass} bg-[#ff5e83] text-white flex gap-2 items-center`}
              >
                <Save size={16} /> Lưu thông tin
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead>
                <tr className="border-b text-[#806e72]">
                  <th className="py-3">Mã NV</th>
                  <th>Họ tên</th>
                  <th>Số điện thoại</th>
                  <th>Chức vụ</th>
                  <th>Ngày vào làm</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="border-b hover:bg-[#fff8fa]">
                    <td className="py-3 font-bold text-[#d81b60]">{emp.id}</td>
                    <td>{emp.name}</td>
                    <td>{emp.phone}</td>
                    <td>{emp.position}</td>
                    <td>{emp.startDate}</td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editEmployee(emp)}
                          className="text-blue-600"
                          title="Sửa"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className="text-red-500"
                          title="Xóa"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-gray-400">
                      Không tìm thấy nhân viên
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. LỊCH LÀM VÀ CHẤM CÔNG */}
      {subTab === 'lich' && (
        <div className="bg-white p-5 rounded-2xl border border-[#f7d6de] space-y-4">
          <h3 className="font-bold text-[#d81b60]">
            Lịch Làm & Chấm Công
          </h3>

          <form
            onSubmit={saveAttendance}
            className="p-4 bg-[#fff8fa] rounded-xl border border-[#f7d6de] space-y-3"
          >
            <h4 className="font-semibold text-sm">
              {editingAttendance !== null ? 'Sửa lịch làm' : 'Phân ca / Chấm công'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                className={inputClass}
                value={attendanceForm.employeeId}
                onChange={e => setAttendanceForm({
                  ...attendanceForm,
                  employeeId: e.target.value
                })}
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.id} - {emp.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                className={inputClass}
                value={attendanceForm.date}
                onChange={e => setAttendanceForm({
                  ...attendanceForm,
                  date: e.target.value
                })}
                required
              />

              <select
                className={inputClass}
                value={attendanceForm.shift}
                onChange={e => setAttendanceForm({
                  ...attendanceForm,
                  shift: e.target.value
                })}
              >
                <option>Ca sáng</option>
                <option>Ca chiều</option>
                <option>Ca tối</option>
                <option>Ca hành chính</option>
              </select>

              <div>
                <label className="text-xs text-gray-500">Giờ bắt đầu</label>
                <input
                  type="time"
                  className={inputClass}
                  value={attendanceForm.start}
                  onChange={e => setAttendanceForm({
                    ...attendanceForm,
                    start: e.target.value
                  })}
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Giờ kết thúc</label>
                <input
                  type="time"
                  className={inputClass}
                  value={attendanceForm.end}
                  onChange={e => setAttendanceForm({
                    ...attendanceForm,
                    end: e.target.value
                  })}
                  required
                />
              </div>

              <select
                className={inputClass}
                value={attendanceForm.status}
                onChange={e => setAttendanceForm({
                  ...attendanceForm,
                  status: e.target.value
                })}
              >
                <option>Có mặt</option>
                <option>Nghỉ phép</option>
                <option>Vắng mặt</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className={`${btnClass} bg-[#ff5e83] text-white`}
              >
                {editingAttendance !== null ? 'Cập nhật' : 'Lưu chấm công'}
              </button>

              {editingAttendance !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAttendance(null);
                    setAttendanceForm({
                      employeeId: '',
                      date: new Date().toISOString().slice(0, 10),
                      shift: 'Ca sáng',
                      start: '08:00',
                      end: '12:00',
                      status: 'Có mặt'
                    });
                  }}
                  className={`${btnClass} bg-gray-200`}
                >
                  Hủy sửa
                </button>
              )}
            </div>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[750px]">
              <thead>
                <tr className="border-b text-[#806e72]">
                  <th className="py-3">Nhân viên</th>
                  <th>Ngày làm</th>
                  <th>Ca làm</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(item => {
                  const emp = employees.find(e => e.id === item.employeeId);
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">
                        {emp ? `${emp.id} - ${emp.name}` : item.employeeId}
                      </td>
                      <td>{item.date}</td>
                      <td>{item.shift}</td>
                      <td>{item.start}</td>
                      <td>{item.end}</td>
                      <td>
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          item.status === 'Có mặt'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'Nghỉ phép'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editAttendance(item)}
                            className="text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => deleteAttendance(item.id)}
                            className="text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {attendance.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center py-6 text-gray-400">
                      Chưa có dữ liệu chấm công
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. QUẢN LÝ LƯƠNG */}
      {subTab === 'luong' && (
        <div className="bg-white p-5 rounded-2xl border border-[#f7d6de] space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-bold text-[#d81b60]">
              Bảng Tính Lương Nhân Viên
            </h3>
            <span className="text-xs text-gray-500">
              Lương = Lương cơ bản / 26 × Số ca có mặt + Phụ cấp + Thưởng
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[850px]">
              <thead>
                <tr className="border-b text-[#806e72]">
                  <th className="py-3">Mã NV</th>
                  <th>Họ tên</th>
                  <th>Chức vụ</th>
                  <th>Số ca có mặt</th>
                  <th>Lương cơ bản</th>
                  <th>Phụ cấp</th>
                  <th>Thưởng</th>
                  <th>Thực lĩnh</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const salary = getSalary(emp);
                  return (
                    <tr key={emp.id} className="border-b">
                      <td className="py-3 font-bold text-[#d81b60]">
                        {emp.id}
                      </td>
                      <td>{emp.name}</td>
                      <td>{emp.position}</td>
                      <td>{salary.workDays} ca</td>
                      <td>{money(emp.baseSalary)}</td>
                      <td>{money(emp.allowance)}</td>
                      <td>{money(emp.bonus)}</td>
                      <td className="font-bold text-green-600">
                        {money(salary.total)}
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-400">
                      Chưa có nhân viên
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
