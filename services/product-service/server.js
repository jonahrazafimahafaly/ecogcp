require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PRODUCT_PORT || 3002;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Product Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Product Service:', error.message);
    process.exit(1);
  }
};

start();