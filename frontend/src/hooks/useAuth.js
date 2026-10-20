import { useSelector, useDispatch } from 'react-redux';
import { logout, clearError } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state) => state.auth
  );
  return {
    user,
    isAuthenticated,
    loading,
    error,
    isAdmin: user?.role === 'admin',
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
  };
};