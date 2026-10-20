const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Laisse passer OPTIONS
  if (req.method === 'OPTIONS') return next();

  const url = req.url;

  // Routes publiques — on vérifie uniquement l'URL et la méthode
  // JAMAIS le body — on ne le parse pas ici
  const isPublic =
    (req.method === 'POST' && url.startsWith('/api/auth/register')) ||
    (req.method === 'POST' && url.startsWith('/api/auth/login'))    ||
    (req.method === 'POST' && url.startsWith('/api/auth/refresh'))  ||
    (req.method === 'GET'  && url.startsWith('/api/products'))      ||
    (req.method === 'GET'  && url.startsWith('/api/categories'))    ||
    (req.method === 'GET'  && url.startsWith('/health'));

  if (isPublic) return next();

  // Vérification JWT — uniquement dans les headers Authorization
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "Token d'accès manquant",
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Injecte dans les headers — jamais dans le body
    req.headers['x-user-id']        = String(decoded.userId);
    req.headers['x-user-role']      = String(decoded.role);
    req.headers['x-gateway-secret'] = process.env.GATEWAY_SECRET || 'gateway-internal-secret';

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token invalide',
    });
  }
};

module.exports = { authMiddleware };