const express = require('express');
const { body } = require('express-validator');
const {
  initiatePayment,
  processPayment,
  getPaymentByOrder,
  getPaymentById,
  refundPayment,
  getAllPayments,
  getPaymentStats,
} = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const initiateRules = [
  body('orderId').notEmpty().withMessage('Order ID requis'),
  body('method')
    .isIn(['card', 'mobile_money', 'cash_on_delivery'])
    .withMessage('Méthode invalide'),
];

// Routes user connecté
router.post('/initiate', protect, initiateRules, initiatePayment);
router.post('/:paymentId/process', protect, processPayment);
router.get('/order/:orderId', protect, getPaymentByOrder);
router.get('/:id', protect, getPaymentById);

// Routes admin
router.get('/admin/all', protect, adminOnly, getAllPayments);
router.get('/admin/stats', protect, adminOnly, getPaymentStats);
router.post('/:id/refund', protect, adminOnly, refundPayment);

module.exports = router;