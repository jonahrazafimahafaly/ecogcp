const crypto = require('crypto');
const Payment = require('../models/Payment');
const orderService = require('../services/orderService');
const { validationResult } = require('express-validator');

// Génère un ID de transaction unique
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

// Simule le traitement selon la méthode de paiement
const processPaymentByMethod = async (method, details, amount) => {
  // Simulation d'un délai de traitement réel
  await new Promise((resolve) => setTimeout(resolve, 800));

  switch (method) {
    case 'card': {
      // Simulation : les cartes finissant par 0000 échouent
      if (details?.cardNumber?.endsWith('0000')) {
        return { success: false, error: 'Carte refusée par la banque' };
      }
      return {
        success: true,
        providerReference: `CARD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        last4: details?.cardNumber?.slice(-4) || '****',
        brand: 'Visa',
      };
    }

    case 'mobile_money': {
      // Simulation : numéros commençant par 000 échouent
      if (details?.phoneNumber?.startsWith('000')) {
        return { success: false, error: 'Numéro mobile money invalide' };
      }
      return {
        success: true,
        providerReference: `MM-${details?.provider?.toUpperCase()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
        phoneNumber: details?.phoneNumber,
        provider: details?.provider,
      };
    }

    case 'cash_on_delivery': {
      // Paiement à la livraison — toujours accepté
      return {
        success: true,
        providerReference: `COD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
      };
    }

    default:
      return { success: false, error: 'Méthode de paiement non supportée' };
  }
};

// POST /api/payments/initiate — Initier un paiement
const initiatePayment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, method, cardDetails, mobileMoneyDetails } = req.body;

    // Vérifie que la commande existe
    const order = await orderService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    // Vérifie que la commande appartient à l'utilisateur
    if (order.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    // Vérifie que la commande n'est pas déjà payée
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cette commande est déjà payée',
      });
    }

    // Vérifie qu'il n'y a pas un paiement pending en cours
    const existingPending = await Payment.findOne({
      orderId,
      status: 'pending',
    });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'Un paiement est déjà en cours pour cette commande',
        data: { paymentId: existingPending._id },
      });
    }

    // Crée l'enregistrement du paiement
    const payment = await Payment.create({
      orderId,
      userId: req.userId,
      orderNumber: order.orderNumber,
      amount: order.pricing.total,
      method,
      cardDetails: method === 'card' ? {
        last4: cardDetails?.cardNumber?.slice(-4),
        brand: 'Visa',
        expiryMonth: cardDetails?.expiryMonth,
        expiryYear: cardDetails?.expiryYear,
      } : undefined,
      mobileMoneyDetails: method === 'mobile_money' ? {
        phoneNumber: mobileMoneyDetails?.phoneNumber,
        provider: mobileMoneyDetails?.provider,
      } : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Paiement initié',
      data: {
        paymentId: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error('initiatePayment error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/payments/:paymentId/process — Traiter le paiement
const processPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable',
      });
    }

    if (payment.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Paiement déjà ${payment.status}`,
      });
    }

    // Passe en processing
    payment.status = 'processing';
    await payment.save();

    // Traite le paiement selon la méthode
    const details =
      payment.method === 'card'
        ? { ...req.body.cardDetails, cardNumber: req.body.cardDetails?.cardNumber }
        : payment.method === 'mobile_money'
        ? payment.mobileMoneyDetails
        : {};

    const result = await processPaymentByMethod(
      payment.method,
      details,
      payment.amount
    );

    const transactionId = generateTransactionId();

    // Enregistre la tentative
    payment.attempts.push({
      attemptedAt: new Date(),
      status: result.success ? 'completed' : 'failed',
      errorMessage: result.error || null,
      transactionId,
    });

    if (result.success) {
      payment.status = 'completed';
      payment.transactionId = transactionId;
      payment.providerReference = result.providerReference;

      if (result.last4) {
        payment.cardDetails = {
          last4: result.last4,
          brand: result.brand,
          expiryMonth: payment.cardDetails?.expiryMonth,
          expiryYear: payment.cardDetails?.expiryYear,
        };
      }

      // Notifie order-service du succès
      await orderService.updateOrderPayment(
        payment.orderId,
        'paid',
        payment._id.toString()
      );

      await payment.save();

      return res.status(200).json({
        success: true,
        message: 'Paiement réussi',
        data: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          providerReference: payment.providerReference,
          paidAt: payment.updatedAt,
        },
      });
    } else {
      payment.status = 'failed';
      await payment.save();

      // Notifie order-service de l'échec
      await orderService.updateOrderPayment(
        payment.orderId,
        'failed',
        null
      );

      return res.status(400).json({
        success: false,
        message: result.error || 'Paiement échoué',
        data: { paymentId: payment._id, status: payment.status },
      });
    }
  } catch (error) {
    console.error('processPayment error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/payments/order/:orderId — Paiements d'une commande
const getPaymentByOrder = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
    }).sort('-createdAt');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Aucun paiement trouvé pour cette commande',
      });
    }

    if (payment.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/payments/:id — Détail d'un paiement
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable',
      });
    }

    if (payment.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/payments/:id/refund — Remboursement (admin)
const refundPayment = async (req, res) => {
  try {
    const { reason, amount } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Seuls les paiements complétés peuvent être remboursés',
      });
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Le montant du remboursement dépasse le montant payé',
      });
    }

    // Simulation du remboursement
    await new Promise((resolve) => setTimeout(resolve, 500));
    const refundTransactionId = `REF-${generateTransactionId()}`;

    payment.status = 'refunded';
    payment.refund = {
      amount: refundAmount,
      reason: reason || 'Remboursement demandé',
      refundedAt: new Date(),
      refundTransactionId,
    };

    await payment.save();

    // Notifie order-service
    await orderService.updateOrderPayment(payment.orderId, 'refunded', null);

    res.status(200).json({
      success: true,
      message: 'Remboursement effectué',
      data: {
        refundTransactionId,
        amount: refundAmount,
        currency: payment.currency,
        refundedAt: payment.refund.refundedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/payments/admin/all — Tous les paiements (admin)
const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (method) filter.method = method;

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/payments/admin/stats — Statistiques paiements (admin)
const getPaymentStats = async (req, res) => {
  try {
    const [methodStats, statusStats, revenueByDay] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$method', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]),
      Payment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { methodStats, statusStats, revenueByDay },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  initiatePayment,
  processPayment,
  getPaymentByOrder,
  getPaymentById,
  refundPayment,
  getAllPayments,
  getPaymentStats,
};