import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import type { CreateMyStarshipRequest } from '../api/myStarshipsApi';
import { useToast } from '../contexts/ToastContext';

export function CreateStarship() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [formData, setFormData] = useState<CreateMyStarshipRequest>({
    name: '',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (data: CreateMyStarshipRequest) => myStarshipsApi.create(data),
    onSuccess: (result) => {
      toast.success('Ship created successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      navigate(`/hangar/${result.id}/edit`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Error creating starship');
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

  const handleChange = (field: keyof CreateMyStarshipRequest, value: any) => {
    setFormData({
      ...formData,
      [field]: value === '' ? undefined : value,
    });
  };

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/hangar')}
          className="text-yellow-400 hover:text-yellow-300 mb-6 transition"
        >
          ← Back to Hangar
        </button>

        <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-6">Create Custom Starship</h1>

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
                  placeholder="Millennium Falcon"
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
                  placeholder="YT-1300"
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
                  placeholder="Corellian Engineering"
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
                  placeholder="Light Freighter"
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
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                  placeholder="34.37"
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
                  placeholder="4"
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
                  placeholder="6"
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
                  placeholder="100000"
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
                  placeholder="0.5"
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
                  placeholder="75"
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
                  placeholder="2 months"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-semibold py-2 rounded-lg transition"
              >
                {mutation.isPending ? 'Creating...' : 'Create Ship'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/hangar')}
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
