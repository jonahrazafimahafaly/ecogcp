import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import { fetchMe } from './store/slices/authSlice';
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Pages publiques
import HomePage          from './pages/HomePage';
import ProductsPage      from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';

// Pages privées
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage   from './pages/OrdersPage';

// Pages admin
import DashboardPage       from './pages/admin/DashboardPage';
import ProductsAdminPage   from './pages/admin/ProductsAdminPage';
import CategoriesAdminPage from './pages/admin/CategoriesAdminPage';
import OrdersAdminPage     from './pages/admin/OrdersAdminPage';

// Auth
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin)         return <Navigate to="/" replace />;
  return children;
};

const AppInit = ({ children }) => {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      store.dispatch(fetchMe()).unwrap().catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
    }
  }, []);
  return children;
};

const App = () => (
  <Provider store={store}>
    <BrowserRouter>
      <AppInit>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Auth — sans layout */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Pages publiques */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
          <Route path="/products/:slug" element={<Layout><ProductDetailPage /></Layout>} />

          {/* Pages privées */}
          <Route path="/checkout" element={
            <PrivateRoute><Layout><CheckoutPage /></Layout></PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute><Layout><OrdersPage /></Layout></PrivateRoute>
          } />

          {/* Pages admin avec AdminLayout */}
          <Route path="/admin" element={
            <AdminRoute>
              <Layout><AdminLayout><DashboardPage /></AdminLayout></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/products" element={
            <AdminRoute>
              <Layout><AdminLayout><ProductsAdminPage /></AdminLayout></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <Layout><AdminLayout><CategoriesAdminPage /></AdminLayout></Layout>
            </AdminRoute>
          } />
          <Route path="/admin/orders" element={
            <AdminRoute>
              <Layout><AdminLayout><OrdersAdminPage /></AdminLayout></Layout>
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInit>
    </BrowserRouter>
  </Provider>
);

export default App;