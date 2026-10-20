const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// PAS DE HOOK PRE SAVE — le slug est généré dans le controller
module.exports = mongoose.model('Category', categorySchema);