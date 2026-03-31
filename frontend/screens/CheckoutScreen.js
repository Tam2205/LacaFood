import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform, Image, Linking,
} from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { createOrder, validatePromoCode, SHOP_LOCATION } from '../api';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
};

const MAX_DELIVERY_KM = 30;
const VN_BOUNDS = {
  minLat: 8,
  maxLat: 24,
  minLng: 102,
  maxLng: 110,
};
const BANK_INFO = {
  bankName: 'Vietcombank',
  accountNumber: '0123456789',
  accountName: 'LACA FOOD',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

// Haversine formula - tính khoảng cách giữa 2 tọa độ (km)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CheckoutScreen({ navigation }) {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const mapRef = useRef(null);
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [payMethod, setPayMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [marker, setMarker] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [mapRegion, setMapRegion] = useState({
    latitude: SHOP_LOCATION.lat,
    longitude: SHOP_LOCATION.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [qrConfirmed, setQrConfirmed] = useState(false);

  const deliveryFee = distanceKm > 5 ? Math.round((distanceKm - 5) * 5000) : 0;
  const subtotal = getTotal();
  const promoDiscount = promoResult?.discountAmount || 0;
  const total = Math.max(0, subtotal - promoDiscount) + deliveryFee;

  // Delivery time estimation
  const estimatedMinutes = distanceKm > 0 ? Math.max(15, Math.round(distanceKm * 3 + 10)) : 0;
  const paymentRef = `LACA${String(user?._id || '').slice(-4).toUpperCase()}${Date.now().toString().slice(-6)}`;
  const qrPayload = `BANK:${BANK_INFO.bankName};ACC:${BANK_INFO.accountNumber};NAME:${BANK_INFO.accountName};AMOUNT:${Math.round(total)};CONTENT:${paymentRef}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(qrPayload)}`;

  // Auto-calculate distance when marker changes
  useEffect(() => {
    if (marker) {
      const dist = haversineDistance(
        SHOP_LOCATION.lat, SHOP_LOCATION.lng,
        marker.lat, marker.lng
      );
      setDistanceKm(Math.round(dist * 10) / 10);
    }
  }, [marker]);

  useEffect(() => {
    if (payMethod !== 'qr' && qrConfirmed) {
      setQrConfirmed(false);
    }
  }, [payMethod, qrConfirmed]);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const result = await validatePromoCode(promoInput.trim(), subtotal);
      if (result.valid) {
        setPromoResult(result);
        Alert.alert('🎉 Áp dụng thành công', `Giảm ${result.discountPercent}% (-${formatPrice(result.discountAmount)})`);
      } else {
        setPromoResult(null);
        Alert.alert('❌ Lỗi', result.message || 'Mã không hợp lệ');
      }
    } catch {
      setPromoResult(null);
      Alert.alert('❌ Lỗi', 'Mã không hợp lệ hoặc đã hết hạn');
    }
    setPromoLoading(false);
  };

  const isInVietnamBounds = (lat, lng) => (
    lat >= VN_BOUNDS.minLat && lat <= VN_BOUNDS.maxLat && lng >= VN_BOUNDS.minLng && lng <= VN_BOUNDS.maxLng
  );

  const resetMapToShop = () => {
    const region = {
      latitude: SHOP_LOCATION.lat,
      longitude: SHOP_LOCATION.lng,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setMapRegion(region);
    mapRef.current?.animateToRegion(region, 500);
  };

  const openExternalMap = async () => {
    const target = marker || SHOP_LOCATION;
    const url = `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Loi', 'Khong mo duoc ban do ngoai.');
    }
  };

  const useMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Vui lòng cấp quyền vị trí trong cài đặt');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newMarker = { lat: loc.coords.latitude, lng: loc.coords.longitude };

      const dist = haversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, newMarker.lat, newMarker.lng);
      if (dist > MAX_DELIVERY_KM) {
        Alert.alert(
          'Vị trí hiện tại quá xa',
          `Thiết bị đang ở cách quán ${Math.round(dist * 10) / 10} km. Vui lòng nhấn trên bản đồ để chọn vị trí giao gần quán (<= ${MAX_DELIVERY_KM} km).`
        );
        return;
      }
      if (!isInVietnamBounds(newMarker.lat, newMarker.lng)) {
        Alert.alert('Vi tri bat thuong', 'Vi tri hien tai dang o ngoai Viet Nam. Vui long chon thu cong tren ban do.');
        return;
      }

      setMarker(newMarker);
      setMapRegion({
        latitude: newMarker.lat,
        longitude: newMarker.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      mapRef.current?.animateToRegion({
        latitude: newMarker.lat,
        longitude: newMarker.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);

      // Reverse geocode to get address
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: newMarker.lat,
        longitude: newMarker.lng,
      });
      if (geo) {
        const parts = [geo.name, geo.street, geo.district, geo.city].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại');
    }
  };

  const onMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!isInVietnamBounds(latitude, longitude)) {
      Alert.alert('Ngoai khu vuc ho tro', 'Vui long chon diem giao hang trong khu vuc Viet Nam.');
      resetMapToShop();
      return;
    }
    const dist = haversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, latitude, longitude);
    if (dist > MAX_DELIVERY_KM) {
      Alert.alert('Ngoài phạm vi giao hàng', `Vị trí này cách quán ${Math.round(dist * 10) / 10} km, vượt quá ${MAX_DELIVERY_KM} km.`);
      return;
    }
    setMarker({ lat: latitude, lng: longitude });
    setMapRegion(prev => ({
      ...prev,
      latitude,
      longitude,
    }));

    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo) {
        const parts = [geo.name, geo.street, geo.district, geo.city].filter(Boolean);
        setAddress(parts.join(', '));
      }
    } catch {}
  };

  const handleCheckout = async () => {
    if (!marker) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn vị trí giao hàng trên bản đồ');
      return;
    }
    if (distanceKm > MAX_DELIVERY_KM) {
      Alert.alert('Ngoài phạm vi giao hàng', `Hiện chỉ hỗ trợ đơn trong phạm vi ${MAX_DELIVERY_KM} km từ quán.`);
      return;
    }
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm món vào giỏ hàng');
      return;
    }
    if (payMethod === 'qr' && !qrConfirmed) {
      Alert.alert('Chưa xác nhận thanh toán', 'Vui lòng quét QR và bật xác nhận đã chuyển khoản.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        user: user?._id,
        items: items.map(i => {
          const basePrice = i.food.discount > 0 ? i.food.price * (1 - i.food.discount / 100) : i.food.price;
          return {
            food: i.food._id,
            quantity: i.quantity,
            price: basePrice + (i.optionsExtra || 0),
            selectedOptions: i.selectedOptions || [],
          };
        }),
        total: subtotal,
        address,
        location: { lat: marker.lat, lng: marker.lng },
        note,
        deliveryDistance: distanceKm,
        promoCode: promoResult?.code || undefined,
        payMethod,
        paymentStatus: payMethod === 'qr' ? 'paid' : 'pending',
        paymentRef: payMethod === 'qr' ? paymentRef : undefined,
      };
      const result = await createOrder(orderData);
      clearCart();
      Alert.alert(
        '🎉 Đặt hàng thành công!',
        `Mã đơn: #${(result._id || '').slice(-6).toUpperCase()}\nTổng: ${formatPrice(result.total || total)}\n${deliveryFee > 0 ? `Phí ship: ${formatPrice(deliveryFee)}` : 'Miễn phí ship'}\nKhoảng cách: ${distanceKm} km\nThời gian giao: ~${estimatedMinutes} phút\nThanh toán: ${payMethod === 'qr' ? 'QR (đã xác nhận)' : 'COD'}`,
        [{ text: 'OK', onPress: () => navigation.navigate('CustomerTabs') }]
      );
    } catch {
      Alert.alert('Lỗi', 'Không thể đặt hàng. Vui lòng thử lại!');
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={styles.title}>📝 Thanh toán</Text>

        {/* Order summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đơn hàng ({items.length} món)</Text>
          {items.map(({ food, quantity, selectedOptions, optionsExtra, cartKey }) => {
            const basePrice = food.discount > 0 ? food.price * (1 - food.discount / 100) : food.price;
            const unitPrice = basePrice + (optionsExtra || 0);
            return (
              <View key={cartKey} style={styles.summaryItemWrap}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryName} numberOfLines={1}>{food.name} x{quantity}</Text>
                  <Text style={styles.summaryPrice}>{formatPrice(unitPrice * quantity)}</Text>
                </View>
                {selectedOptions && selectedOptions.length > 0 && (
                  <Text style={styles.summaryOptions}>
                    {selectedOptions.map(o => o.choiceName + (o.extraPrice > 0 ? ` (+${formatPrice(o.extraPrice)})` : '')).join(', ')}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Map picker */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Chọn vị trí giao hàng</Text>
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              mapType="standard"
              region={mapRegion}
              onRegionChangeComplete={(region) => {
                if (!isInVietnamBounds(region.latitude, region.longitude)) {
                  resetMapToShop();
                } else {
                  setMapRegion(region);
                }
              }}
              onPress={onMapPress}
            >
              {/* OpenStreetMap tiles - no API key needed */}
              <UrlTile
                urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                tileSize={256}
                flipY={false}
              />
              {/* Shop marker */}
              <Marker
                coordinate={{ latitude: SHOP_LOCATION.lat, longitude: SHOP_LOCATION.lng }}
                title="🏪 La cà Food"
                description="Vị trí quán"
                pinColor="blue"
              />
              {/* Delivery marker */}
              {marker && (
                <Marker
                  coordinate={{ latitude: marker.lat, longitude: marker.lng }}
                  title="📍 Giao hàng tại đây"
                  description={`Cách quán ${distanceKm} km`}
                  pinColor="red"
                  draggable
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setMarker({ lat: latitude, lng: longitude });
                  }}
                />
              )}
            </MapView>
          </View>

          <TouchableOpacity style={styles.locationBtn} onPress={useMyLocation} activeOpacity={0.8}>
            <Text style={styles.locationBtnText}>📌 Dùng vị trí hiện tại</Text>
          </TouchableOpacity>
          <View style={styles.mapBtnRow}>
            <TouchableOpacity style={[styles.locationBtn, styles.mapSmallBtn]} onPress={resetMapToShop} activeOpacity={0.8}>
              <Text style={styles.locationBtnText}>🏪 Ve vi tri quan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.locationBtn, styles.mapSmallBtn]} onPress={openExternalMap} activeOpacity={0.8}>
              <Text style={styles.locationBtnText}>🗺️ Mo ban do ngoai</Text>
            </TouchableOpacity>
          </View>

          {marker && (
            <View style={styles.distanceBox}>
              <Text style={styles.distanceText}>
                🏍️ Khoảng cách: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{distanceKm} km</Text>
              </Text>
              <Text style={styles.feeNote}>
                {distanceKm <= 5 ? '✅ Miễn phí giao hàng (≤5km)' : `Phí ship: ${formatPrice(deliveryFee)} (${(distanceKm - 5).toFixed(1)}km x 5.000đ)`}
              </Text>
              {estimatedMinutes > 0 && (
                <Text style={styles.deliveryTimeText}>
                  🕐 Thời gian giao dự kiến: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>~{estimatedMinutes} phút</Text>
                </Text>
              )}
              {distanceKm > MAX_DELIVERY_KM && (
                <Text style={[styles.deliveryTimeText, { color: COLORS.red }]}>⚠️ Ngoài phạm vi giao hàng {MAX_DELIVERY_KM} km</Text>
              )}
            </View>
          )}

          {!marker && (
            <Text style={styles.mapHint}>👆 Nhấn vào bản đồ để chọn vị trí giao hàng</Text>
          )}
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏠 Địa chỉ chi tiết</Text>
          <TextInput
            style={styles.input}
            placeholder="Số nhà, tên đường, phường..."
            value={address}
            onChangeText={setAddress}
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Promo Code */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎫 Mã khuyến mãi</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
              placeholder="Nhập mã khuyến mãi..."
              value={promoInput}
              onChangeText={setPromoInput}
              autoCapitalize="characters"
              placeholderTextColor={COLORS.gray}
            />
            <TouchableOpacity
              style={[styles.promoBtn, promoLoading && { opacity: 0.6 }]}
              onPress={handleApplyPromo}
              disabled={promoLoading}
            >
              {promoLoading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.promoBtnText}>Áp dụng</Text>
              )}
            </TouchableOpacity>
          </View>
          {promoResult && (
            <View style={styles.promoSuccess}>
              <Text style={styles.promoSuccessText}>
                ✅ Mã {promoResult.code} - Giảm {promoResult.discountPercent}% (-{formatPrice(promoResult.discountAmount)})
              </Text>
              <TouchableOpacity onPress={() => { setPromoResult(null); setPromoInput(''); }}>
                <Text style={{ color: COLORS.red, fontSize: 13 }}>Hủy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💬 Ghi chú</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            placeholder="Ghi chú cho quán (tùy chọn)"
            value={note}
            onChangeText={setNote}
            multiline
            placeholderTextColor={COLORS.gray}
          />
        </View>

        {/* Payment method */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💳 Phương thức thanh toán</Text>
          {[
            { key: 'cod', label: '💵 Tiền mặt khi nhận hàng (COD)' },
            { key: 'qr', label: '📷 Quét mã QR chuyển khoản' },
          ].map(method => (
            <TouchableOpacity
              key={method.key}
              style={[styles.payOption, payMethod === method.key && styles.payOptionActive]}
              onPress={() => setPayMethod(method.key)}
            >
              <View style={[styles.radio, payMethod === method.key && styles.radioActive]} />
              <Text style={[styles.payLabel, payMethod === method.key && { color: COLORS.primary, fontWeight: '600' }]}>{method.label}</Text>
            </TouchableOpacity>
          ))}

          {payMethod === 'qr' && (
            <View style={styles.qrCard}>
              <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} />
              <Text style={styles.qrLine}>Ngân hàng: {BANK_INFO.bankName}</Text>
              <Text style={styles.qrLine}>Số TK: {BANK_INFO.accountNumber}</Text>
              <Text style={styles.qrLine}>Chủ TK: {BANK_INFO.accountName}</Text>
              <Text style={styles.qrLine}>Số tiền: {formatPrice(total)}</Text>
              <Text style={styles.qrLine}>Nội dung CK: {paymentRef}</Text>

              <TouchableOpacity
                style={[styles.confirmQrBtn, qrConfirmed && styles.confirmQrBtnActive]}
                onPress={() => setQrConfirmed(v => !v)}
              >
                <Text style={[styles.confirmQrText, qrConfirmed && styles.confirmQrTextActive]}>
                  {qrConfirmed ? '✅ Da xac nhan da chuyen khoan' : '☑️ Toi da quet QR va chuyen khoan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Price summary */}
        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tạm tính</Text>
            <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Phí giao hàng</Text>
            <Text style={[styles.priceValue, deliveryFee === 0 && { color: COLORS.green }]}>
              {deliveryFee === 0 ? 'Miễn phí' : formatPrice(deliveryFee)}
            </Text>
          </View>
          {promoDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Khuyến mãi ({promoResult?.code})</Text>
              <Text style={[styles.priceValue, { color: COLORS.green }]}>-{formatPrice(promoDiscount)}</Text>
            </View>
          )}
          {distanceKm > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Khoảng cách</Text>
              <Text style={styles.priceValue}>{distanceKm} km</Text>
            </View>
          )}
          {estimatedMinutes > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Thời gian giao dự kiến</Text>
              <Text style={[styles.priceValue, { color: COLORS.primary }]}>~{estimatedMinutes} phút</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.placeOrderBtn, loading && { opacity: 0.6 }]}
          onPress={handleCheckout}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.placeOrderText}>{payMethod === 'qr' ? `Xác nhận đặt đơn QR — ${formatPrice(total)}` : `Đặt hàng — ${formatPrice(total)}`}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.dark, marginBottom: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  summaryItemWrap: { marginBottom: 4 },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryName: { flex: 1, fontSize: 14, color: COLORS.dark },
  summaryPrice: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  summaryOptions: { fontSize: 12, color: COLORS.gray, marginLeft: 4, marginBottom: 4 },
  input: {
    backgroundColor: '#F8F8F8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: COLORS.dark, borderWidth: 1, borderColor: '#E8E8E8',
  },
  mapContainer: { height: 250, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  map: { flex: 1 },
  locationBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginBottom: 8,
  },
  locationBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  mapBtnRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  mapSmallBtn: { flex: 1, marginBottom: 0 },
  distanceBox: {
    backgroundColor: '#FFF6F0', borderRadius: 10, padding: 10, marginTop: 4,
  },
  distanceText: { fontSize: 14, color: COLORS.dark },
  feeNote: { fontSize: 13, marginTop: 4, color: COLORS.gray },
  deliveryTimeText: { fontSize: 13, marginTop: 4, color: COLORS.dark },
  mapHint: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 4 },

  // Promo code styles
  promoRow: { flexDirection: 'row', alignItems: 'center' },
  promoBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 16,
    paddingVertical: 11, justifyContent: 'center', alignItems: 'center',
  },
  promoBtnText: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  promoSuccess: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#E8F8E8', borderRadius: 8, padding: 10, marginTop: 8,
  },
  promoSuccessText: { fontSize: 13, color: COLORS.green, flex: 1 },

  payOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  payOptionActive: { backgroundColor: '#FFF6F0', borderRadius: 8 },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.gray,
    marginRight: 12, marginLeft: 4,
  },
  radioActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  payLabel: { fontSize: 14, color: COLORS.dark },
  qrCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFBF8',
  },
  qrTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  qrImage: { width: 220, height: 220, alignSelf: 'center', marginBottom: 10, borderRadius: 8 },
  qrLine: { fontSize: 13, color: COLORS.dark, marginBottom: 3 },
  confirmQrBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  confirmQrBtnActive: { backgroundColor: '#E9F9EE', borderColor: COLORS.green },
  confirmQrText: { color: COLORS.primary, textAlign: 'center', fontWeight: '600', fontSize: 13 },
  confirmQrTextActive: { color: COLORS.green },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontSize: 14, color: COLORS.gray },
  priceValue: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E8E8E8', marginTop: 8, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E8E8E8',
    elevation: 8,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary, height: 54, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  placeOrderText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
});
