import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Package } from 'lucide-react';

const EMPTY_FORM = {
  name: '', description: '', price: '', comparePrice: '',
  stock: '', category: '', isFeatured: false,
  images: [{ url: '', isMain: true }],
};

const ProductsAdminPage = () => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get('/api/products?limit=100'),
        api.get('/api/categories'),
      ]);
      setProducts(p.data.data);
      setCategories(c.data.data);
    } catch (err) {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    reset({
      name:         product.name,
      description:  product.description,
      price:        product.price,
      comparePrice: product.comparePrice || '',
      stock:        product.stock,
      category:     product.category?._id || product.category,
      isFeatured:   product.isFeatured,
      imageUrl:     product.images?.[0]?.url || '',
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        name:         data.name,
        description:  data.description,
        price:        Number(data.price),
        comparePrice: Number(data.comparePrice) || 0,
        stock:        Number(data.stock),
        category:     data.category,
        isFeatured:   data.isFeatured,
        images:       [{ url: data.imageUrl || 'https://placehold.co/400x400?text=Produit', isMain: true }],
      };

      if (editing) {
        await api.put(`/api/products/${editing._id}`, payload);
        toast.success('Produit mis à jour !');
      } else {
        await api.post('/api/products', payload);
        toast.success('Produit créé !');
      }

      setShowModal(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Produit supprimé');
      fetchAll();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des produits</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} produit(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      {loading ? <Spinner size="lg" className="py-20" /> : (
        <div className="p-0 overflow-hidden card">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="p-4 font-medium text-left text-gray-600">Produit</th>
                <th className="p-4 font-medium text-left text-gray-600">Catégorie</th>
                <th className="p-4 font-medium text-left text-gray-600">Prix</th>
                <th className="p-4 font-medium text-left text-gray-600">Stock</th>
                <th className="p-4 font-medium text-left text-gray-600">Vedette</th>
                <th className="p-4 font-medium text-right text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Aucun produit — créez-en un !
                  </td>
                </tr>
              ) : products.map((p) => (
                <tr key={p._id} className="transition-colors hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images?.[0]?.url || 'https://placehold.co/48x48'}
                        alt={p.name}
                        className="flex-shrink-0 object-cover w-10 h-10 rounded-lg"
                      />
                      <span className="font-medium text-gray-900 line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{p.category?.name || '—'}</td>
                  <td className="p-4 font-medium">{Number(p.price).toLocaleString('fr-FR')} Ar</td>
                  <td className="p-4">
                    <span className={`badge ${
                      p.stock === 0 ? 'bg-red-100 text-red-700' :
                      p.stock <= 10 ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`badge ${p.isFeatured ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isFeatured ? 'Oui' : 'Non'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 transition-colors rounded-lg hover:bg-primary-50 text-primary-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-2 text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Créer/Modifier */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-bold">
                  {editing ? 'Modifier le produit' : 'Nouveau produit'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Nom du produit</label>
                  <input
                    {...register('name', { required: 'Requis' })}
                    className="input-field"
                    placeholder="Ex: iPhone 15 Pro"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description', { required: 'Requis' })}
                    className="resize-none input-field"
                    rows={3}
                    placeholder="Description du produit..."
                  />
                  {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Prix (Ar)</label>
                    <input
                      {...register('price', { required: 'Requis', min: { value: 0, message: 'Invalide' } })}
                      type="number"
                      className="input-field"
                      placeholder="50000"
                    />
                    {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Prix barré (Ar)</label>
                    <input
                      {...register('comparePrice')}
                      type="number"
                      className="input-field"
                      placeholder="70000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Stock</label>
                    <input
                      {...register('stock', { required: 'Requis', min: { value: 0, message: 'Invalide' } })}
                      type="number"
                      className="input-field"
                      placeholder="100"
                    />
                    {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">Catégorie</label>
                    <select
                      {...register('category', { required: 'Requis' })}
                      className="input-field"
                    >
                      <option value="">Choisir...</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                    {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">URL de l'image</label>
                  <input
                    {...register('imageUrl')}
                    className="input-field"
                    placeholder="https://exemple.com/image.jpg"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    {...register('isFeatured')}
                    type="checkbox"
                    id="isFeatured"
                    className="w-4 h-4 rounded text-primary-600"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">
                    Mettre en vedette sur la page d'accueil
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 btn-primary"
                  >
                    {saving ? <Spinner size="sm" /> : editing ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ProductsAdminPage;