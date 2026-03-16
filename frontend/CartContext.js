import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = (food, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.food._id === food._id);
      if (existing) {
        return prev.map(item =>
          item.food._id === food._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { food, quantity }];
    });
  };

  const removeFromCart = (foodId) => {
    setItems(prev => prev.filter(item => item.food._id !== foodId));
  };

  const updateQuantity = (foodId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.food._id === foodId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const price = item.food.discount > 0
        ? item.food.price * (1 - item.food.discount / 100)
        : item.food.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, getTotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
