const Order = require('../models/Order');
const { validationResult } = require('express-validator');
const productService = require('../services/productService');

// POST /api/orders — Créer une commande
const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Vérifie chaque produit et calcule les prix en temps réel
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await productService.getProduct(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit ${item.productId} introuvable`,
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Le produit "${product.name}" n'est plus disponible`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour "${product.name}". Disponible: ${product.stock}`,
        });
      }

      const itemSubtotal = product.price * item.quantity;
      subtotal += itemSubtotal;

      validatedItems.push({
        productId: item.productId,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });
    }

    // Calcul des frais
    const shippingCost = subtotal >= 50000 ? 0 : 5000;
    const tax = Math.round(subtotal * 0.0);
    const total = subtotal + shippingCost + tax;

    // Crée la commande
    const order = await Order.create({
      userId: req.userId,
      items: validatedItems,
      shippingAddress,
      pricing: { subtotal, shippingCost, tax, total },
      paymentMethod,
      notes,
      statusHistory: [{ status: 'pending', note: 'Commande créée' }],
    });

    // Décrémente le stock pour chaque produit
    for (const item of validatedItems) {
      await productService.decrementStock(item.productId, item.quantity);
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order,
    });
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/orders — Mes commandes (user connecté)
const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { userId: req.userId };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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

// GET /api/orders/:id — Détail d'une commande
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    // Un user ne peut voir que ses propres commandes
    if (order.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/orders/number/:orderNumber
const getOrderByNumber = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderNumber: req.params.orderNumber,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    if (order.userId !== req.userId && req.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé',
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/orders/admin/all — Toutes les commandes (admin)
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      sort = '-createdAt',
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
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

// PATCH /api/orders/:id/status — Changer le statut (admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: ['refunded'],
      cancelled: [],
      refunded: [],
    };

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition invalide: ${order.status} → ${status}`,
      });
    }

    // Si annulation, restaure le stock
    if (status === 'cancelled') {
      for (const item of order.items) {
        await productService.incrementStock(item.productId, item.quantity);
      }
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: note || '',
      changedAt: new Date(),
    });
    await order.save();

    res.status(200).json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /api/orders/:id/payment — Mise à jour paiement (payment-service)
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable',
      });
    }

    order.paymentStatus = paymentStatus;
    if (paymentId) order.paymentId = paymentId;

    // Si paiement réussi, confirme la commande automatiquement
    if (paymentStatus === 'paid' && order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        note: 'Paiement reçu',
        changedAt: new Date(),
      });
    }

    await order.save();
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/orders/admin/stats — Statistiques (admin)
const getOrderStats = async (req, res) => {
  try {
    const [statusStats, revenueStats, recentOrders] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$pricing.total' },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: '$pricing.total' },
          },
        },
      ]),
      Order.find().sort('-createdAt').limit(5),
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusStats,
        revenue: revenueStats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          avgOrderValue: 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByNumber,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStats,
};