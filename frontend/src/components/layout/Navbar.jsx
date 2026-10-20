import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Settings, Package } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { count, toggleCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-600">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ShopMG</span>
          </Link>

          {/* Nav links */}
          <div className="items-center hidden gap-6 md:flex">
            <Link to="/" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
              Accueil
            </Link>
            <Link to="/products" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
              Produits
            </Link>
            {isAuthenticated && (
              <Link to="/orders" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
                Mes commandes
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin" className="text-sm font-medium text-gray-600 transition-colors hover:text-primary-600">
                Admin
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Panier */}
            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-600 transition-colors rounded-lg hover:text-primary-600 hover:bg-gray-100"
            >
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute flex items-center justify-center w-5 h-5 text-xs font-medium text-white rounded-full -top-1 -right-1 bg-primary-600">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm text-gray-600 md:block">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 transition-colors rounded-lg hover:text-red-600 hover:bg-red-50"
                  title="Se déconnecter"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;