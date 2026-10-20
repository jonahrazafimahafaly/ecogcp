import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate  = new Rate('errors');
const reqTrend   = new Trend('request_duration');

// Configuration du benchmark
export const options = {
  stages: [
    { duration: '30s', target: 10  }, // Montée à 10 users
    { duration: '1m',  target: 50  }, // Montée à 50 users
    { duration: '2m',  target: 100 }, // Charge max 100 users
    { duration: '1m',  target: 50  }, // Descente
    { duration: '30s', target: 0   }, // Fin
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    errors:            ['rate<0.01'], // Moins de 1% d'erreurs
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test 1 — Health check gateway
  const health = http.get(`${BASE_URL}/health`);
  check(health, { 'health ok': (r) => r.status === 200 });

  // Test 2 — Liste des produits (route publique)
  const products = http.get(`${BASE_URL}/api/products?limit=12`);
  check(products, {
    'products status 200': (r) => r.status === 200,
    'products has data':   (r) => JSON.parse(r.body).data !== undefined,
  });
  errorRate.add(products.status !== 200);
  reqTrend.add(products.timings.duration);

  // Test 3 — Liste des catégories
  const categories = http.get(`${BASE_URL}/api/categories`);
  check(categories, { 'categories ok': (r) => r.status === 200 });

  // Test 4 — Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: 'admin@shopmg.com', password: 'Admin123!' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { 'login ok': (r) => r.status === 200 });

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).data.accessToken;

    // Test 5 — Mes commandes (route protégée)
    const orders = http.get(`${BASE_URL}/api/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    check(orders, { 'orders ok': (r) => r.status === 200 });
  }

  sleep(1);
}