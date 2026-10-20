const axios = require('axios');

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

// Récupère les infos d'un produit
const getProduct = async (productId) => {
  try {
    const { data } = await axios.get(
      `${PRODUCT_SERVICE_URL}/api/products/${productId}`,
      { timeout: 5000 }
    );
    return data.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw new Error(`Product Service indisponible: ${error.message}`);
  }
};

// Décrémente le stock après une commande
const decrementStock = async (productId, quantity) => {
  try {
    const { data } = await axios.patch(
      `${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`,
      { quantity, operation: 'decrement' },
      { timeout: 5000 }
    );
    return data.data;
  } catch (error) {
    throw new Error(`Erreur mise à jour stock: ${error.message}`);
  }
};

// Restaure le stock en cas d'annulation
const incrementStock = async (productId, quantity) => {
  try {
    await axios.patch(
      `${PRODUCT_SERVICE_URL}/api/products/${productId}/stock`,
      { quantity, operation: 'increment' },
      { timeout: 5000 }
    );
  } catch (error) {
    console.error(`Erreur restauration stock produit ${productId}:`, error.message);
  }
};

module.exports = { getProduct, decrementStock, incrementStock };