const BASE_URL = 'http://10.0.2.2:5001/api';
export const SOCKET_URL = 'http://10.0.2.2:5001';

// Shop location (tọa độ quán) - thay đổi theo vị trí thực tế của quán
export const SHOP_LOCATION = { lat: 10.7769, lng: 106.7009 };

export async function registerAccount(formData) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function loginAccount({ username, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getFoods(category) {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  const res = await fetch(`${BASE_URL}/foods?${params.toString()}`);
  return res.json();
}

export async function getDiscountedFoods() {
  const res = await fetch(`${BASE_URL}/foods?hasDiscount=true`);
  return res.json();
}

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });
  return res.json();
}

export async function getOrders(userId) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  const res = await fetch(`${BASE_URL}/orders?${params.toString()}`);
  return res.json();
}

export async function getAllOrders() {
  const res = await fetch(`${BASE_URL}/orders`);
  return res.json();
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function assignShipper(orderId, shipperId, deliveryDistance) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/assign`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shipperId, deliveryDistance }),
  });
  return res.json();
}

export async function getStaff() {
  const res = await fetch(`${BASE_URL}/users/staff`);
  return res.json();
}

export async function getStats() {
  const res = await fetch(`${BASE_URL}/stats`);
  return res.json();
}

export async function updateProfile(userId, formData) {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    method: 'PUT',
    body: formData,
  });
  return res.json();
}

export async function getProfile(userId) {
  const res = await fetch(`${BASE_URL}/users/${userId}`);
  return res.json();
}

export const IMAGE_BASE_URL = 'http://10.0.2.2:5001';

export async function addFood(formData) {
  const res = await fetch(`${BASE_URL}/foods`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

export async function updateFood(foodId, data) {
  const isFormData = data instanceof FormData;
  const res = await fetch(`${BASE_URL}/foods/${foodId}`, {
    method: 'PUT',
    ...(isFormData ? { body: data } : {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  });
  return res.json();
}

export async function updateShipperLocation(orderId, lat, lng) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/shipper-location`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lng }),
  });
  return res.json();
}
