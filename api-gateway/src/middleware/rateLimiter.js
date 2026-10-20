const rateLimit = require('express-rate-limit');

// Limite générale — 100 requêtes / 15 min par IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer dans 15 minutes',
  },
});

// Limite stricte pour l'auth — 10 tentatives / 15 min
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  },
});

// Limite paiements — 20 / 15 min
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes de paiement',
  },
});

module.exports = { generalLimiter, authLimiter, paymentLimiter };