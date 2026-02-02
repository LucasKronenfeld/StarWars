import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import type { UpdateMyStarshipRequest } from '../api/myStarshipsApi';
import { useToast } from '../contexts/ToastContext';

export function EditStarship() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formData, setFormData] = useState<UpdateMyStarshipRequest>({
    name: '',
  });
  const [error, setError] = useState('');

  const { data: ship, isLoading } = useQuery({
    queryKey: ['my-starship', id],
    queryFn: () => myStarshipsApi.getById(Number(id)),
    enabled: !!id,
  });

  useEffect(() => {
    if (ship) {
      setFormData({
        name: ship.name,
        model: ship.model,
        manufacturer: ship.manufacturer,
        starshipClass: ship.starshipClass,
        costInCredits: ship.costInCredits,
        length: ship.length,
        crew: ship.crew,
        passengers: ship.passengers,
        cargoCapacity: ship.cargoCapacity,
        hyperdriveRating: ship.hyperdriveRating,
        mglt: ship.mglt,
        consumables: ship.consumables,
      });
    }
  }, [ship]);

  const mutation = useMutation({
    mutationFn: (data: UpdateMyStarshipRequest) => myStarshipsApi.update(Number(id), data),
    onSuccess: () => {
      toast.success('Ship updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      queryClient.invalidateQueries({ queryKey: ['my-starship', id] });
      navigate('/hangar');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error updating starship');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    mutation.mutate(formData);
  };

  const handleChange = (field: keyof UpdateMyStarshipRequest, value: any) => {
    setFormData({
      ...formData,
      [field]: value === '' ? undefined : value,
    });
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center">Loading...</div>;
  }

  if (!ship) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Starship not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/hangar')}
          className="text-cyan-400 hover:text-cyan-300 mb-6"
        >
          ← Back to Hangar
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-6">Edit: {ship.name}</h1>

          {error && (
            <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-2 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={formData.model || ''}
                  onChange={(e) => handleChange('model', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer || ''}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Class
                </label>
                <input
                  type="text"
                  value={formData.starshipClass || ''}
                  onChange={(e) => handleChange('starshipClass', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Length (m)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.length || ''}
                  onChange={(e) => handleChange('length', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Crew
                </label>
                <input
                  type="number"
                  value={formData.crew || ''}
                  onChange={(e) => handleChange('crew', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Passengers
                </label>
                <input
                  type="number"
                  value={formData.passengers || ''}
                  onChange={(e) => handleChange('passengers', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cargo Capacity
                </label>
                <input
                  type="number"
                  value={formData.cargoCapacity || ''}
                  onChange={(e) => handleChange('cargoCapacity', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hyperdrive Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.hyperdriveRating || ''}
                  onChange={(e) => handleChange('hyperdriveRating', e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  MGLT
                </label>
                <input
                  type="number"
                  value={formData.mglt || ''}
                  onChange={(e) => handleChange('mglt', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Consumables
                </label>
                <input
                  type="text"
                  value={formData.consumables || ''}
                  onChange={(e) => handleChange('consumables', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded transition"
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/hangar')}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
