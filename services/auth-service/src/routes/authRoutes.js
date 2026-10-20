const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  verifyToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Règles de validation
const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Nom trop court'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
];

const loginRules = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
];

// Routes publiques
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/refresh', refreshToken);

// Routes protégées
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/verify', protect, verifyToken);

module.exports = router;