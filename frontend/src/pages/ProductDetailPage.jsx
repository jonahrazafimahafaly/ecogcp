import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, Package, Truck, Shield } from 'lucide-react';
import api from '../api/axios';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity]     = useState(1);
  const [review, setReview]         = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Essaie d'abord par slug, sinon par ID
        const endpoint = slug.match(/^[0-9a-fA-F]{24}$/)
          ? `/api/products/${slug}`
          : `/api/products/slug/${slug}`;
        const { data } = await api.get(endpoint);
        setProduct(data.data);
      } catch {
        toast.error('Produit introuvable');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) addToCart(product);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Connectez-vous pour laisser un avis');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/products/${product._id}/reviews`, {
        ...review,
        userName: 'Vous',
      });
      setProduct(data.data);
      setReview({ rating: 5, comment: '' });
      toast.success('Avis ajouté !');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner size="lg" className="py-32" />;
  if (!product) return null;

  const mainImage = product.images?.[selectedImage]?.url
    || 'https://placehold.co/600x500?text=No+Image';

  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div>
      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid grid-cols-1 gap-10 mb-12 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-3">
          <div className="overflow-hidden bg-gray-100 aspect-square rounded-2xl">
            <img
              src={mainImage}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 pb-1 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? 'border-primary-600' : 'border-gray-200'
                  }`}
                >
                  <img src={img.url} alt="" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Infos produit */}
        <div className="space-y-5">
          {/* Catégorie */}
          {product.category && (
            <span className="badge bg-primary-50 text-primary-700">
              {product.category.name}
            </span>
          )}

          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          {/* Rating */}
          {product.ratings?.count > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= product.ratings.average
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.ratings.average}/5 ({product.ratings.count} avis)
              </span>
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              {product.price.toLocaleString('fr-FR')} Ar
            </span>
            {discount > 0 && (
              <>
                <span className="text-lg text-gray-400 line-through">
                  {product.comparePrice.toLocaleString('fr-FR')} Ar
                </span>
                <span className="text-red-700 bg-red-100 badge">-{discount}%</span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="leading-relaxed text-gray-600">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              product.stock > 10 ? 'bg-green-500' :
              product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {product.stock === 0
                ? 'Rupture de stock'
                : product.stock <= 10
                ? `Plus que ${product.stock} en stock`
                : 'En stock'}
            </span>
          </div>

          {/* Quantité + Panier */}
          {product.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center overflow-hidden border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 font-medium transition-colors hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 font-medium transition-colors hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                className="btn-primary flex items-center gap-2 flex-1 justify-center py-2.5"
              >
                <ShoppingCart className="w-4 h-4" />
                Ajouter au panier
              </button>
            </div>
          )}

          {/* Garanties */}
          <div className="pt-5 space-y-3 border-t">
            {[
              { icon: <Truck className="w-4 h-4" />,    text: 'Livraison en 7 jours partout à Madagascar' },
              { icon: <Shield className="w-4 h-4" />,   text: 'Paiement 100% sécurisé' },
              { icon: <Package className="w-4 h-4" />,  text: 'Retours acceptés sous 30 jours' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-primary-600">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Avis */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Liste des avis */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Avis clients ({product.reviews?.length || 0})
          </h2>
          {product.reviews?.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun avis pour l'instant.</p>
          ) : (
            <div className="space-y-4">
              {product.reviews.map((r, i) => (
                <div key={i} className="p-4 card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{r.userName}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulaire avis */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-gray-900">Laisser un avis</h2>
          <div className="card">
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Note</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReview((r) => ({ ...r, rating: s }))}
                    >
                      <Star className={`h-7 w-7 transition-colors ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Commentaire</label>
                <textarea
                  value={review.comment}
                  onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
                  rows={4}
                  placeholder="Partagez votre expérience..."
                  className="resize-none input-field"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary"
              >
                {submitting ? <Spinner size="sm" /> : 'Publier mon avis'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetailPage;