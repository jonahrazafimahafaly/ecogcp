import { createSlice } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';

const loadCartFromStorage = () => {
  try {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: loadCartFromStorage(),
    isOpen: false,
  },
  reducers: {
    addToCart: (state, action) => {
      const product = action.payload;
      const existing = state.items.find((i) => i._id === product._id);
      if (existing) {
        if (existing.quantity < product.stock) {
          existing.quantity += 1;
          toast.success('Quantité mise à jour');
        } else {
          toast.error('Stock insuffisant');
          return;
        }
      } else {
        state.items.push({ ...product, quantity: 1 });
        toast.success('Produit ajouté au panier');
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((i) => i._id !== action.payload);
      localStorage.setItem('cart', JSON.stringify(state.items));
      toast.success('Produit retiré du panier');
    },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i._id === id);
      if (item) {
        if (quantity <= 0) {
          state.items = state.items.filter((i) => i._id !== id);
        } else if (quantity <= item.stock) {
          item.quantity = quantity;
        } else {
          toast.error('Stock insuffisant');
        }
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('cart');
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
  },
});

export const {
  addToCart, removeFromCart, updateQuantity,
  clearCart, toggleCart, closeCart,
} = cartSlice.actions;

export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);

export default cartSlice.reducer;