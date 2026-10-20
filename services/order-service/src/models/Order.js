const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: [true, 'Product ID requis'],
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'La quantité doit être au moins 1'],
  },
  subtotal: {
    type: Number,
    required: true,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true, default: 'MG' },
  phone: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User ID requis'],
      index: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'La commande doit contenir au moins un article',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      shippingCost: { type: Number, default: 0 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: [
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'failed', 'refunded'],
      default: 'unpaid',
    },
    paymentId: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'mobile_money', 'cash_on_delivery'],
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    estimatedDelivery: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Génère un numéro de commande unique avant sauvegarde
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  // Calcule la date de livraison estimée (7 jours)
  if (!this.estimatedDelivery) {
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    this.estimatedDelivery = delivery;
  }
  next();
});

// Index pour les requêtes fréquentes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });

module.exports = mongoose.model('Order', orderSchema);