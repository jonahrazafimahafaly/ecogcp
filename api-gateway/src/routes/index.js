const { createProxyMiddleware } = require('http-proxy-middleware');
const express = require('express');
const services = require('../config/services');
const { authLimiter, paymentLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const makeProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error(`[GATEWAY] Proxy error vers ${target}:`, err.message);
        res.status(503).json({
          success: false,
          message: 'Service temporairement indisponible',
        });
      },
    },
  });

router.use('/api/auth',       authLimiter,    makeProxy(services.auth.url));
router.use('/api/products',                   makeProxy(services.product.url));
router.use('/api/categories',                 makeProxy(services.category.url));
router.use('/api/orders',                     makeProxy(services.order.url));
router.use('/api/payments',   paymentLimiter, makeProxy(services.payment.url));

module.exports = router;