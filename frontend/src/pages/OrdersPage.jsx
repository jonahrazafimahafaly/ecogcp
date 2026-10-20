import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',    color: 'bg-amber-100 text-amber-700' },
  confirmed:  { label: 'Confirmée',     color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'En préparation',color: 'bg-indigo-100 text-indigo-700' },
  shipped:    { label: 'Expédiée',      color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Livrée',        color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Annulée',       color: 'bg-red-100 text-red-700' },
  refunded:   { label: 'Remboursée',    color: 'bg-gray-100 text-gray-700' },
};

const PAYMENT_CONFIG = {
  unpaid:   { label: 'Non payé',   color: 'bg-red-100 text-red-600' },
  paid:     { label: 'Payé',       color: 'bg-green-100 text-green-700' },
  failed:   { label: 'Échoué',     color: 'bg-red-100 text-red-700' },
  refunded: { label: 'Remboursé',  color: 'bg-gray-100 text-gray-600' },
};

const OrderCard = ({ order }) => {
  const [expanded, setExpanded] = useState(false);
  const status  = STATUS_CONFIG[order.status]  || STATUS_CONFIG.pending;
  const payment = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.unpaid;

  return (
    <div className="p-0 overflow-hidden card">
      {/* Header */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-gray-900">{order.orderNumber}</span>
              <span className={`badge ${status.color}`}>{status.label}</span>
              <span className={`badge ${payment.color}`}>{payment.label}</span>
            </div>
            <p className="text-sm text-gray-500">
              {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold text-gray-900">
                {order.pricing.total.toLocaleString('fr-FR')} Ar
              </p>
              <p className="text-xs text-gray-400">
                {order.items.length} article{order.items.length > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div className="p-4 space-y-4 bg-gray-50">
          {/* Articles */}
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                <img
                  src={item.image || 'https://placehold.co/60x60'}
                  alt={item.name}
                  className="flex-shrink-0 object-cover w-12 h-12 rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-xs text-gray-500">Qté: {item.quantity}</p>
                </div>
                <p className="flex-shrink-0 text-sm font-semibold">
                  {item.subtotal.toLocaleString('fr-FR')} Ar
                </p>
              </div>
            ))}
          </div>

          {/* Adresse & Pricing */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="p-3 bg-white rounded-xl">
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Livraison</p>
              <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">
                {order.shippingAddress.city}, {order.shippingAddress.postalCode}
              </p>
              <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
            </div>
            <div className="p-3 bg-white rounded-xl">
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Récapitulatif</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{order.pricing.subtotal.toLocaleString('fr-FR')} Ar</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>
                    {order.pricing.shippingCost === 0
                      ? 'Gratuite'
                      : `${order.pricing.shippingCost.toLocaleString('fr-FR')} Ar`}
                  </span>
                </div>
                <div className="flex justify-between pt-1 font-bold border-t">
                  <span>Total</span>
                  <span>{order.pricing.total.toLocaleString('fr-FR')} Ar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Historique statuts */}
          {order.statusHistory?.length > 0 && (
            <div className="p-3 bg-white rounded-xl">
              <p className="mb-3 text-xs font-semibold text-gray-500 uppercase">Historique</p>
              <div className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    <span className={`badge ${STATUS_CONFIG[h.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_CONFIG[h.status]?.label || h.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(h.changedAt).toLocaleString('fr-FR')}
                    </span>
                    {h.note && <span className="text-gray-500">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const OrdersPage = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params = filter ? `?status=${filter}` : '';
        const { data } = await api.get(`/api/orders/my-orders${params}`);
        setOrders(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [filter]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 mb-6 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes commandes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-auto input-field"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner size="lg" className="py-20" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16 text-gray-200" />}
          title="Aucune commande"
          description="Vous n'avez pas encore passé de commande"
          action={
            <Link to="/products" className="px-6 btn-primary">
              Commencer mes achats
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};
export default OrdersPage;