const express = require('express');
const { body } = require('express-validator');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByNumber,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const orderRules = [
  body('items').isArray({ min: 1 }).withMessage('Au moins un article requis'),
  body('items.*.productId').notEmpty().withMessage('Product ID requis'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantité invalide'),
  body('shippingAddress.fullName').notEmpty().withMessage('Nom complet requis'),
  body('shippingAddress.address').notEmpty().withMessage('Adresse requise'),
  body('shippingAddress.city').notEmpty().withMessage('Ville requise'),
  body('shippingAddress.postalCode').notEmpty().withMessage('Code postal requis'),
  body('shippingAddress.phone').notEmpty().withMessage('Téléphone requis'),
  body('paymentMethod')
    .isIn(['card', 'mobile_money', 'cash_on_delivery'])
    .withMessage('Méthode de paiement invalide'),
];

// Routes user connecté
router.post('/', protect, orderRules, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/number/:orderNumber', protect, getOrderByNumber);
router.get('/:id', protect, getOrderById);

// Routes admin
router.get('/admin/all', protect, adminOnly, getAllOrders);
router.get('/admin/stats', protect, adminOnly, getOrderStats);
router.patch('/:id/status', protect, adminOnly, updateOrderStatus);

// Route interne — appelée par payment-service (sans auth JWT)
router.patch('/:id/payment', updatePaymentStatus);

module.exports = router;