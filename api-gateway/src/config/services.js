const services = {
  auth: {
    url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    prefix: '/api/auth',
  },
  product: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    prefix: '/api/products',
  },
  category: {
    url: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    prefix: '/api/categories',
  },
  order: {
    url: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
    prefix: '/api/orders',
  },
  payment: {
    url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
    prefix: '/api/payments',
  },
};

module.exports = services;