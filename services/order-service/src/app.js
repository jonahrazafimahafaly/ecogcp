const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'order-service',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/orders', orderRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} introuvable`,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Erreur interne' });
});

module.exports = app;