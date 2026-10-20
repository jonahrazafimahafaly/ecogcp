import ProductCard from './ProductCard';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';
import { ShoppingBag } from 'lucide-react';

const ProductGrid = ({ products, loading }) => {
  if (loading) return <Spinner size="lg" className="py-20" />;
  if (!products?.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="w-16 h-16 text-gray-300" />}
        title="Aucun produit trouvé"
        description="Essayez de modifier vos filtres de recherche"
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
export default ProductGrid;