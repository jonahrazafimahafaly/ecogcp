require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PAYMENT_PORT || 3004;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Payment Service:', error.message);
    process.exit(1);
  }
};

start();