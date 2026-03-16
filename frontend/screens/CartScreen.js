import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useCart } from '../CartContext';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', red: '#E74C3C', green: '#2ECC71',
};

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

const EMOJI_MAP = {
  nuoc_uong: '🧋', lau: '🍲', mon_nhau: '🍗', bun_pho: '🍜', com: '🍚', an_vat: '🍢',
};

export default function CartScreen({ navigation }) {
  const { items, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyText}>Giỏ hàng trống</Text>
        <Text style={styles.emptySubtext}>Thêm món ngon vào giỏ hàng nhé!</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.shopBtnText}>Xem thực đơn</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>🛒 Giỏ hàng ({items.length} món)</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert('Xóa giỏ hàng', 'Bạn muốn xóa tất cả món?', [
              { text: 'Hủy' },
              { text: 'Xóa', onPress: clearCart, style: 'destructive' },
            ]);
          }}>
            <Text style={styles.clearText}>Xóa tất cả</Text>
          </TouchableOpacity>
        </View>

        {items.map(({ food, quantity }) => {
          const hasDiscount = food.discount > 0;
          const unitPrice = hasDiscount ? food.price * (1 - food.discount / 100) : food.price;
          return (
            <View key={food._id} style={styles.cartItem}>
              <View style={styles.itemEmoji}>
                <Text style={{ fontSize: 32 }}>{EMOJI_MAP[food.category] || '🍜'}</Text>
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{food.name}</Text>
                <View style={styles.priceRow}>
                  {hasDiscount && <Text style={styles.oldPrice}>{formatPrice(food.price)}</Text>}
                  <Text style={[styles.itemPrice, hasDiscount && { color: COLORS.red }]}>{formatPrice(unitPrice)}</Text>
                </View>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(food._id, quantity - 1)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(food._id, quantity + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(food._id)}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom checkout bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatPrice(getTotal())}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>Thanh toán →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, padding: 20 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  shopBtn: { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark },
  clearText: { fontSize: 14, color: COLORS.red },
  cartItem: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: 16, padding: 12,
    marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, alignItems: 'center',
  },
  itemEmoji: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#FFF0E8',
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: COLORS.dark },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  oldPrice: { fontSize: 12, color: COLORS.gray, textDecorationLine: 'line-through', marginRight: 6 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginHorizontal: 8 },
  removeBtn: { marginLeft: 8, padding: 4 },
  removeBtnText: { fontSize: 16, color: COLORS.red },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#E8E8E8',
    elevation: 8,
  },
  totalLabel: { fontSize: 12, color: COLORS.gray },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  checkoutBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  checkoutBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
