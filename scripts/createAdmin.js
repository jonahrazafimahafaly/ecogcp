const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../services/auth-service/.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Vérification que MONGO_URI est bien chargé
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Chargé' : '❌ Non trouvé');

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI introuvable — vérifiez services/auth-service/.env');
  process.exit(1);
}

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role:         { type: String, default: 'user' },
  isActive:     { type: Boolean, default: true },
  refreshToken: { type: String, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB Atlas');

    await User.deleteOne({ email: 'alfahashirama@gmail.com' });

    const salt     = await bcrypt.genSalt(12);
    const password = await bcrypt.hash('@Nasandratra2003+#*&', salt);

    const admin = await User.create({
      name:     'Super Admin',
      email:    'alfahashirama@gmail.com',
      password,
      role:     'admin',
      isActive: true,
    });

    console.log('✅ Compte admin créé avec succès !');
    console.log('   Email    :', admin.email);
    console.log('   Password : @Nasandratra2003+#*&');
    console.log('   Role     :', admin.role);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdmin();