import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, ActivityIndicator, RefreshControl, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getFoods, getAllOrders, getStats, getStaff, assignShipper, updateOrderStatus, addFood, updateFood, IMAGE_BASE_URL } from '../api';
import { useAuth } from '../AuthContext';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
  yellow: '#F39C12', blue: '#3498DB',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

const STATUS_MAP = {
  pending: { label: 'Chờ', color: COLORS.yellow },
  confirmed: { label: 'Xác nhận', color: COLORS.blue },
  delivering: { label: 'Đang giao', color: COLORS.primary },
  done: { label: 'Hoàn thành', color: COLORS.green },
  cancelled: { label: 'Hủy', color: COLORS.red },
};

export default function AdminScreen({ navigation }) {
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [foods, setFoods] = useState([]);
  const [stats, setStats] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { logout } = useAuth();

  // Add food form
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState('com');
  const [newImage, setNewImage] = useState(null);

  // Assign shipper
  const [distanceInputs, setDistanceInputs] = useState({});

  const loadData = useCallback(async () => {
    try {
      const [o, f, s, st] = await Promise.all([getAllOrders(), getFoods(), getStats(), getStaff()]);
      setOrders(o);
      setFoods(f);
      setStats(s);
      setStaffList(st);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAssignShipper = async (orderId, shipperId) => {
    const dist = parseFloat(distanceInputs[orderId]) || 3;
    try {
      await assignShipper(orderId, shipperId, dist);
      Alert.alert('Thành công', 'Đã chỉ định người giao hàng');
      loadData();
    } catch {
      Alert.alert('Lỗi', 'Không thể chỉ định');
    }
  };

  const handleStatusChange = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      loadData();
    } catch { Alert.alert('Lỗi', 'Không cập nhật được'); }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setNewImage(result.assets[0]);
    }
  };

  const handleAddFood = async () => {
    if (!newName.trim() || !newPrice) {
      Alert.alert('Lỗi', 'Nhập đủ tên và giá'); return;
    }
    try {
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('price', newPrice);
      formData.append('description', newDesc);
      formData.append('category', newCat);
      if (newImage) {
        const uri = newImage.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('image', { uri, name: `food_${Date.now()}.${ext}`, type: `image/${ext}` });
      }
      await addFood(formData);
      Alert.alert('Thành công', 'Đã thêm món');
      setNewName(''); setNewPrice(''); setNewDesc(''); setNewImage(null);
      loadData();
    } catch { Alert.alert('Lỗi', 'Không thể thêm'); }
  };

  const handleSetDiscount = async (foodId) => {
    Alert.prompt ? Alert.prompt('Giảm giá', 'Nhập % giảm giá (0 = hủy giảm)', async (val) => {
      const d = parseInt(val) || 0;
      await updateFood(foodId, { discount: d, isFlashSale: d > 0, eventType: d > 0 ? 'flashsale' : 'none' });
      loadData();
    }) : (() => {
      // Android fallback - just toggle between 0 and 20
      const food = foods.find(f => f._id === foodId);
      const newDiscount = food?.discount > 0 ? 0 : 20;
      updateFood(foodId, { discount: newDiscount, isFlashSale: newDiscount > 0, eventType: newDiscount > 0 ? 'flashsale' : 'none' })
        .then(() => { Alert.alert('OK', newDiscount > 0 ? 'Đã giảm 20%' : 'Đã hủy giảm giá'); loadData(); });
    })();
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
          <View style={styles.statBox}><Text style={styles.statNum}>{formatPrice(stats.totalRevenue)}</Text><Text style={styles.statLabel}>Doanh thu</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{stats.totalFoods}</Text><Text style={styles.statLabel}>Món ăn</Text></View>
          <View style={styles.statBox}><Text style={styles.statNum}>{stats.totalShippers}</Text><Text style={styles.statLabel}>Shipper</Text></View>
        </View>
      )}

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {['orders', 'foods', 'addFood'].map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'orders' ? '📦 Đơn hàng' : t === 'foods' ? '🍽️ Thực đơn' : '➕ Thêm món'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
      >
        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <>
            <Text style={styles.sectionTitle}>Đơn hàng ({orders.length})</Text>
            {orders.map(order => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.pending;
              const itemNames = (order.items || []).map(i => `${i.food?.name} x${i.quantity}`).join(', ');
              return (
                <View key={order._id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderId}>#{order._id?.slice(-6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '20' }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderDetail}>👤 {order.user?.name || 'Khách'} - {order.user?.phone || ''}</Text>
                  <Text style={styles.orderDetail}>📍 {order.address || 'N/A'}</Text>
                  <Text style={styles.orderDetail} numberOfLines={2}>🍽️ {itemNames || 'N/A'}</Text>
                  <Text style={styles.orderDetail}>💰 {formatPrice(order.total || 0)} {order.deliveryFee > 0 ? `(ship: ${formatPrice(order.deliveryFee)})` : ''}</Text>
                  {order.shipper && <Text style={styles.orderDetail}>🏍️ {order.shipper.name} - {order.shipper.phone}</Text>}

                  {/* Assign shipper */}
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
                      {staffList.map(s => (
                        <TouchableOpacity key={s._id} style={styles.staffBtn} onPress={() => handleAssignShipper(order._id, s._id)}>
                          <Text style={styles.staffBtnText}>📌 {s.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Status buttons */}
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
                  <View style={styles.foodThumbPlaceholder}>
                    <Text style={{ fontSize: 20 }}>🍽️</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMeta}>{formatPrice(food.price)} • {food.category} {food.discount > 0 ? `• -${food.discount}%` : ''}</Text>
                </View>
                <TouchableOpacity style={styles.discountBtn} onPress={() => handleSetDiscount(food._id)}>
                  <Text style={styles.discountBtnText}>{food.discount > 0 ? '🔴 Hủy KM' : '🟢 Giảm giá'}</Text>
                </TouchableOpacity>
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

            {/* Image picker */}
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 6 }}>Hình ảnh:</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
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
              {[
                { key: 'nuoc_uong', l: '🧋 Nước uống' }, { key: 'lau', l: '🍲 Lẩu' },
                { key: 'mon_nhau', l: '🍗 Món nhậu' }, { key: 'bun_pho', l: '🍜 Bún/Phở' },
                { key: 'com', l: '🍚 Cơm' }, { key: 'an_vat', l: '🍢 Ăn vặt' },
              ].map(c => (
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
      </ScrollView>
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
  statNum: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', marginHorizontal: 4 },
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
  statusBtns: { flexDirection: 'row', marginTop: 8, gap: 6, flexWrap: 'wrap' },
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
  imagePickerBtn: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 12, alignItems: 'center', justifyContent: 'center',
    height: 160, backgroundColor: '#FAFAFA',
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
  imagePickerPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  discountBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8F8F8' },
  discountBtnText: { fontSize: 11, fontWeight: '600' },
  formCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  formInput: {
    backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, borderWidth: 1, borderColor: '#E8E8E8', marginBottom: 10, color: COLORS.dark,
  },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 8 },
  catChipActive: { backgroundColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.dark },
  addFoodBtn: { backgroundColor: COLORS.primary, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  addFoodBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
