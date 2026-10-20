const Category = require('../models/Category');

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('getAllCategories error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }
    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('getCategoryById error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom est requis',
      });
    }

    const existing = await Category.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cette catégorie existe déjà',
      });
    }

    // Création avec insertOne pour éviter les hooks
    const category = await Category.create({
      name:        name.trim(),
      slug:        generateSlug(name.trim()),
      description: description ? description.trim() : '',
      isActive:    true,
    });

    return res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('createCategory error:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Cette catégorie existe déjà',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const updateData = {};
    if (name) {
      updateData.name = name.trim();
      updateData.slug = generateSlug(name.trim());
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('updateCategory error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Catégorie supprimée avec succès',
    });
  } catch (error) {
    console.error('deleteCategory error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};