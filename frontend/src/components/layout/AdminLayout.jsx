import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag,
  Tag, TrendingUp, ArrowLeft,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/admin',            icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
  { to: '/admin/products',   icon: <Package className="w-4 h-4" />,        label: 'Produits' },
  { to: '/admin/categories', icon: <Tag className="w-4 h-4" />,            label: 'Catégories' },
  { to: '/admin/orders',     icon: <ShoppingBag className="w-4 h-4" />,    label: 'Commandes' },
];

const AdminLayout = ({ children }) => {
  const { pathname } = useLocation();

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="flex-shrink-0 w-56">
        <div className="sticky p-3 card top-24">
          <div className="flex items-center gap-2 px-3 py-2 mb-3">
            <span className="text-xs badge bg-primary-100 text-primary-700">Admin</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.to
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 mt-3 border-t">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour boutique
            </Link>
          </div>
        </div>
      </aside>

      {/* Contenu */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
};
export default AdminLayout;