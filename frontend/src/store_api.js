export async function api(path, body) {
  const response = await fetch(path, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'x-app-request': 'nhom31' }, ...(body === undefined ? {} : { method: 'POST', body: JSON.stringify(body) }) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Không thể kết nối máy chủ.');
  return data;
}
export const moneyText = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
