const morgan = require('morgan');

// Format personnalisé avec le service cible
morgan.token('service', (req) => {
  const path = req.path;
  if (path.startsWith('/api/auth')) return 'AUTH';
  if (path.startsWith('/api/products') || path.startsWith('/api/categories')) return 'PRODUCT';
  if (path.startsWith('/api/orders')) return 'ORDER';
  if (path.startsWith('/api/payments')) return 'PAYMENT';
  return 'GATEWAY';
});

const logger = morgan(
  '[:date[clf]] :method :url -> :service | :status :response-time ms'
);

module.exports = logger;