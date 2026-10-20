import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const CartDrawer = () => {
  const { items, isOpen, total, count, removeFromCart, updateQuantity, closeCart } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity bg-black/50"
        onClick={closeCart}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 z-50 flex flex-col w-full h-full max-w-md bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Panier ({count} article{count > 1 ? 's' : ''})
          </h2>
          <button onClick={closeCart} className="p-2 transition-colors rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 mb-4 text-gray-200" />
              <p className="text-gray-500">Votre panier est vide</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item._id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <img
                  src={item.images?.[0]?.url || 'https://placehold.co/80x80'}
                  alt={item.name}
                  className="flex-shrink-0 object-cover w-16 h-16 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{item.name}</p>
                  <p className="text-primary-600 font-semibold text-sm mt-0.5">
                    {(item.price * item.quantity).toLocaleString('fr-FR')} Ar
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="flex items-center justify-center transition-colors border border-gray-300 rounded-lg w-7 h-7 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-sm font-medium text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="flex items-center justify-center transition-colors border border-gray-300 rounded-lg w-7 h-7 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="ml-auto p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 space-y-3 border-t">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{total.toLocaleString('fr-FR')} Ar</span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full py-3 text-center btn-primary"
            >
              Commander
            </Link>
            <button
              onClick={closeCart}
              className="btn-secondary w-full py-2.5 text-sm"
            >
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  );
};
export default CartDrawer;