import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductGrid from '../components/product/ProductGrid';
import { ArrowRight, ShoppingBag, Shield, Truck } from 'lucide-react';

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/api/products?featured=true&limit=8')
      .then(({ data }) => setFeatured(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <div className="p-8 text-center text-white bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl md:p-16">
        <h1 className="mb-4 text-3xl font-bold md:text-5xl">
          Bienvenue sur ShopMG
        </h1>
        <p className="max-w-xl mx-auto mb-8 text-lg text-primary-100">
          Découvrez des milliers de produits au meilleur prix, livrés rapidement partout à Madagascar.
        </p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 font-semibold transition-colors bg-white text-primary-700 rounded-xl hover:bg-primary-50">
          Voir les produits <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { icon: <Truck className="w-6 h-6" />, title: 'Livraison rapide', desc: 'Partout à Madagascar en 7 jours' },
          { icon: <Shield className="w-6 h-6" />, title: 'Paiement sécurisé', desc: 'MVola, Orange Money, carte bancaire' },
          { icon: <ShoppingBag className="w-6 h-6" />, title: 'Large catalogue', desc: 'Des milliers de produits disponibles' },
        ].map((f) => (
          <div key={f.title} className="flex items-start gap-4 card">
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">{f.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{f.title}</h3>
              <p className="text-gray-500 text-sm mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Produits en vedette */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Produits en vedette</h2>
          <Link to="/products" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ProductGrid products={featured} loading={loading} />
      </div>
    </div>
  );
};
export default HomePage;