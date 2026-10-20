const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID requis'],
      index: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID requis'],
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Montant requis'],
      min: [0, 'Le montant ne peut pas être négatif'],
    },
    currency: {
      type: String,
      default: 'MGA',
      enum: ['MGA', 'EUR', 'USD'],
    },
    method: {
      type: String,
      required: true,
      enum: ['card', 'mobile_money', 'cash_on_delivery'],
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    providerReference: {
      type: String,
      default: null,
    },
    // Détails selon la méthode
    cardDetails: {
      last4: String,
      brand: String,
      expiryMonth: Number,
      expiryYear: Number,
    },
    mobileMoneyDetails: {
      phoneNumber: String,
      provider: {
        type: String,
        enum: ['mvola', 'orange_money', 'airtel_money'],
      },
    },
    // Historique des tentatives
    attempts: [
      {
        attemptedAt: { type: Date, default: Date.now },
        status: String,
        errorMessage: String,
        transactionId: String,
      },
    ],
    // Remboursement
    refund: {
      amount: { type: Number, default: 0 },
      reason: String,
      refundedAt: Date,
      refundTransactionId: String,
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 min
    },
  },
  { timestamps: true }
);

// Index TTL — expire les paiements pending après 30min
paymentSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } });
paymentSchema.index({ orderId: 1, status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);