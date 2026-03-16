import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions, RefreshControl, TextInput, Image,
} from 'react-native';
import { getFoods, IMAGE_BASE_URL } from '../api';
import { useCart } from '../CartContext';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', red: '#E74C3C', lightGray: '#E8E8E8',
};

const CATEGORIES = [
  { key: null, label: 'Tất cả', icon: '🍽️' },
  { key: 'nuoc_uong', label: 'Nước uống', icon: '🧋' },
  { key: 'lau', label: 'Lẩu', icon: '🍲' },
  { key: 'mon_nhau', label: 'Món nhậu', icon: '🍗' },
  { key: 'bun_pho', label: 'Bún/Phở', icon: '🍜' },
  { key: 'com', label: 'Cơm', icon: '🍚' },
  { key: 'an_vat', label: 'Ăn vặt', icon: '🍢' },
];

function formatPrice(price) {
  return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
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

export default function MenuTab({ navigation }) {
  const [allFoods, setAllFoods] = useState([]);
  const [selectedCat, setSelectedCat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();

  const loadData = async () => {
    try {
      const f = await getFoods();
      setAllFoods(f);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredFoods = allFoods.filter(f => {
    if (selectedCat && f.category !== selectedCat) return false;
    if (search.trim()) {
      return f.name.toLowerCase().includes(search.toLowerCase());
    }
    return true;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Tìm món ăn..."
          placeholderTextColor={COLORS.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key || 'all'}
            style={[styles.catTab, selectedCat === cat.key && styles.catTabActive]}
            onPress={() => setSelectedCat(cat.key)}
          >
            <Text style={styles.catIcon}>{cat.icon}</Text>
            <Text style={[styles.catLabel, selectedCat === cat.key && styles.catLabelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Food list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} colors={[COLORS.primary]} />}
      >
        <Text style={styles.resultCount}>
          {filteredFoods.length} món {selectedCat ? `trong "${CATEGORIES.find(c => c.key === selectedCat)?.label}"` : ''}
        </Text>
        {filteredFoods.length === 0 ? (
          <Text style={styles.emptyText}>Không tìm thấy món ăn nào</Text>
        ) : (
          filteredFoods.map(food => (
            <FoodCard
              key={food._id}
              food={food}
              onPress={() => navigation.navigate('FoodDetail', { food })}
              onAddCart={() => addToCart(food, 1)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  searchContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInput: {
    backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, color: COLORS.dark,
  },
  catScroll: { maxHeight: 80, marginBottom: 4 },
  catTab: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
    borderRadius: 16, backgroundColor: COLORS.white, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 2,
  },
  catTabActive: { backgroundColor: COLORS.primary },
  catIcon: { fontSize: 24 },
  catLabel: { fontSize: 11, color: COLORS.dark, marginTop: 2, fontWeight: '600' },
  catLabelActive: { color: COLORS.white },
  resultCount: { fontSize: 13, color: COLORS.gray, marginTop: 8, marginBottom: 4 },
  emptyText: { color: COLORS.gray, marginTop: 20, textAlign: 'center', fontSize: 14 },
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
