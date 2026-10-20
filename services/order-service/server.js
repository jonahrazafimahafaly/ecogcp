require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.ORDER_PORT || 3003;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Order Service:', error.message);
    process.exit(1);
  }
};

start();