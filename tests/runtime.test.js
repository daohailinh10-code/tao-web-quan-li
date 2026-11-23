import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { createApp } from '../server/app.js';
import { openDb } from '../server/db.js';
import { initialize } from '../server/seed.js';

test('Node 22 chạy được đăng ký nhân viên, quản lý khách hàng và đăng xuất', { timeout: 60_000 }, async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'pinkbook-node22-'));
  const db = await openDb({ dir: join(dataDir, 'db') });
  let server;

  try {
    const password = 'PinkBook-Test-22!';
    await initialize(db, { password, credentialDir: null, demo: false });

    const app = createApp(db);
    server = await new Promise((resolve, reject) => {
      const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
      instance.once('error', reject);
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const mutationHeaders = {
      'Content-Type': 'application/json',
      'x-app-request': 'nhom31'
    };

    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { ok: true });

    const loginResponse = await fetch(`${baseUrl}/api/login`, {
      method: 'POST',
      headers: mutationHeaders,
      body: JSON.stringify({ phone: '0901234567', password })
    });
    assert.equal(loginResponse.status, 200);
    const loginData = await loginResponse.json();
    assert.equal(loginData.user.role, 'owner');

    const cookie = loginResponse.headers.get('set-cookie')?.split(';')[0];
    assert.match(cookie || '', /^session=/);

    const registered = await fetch(`${baseUrl}/api/register`, {
      method: 'POST', headers: mutationHeaders,
      body: JSON.stringify({ name: 'Nhân viên thử', phone: '0912345678', password: 'Employee-Test-22!' })
    });
    assert.equal(registered.status, 200);
    const beforeApproval = await fetch(`${baseUrl}/api/login`, {
      method: 'POST', headers: mutationHeaders,
      body: JSON.stringify({ phone: '0912345678', password: 'Employee-Test-22!' })
    });
    assert.equal(beforeApproval.status, 403);

    let ownerState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: cookie } })).json();
    const employee = ownerState.users.find(user => user.phone === '0912345678');
    assert.equal(employee.role, 'employee');
    assert.equal(employee.active, false);
    const approval = await fetch(`${baseUrl}/api/action/user.active`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ id: employee.id, version: employee.version, active: true, reason: 'Duyệt thử nghiệm' })
    });
    assert.equal(approval.status, 200);
    const employeeLogin = await fetch(`${baseUrl}/api/login`, {
      method: 'POST', headers: mutationHeaders,
      body: JSON.stringify({ phone: '0912345678', password: 'Employee-Test-22!' })
    });
    assert.equal(employeeLogin.status, 200);
    const employeeData = await employeeLogin.json();
    assert.equal(employeeData.user.role, 'employee');
    assert.deepEqual(employeeData.user.permissions, ['products', 'orders', 'customers']);
    const employeeCookie = employeeLogin.headers.get('set-cookie')?.split(';')[0];

    const workDate = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const assigned = await fetch(`${baseUrl}/api/action/shift.assign`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ employee_id: employee.id, work_date: workDate, shift: 'full', starts_at: '00:00', ends_at: '23:59' })
    });
    assert.equal(assigned.status, 200);
    const assignment = await assigned.json();
    const employeeSchedule = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: employeeCookie } })).json();
    assert.equal(employeeSchedule.work_shifts.length, 1);
    assert.equal(employeeSchedule.work_shifts[0].task, 'Ca làm việc tại cửa hàng');
    const monthly = await fetch(`${baseUrl}/api/shifts?month=${workDate.slice(0,7)}&employee_id=${employee.id}`, { headers: { Cookie: employeeCookie } });
    assert.equal(monthly.status, 200);
    assert.equal((await monthly.json()).length, 1);
    const clocked = await fetch(`${baseUrl}/api/action/shift.clock`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: employeeCookie },
      body: JSON.stringify({ id: assignment.id })
    });
    assert.equal(clocked.status, 200);
    const visibleToOwner = await (await fetch(`${baseUrl}/api/shifts?month=${workDate.slice(0,7)}&employee_id=${employee.id}`, { headers: { Cookie: cookie } })).json();
    assert.ok(visibleToOwner[0].check_in);
    const secondEmployee = await fetch(`${baseUrl}/api/action/user.save`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ name: 'Nhân viên tự chấm', phone: '0912345679', password: 'Employee-Second-22!' })
    });
    assert.equal(secondEmployee.status, 200);
    const secondId = (await secondEmployee.json()).id;
    const secondLogin = await fetch(`${baseUrl}/api/login`, {
      method: 'POST', headers: mutationHeaders,
      body: JSON.stringify({ phone: '0912345679', password: 'Employee-Second-22!' })
    });
    const secondCookie = secondLogin.headers.get('set-cookie')?.split(';')[0];
    const secondState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: secondCookie } })).json();
    assert.ok(secondState.products);
    assert.ok(secondState.customers);
    assert.ok(secondState.pos_customers);
    const selfClock = await fetch(`${baseUrl}/api/action/shift.clock`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: secondCookie }, body: JSON.stringify({})
    });
    assert.equal(selfClock.status, 200);
    const selfVisibleToOwner = await (await fetch(`${baseUrl}/api/shifts?month=${workDate.slice(0,7)}&employee_id=${secondId}`, { headers: { Cookie: cookie } })).json();
    assert.equal(selfVisibleToOwner[0].task, 'Ca tự chấm công');
    assert.ok(selfVisibleToOwner[0].check_in);

    const savedCustomer = await fetch(`${baseUrl}/api/action/customer.save`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ name: 'Khách thử', phone: '0987654321', email: '', address: 'Hà Nội', password: 'Customer-Test-22!' })
    });
    assert.equal(savedCustomer.status, 200);
    const customer = await savedCustomer.json();
    const initialState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: cookie } })).json();
    const bookSaved = await fetch(`${baseUrl}/api/action/product.save`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ sku: 'TEST-01', name: 'Sách thử', category_id: initialState.categories[0].id, specs: { author: 'Tác giả thử' } })
    });
    assert.equal(bookSaved.status, 200);
    const book = await bookSaved.json();
    const priceSaved = await fetch(`${baseUrl}/api/action/price.save`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ id: book.id, price: 50000 })
    });
    assert.equal(priceSaved.status, 200);
    const received = await fetch(`${baseUrl}/api/action/stock.receive`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ product_id: book.id, quantity: 5 })
    });
    assert.equal(received.status, 200);
    const sold = await fetch(`${baseUrl}/api/action/pos.sale`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: employeeCookie },
      body: JSON.stringify({ buyer_name: customer.name, buyer_phone: customer.phone, lines: [{ product_id: book.id, quantity: 2 }] })
    });
    assert.equal(sold.status, 200);
    assert.equal((await sold.json()).earned, 5000);
    const guestSold = await fetch(`${baseUrl}/api/action/pos.sale`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: employeeCookie },
      body: JSON.stringify({ lines: [{ product_id: book.id, quantity: 1 }] })
    });
    assert.equal(guestSold.status, 200);
    const guestSale = await guestSold.json();
    assert.equal(guestSale.earned, 0);
    const afterSale = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: cookie } })).json();
    assert.equal(afterSale.products.find(item => item.id === book.id).actual, 2);
    assert.equal(afterSale.customers.find(item => item.id === customer.id).points, 5000);
    assert.equal(afterSale.orders.find(order => order.id === guestSale.id)?.customer_name, 'Khách lẻ');
    const newMemberSale = await fetch(`${baseUrl}/api/action/pos.sale`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: secondCookie },
      body: JSON.stringify({ buyer_name: 'Khách tích điểm mới', buyer_phone: '0934567890', lines: [{ product_id: book.id, quantity: 1 }] })
    });
    assert.equal(newMemberSale.status, 200);
    assert.equal((await newMemberSale.json()).earned, 2500);
    const createdMemberState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: cookie } })).json();
    assert.equal(createdMemberState.customers.find(user => user.phone === '0934567890').points, 2500);
    const updatedCustomer = await fetch(`${baseUrl}/api/action/customer.save`, {
      method: 'POST', headers: { ...mutationHeaders, Cookie: cookie },
      body: JSON.stringify({ id: customer.id, version: customer.version, name: 'Khách đã sửa', phone: customer.phone, email: '', address: 'Hải Phòng' })
    });
    assert.equal(updatedCustomer.status, 200);
    ownerState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: cookie } })).json();
    assert.equal(ownerState.customers.find(user => user.id === customer.id).address, 'Hải Phòng');
    const employeeState = await (await fetch(`${baseUrl}/api/state`, { headers: { Cookie: employeeCookie } })).json();
    assert.equal(employeeState.customers.find(user => user.id === customer.id).name, 'Khách đã sửa');
    assert.equal(employeeState.users, undefined);

    const logoutResponse = await fetch(`${baseUrl}/api/logout`, {
      method: 'POST',
      headers: { ...mutationHeaders, Cookie: cookie }
    });
    assert.equal(logoutResponse.status, 200);
    assert.deepEqual(await logoutResponse.json(), { ok: true });

    const stateResponse = await fetch(`${baseUrl}/api/state`, {
      headers: { Cookie: cookie }
    });
    assert.equal(stateResponse.status, 200);
    const state = await stateResponse.json();
    assert.equal(state.user, null);
  } finally {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
    await db.close();
    await rm(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
