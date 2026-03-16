import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Dimensions, RefreshControl, Image,
} from 'react-native';
import { getDiscountedFoods, getEvents, IMAGE_BASE_URL } from '../api';
import { useCart } from '../CartContext';
import { useAuth } from '../AuthContext';

const { width } = Dimensions.get('window');
const COLORS = {
  primary: '#FF6B35', secondary: '#004E89', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', lightGray: '#E8E8E8', green: '#2ECC71',
  red: '#E74C3C', yellow: '#F39C12',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

function EventCard({ event }) {
  const colors = { flashsale: COLORS.red, hourly: COLORS.yellow, blackfriday: COLORS.dark };
  const labels = { flashsale: '⚡ Flash Sale', hourly: '⏰ Giảm theo giờ', blackfriday: '🏷️ Black Friday' };
  const isHourly = event.type === 'hourly';
  const currentHour = new Date().getHours();
  const isActive = !isHourly || (currentHour >= event.startHour && currentHour < event.endHour);
  return (
    <View style={[styles.eventCard, { backgroundColor: colors[event.type] || COLORS.primary, opacity: isActive ? 1 : 0.5 }]}>  
      <Text style={styles.eventBadge}>-{event.discount}%</Text>
      <Text style={styles.eventName}>{event.name}</Text>
      <Text style={styles.eventType}>
        {labels[event.type] || event.type}
        {isHourly ? ` (${event.startHour}h-${event.endHour}h)` : ''}
      </Text>
      {isHourly && (
        <View style={[styles.activeDot, { backgroundColor: isActive ? COLORS.green : COLORS.gray }]}>
          <Text style={{ color: COLORS.white, fontSize: 8, fontWeight: 'bold' }}>
            {isActive ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      )}
    </View>
  );
}

function FoodCard({ food, onPress, onAddCart }) {
  const hasDiscount = food.discount > 0;
  const discountedPrice = hasDiscount ? food.price * (1 - food.discount / 100) : food.price;
  const EMOJI_MAP = {
    nuoc_uong: '🧋', lau: '🍲', mon_nhau: '🍗', bun_pho: '🍜', com: '🍚', an_vat: '🍢',
  };
  return (
    <TouchableOpacity style={styles.foodCard} onPress={onPress} activeOpacity={0.85}>
      {food.image ? (
        <Image source={{ uri: IMAGE_BASE_URL + food.image }} style={styles.foodImage} />
      ) : (
        <View style={styles.foodImagePlaceholder}>
          <Text style={styles.foodEmoji}>{EMOJI_MAP[food.category] || '🍜'}</Text>
        </View>
      )}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName} numberOfLines={1}>{food.name}</Text>
        <Text style={styles.foodDesc} numberOfLines={2}>{food.description}</Text>
        <View style={styles.priceRow}>
          {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(food.price)}</Text>}
          <Text style={[styles.foodPrice, hasDiscount && { color: COLORS.red }]}>{formatPrice(discountedPrice)}</Text>
        </View>
        {hasDiscount && (
          <View style={styles.saleBadge}><Text style={styles.saleBadgeText}>-{food.discount}%</Text></View>
        )}
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={onAddCart}>
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function HomeTab({ navigation }) {
  const [foods, setFoods] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  const loadData = async () => {
    try {
      const [f, e] = await Promise.all([getDiscountedFoods(), getEvents()]);
      setFoods(f);
      setEvents(e);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.gray }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào {user?.name || ''} 👋</Text>
          <Text style={styles.headerTitle}>Khuyến mãi hôm nay</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {events.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 Sự kiện</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {events.map(event => <EventCard key={event._id} event={event} />)}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ Món đang giảm giá</Text>
          {foods.length === 0 ? (
            <Text style={styles.emptyText}>Hiện chưa có món nào giảm giá</Text>
          ) : (
            foods.map(food => (
              <FoodCard
                key={food._id}
                food={food}
                onPress={() => navigation.navigate('FoodDetail', { food })}
                onAddCart={() => addToCart(food, 1)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  greeting: { color: '#FFD6C0', fontSize: 14 },
  headerTitle: { color: COLORS.white, fontSize: 22, fontWeight: 'bold', marginTop: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  emptyText: { color: COLORS.gray, marginTop: 10, fontSize: 14 },
  eventCard: {
    width: 160, height: 90, borderRadius: 16, marginRight: 12, padding: 14, justifyContent: 'space-between',
  },
  eventBadge: { color: COLORS.white, fontWeight: 'bold', fontSize: 22 },
  eventName: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  eventType: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  activeDot: {
    position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  foodCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, marginTop: 12,
    padding: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  foodImage: { width: 80, height: 80, borderRadius: 12 },
  foodImagePlaceholder: {
    width: 80, height: 80, borderRadius: 12, backgroundColor: '#FFF0E8',
    justifyContent: 'center', alignItems: 'center',
  },
  foodEmoji: { fontSize: 36 },
  foodInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  foodName: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  foodDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  foodPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  oldPrice: { fontSize: 13, color: COLORS.gray, textDecorationLine: 'line-through', marginRight: 6 },
  saleBadge: {
    position: 'absolute', top: -4, right: 0, backgroundColor: COLORS.red,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8,
  },
  saleBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginLeft: 8,
  },
  addBtnText: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
});
