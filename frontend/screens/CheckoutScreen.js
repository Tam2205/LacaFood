import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';
import { createOrder, SHOP_LOCATION } from '../api';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
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

  const deliveryFee = distanceKm > 5 ? Math.round((distanceKm - 5) * 5000) : 0;
  const subtotal = getTotal();
  const total = subtotal + deliveryFee;

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

  const useMyLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Vui lòng cấp quyền vị trí trong cài đặt');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newMarker = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setMarker(newMarker);
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
    setMarker({ lat: latitude, lng: longitude });

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
    if (!address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ giao hàng');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng thêm món vào giỏ hàng');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        user: user?._id,
        items: items.map(i => ({
          food: i.food._id,
          quantity: i.quantity,
          price: i.food.discount > 0 ? i.food.price * (1 - i.food.discount / 100) : i.food.price,
        })),
        total,
        address,
        location: { lat: marker.lat, lng: marker.lng },
        note,
        deliveryDistance: distanceKm,
      };
      const result = await createOrder(orderData);
      clearCart();
      Alert.alert(
        '🎉 Đặt hàng thành công!',
        `Mã đơn: #${result._id?.slice(-6).toUpperCase()}\nTổng: ${formatPrice(total)}\n${deliveryFee > 0 ? `Phí ship: ${formatPrice(deliveryFee)}` : 'Miễn phí ship'}\nKhoảng cách: ${distanceKm} km`,
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
          {items.map(({ food, quantity }) => {
            const price = food.discount > 0 ? food.price * (1 - food.discount / 100) : food.price;
            return (
              <View key={food._id} style={styles.summaryItem}>
                <Text style={styles.summaryName} numberOfLines={1}>{food.name} x{quantity}</Text>
                <Text style={styles.summaryPrice}>{formatPrice(price * quantity)}</Text>
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
              initialRegion={{
                latitude: SHOP_LOCATION.lat,
                longitude: SHOP_LOCATION.lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onPress={onMapPress}
            >
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

          {marker && (
            <View style={styles.distanceBox}>
              <Text style={styles.distanceText}>
                🏍️ Khoảng cách: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{distanceKm} km</Text>
              </Text>
              <Text style={styles.feeNote}>
                {distanceKm <= 5 ? '✅ Miễn phí giao hàng (≤5km)' : `Phí ship: ${formatPrice(deliveryFee)} (${(distanceKm - 5).toFixed(1)}km x 5.000đ)`}
              </Text>
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
            { key: 'bank', label: '🏦 Chuyển khoản ngân hàng' },
            { key: 'momo', label: '📱 Ví MoMo' },
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
          {distanceKm > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Khoảng cách</Text>
              <Text style={styles.priceValue}>{distanceKm} km</Text>
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
            <Text style={styles.placeOrderText}>Đặt hàng — {formatPrice(total)}</Text>
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
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryName: { flex: 1, fontSize: 14, color: COLORS.dark },
  summaryPrice: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
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
  distanceBox: {
    backgroundColor: '#FFF6F0', borderRadius: 10, padding: 10, marginTop: 4,
  },
  distanceText: { fontSize: 14, color: COLORS.dark },
  feeNote: { fontSize: 13, marginTop: 4, color: COLORS.gray },
  mapHint: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 4 },
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
