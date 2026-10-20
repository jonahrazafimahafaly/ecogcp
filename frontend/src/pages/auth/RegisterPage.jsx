import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { registerUser } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../../components/ui/Spinner';
import { Package } from 'lucide-react';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, clearError } = useAuth();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); clearError(); }
  }, [error]);

  const onSubmit = (data) => {
    const { confirmPassword, ...userData } = data;
    dispatch(registerUser(userData));
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary-600 rounded-xl">
            <Package className="text-white h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="mt-1 text-gray-500">Rejoignez ShopMG</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Nom complet</label>
              <input
                {...register('name', { required: 'Nom requis', minLength: { value: 2, message: 'Minimum 2 caractères' } })}
                placeholder="Jean Dupont"
                className="input-field"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Email</label>
              <input
                {...register('email', { required: 'Email requis', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email invalide' } })}
                type="email"
                placeholder="vous@exemple.com"
                className="input-field"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Mot de passe</label>
              <input
                {...register('password', { required: 'Requis', minLength: { value: 6, message: 'Minimum 6 caractères' } })}
                type="password"
                placeholder="••••••••"
                className="input-field"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <input
                {...register('confirmPassword', {
                  required: 'Requis',
                  validate: (val) => val === watch('password') || 'Les mots de passe ne correspondent pas',
                })}
                type="password"
                placeholder="••••••••"
                className="input-field"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner size="sm" /> : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;