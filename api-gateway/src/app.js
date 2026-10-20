const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const services = require('./config/services');
const { authMiddleware } = require('./middleware/authMiddleware');
const { generalLimiter } = require('./middleware/rateLimiter');
const routes = require('./routes/index');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

morgan.token('service', (req) => {
  const url = req.url;
  if (url.startsWith('/api/auth'))       return 'AUTH';
  if (url.startsWith('/api/products'))   return 'PRODUCT';
  if (url.startsWith('/api/categories')) return 'PRODUCT';
  if (url.startsWith('/api/orders'))     return 'ORDER';
  if (url.startsWith('/api/payments'))   return 'PAYMENT';
  return 'GATEWAY';
});

app.use(morgan('[:date[clf]] :method :url -> :service | :status :response-time ms'));
app.use(generalLimiter);

// ── Health checks — pas de body parsing nécessaire ─────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/all', async (req, res) => {
  const axios = require('axios');
  const checks = await Promise.allSettled([
    axios.get(`${services.auth.url}/health`,    { timeout: 3000 }),
    axios.get(`${services.product.url}/health`, { timeout: 3000 }),
    axios.get(`${services.order.url}/health`,   { timeout: 3000 }),
    axios.get(`${services.payment.url}/health`, { timeout: 3000 }),
  ]);
  const names = ['auth', 'product', 'order', 'payment'];
  const results = {};
  checks.forEach((result, i) => {
    results[names[i]] = result.status === 'fulfilled' ? 'ok' : 'down';
  });
  const allHealthy = Object.values(results).every((s) => s === 'ok');
  res.status(allHealthy ? 200 : 207).json({
    status: allHealthy ? 'ok' : 'degraded',
    services: results,
    timestamp: new Date().toISOString(),
  });
});

// ── Auth middleware — lit uniquement les headers, pas le body ──
app.use(authMiddleware);

// ── Proxy routes — le body est transmis tel quel (stream) ──────
app.use(routes);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} introuvable`,
  });
});

// ── Error handler ──────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[GATEWAY ERROR]', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du gateway',
  });
});

module.exports = app;