import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCart } from '../hooks/useCart';
import api from '../api/axios';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import { ShoppingBag } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'mobile_money', label: '📱 Mobile Money (MVola / Orange)' },
  { value: 'cash_on_delivery', label: '💵 Paiement à la livraison' },
  { value: 'card', label: '💳 Carte bancaire' },
];

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const shippingCost = total >= 50000 ? 0 : 5000;
  const finalTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900">Panier vide</h2>
        <p className="mb-6 text-gray-500">Ajoutez des produits avant de commander</p>
        <button onClick={() => navigate('/products')} className="px-6 btn-primary">
          Voir les produits
        </button>
      </div>
    );
  }

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      // 1. Créer la commande
      const orderPayload = {
        items: items.map((i) => ({ productId: i._id, quantity: i.quantity })),
        shippingAddress: {
          fullName:   formData.fullName,
          address:    formData.address,
          city:       formData.city,
          postalCode: formData.postalCode,
          phone:      formData.phone,
          country:    'MG',
        },
        paymentMethod,
        notes: formData.notes || '',
      };

      const { data: orderData } = await api.post('/api/orders', orderPayload);
      const order = orderData.data;

      // 2. Initier le paiement
      const { data: payData } = await api.post('/api/payments/initiate', {
        orderId: order._id,
        method: paymentMethod,
      });

      // 3. Traiter le paiement
      const processPayload =
        paymentMethod === 'mobile_money'
          ? { mobileMoneyDetails: { phoneNumber: formData.phone, provider: 'mvola' } }
          : paymentMethod === 'card'
          ? { cardDetails: { cardNumber: formData.cardNumber, expiryMonth: 12, expiryYear: 2027 } }
          : {};

      await api.post(`/api/payments/${payData.data.paymentId}/process`, processPayload);

      clearCart();
      toast.success('Commande passée avec succès ! 🎉');
      navigate(`/orders`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la commande');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Finaliser la commande</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Formulaire */}
        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Adresse */}
            <div className="card">
              <h2 className="mb-4 font-semibold text-gray-900">Adresse de livraison</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Nom complet</label>
                  <input
                    {...register('fullName', { required: 'Requis' })}
                    placeholder="Jean Dupont"
                    className="input-field"
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Adresse</label>
                  <input
                    {...register('address', { required: 'Requis' })}
                    placeholder="Lot II J 10, Ankorondrano"
                    className="input-field"
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Ville</label>
                  <input
                    {...register('city', { required: 'Requis' })}
                    placeholder="Antananarivo"
                    className="input-field"
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    {...register('postalCode', { required: 'Requis' })}
                    placeholder="101"
                    className="input-field"
                  />
                  {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    {...register('phone', { required: 'Requis' })}
                    placeholder="+261 34 00 000 00"
                    className="input-field"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Notes (optionnel)</label>
                  <textarea
                    {...register('notes')}
                    placeholder="Instructions particulières pour la livraison..."
                    rows={2}
                    className="resize-none input-field"
                  />
                </div>
              </div>
            </div>

            {/* Paiement */}
            <div className="card">
              <h2 className="mb-4 font-semibold text-gray-900">Méthode de paiement</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      paymentMethod === m.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={m.value}
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      className="text-primary-600"
                    />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>

              {/* Champ carte */}
              {paymentMethod === 'card' && (
                <div className="mt-4">
                  <label className="block mb-1 text-sm font-medium text-gray-700">Numéro de carte</label>
                  <input
                    {...register('cardNumber', {
                      required: paymentMethod === 'card' ? 'Requis' : false,
                    })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={16}
                    className="input-field"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full gap-2 py-3 text-base btn-primary"
            >
              {loading ? <Spinner size="sm" /> : `Confirmer la commande — ${finalTotal.toLocaleString('fr-FR')} Ar`}
            </button>
          </form>
        </div>

        {/* Résumé commande */}
        <div className="sticky card h-fit top-24">
          <h2 className="mb-4 font-semibold text-gray-900">Résumé</h2>
          <div className="mb-4 space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between text-sm">
                <span className="flex-1 mr-2 text-gray-600 line-clamp-1">
                  {item.name} × {item.quantity}
                </span>
                <span className="flex-shrink-0 font-medium">
                  {(item.price * item.quantity).toLocaleString('fr-FR')} Ar
                </span>
              </div>
            ))}
          </div>
          <div className="pt-3 space-y-2 text-sm border-t">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total</span>
              <span>{total.toLocaleString('fr-FR')} Ar</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                {shippingCost === 0 ? 'Gratuite' : `${shippingCost.toLocaleString('fr-FR')} Ar`}
              </span>
            </div>
            {shippingCost > 0 && (
              <p className="text-xs text-gray-400">
                Livraison gratuite dès 50 000 Ar
              </p>
            )}
            <div className="flex justify-between pt-2 mt-2 text-base font-bold border-t">
              <span>Total</span>
              <span>{finalTotal.toLocaleString('fr-FR')} Ar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CheckoutPage;