import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Dimensions,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import io from 'socket.io-client';
import { getOrders, updateOrderStatus, SOCKET_URL, SHOP_LOCATION } from '../api';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
  yellow: '#F39C12', blue: '#3498DB',
};

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', color: COLORS.yellow, icon: '⏳' },
  confirmed: { label: 'Đã xác nhận', color: COLORS.blue, icon: '✅' },
  delivering: { label: 'Đang giao', color: COLORS.primary, icon: '🚀' },
  done: { label: 'Hoàn thành', color: COLORS.green, icon: '🎉' },
  cancelled: { label: 'Đã hủy', color: COLORS.red, icon: '❌' },
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

function OrderMapCard({ order, shipperPos }) {
  const mapRef = useRef(null);
  const hasLocation = order.location?.lat && order.location?.lng;
  const isDelivering = order.status === 'delivering';

  useEffect(() => {
    if (mapRef.current && hasLocation) {
      const coords = [
        { latitude: SHOP_LOCATION.lat, longitude: SHOP_LOCATION.lng },
        { latitude: order.location.lat, longitude: order.location.lng },
      ];
      if (shipperPos) {
        coords.push({ latitude: shipperPos.lat, longitude: shipperPos.lng });
      }
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [shipperPos, hasLocation]);

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const itemNames = (order.items || []).map(i => i.food?.name || 'Món ăn').join(', ');
  const date = new Date(order.createdAt).toLocaleString('vi-VN');

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>#{(order._id || '').slice(-6).toUpperCase()}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.icon} {status.label}</Text>
        </View>
      </View>

      {/* Map for orders with location */}
      {hasLocation && (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: order.location.lat,
              longitude: order.location.lng,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            {/* Shop */}
            <Marker
              coordinate={{ latitude: SHOP_LOCATION.lat, longitude: SHOP_LOCATION.lng }}
              title="🏪 La cà Food"
              pinColor="blue"
            />
            {/* Customer */}
            <Marker
              coordinate={{ latitude: order.location.lat, longitude: order.location.lng }}
              title="📍 Giao hàng"
              description={order.address}
              pinColor="red"
            />
            {/* Shipper realtime */}
            {isDelivering && shipperPos && (
              <Marker
                coordinate={{ latitude: shipperPos.lat, longitude: shipperPos.lng }}
                title="🏍️ Shipper"
                pinColor="green"
              />
            )}
            {/* Route line */}
            {isDelivering && shipperPos && (
              <Polyline
                coordinates={[
                  { latitude: shipperPos.lat, longitude: shipperPos.lng },
                  { latitude: order.location.lat, longitude: order.location.lng },
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            )}
          </MapView>
          {isDelivering && (
            <View style={styles.trackingBadge}>
              <Text style={styles.trackingText}>
                {shipperPos ? '🏍️ Đang theo dõi shipper...' : '⏳ Chờ shipper cập nhật vị trí...'}
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.orderItems} numberOfLines={2}>{itemNames || 'Đơn hàng'}</Text>
      <Text style={styles.orderDate}>{date}</Text>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.totalLabel}>Tổng tiền</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total || 0)}</Text>
        </View>
        <View style={styles.deliveryInfo}>
          {order.deliveryDistance > 0 && (
            <Text style={styles.deliveryText}>📍 {order.deliveryDistance} km</Text>
          )}
          {order.deliveryFee > 0 && (
            <Text style={styles.feeText}>Phí ship: {formatPrice(order.deliveryFee)}</Text>
          )}
          {order.deliveryFee === 0 && order.deliveryDistance <= 5 && (
            <Text style={[styles.feeText, { color: COLORS.green }]}>Miễn phí ship</Text>
          )}
        </View>
      </View>

      {order.shipper && (
        <View style={styles.shipperInfo}>
          <Text style={styles.shipperLabel}>🏍️ Người giao hàng</Text>
          <Text style={styles.shipperName}>{order.shipper.name} - {order.shipper.phone}</Text>
        </View>
      )}

      {order.status === 'delivering' && !hasLocation && (
        <View style={styles.progressBar}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>Đang trên đường đến bạn...</Text>
        </View>
      )}
    </View>
  );
}

export default function DeliveryTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipperPositions, setShipperPositions] = useState({});
  const { user } = useAuth();
  const socketRef = useRef(null);

  const loadOrders = async () => {
    try {
      const data = await getOrders(user?.role === 'staff' ? undefined : user?._id, user?.role === 'staff' ? user?._id : undefined);
      setOrders(data);
      return data;
    } catch {}
    setLoading(false);
    setRefreshing(false);
    return [];
  };

  // Socket.IO connection for realtime tracking
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected for tracking');
    });

    // Listen for shipper location updates
    socket.on('shipperLocationUpdate', ({ orderId, lat, lng }) => {
      setShipperPositions(prev => ({ ...prev, [orderId]: { lat, lng } }));
    });

    // Listen for order status updates
    socket.on('orderStatusUpdate', ({ orderId, status }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Subscribe to track active delivering orders
  useEffect(() => {
    const deliveringOrders = orders.filter(o => o.status === 'delivering');
    if (socketRef.current && deliveringOrders.length > 0) {
      deliveringOrders.forEach(order => {
        socketRef.current.emit('trackOrder', order._id);
      });
    }
  }, [orders]);

  useEffect(() => {
    loadOrders().then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'delivering'].includes(o.status));
  const pastOrders = orders.filter(o => ['done', 'cancelled'].includes(o.status));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚀 Đơn hàng của bạn</Text>
        <Text style={styles.headerSub}>Theo dõi đơn hàng và vị trí giao hàng</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders().then(() => setRefreshing(false)); }} colors={[COLORS.primary]} />}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtext}>Hãy đặt món ngon từ thực đơn nhé!</Text>
          </View>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>📦 Đang xử lý ({activeOrders.length})</Text>
                {activeOrders.map(o => (
                  <OrderMapCard
                    key={o._id}
                    order={o}
                    shipperPos={shipperPositions[o._id]}
                  />
                ))}
              </>
            )}
            {pastOrders.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📋 Lịch sử ({pastOrders.length})</Text>
                {pastOrders.map(o => (
                  <OrderMapCard
                    key={o._id}
                    order={o}
                    shipperPos={null}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginTop: 16, marginBottom: 8 },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  map: { flex: 1 },
  trackingBadge: {
    position: 'absolute', bottom: 8, left: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10,
  },
  trackingText: { color: COLORS.white, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  orderItems: { fontSize: 14, color: COLORS.dark, marginBottom: 4 },
  orderDate: { fontSize: 12, color: COLORS.gray },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  totalLabel: { fontSize: 12, color: COLORS.gray },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  deliveryInfo: { alignItems: 'flex-end' },
  deliveryText: { fontSize: 12, color: COLORS.dark },
  feeText: { fontSize: 12, color: COLORS.red, fontWeight: '600' },
  shipperInfo: {
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  shipperLabel: { fontSize: 12, color: COLORS.gray, marginBottom: 2 },
  shipperName: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  progressBar: { marginTop: 12 },
  progressTrack: { height: 6, backgroundColor: '#E8E8E8', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { fontSize: 11, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
});
