const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// GET /api/products  — avec filtres, tri, pagination
const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      search,
      sort = '-createdAt',
      featured,
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (featured === 'true') filter.isFeatured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('getAllProducts error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// GET /api/products/slug/:slug
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/products  (admin)
const createProduct = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const product = await Product.create(req.body);
    await product.populate('category', 'name slug');
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Un produit avec ce nom existe déjà' });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PUT /api/products/:id  (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// DELETE /api/products/:id  (admin — soft delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }
    res.status(200).json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// POST /api/products/:id/reviews  (user connecté)
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    // Vérifie si l'utilisateur a déjà laissé un avis
    const alreadyReviewed = product.reviews.find(
      (r) => r.userId === req.userId
    );
    if (alreadyReviewed) {
      return res.status(409).json({
        success: false,
        message: 'Vous avez déjà donné un avis sur ce produit',
      });
    }

    product.reviews.push({
      userId: req.userId,
      userName: req.body.userName || 'Anonyme',
      rating: Number(rating),
      comment,
    });

    product.calculateRating();
    await product.save();

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// PATCH /api/products/:id/stock  (utilisé par order-service)
const updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    if (operation === 'decrement') {
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: 'Stock insuffisant' });
      }
      product.stock -= quantity;
    } else {
      product.stock += quantity;
    }

    await product.save();
    res.status(200).json({ success: true, data: { stock: product.stock } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  updateStock,
};