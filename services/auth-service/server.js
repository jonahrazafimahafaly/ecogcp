require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.AUTH_PORT || 3001;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Auth Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Auth Service:', error.message);
    process.exit(1);
  }
};

start();