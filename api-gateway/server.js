require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`   Auth    → ${process.env.AUTH_SERVICE_URL    || 'http://localhost:3001'}`);
  console.log(`   Product → ${process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002'}`);
  console.log(`   Order   → ${process.env.ORDER_SERVICE_URL   || 'http://localhost:3003'}`);
  console.log(`   Payment → ${process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004'}`);
});