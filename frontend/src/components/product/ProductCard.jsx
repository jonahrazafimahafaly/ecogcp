import { Link } from 'react-router-dom';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const mainImage = product.images?.find((i) => i.isMain)?.url
    || product.images?.[0]?.url
    || 'https://placehold.co/400x300?text=No+Image';

  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="p-0 overflow-hidden transition-shadow duration-200 card group hover:shadow-md">
      {/* Image */}
      <Link to={`/products/${product.slug || product._id}`}>
        <div className="relative overflow-hidden bg-gray-100 aspect-square">
          <img
            src={mainImage}
            alt={product.name}
            className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute text-red-700 bg-red-100 top-2 left-2 badge">
              -{discount}%
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="px-3 py-1 text-sm font-medium text-white rounded bg-black/60">
                Rupture de stock
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Infos */}
      <div className="p-4">
        <Link to={`/products/${product.slug || product._id}`}>
          <h3 className="mb-1 font-medium text-gray-900 transition-colors line-clamp-2 hover:text-primary-600">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.ratings?.count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-600">
              {product.ratings.average} ({product.ratings.count})
            </span>
          </div>
        )}

        {/* Prix */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-semibold text-gray-900">
            {product.price.toLocaleString('fr-FR')} Ar
          </span>
          {discount > 0 && (
            <span className="text-sm text-gray-400 line-through">
              {product.comparePrice.toLocaleString('fr-FR')} Ar
            </span>
          )}
        </div>

        {/* Bouton panier */}
        <button
          onClick={() => addToCart(product)}
          disabled={product.stock === 0}
          className="flex items-center justify-center w-full gap-2 py-2 text-sm btn-primary"
        >
          <ShoppingCart className="w-4 h-4" />
          {product.stock === 0 ? 'Indisponible' : 'Ajouter au panier'}
        </button>
      </div>
    </div>
  );
};
export default ProductCard;