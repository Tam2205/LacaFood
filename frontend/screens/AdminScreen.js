import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, RefreshControl, Image, Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  getFoods, getAllOrders, getStats, getStaff, assignShipper, assignRandomShipper, updateOrderStatus,
  addFood, updateFood, deleteFood, IMAGE_BASE_URL,
  createStaff,
  getPromoCodes, createPromoCode, deletePromoCode,
  getAllEvents, createEvent, deleteEvent,
} from '../api';
import { useAuth } from '../AuthContext';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
  yellow: '#F39C12', blue: '#3498DB',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

function formatCompactMoney(value) {
  const amount = Number(value) || 0;
  if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}ty`;
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}tr`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}k`;
  return `${Math.round(amount)}d`;
}

const STATUS_MAP = {
  pending: { label: 'Chờ', color: COLORS.yellow },
  confirmed: { label: 'Xác nhận', color: COLORS.blue },
  delivering: { label: 'Đang giao', color: COLORS.primary },
  done: { label: 'Hoàn thành', color: COLORS.green },
  cancelled: { label: 'Hủy', color: COLORS.red },
};

const CATS = [
  { key: 'nuoc_uong', l: '🧋 Nước uống' }, { key: 'lau', l: '🍲 Lẩu' },
  { key: 'mon_nhau', l: '🍗 Món nhậu' }, { key: 'bun_pho', l: '🍜 Bún/Phở' },
  { key: 'com', l: '🍚 Cơm' }, { key: 'an_vat', l: '🍢 Ăn vặt' },
];

export default function AdminScreen({ navigation }) {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [promos, setPromos] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  // Add food form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('com');
  const [newImage, setNewImage] = useState(null);
  const [newOptionsJson, setNewOptionsJson] = useState('');

  // Edit food modal
  const [editFood, setEditFood] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editCat, setEditCat] = useState('com');
  const [editImage, setEditImage] = useState(null);
  const [editOptionsJson, setEditOptionsJson] = useState('');

  // Promo code form
  const [promoCode, setPromoCode] = useState('');
  const [promoPercent, setPromoPercent] = useState('');
  const [promoMaxUses, setPromoMaxUses] = useState('100');
  const [promoMinOrder, setPromoMinOrder] = useState('0');
  const [promoDays, setPromoDays] = useState('30');

  // Event form
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('flashsale');
  const [eventDiscount, setEventDiscount] = useState('');
  const [eventStartHour, setEventStartHour] = useState('');
  const [eventEndHour, setEventEndHour] = useState('');
  const [eventFoods, setEventFoods] = useState([]);

  // Assign shipper
  const [distanceInputs, setDistanceInputs] = useState({});

  // Add shipper form
  const [shipperName, setShipperName] = useState('');
  const [shipperPhone, setShipperPhone] = useState('');
  const [shipperUsername, setShipperUsername] = useState('');
  const [shipperPassword, setShipperPassword] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [o, f, s, st, p, e] = await Promise.all([
        getAllOrders(), getFoods(), getStats(), getStaff(), getPromoCodes(), getAllEvents(),
      ]);
      setOrders(Array.isArray(o) ? o : []);
      setFoods(Array.isArray(f) ? f : []);
      setStats(s && typeof s === 'object' ? s : null);
      setStaffList(Array.isArray(st) ? st : []);
      setPromos(Array.isArray(p) ? p : []);
      setEvents(Array.isArray(e) ? e : []);
    } catch {
      setOrders([]);
      setFoods([]);
      setStaffList([]);
      setPromos([]);
      setEvents([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const busyShipperIds = new Set(
    (orders || [])
      .filter(o => ['confirmed', 'delivering'].includes(o.status) && o.shipper?._id)
      .map(o => o.shipper._id)
  );

  const handleAssignShipper = async (orderId, shipperId) => {
    const dist = parseFloat(distanceInputs[orderId]) || 3;
    if (busyShipperIds.has(shipperId)) {
      Alert.alert('Shipper đang bận', 'Người này đang giao đơn khác, vui lòng chọn người khác hoặc dùng tự chọn.');
      return;
    }
    try {
      await assignShipper(orderId, shipperId, dist);
      Alert.alert('Thành công', 'Đã chỉ định người giao hàng');
      loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể chỉ định');
    }
  };

  const handleAssignRandomShipper = async (orderId) => {
    const dist = parseFloat(distanceInputs[orderId]) || 3;
    try {
      const result = await assignRandomShipper(orderId, dist);
      if (result?.message) {
        Alert.alert('Thông báo', result.message);
      } else {
        Alert.alert('Thành công', `Đã tự chọn shipper: ${result?.shipper?.name || 'N/A'}`);
      }
      loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể tự chọn shipper');
    }
  };

  const handleCreateShipper = async () => {
    const safeUsername = (shipperUsername || '').trim().toLowerCase();
    if (!shipperName.trim() || !safeUsername || !shipperPassword.trim()) {
      Alert.alert('Thiếu thông tin', 'Nhập tên, username và mật khẩu cho shipper');
      return;
    }
    try {
      const result = await createStaff({
        name: shipperName.trim(),
        phone: shipperPhone.trim(),
        username: safeUsername,
        password: shipperPassword,
      });
      if (result?.message && !result?._id) {
        Alert.alert('Lỗi', result.message);
        return;
      }
      Alert.alert('Thành công', `Đã thêm shipper ${result.name || shipperName}`);
      setShipperName('');
      setShipperPhone('');
      setShipperUsername('');
      setShipperPassword('');
      loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể thêm shipper');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch { Alert.alert('Lỗi', 'Không cập nhật được'); }
  };

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) setter(result.assets[0]);
  };

  const handleAddFood = async () => {
    if (!newName.trim() || !newPrice) { Alert.alert('Lỗi', 'Nhập đủ tên và giá'); return; }
    try {
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('price', newPrice);
      formData.append('description', newDesc);
      formData.append('category', newCat);
      if (newOptionsJson.trim()) {
        try {
          JSON.parse(newOptionsJson);
          formData.append('options', newOptionsJson.trim());
        } catch {
          Alert.alert('Lỗi options', 'JSON tùy chọn không hợp lệ');
          return;
        }
      }
      if (newImage) {
        const uri = newImage.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', { uri, name: `food_${Date.now()}.${ext}`, type: `image/${ext}` });
      }
      await addFood(formData);
      Alert.alert('Thành công', 'Đã thêm món');
      setNewName(''); setNewPrice(''); setNewDesc(''); setNewImage(null); setNewOptionsJson('');
      loadData();
    } catch { Alert.alert('Lỗi', 'Không thể thêm'); }
  };

  const handleDeleteFood = (foodId, foodName) => {
    Alert.alert('Xóa món', `Bạn muốn xóa "${foodName}"?`, [
      { text: 'Hủy' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await deleteFood(foodId);
            Alert.alert('Đã xóa', foodName);
            loadData();
          } catch { Alert.alert('Lỗi', 'Không thể xóa'); }
        },
      },
    ]);
  };

  const handleTogglePromo = async (food) => {
    const newActive = !food.promoActive;
    const data = { promoActive: newActive };
    if (!newActive) {
      data.discount = 0;
      data.isFlashSale = false;
      data.eventType = 'none';
    }
    await updateFood(food._id, data);
    loadData();
  };

  const openEditFood = (food) => {
    setEditFood(food);
    setEditName(food.name || '');
    setEditPrice(String(food.price || ''));
    setEditDesc(food.description || '');
    setEditDiscount(String(food.discount || 0));
    setEditCat(food.category || 'com');
    setEditImage(null);
    setEditOptionsJson(food.options?.length ? JSON.stringify(food.options, null, 2) : '');
  };

  const handleSaveEdit = async () => {
    if (!editFood) return;
    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('price', editPrice);
      formData.append('description', editDesc);
      formData.append('discount', editDiscount);
      formData.append('category', editCat);
      if (editOptionsJson.trim()) {
        try {
          JSON.parse(editOptionsJson);
          formData.append('options', editOptionsJson.trim());
        } catch {
          Alert.alert('Lỗi options', 'JSON tùy chọn không hợp lệ');
          return;
        }
      }
      const disc = parseInt(editDiscount) || 0;
      formData.append('isFlashSale', disc > 0 ? 'true' : 'false');
      formData.append('promoActive', disc > 0 ? 'true' : 'false');
      formData.append('eventType', disc > 0 ? 'flashsale' : 'none');
      if (editImage) {
        const uri = editImage.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', { uri, name: `food_${Date.now()}.${ext}`, type: `image/${ext}` });
      }
      await updateFood(editFood._id, formData);
      Alert.alert('Thành công', 'Đã cập nhật');
      setEditFood(null);
      loadData();
    } catch { Alert.alert('Lỗi', 'Không thể cập nhật'); }
  };

  const handleCreatePromo = async () => {
    if (!promoCode.trim() || !promoPercent) { Alert.alert('Lỗi', 'Nhập mã và %'); return; }
    try {
      const validTo = new Date();
      validTo.setDate(validTo.getDate() + (parseInt(promoDays) || 30));
      await createPromoCode({
        code: promoCode.trim().toUpperCase(),
        discountPercent: parseInt(promoPercent),
        maxUses: parseInt(promoMaxUses) || 100,
        minOrder: parseInt(promoMinOrder) || 0,
        validTo,
      });
      Alert.alert('Thành công', 'Đã tạo mã khuyến mãi');
      setPromoCode(''); setPromoPercent(''); setPromoMaxUses('100'); setPromoMinOrder('0'); setPromoDays('30');
      loadData();
    } catch (err) { Alert.alert('Lỗi', 'Mã có thể đã tồn tại'); }
  };

  const handleDeletePromo = (id) => {
    Alert.alert('Xóa mã', 'Xác nhận xóa?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { await deletePromoCode(id); loadData(); } },
    ]);
  };

  const toggleEventFood = (foodId) => {
    setEventFoods(prev =>
      prev.includes(foodId) ? prev.filter(id => id !== foodId) : [...prev, foodId]
    );
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim() || !eventDiscount || eventFoods.length === 0) {
      Alert.alert('Lỗi', 'Nhập tên, % giảm và chọn ít nhất 1 món'); return;
    }
    try {
      const data = {
        name: eventName,
        type: eventType,
        discount: parseInt(eventDiscount),
        foods: eventFoods,
        active: true,
      };
      if (eventType === 'hourly') {
        data.startHour = parseInt(eventStartHour) || 0;
        data.endHour = parseInt(eventEndHour) || 23;
      }
      await createEvent(data);
      Alert.alert('Thành công', 'Đã tạo sự kiện & áp dụng giảm giá cho các món');
      setEventName(''); setEventDiscount(''); setEventFoods([]); setEventStartHour(''); setEventEndHour('');
      loadData();
    } catch { Alert.alert('Lỗi', 'Không thể tạo sự kiện'); }
  };

  const handleDeleteEvent = (id) => {
    Alert.alert('Xóa sự kiện', 'Sẽ hủy giảm giá các món trong sự kiện', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => { await deleteEvent(id); loadData(); } },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Quản trị viên</Text>
        <TouchableOpacity onPress={() => { logout(); navigation.replace('Home'); }}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statNum}>{stats.totalOrders}</Text><Text style={styles.statLabel}>Đơn hàng</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum} numberOfLines={1}>{formatCompactMoney(stats.totalRevenue)}</Text><Text style={styles.statLabel}>Doanh thu</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{stats.totalFoods}</Text><Text style={styles.statLabel}>Món ăn</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{stats.totalShippers}</Text><Text style={styles.statLabel}>Shipper</Text></View>
        </View>
      )}

      {/* Tab switcher */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabRow}>
          {[
            { key: 'orders', label: '📦 Đơn hàng' },
            { key: 'foods', label: '🍽️ Thực đơn' },
            { key: 'addFood', label: '➕ Thêm món' },
            { key: 'promos', label: '🎫 Mã KM' },
            { key: 'events', label: '🔥 Sự kiện' },
          ].map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]} onPress={() => setTab(t.key)}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
      >
        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <>
            <Text style={styles.sectionTitle}>Đơn hàng ({Array.isArray(orders) ? orders.length : 0})</Text>
            <View style={[styles.formCard, { marginBottom: 12 }]}> 
              <Text style={styles.formLabel}>➕ Thêm người giao hàng</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Tên shipper"
                value={shipperName}
                onChangeText={setShipperName}
                placeholderTextColor={COLORS.gray}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Số điện thoại"
                value={shipperPhone}
                onChangeText={setShipperPhone}
                keyboardType="phone-pad"
                placeholderTextColor={COLORS.gray}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Username đăng nhập"
                value={shipperUsername}
                onChangeText={setShipperUsername}
                autoCapitalize="none"
                placeholderTextColor={COLORS.gray}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Mật khẩu"
                value={shipperPassword}
                onChangeText={setShipperPassword}
                secureTextEntry
                placeholderTextColor={COLORS.gray}
              />
              <TouchableOpacity style={styles.addFoodBtn} onPress={handleCreateShipper}>
                <Text style={styles.addFoodBtnText}>Thêm shipper</Text>
              </TouchableOpacity>
            </View>

            {(Array.isArray(orders) ? orders : []).length === 0 && (
              <View style={styles.formCard}>
                <Text style={{ color: COLORS.gray }}>Hiện chưa có đơn hàng hoặc không tải được dữ liệu đơn hàng.</Text>
              </View>
            )}
            {(Array.isArray(orders) ? orders : []).map(order => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const itemNames = (Array.isArray(order.items) ? order.items : []).map(i => `${i?.food?.name || 'Mon'} x${i?.quantity || 0}`).join(', ');
              return (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDetail}>👤 {order.user?.name || 'Khách'} - {order.user?.phone || ''}</Text>
                  <Text style={styles.orderDetail}>📍 {order.address || 'N/A'}</Text>
                  <Text style={styles.orderDetail} numberOfLines={2}>🍽️ {itemNames || 'N/A'}</Text>
                  <Text style={styles.orderDetail}>💰 {formatPrice(order.total || 0)} {order.deliveryFee > 0 ? `(ship: ${formatPrice(order.deliveryFee)})` : ''}</Text>
                  {order.promoCode ? <Text style={styles.orderDetail}>🎫 Mã KM: {order.promoCode} (-{formatPrice(order.promoDiscount || 0)})</Text> : null}
                  {order.deliveryTime ? <Text style={styles.orderDetail}>🕐 Giao: ~{order.deliveryTime}</Text> : null}
                  {order.shipper && <Text style={styles.orderDetail}>🏍️ {order.shipper.name} - {order.shipper.phone}</Text>}

                  {order.status === 'pending' && (
                    <View style={styles.assignSection}>
                      <Text style={styles.assignLabel}>Chỉ định shipper:</Text>
                      <TextInput
                        style={styles.distInput}
                        placeholder="Km"
                        keyboardType="numeric"
                        value={distanceInputs[order._id] || ''}
                        onChangeText={v => setDistanceInputs(prev => ({ ...prev, [order._id]: v }))}
                      />
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.primary, marginBottom: 8 }]}
                        onPress={() => handleAssignRandomShipper(order._id)}
                      >
                        <Text style={styles.actionBtnText}>🎲 Tự chọn shipper rảnh</Text>
                      </TouchableOpacity>
                      {(Array.isArray(staffList) ? staffList : []).map(s => (
                        <TouchableOpacity
                          key={s._id}
                          style={[styles.staffBtn, busyShipperIds.has(s._id) && styles.staffBtnBusy]}
                          onPress={() => handleAssignShipper(order._id, s._id)}
                        >
                          <Text style={[styles.staffBtnText, busyShipperIds.has(s._id) && styles.staffBtnTextBusy]}>
                            {busyShipperIds.has(s._id) ? '⛔' : '📌'} {s.name}
                            {busyShipperIds.has(s._id) ? ' (đang giao)' : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.statusBtns}>
                    {order.status !== 'done' && order.status !== 'cancelled' && (
                      <>
                        {order.status === 'confirmed' && (
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.primary }]} onPress={() => handleStatusChange(order._id, 'delivering')}>
                            <Text style={styles.actionBtnText}>🚀 Giao hàng</Text>
                          </TouchableOpacity>
                        )}
                        {order.status === 'delivering' && (
                          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.green }]} onPress={() => handleStatusChange(order._id, 'done')}>
                            <Text style={styles.actionBtnText}>✅ Hoàn thành</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: COLORS.red }]} onPress={() => handleStatusChange(order._id, 'cancelled')}>
                          <Text style={styles.actionBtnText}>❌ Hủy</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* FOODS TAB */}
        {tab === 'foods' && (
          <>
            <Text style={styles.sectionTitle}>Thực đơn ({foods.length} món)</Text>
            {foods.map(food => (
              <View key={food._id} style={styles.foodItem}>
                {food.image ? (
                  <Image source={{ uri: IMAGE_BASE_URL + food.image }} style={styles.foodThumb} />
                ) : (
                  <View style={styles.foodThumbPlaceholder}><Text style={{ fontSize: 20 }}>🍽️</Text></View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMeta}>
                    {formatPrice(food.price)} • {food.category} {food.discount > 0 ? `• -${food.discount}%` : ''}
                  </Text>
                  {food.options?.length > 0 && (
                    <Text style={styles.foodMeta}>🛠️ {food.options.length} tùy chọn</Text>
                  )}
                </View>
                <View style={styles.foodActions}>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: food.promoActive || food.discount > 0 ? '#FFE8E8' : '#E8FFE8' }]}
                    onPress={() => handleTogglePromo(food)}>
                    <Text style={{ fontSize: 11, color: food.promoActive || food.discount > 0 ? COLORS.red : COLORS.green, fontWeight: '600' }}>
                      {food.promoActive || food.discount > 0 ? '🔴 Tắt KM' : '🟢 Bật KM'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#E8F0FF' }]} onPress={() => openEditFood(food)}>
                    <Text style={{ fontSize: 11, color: COLORS.blue, fontWeight: '600' }}>✏️ Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: '#FFE8E8' }]} onPress={() => handleDeleteFood(food._id, food.name)}>
                    <Text style={{ fontSize: 11, color: COLORS.red, fontWeight: '600' }}>🗑️ Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ADD FOOD TAB */}
        {tab === 'addFood' && (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>➕ Thêm món mới</Text>
            <TextInput style={styles.formInput} placeholder="Tên món" value={newName} onChangeText={setNewName} placeholderTextColor={COLORS.gray} />
            <TextInput style={styles.formInput} placeholder="Giá (VND)" value={newPrice} onChangeText={setNewPrice} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
            <TextInput style={styles.formInput} placeholder="Mô tả" value={newDesc} onChangeText={setNewDesc} placeholderTextColor={COLORS.gray} />
            <TextInput
              style={[styles.formInput, { minHeight: 90, textAlignVertical: 'top' }]}
              placeholder="Tuy chon mon (JSON), vi du: nhom Size, Topping"
              value={newOptionsJson}
              onChangeText={setNewOptionsJson}
              multiline
              placeholderTextColor={COLORS.gray}
            />

            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Hình ảnh:</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(setNewImage)}>
              {newImage ? (
                <Image source={{ uri: newImage.uri }} style={styles.imagePreview} />
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Text style={{ fontSize: 28 }}>📷</Text>
                  <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>Chọn ảnh món ăn</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Danh mục:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {CATS.map(c => (
                <TouchableOpacity key={c.key} style={[styles.catChip, newCat === c.key && styles.catChipActive]} onPress={() => setNewCat(c.key)}>
                  <Text style={[styles.catChipText, newCat === c.key && { color: COLORS.white }]}>{c.l}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.addFoodBtn} onPress={handleAddFood}>
              <Text style={styles.addFoodBtnText}>Thêm món</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PROMO CODES TAB */}
        {tab === 'promos' && (
          <>
            <Text style={styles.sectionTitle}>🎫 Quản lý mã khuyến mãi</Text>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Tạo mã mới</Text>
              <TextInput style={styles.formInput} placeholder="Mã KM (VD: GIAM20)" value={promoCode}
                onChangeText={setPromoCode} autoCapitalize="characters" placeholderTextColor={COLORS.gray} />
              <View style={styles.formRow}>
                <TextInput style={[styles.formInput, { flex: 1, marginRight: 6 }]} placeholder="% giảm" value={promoPercent}
                  onChangeText={setPromoPercent} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
                <TextInput style={[styles.formInput, { flex: 1, marginLeft: 6 }]} placeholder="Max lượt" value={promoMaxUses}
                  onChangeText={setPromoMaxUses} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
              </View>
              <View style={styles.formRow}>
                <TextInput style={[styles.formInput, { flex: 1, marginRight: 6 }]} placeholder="Đơn tối thiểu (đ)" value={promoMinOrder}
                  onChangeText={setPromoMinOrder} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
                <TextInput style={[styles.formInput, { flex: 1, marginLeft: 6 }]} placeholder="Số ngày hiệu lực" value={promoDays}
                  onChangeText={setPromoDays} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
              </View>
              <TouchableOpacity style={styles.addFoodBtn} onPress={handleCreatePromo}>
                <Text style={styles.addFoodBtnText}>Tạo mã</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Danh sách mã ({promos.length})</Text>
            {promos.map(p => (
              <View key={p._id} style={styles.promoCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoCodeText}>{p.code}</Text>
                  <Text style={styles.promoMeta}>
                    Giảm {p.discountPercent}% • Đã dùng {p.usedCount}/{p.maxUses}
                    {p.minOrder > 0 ? ` • Tối thiểu ${formatPrice(p.minOrder)}` : ''}
                  </Text>
                  <Text style={styles.promoMeta}>
                    Hết hạn: {new Date(p.validTo).toLocaleDateString('vi')}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePromo(p._id)} style={styles.promoDeleteBtn}>
                  <Text style={{ color: COLORS.red, fontWeight: 'bold' }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* EVENTS TAB */}
        {tab === 'events' && (
          <>
            <Text style={styles.sectionTitle}>🔥 Quản lý sự kiện giảm giá</Text>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Tạo sự kiện mới</Text>
              <TextInput style={styles.formInput} placeholder="Tên sự kiện" value={eventName}
                onChangeText={setEventName} placeholderTextColor={COLORS.gray} />

              <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Loại sự kiện:</Text>
              <View style={styles.formRow}>
                {[
                  { key: 'flashsale', l: '⚡ Flash Sale' },
                  { key: 'hourly', l: '⏰ Theo giờ' },
                  { key: 'blackfriday', l: '🏷️ Black Friday' },
                ].map(t => (
                  <TouchableOpacity key={t.key}
                    style={[styles.catChip, eventType === t.key && styles.catChipActive, { marginBottom: 6 }]}
                    onPress={() => setEventType(t.key)}>
                    <Text style={[styles.catChipText, eventType === t.key && { color: COLORS.white }]}>{t.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.formInput} placeholder="% giảm giá" value={eventDiscount}
                onChangeText={setEventDiscount} keyboardType="numeric" placeholderTextColor={COLORS.gray} />

              {eventType === 'hourly' && (
                <View style={styles.formRow}>
                  <TextInput style={[styles.formInput, { flex: 1, marginRight: 6 }]} placeholder="Giờ bắt đầu (0-23)" value={eventStartHour}
                    onChangeText={setEventStartHour} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
                  <TextInput style={[styles.formInput, { flex: 1, marginLeft: 6 }]} placeholder="Giờ kết thúc (0-23)" value={eventEndHour}
                    onChangeText={setEventEndHour} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
                </View>
              )}

              <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>
                Chọn món ({eventFoods.length} đã chọn):
              </Text>
              <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                {foods.map(f => {
                  const selected = eventFoods.includes(f._id);
                  return (
                    <TouchableOpacity key={f._id}
                      style={[styles.eventFoodItem, selected && styles.eventFoodItemActive]}
                      onPress={() => toggleEventFood(f._id)}>
                      <View style={[styles.checkBox, selected && styles.checkBoxActive]}>
                        {selected && <Text style={{ color: COLORS.white, fontSize: 12 }}>✓</Text>}
                      </View>
                      <Text style={[styles.eventFoodName, selected && { color: COLORS.primary }]}>
                        {f.name} - {formatPrice(f.price)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={[styles.addFoodBtn, { marginTop: 12 }]} onPress={handleCreateEvent}>
                <Text style={styles.addFoodBtnText}>Tạo sự kiện</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Sự kiện hiện tại ({events.length})</Text>
            {events.map(ev => {
              const typeLabels = { flashsale: '⚡ Flash Sale', hourly: '⏰ Theo giờ', blackfriday: '🏷️ Black Friday' };
              return (
                <View key={ev._id} style={styles.eventCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.eventCardName}>{ev.name}</Text>
                    <Text style={styles.eventCardMeta}>
                      {typeLabels[ev.type] || ev.type} • Giảm {ev.discount}%
                      {ev.type === 'hourly' ? ` • ${ev.startHour}h - ${ev.endHour}h` : ''}
                    </Text>
                    <Text style={styles.eventCardMeta}>
                      Áp dụng: {(ev.foods || []).map(f => f.name || f).join(', ') || 'Chưa có món'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteEvent(ev._id)} style={styles.promoDeleteBtn}>
                    <Text style={{ color: COLORS.red, fontWeight: 'bold' }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* EDIT FOOD MODAL */}
      <Modal visible={!!editFood} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>✏️ Sửa món: {editFood?.name}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput style={styles.formInput} placeholder="Tên món" value={editName} onChangeText={setEditName} placeholderTextColor={COLORS.gray} />
              <TextInput style={styles.formInput} placeholder="Giá (VND)" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
              <TextInput style={styles.formInput} placeholder="Mô tả" value={editDesc} onChangeText={setEditDesc} placeholderTextColor={COLORS.gray} />
              <TextInput style={styles.formInput} placeholder="% giảm giá (0 = không giảm)" value={editDiscount} onChangeText={setEditDiscount} keyboardType="numeric" placeholderTextColor={COLORS.gray} />
              <TextInput
                style={[styles.formInput, { minHeight: 90, textAlignVertical: 'top' }]}
                placeholder="Tùy chọn món (JSON)"
                value={editOptionsJson}
                onChangeText={setEditOptionsJson}
                multiline
                placeholderTextColor={COLORS.gray}
              />

              <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Danh mục:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {CATS.map(c => (
                  <TouchableOpacity key={c.key} style={[styles.catChip, editCat === c.key && styles.catChipActive]} onPress={() => setEditCat(c.key)}>
                    <Text style={[styles.catChipText, editCat === c.key && { color: COLORS.white }]}>{c.l}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Đổi ảnh:</Text>
              <TouchableOpacity style={[styles.imagePickerBtn, { height: 120 }]} onPress={() => pickImage(setEditImage)}>
                {editImage ? (
                  <Image source={{ uri: editImage.uri }} style={styles.imagePreview} />
                ) : editFood?.image ? (
                  <Image source={{ uri: IMAGE_BASE_URL + editFood.image }} style={styles.imagePreview} />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Text style={{ fontSize: 28 }}>📷</Text>
                    <Text style={{ fontSize: 12, color: COLORS.gray }}>Chọn ảnh mới</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.formRow}>
                <TouchableOpacity style={[styles.addFoodBtn, { flex: 1, marginRight: 6 }]} onPress={handleSaveEdit}>
                  <Text style={styles.addFoodBtnText}>💾 Lưu</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.addFoodBtn, { flex: 1, marginLeft: 6, backgroundColor: COLORS.gray }]} onPress={() => setEditFood(null)}>
                  <Text style={styles.addFoodBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  logoutText: { color: COLORS.red, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: COLORS.white },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  statNum: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  tabScroll: { backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, marginHorizontal: 3 },
  tabBtnActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  tabTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: 12 },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  orderDetail: { fontSize: 13, color: COLORS.dark, marginBottom: 3 },
  assignSection: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  assignLabel: { fontSize: 12, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  distInput: {
    backgroundColor: '#F8F8F8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    fontSize: 13, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 6, width: 100,
  },
  staffBtn: { backgroundColor: COLORS.blue + '15', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  staffBtnText: { fontSize: 13, color: COLORS.blue, fontWeight: '600' },
  staffBtnBusy: { backgroundColor: '#F5F5F5' },
  staffBtnTextBusy: { color: COLORS.gray },
  statusBtns: { flexDirection: 'row', marginTop: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 6, marginTop: 4 },
  actionBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  foodItem: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    marginBottom: 8, elevation: 1, alignItems: 'center',
  },
  foodThumb: { width: 48, height: 48, borderRadius: 8, marginRight: 10, backgroundColor: '#FFF0E8' },
  foodThumbPlaceholder: {
    width: 48, height: 48, borderRadius: 8, marginRight: 10, backgroundColor: '#FFF0E8',
    justifyContent: 'center', alignItems: 'center',
  },
  foodName: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark },
  foodMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  foodActions: { alignItems: 'flex-end' },
  smallBtn: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, marginBottom: 3 },
  imagePickerBtn: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center',
    height: 160, backgroundColor: '#FAFAFA',
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
  imagePickerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  formCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  formInput: {
    backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 10, color: COLORS.dark,
  },
  formRow: { flexDirection: 'row', flexWrap: 'wrap' },
  formLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.dark },
  addFoodBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addFoodBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },

  // Promo styles
  promoCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    marginBottom: 8, elevation: 1, alignItems: 'center',
  },
  promoCodeText: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  promoMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  promoDeleteBtn: { padding: 8 },

  // Event styles
  eventCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    marginBottom: 8, elevation: 1, alignItems: 'center',
  },
  eventCardName: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark },
  eventCardMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  eventFoodItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  eventFoodItemActive: { backgroundColor: '#FFF6F0', borderRadius: 8, paddingHorizontal: 4 },
  eventFoodName: { fontSize: 13, color: COLORS.dark, flex: 1 },
  checkBox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: COLORS.gray,
    marginRight: 10, justifyContent: 'center', alignItems: 'center',
  },
  checkBoxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 20, maxHeight: '85%',
  },
});
