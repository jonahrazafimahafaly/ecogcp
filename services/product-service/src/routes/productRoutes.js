const express = require('express');
const { body } = require('express-validator');
const {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  updateStock,
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

const productRules = [
  body('name').trim().notEmpty().withMessage('Nom requis'),
  body('description').trim().notEmpty().withMessage('Description requise'),
  body('price').isFloat({ min: 0 }).withMessage('Prix invalide'),
  body('category').notEmpty().withMessage('Catégorie requise'),
  body('stock').isInt({ min: 0 }).withMessage('Stock invalide'),
];

// Routes publiques
router.get('/', getAllProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// Routes protégées — utilisateur connecté
router.post('/:id/reviews', protect, addReview);

// Routes admin
router.post('/', protect, adminOnly, productRules, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Route interne — appelée par order-service
router.patch('/:id/stock', updateStock);

module.exports = router;