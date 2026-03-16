import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

// Generate unique key for cart item based on food ID + selected options
function getCartKey(food, selectedOptions) {
  const optKey = selectedOptions && selectedOptions.length > 0
    ? '_' + selectedOptions.map(o => `${o.groupName}:${o.choiceName}`).sort().join('|')
    : '';
  return food._id + optKey;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const addToCart = (food, quantity = 1, selectedOptions = []) => {
    const key = getCartKey(food, selectedOptions);
    const optionsExtra = selectedOptions.reduce((sum, o) => sum + (o.extraPrice || 0), 0);

    setItems(prev => {
      const existing = prev.find(item => item.cartKey === key);
      if (existing) {
        return prev.map(item =>
          item.cartKey === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { food, quantity, selectedOptions, optionsExtra, cartKey: key }];
    });
  };

  const removeFromCart = (cartKey) => {
    setItems(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartKey);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.cartKey === cartKey ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const basePrice = item.food.discount > 0
        ? item.food.price * (1 - item.food.discount / 100)
        : item.food.price;
      const price = basePrice + (item.optionsExtra || 0);
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
