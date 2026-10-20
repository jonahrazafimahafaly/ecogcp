const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId:   { type: String, required: true },
    userName: { type: String, required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, trim: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
    },
    slug: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
      required: [true, 'La description est requise'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: 0,
    },
    comparePrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'La catégorie est requise'],
    },
    images: [
      {
        url:     { type: String, required: true },
        publicId:{ type: String },
        isMain:  { type: Boolean, default: false },
      },
    ],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    sku: {
      type: String,
      sparse: true,
    },
    ratings: {
      average: { type: Number, default: 0 },
      count:   { type: Number, default: 0 },
    },
    reviews: [reviewSchema],
    isActive:   { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

// PAS DE HOOK PRE SAVE
// Index pour la recherche
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });

productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.ratings = { average: 0, count: 0 };
  } else {
    const total = this.reviews.reduce((sum, r) => sum + r.rating, 0);
    this.ratings = {
      average: Math.round((total / this.reviews.length) * 10) / 10,
      count:   this.reviews.length,
    };
  }
};

module.exports = mongoose.model('Product', productSchema);