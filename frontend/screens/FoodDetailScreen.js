import React, { useState } from 'react';
import {
  View, Text, Alert, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image,
} from 'react-native';
import { useCart } from '../CartContext';
import { IMAGE_BASE_URL } from '../api';

const COLORS = {
  primary: '#FF6B35',
  bg: '#F5F5F5',
  white: '#FFFFFF',
  dark: '#1A1A2E',
  gray: '#888',
  green: '#2ECC71',
  red: '#E74C3C',
};

const EMOJI_MAP = {
  nuoc_uong: '🧋', lau: '🍲', mon_nhau: '🍗', bun_pho: '🍜', com: '🍚', an_vat: '🍢',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

export default function FoodDetailScreen({ route, navigation }) {
  const { food } = route.params;
  const [quantity, setQuantity] = useState(1);
  const { addToCart, getItemCount } = useCart();

  const hasDiscount = food.discount > 0;
  const discountedPrice = hasDiscount ? food.price * (1 - food.discount / 100) : food.price;

  const handleAddToCart = () => {
    addToCart(food, quantity);
    Alert.alert('🛒 Đã thêm vào giỏ', `${food.name} x${quantity}`, [
      { text: 'Tiếp tục mua', onPress: () => navigation.goBack() },
      { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart') },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Hero image area */}
      <View style={styles.heroSection}>
        {food.image ? (
          <Image source={{ uri: IMAGE_BASE_URL + food.image }} style={styles.heroImage} />
        ) : (
          <Text style={styles.heroEmoji}>{EMOJI_MAP[food.category] || '🍜'}</Text>
        )}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{food.discount}%</Text>
          </View>
        )}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Name & Price */}
        <View style={styles.titleRow}>
          <Text style={styles.foodName}>{food.name}</Text>
          <View>
            {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(food.price)}</Text>}
            <Text style={styles.price}>{formatPrice(discountedPrice)}</Text>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.tagRow}>
          {food.category ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{EMOJI_MAP[food.category] || ''} {food.category}</Text>
            </View>
          ) : null}
          {food.isFlashSale ? (
            <View style={[styles.tag, { backgroundColor: '#FFE8E8' }]}>
              <Text style={[styles.tagText, { color: COLORS.red }]}>⚡ Flash Sale</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{food.description || 'Món ăn ngon từ La cà Food, được chế biến với nguyên liệu tươi ngon nhất.'}</Text>
        </View>

        {/* Delivery info */}
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryIcon}>📍</Text>
            <View>
              <Text style={styles.deliveryLabel}>Phí ship ≤5km</Text>
              <Text style={styles.deliveryValue}>Miễn phí</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.deliveryItem}>
            <Text style={styles.deliveryIcon}>🕐</Text>
            <View>
              <Text style={styles.deliveryLabel}>Thời gian giao</Text>
              <Text style={styles.deliveryValue}>~15-30 phút</Text>
            </View>
          </View>
        </View>

        {/* Quantity selector */}
        <View style={styles.qtySection}>
          <Text style={styles.sectionTitle}>Số lượng</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.cartBadgeBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {getItemCount() > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{getItemCount()}</Text></View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.orderBtn} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={styles.orderBtnText}>Thêm vào giỏ — {formatPrice(discountedPrice * quantity)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  heroSection: {
    height: 220,
    backgroundColor: '#FFF0E8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroEmoji: { fontSize: 80 },
  discountBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },

  content: { flex: 1, padding: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  foodName: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark, flex: 1, marginRight: 12 },
  price: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, textAlign: 'right' },
  oldPrice: { fontSize: 14, color: COLORS.gray, textDecorationLine: 'line-through', textAlign: 'right' },

  tagRow: { flexDirection: 'row', marginTop: 12 },
  tag: { backgroundColor: '#EEF4FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
  tagText: { fontSize: 12, color: '#004E89' },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: 6 },
  description: { fontSize: 14, color: COLORS.gray, lineHeight: 22 },

  deliveryCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  deliveryIcon: { fontSize: 28, marginRight: 10 },
  deliveryLabel: { fontSize: 11, color: COLORS.gray },
  deliveryValue: { fontSize: 15, fontWeight: 'bold', color: COLORS.dark },
  divider: { width: 1, backgroundColor: '#E8E8E8', marginHorizontal: 8 },

  successBox: {
    backgroundColor: '#E8F8F0',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  successText: { color: COLORS.green, fontWeight: '600', fontSize: 15 },

  qtySection: { marginTop: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  qtyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginHorizontal: 20 },

  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    alignItems: 'center',
  },
  cartBadgeBtn: { position: 'relative', marginRight: 12, padding: 8 },
  cartIcon: { fontSize: 28 },
  badge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.red,
    width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
  orderBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
});
