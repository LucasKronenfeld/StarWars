import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import type { AdminCatalogQuery } from '../api/adminApi';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';

export function AdminCatalog() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [seedKey, setSeedKey] = useState('');
  const [showDevControls, setShowDevControls] = useState(false);

  const query: AdminCatalogQuery = {
    page,
    pageSize: 25,
    includeInactive,
    search: search || undefined,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-catalog', query],
    queryFn: () => adminApi.getCatalogStarships(query),
  });

  // Get environment info
  const { data: envData } = useQuery({
    queryKey: ['admin-environment'],
    queryFn: () => adminApi.getEnvironment(),
  });

  const retireMutation = useMutation({
    mutationFn: (id: number) => adminApi.retireStarship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setMessage('Ship retired!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Error retiring ship');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => adminApi.activateStarship(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setMessage('Ship activated!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Error activating ship');
    },
  });

  const seedMutation = useMutation({
    mutationFn: () => adminApi.syncCatalog(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setMessage('Catalog synced successfully!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Error syncing catalog');
    },
  });

  const devWipeMutation = useMutation({
    mutationFn: () => adminApi.devWipeReseed(seedKey || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setMessage('Database wiped and reseeded!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || err.response?.data?.error || 'Error wiping and reseeding');
    },
  });

  if (error) {
    return (
      <div className="min-h-screen text-red-400 flex items-center justify-center page-transition">
        Error loading catalog
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 text-shadow">Admin Catalog</h1>
          <div className="flex gap-3">
            <button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 px-6 py-2 rounded-lg text-black font-semibold transition"
            >
              {seedMutation.isPending ? 'Syncing...' : '🔄 Sync Catalog'}
            </button>
            {envData?.isDevelopment && (
              <button
                onClick={() => setShowDevControls(!showDevControls)}
                className="bg-black/40 hover:bg-black/60 border border-yellow-500/50 hover:border-yellow-400 px-6 py-2 rounded-lg text-yellow-400 font-semibold transition"
              >
                ⚙️ Dev Tools
              </button>
            )}
          </div>
        </div>

        {/* Dev-only controls */}
        {envData?.isDevelopment && showDevControls && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-yellow-400 mb-4">⚠️ Development Tools</h2>
            <p className="text-yellow-200/80 mb-4">
              These actions are only available in Development mode. Use with caution!
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-yellow-200 mb-2">
                  Seed Key (optional)
                </label>
                <input
                  type="text"
                  value={seedKey}
                  onChange={(e) => setSeedKey(e.target.value)}
                  placeholder="Enter seed key if required..."
                  className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                />
              </div>
              <button
                onClick={() => {
                  if (confirm('⚠️ This will WIPE ALL DATA and reseed. Are you sure?')) {
                    devWipeMutation.mutate();
                  }
                }}
                disabled={devWipeMutation.isPending}
                className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400 disabled:bg-gray-600 px-6 py-2 rounded-lg text-red-400 font-semibold transition"
              >
                {devWipeMutation.isPending ? 'Wiping & Reseeding...' : '💥 Wipe & Reseed Database'}
              </button>
            </div>
          </div>
        )}

        {message && (
          <div className={`px-4 py-2 rounded mb-4 ${message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name..."
              className="w-full px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => {
                setIncludeInactive(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Include Inactive Ships</span>
          </label>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-yellow-400">Loading...</div>
        ) : (
          <>
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/30 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.items.map((ship) => (
                    <tr key={ship.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium">{ship.name}</td>
                      <td className="px-6 py-4 text-gray-400">{ship.manufacturer || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">{ship.starshipClass || '—'}</td>
                      <td className="px-6 py-4">
                        {ship.isActive ? (
                          <Badge label="Active" variant="success" />
                        ) : (
                          <Badge label="Retired" variant="danger" />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {ship.isActive ? (
                          <button
                            onClick={() => retireMutation.mutate(ship.id)}
                            disabled={retireMutation.isPending}
                            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400 disabled:bg-gray-600 px-4 py-1 rounded text-sm text-red-400 transition"
                          >
                            Retire
                          </button>
                        ) : (
                          <button
                            onClick={() => activateMutation.mutate(ship.id)}
                            disabled={activateMutation.isPending}
                            className="bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 hover:border-green-400 disabled:bg-gray-600 px-4 py-1 rounded text-sm text-green-400 transition"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              pageSize={25}
              totalCount={data?.totalCount || 0}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
