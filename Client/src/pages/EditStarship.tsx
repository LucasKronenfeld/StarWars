import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import type { UpdateMyStarshipRequest } from '../api/myStarshipsApi';
import { peopleApi } from '../api/peopleApi';
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

  const { data: people } = useQuery({
    queryKey: ['people'],
    queryFn: peopleApi.getAll,
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
        pilotId: ship.pilotId,
      });
    }
  }, [ship]);

  const mutation = useMutation({
    mutationFn: (data: UpdateMyStarshipRequest) => myStarshipsApi.update(Number(id), data),
    onSuccess: () => {
      toast.success('Ship updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      queryClient.invalidateQueries({ queryKey: ['my-starship', id] });
      navigate('/fleet');
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
    return <div className="min-h-screen text-yellow-400 flex items-center justify-center page-transition">Loading...</div>;
  }

  if (!ship) {
    return (
      <div className="min-h-screen text-red-400 flex items-center justify-center page-transition">
        Starship not found
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/fleet')}
          className="text-yellow-400 hover:text-yellow-300 mb-6 transition"
        >
          ← Back to Fleet
        </button>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">Edit: {ship.name}</h1>

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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Pilot
                </label>
                <select
                  value={formData.pilotId ?? ''}
                  onChange={(e) => handleChange('pilotId', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                >
                  <option value="">No pilot assigned</option>
                  {people?.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-semibold py-2 rounded-lg transition"
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/fleet')}
                className="flex-1 bg-black/40 hover:bg-black/60 border border-white/20 text-white font-semibold py-2 rounded-lg transition"
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
