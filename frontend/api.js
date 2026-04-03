import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Nếu chạy trên điện thoại thật, hãy đổi giá trị này thành IP máy tính của bạn trên cùng mạng Wi-Fi.
// Ví dụ: '192.168.1.100:5001'
const PHYSICAL_HOST = '192.168.1.18:5001';
const DEFAULT_HOST = Platform.OS === 'android' ? '10.0.2.2:5001' : 'localhost:5001';
const BACKEND_HOST = Constants.manifest?.extra?.backendHost || Constants.expoConfig?.extra?.backendHost || PHYSICAL_HOST || DEFAULT_HOST;
const BASE_URL = `http://${BACKEND_HOST}/api`;
export const SOCKET_URL = `http://${BACKEND_HOST}`;

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

export async function getOrders(userId, shipperId) {
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (shipperId) params.append('shipperId', shipperId);
  const query = params.toString();
  const res = await fetch(`${BASE_URL}/orders${query ? `?${query}` : ''}`);
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

export async function assignRandomShipper(orderId, deliveryDistance) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}/assign-random`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryDistance }),
  });
  return res.json();
}

export async function getStaff() {
  const res = await fetch(`${BASE_URL}/users/staff`);
  return res.json();
}

export async function createStaff(data) {
  const res = await fetch(`${BASE_URL}/users/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
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

export const IMAGE_BASE_URL = `http://${BACKEND_HOST}`;

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

// Delete food
export async function deleteFood(foodId) {
  const res = await fetch(`${BASE_URL}/foods/${foodId}`, { method: 'DELETE' });
  return res.json();
}

// Promo codes
export async function validatePromoCode(code, orderTotal) {
  const res = await fetch(`${BASE_URL}/promo/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, orderTotal }),
  });
  return res.json();
}

export async function getPromoCodes() {
  const res = await fetch(`${BASE_URL}/promo`);
  return res.json();
}

export async function createPromoCode(data) {
  const res = await fetch(`${BASE_URL}/promo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deletePromoCode(id) {
  const res = await fetch(`${BASE_URL}/promo/${id}`, { method: 'DELETE' });
  return res.json();
}

// Events
export async function getAllEvents() {
  const res = await fetch(`${BASE_URL}/events/all`);
  return res.json();
}

export async function createEvent(data) {
  const res = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEvent(eventId, data) {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEvent(eventId) {
  const res = await fetch(`${BASE_URL}/events/${eventId}`, { method: 'DELETE' });
  return res.json();
}
