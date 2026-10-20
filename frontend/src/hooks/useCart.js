import { useSelector, useDispatch } from 'react-redux';
import {
  addToCart, removeFromCart, updateQuantity,
  clearCart, toggleCart, closeCart,
  selectCartTotal, selectCartCount,
} from '../store/slices/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch();
  const items   = useSelector((state) => state.cart.items);
  const isOpen  = useSelector((state) => state.cart.isOpen);
  const total   = useSelector(selectCartTotal);
  const count   = useSelector(selectCartCount);

  return {
    items, isOpen, total, count,
    addToCart:      (product)       => dispatch(addToCart(product)),
    removeFromCart: (id)            => dispatch(removeFromCart(id)),
    updateQuantity: (id, quantity)  => dispatch(updateQuantity({ id, quantity })),
    clearCart:      ()              => dispatch(clearCart()),
    toggleCart:     ()              => dispatch(toggleCart()),
    closeCart:      ()              => dispatch(closeCart()),
  };
};