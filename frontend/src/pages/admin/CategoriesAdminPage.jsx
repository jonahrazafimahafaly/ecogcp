import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const CategoriesAdminPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/categories');
      setCategories(data.data);
    } catch {
      toast.error('Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    reset({ name: cat.name, description: cat.description });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/categories/${editing._id}`, data);
        toast.success('Catégorie mise à jour !');
      } else {
        await api.post('/api/categories', data);
        toast.success('Catégorie créée !');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      toast.success('Catégorie supprimée');
      fetchCategories();
    } catch {
      toast.error('Erreur suppression');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
          <p className="text-gray-500 text-sm mt-0.5">{categories.length} catégorie(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      {loading ? <Spinner size="lg" className="py-20" /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-gray-400">
              Aucune catégorie — créez-en une !
            </div>
          ) : categories.map((cat) => (
            <div key={cat._id} className="flex items-center justify-between card">
              <div>
                <p className="font-semibold text-gray-900">{cat.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{cat.description || 'Pas de description'}</p>
                <p className="mt-1 text-xs text-gray-400">/{cat.slug}</p>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg hover:bg-primary-50 text-primary-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 text-red-500 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white shadow-2xl rounded-2xl">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-lg font-bold">
                  {editing ? 'Modifier' : 'Nouvelle catégorie'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Nom</label>
                  <input
                    {...register('name', { required: 'Requis' })}
                    className="input-field"
                    placeholder="Ex: Électronique"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    {...register('description')}
                    className="resize-none input-field"
                    rows={3}
                    placeholder="Description..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 btn-secondary">
                    Annuler
                  </button>
                  <button type="submit" disabled={saving} className="flex-1 btn-primary">
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
export default CategoriesAdminPage;