import 'react-native-gesture-handler';
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider } from './AuthContext';
import { CartProvider, useCart } from './CartContext';

import HomeScreen from './screens/HomeScreen';
import HomeTab from './screens/HomeTab';
import MenuTab from './screens/MenuTab';
import DeliveryTab from './screens/DeliveryTab';
import FoodDetailScreen from './screens/FoodDetailScreen';
import CartScreen from './screens/CartScreen';
import CheckoutScreen from './screens/CheckoutScreen';
import AdminScreen from './screens/AdminScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const COLORS = { primary: '#FF6B35', gray: '#888', white: '#FFFFFF', red: '#E74C3C' };

function TabIcon({ icon, focused, badge }) {
  return (
    <View style={{ alignItems: 'center', position: 'relative' }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      {badge > 0 && (
        <View style={{
          position: 'absolute', top: -6, right: -12,
          backgroundColor: COLORS.red, width: 18, height: 18,
          borderRadius: 9, justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: 'bold' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

function CustomerTabs() {
  const { getItemCount } = useCart();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          height: 60, paddingBottom: 8, paddingTop: 4,
          borderTopWidth: 1, borderTopColor: '#E8E8E8',
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTab}
        options={{
          tabBarLabel: 'Khuyến mãi',
          tabBarIcon: ({ focused }) => <TabIcon icon="🔥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuTab}
        options={{
          tabBarLabel: 'Thực đơn',
          tabBarIcon: ({ focused }) => <TabIcon icon="🍽️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="DeliveryTab"
        component={DeliveryTab}
        options={{
          tabBarLabel: 'Giao hàng',
          tabBarIcon: ({ focused }) => <TabIcon icon="🚀" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Giỏ hàng',
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} badge={getItemCount()} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Cá nhân',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Home" screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white }}>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'La cà Food', headerShown: false }} />
            <Stack.Screen name="CustomerTabs" component={CustomerTabs} options={{ headerShown: false }} />
            <Stack.Screen name="FoodDetail" component={FoodDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng' }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh toán' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </AuthProvider>
  );
}
