import { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/ui/Pagination';
import { Search, SlidersHorizontal } from 'lucide-react';

const ProductsPage = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters]       = useState({
    search: '', category: '', minPrice: '', maxPrice: '', sort: '-createdAt',
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, ...filters });
      Object.keys(filters).forEach((k) => !filters[k] && params.delete(k));
      const { data } = await api.get(`/api/products?${params}`);
      setProducts(data.data);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/api/categories').then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [page, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">Nos produits</h1>
        <p className="text-gray-500">Découvrez notre catalogue</p>
      </div>

      {/* Filtres */}
      <div className="p-4 mb-6 card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="">Toutes catégories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="-createdAt">Plus récents</option>
            <option value="price">Prix croissant</option>
            <option value="-price">Prix décroissant</option>
            <option value="-ratings.average">Mieux notés</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Prix min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="input-field w-28"
            />
            <input
              type="number"
              placeholder="Prix max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="input-field w-28"
            />
          </div>
        </div>
      </div>

      <ProductGrid products={products} loading={loading} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};
export default ProductsPage;