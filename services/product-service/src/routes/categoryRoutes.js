const express = require('express');
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/',       getAllCategories);
router.get('/:id',    getCategoryById);
router.post('/',      protect, adminOnly, createCategory);
router.put('/:id',    protect, adminOnly, updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;