import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  pending:    { label: 'En attente',     color: 'bg-amber-100 text-amber-700',   next: ['confirmed', 'cancelled'] },
  confirmed:  { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700',     next: ['processing', 'cancelled'] },
  processing: { label: 'En préparation', color: 'bg-indigo-100 text-indigo-700', next: ['shipped', 'cancelled'] },
  shipped:    { label: 'Expédiée',       color: 'bg-purple-100 text-purple-700', next: ['delivered'] },
  delivered:  { label: 'Livrée',         color: 'bg-green-100 text-green-700',   next: ['refunded'] },
  cancelled:  { label: 'Annulée',        color: 'bg-red-100 text-red-700',       next: [] },
  refunded:   { label: 'Remboursée',     color: 'bg-gray-100 text-gray-700',     next: [] },
};

const OrderRow = ({ order, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      await api.patch(`/api/orders/${order._id}/status`, { status: newStatus });
      toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus]?.label}`);
      onStatusChange();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="mb-3 overflow-hidden border border-gray-100 rounded-xl">
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center gap-4">
          <div>
            <p className="font-semibold text-gray-900">{order.orderNumber}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <span className={`badge ${status.color}`}>{status.label}</span>
          <span className={`badge ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {order.paymentStatus === 'paid' ? 'Payé' : 'Non payé'}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <p className="font-bold text-gray-900">
            {order.pricing.total.toLocaleString('fr-FR')} Ar
          </p>

          {/* Changement de statut */}
          {status.next.length > 0 && (
            <select
              onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
              disabled={updating}
              className="py-1 text-xs input-field w-44"
              defaultValue=""
            >
              <option value="">Changer statut...</option>
              {status.next.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s]?.label}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3 border-t border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Articles</p>
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                  <span className="font-medium">{item.subtotal.toLocaleString('fr-FR')} Ar</span>
                </div>
              ))}
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Livraison</p>
              <p className="text-sm text-gray-700">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.address}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.city}</p>
              <p className="text-sm text-gray-600">{order.shippingAddress.phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrdersAdminPage = () => {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter ? `?status=${filter}` : '';
      const { data } = await api.get(`/api/orders/admin/all${params}`);
      setOrders(data.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des commandes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} commande(s)</p>
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

      {loading ? <Spinner size="lg" className="py-20" /> : (
        orders.length === 0 ? (
          <p className="py-20 text-center text-gray-400">Aucune commande trouvée</p>
        ) : (
          orders.map((order) => (
            <OrderRow key={order._id} order={order} onStatusChange={fetchOrders} />
          ))
        )
      )}
    </div>
  );
};
export default OrdersAdminPage;