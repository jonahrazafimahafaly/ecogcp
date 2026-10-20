const axios = require('axios');

const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || 'http://localhost:3003';

// Récupère une commande par son ID
const getOrder = async (orderId) => {
  try {
    const { data } = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}`,
      {
        timeout: 5000,
        headers: { 'x-internal-service': 'payment-service' },
      }
    );
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw new Error(`Order Service indisponible: ${error.message}`);
  }
};

// Met à jour le statut de paiement dans order-service
const updateOrderPayment = async (orderId, paymentStatus, paymentId) => {
  try {
    const { data } = await axios.patch(
      `${ORDER_SERVICE_URL}/api/orders/${orderId}/payment`,
      { paymentStatus, paymentId },
      {
        timeout: 5000,
        headers: { 'x-internal-service': 'payment-service' },
      }
    );
    return data.data;
  } catch (error) {
    throw new Error(`Erreur mise à jour commande: ${error.message}`);
  }
};

module.exports = { getOrder, updateOrderPayment };