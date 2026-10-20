import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import {
  ShoppingBag, Users, TrendingUp, Package,
  ArrowRight, CheckCircle, Clock, XCircle,
} from 'lucide-react';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="flex items-start gap-4 card">
    <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orderStats, paymentStats] = await Promise.all([
          api.get('/api/orders/admin/stats'),
          api.get('/api/payments/admin/stats'),
        ]);
        setStats({
          orders:   orderStats.data.data,
          payments: paymentStats.data.data,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Spinner size="lg" className="py-20" />;

  const revenue = stats?.orders?.revenue;
  const statusStats = stats?.orders?.statusStats || [];

  const getStatusCount = (status) =>
    statusStats.find((s) => s._id === status)?.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 text-sm mt-0.5">Vue d'ensemble de votre boutique</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-600" />}
          label="Chiffre d'affaires"
          value={`${(revenue?.totalRevenue || 0).toLocaleString('fr-FR')} Ar`}
          sub="Paiements complétés"
          color="bg-green-50"
        />
        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
          label="Total commandes"
          value={revenue?.totalOrders || 0}
          sub="Commandes payées"
          color="bg-blue-50"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          label="En attente"
          value={getStatusCount('pending')}
          sub="À traiter"
          color="bg-amber-50"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-primary-600" />}
          label="Livrées"
          value={getStatusCount('delivered')}
          sub="Commandes livrées"
          color="bg-primary-50"
        />
      </div>

      {/* Statuts des commandes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Statuts des commandes</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { status: 'pending',    icon: <Clock className="w-4 h-4" />,         color: 'text-amber-500' },
              { status: 'confirmed',  icon: <CheckCircle className="w-4 h-4" />,   color: 'text-blue-500' },
              { status: 'processing', icon: <Package className="w-4 h-4" />,       color: 'text-indigo-500' },
              { status: 'shipped',    icon: <ShoppingBag className="w-4 h-4" />,   color: 'text-purple-500' },
              { status: 'delivered',  icon: <CheckCircle className="w-4 h-4" />,   color: 'text-green-500' },
              { status: 'cancelled',  icon: <XCircle className="w-4 h-4" />,       color: 'text-red-500' },
            ].map(({ status, icon, color }) => {
              const count = getStatusCount(status);
              const total = statusStats.reduce((s, x) => s + x.count, 0) || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className={color}>{icon}</span>
                  <span className="w-32 text-sm text-gray-600 capitalize">{status}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full">
                    <div
                      className="h-2 transition-all rounded-full bg-primary-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm font-medium text-right text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Commandes récentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Commandes récentes</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
              Voir tout <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.orders?.recentOrders?.length === 0 ? (
              <p className="py-6 text-sm text-center text-gray-400">Aucune commande</p>
            ) : (
              stats?.orders?.recentOrders?.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      {order.pricing.total.toLocaleString('fr-FR')} Ar
                    </p>
                    <span className={`badge text-xs ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="card">
        <h2 className="mb-4 font-semibold text-gray-900">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Gérer les produits', to: '/admin/products', icon: <Package className="w-5 h-5" />, color: 'bg-primary-50 text-primary-600' },
            { label: 'Voir les commandes', to: '/admin/orders',   icon: <ShoppingBag className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
            { label: 'Voir les paiements', to: '/admin/payments', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-green-50 text-green-600' },
            { label: 'Gérer les catégories', to: '/admin/categories', icon: <Users className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="flex flex-col items-center gap-2 p-4 text-center transition-colors border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50 group"
            >
              <span className={`p-2 rounded-lg ${action.color}`}>{action.icon}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;