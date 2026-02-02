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
    mutationFn: () => adminApi.seed(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog'] });
      setMessage('Catalog synced!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.message || 'Error syncing catalog');
    },
  });

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading catalog
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">Admin Catalog</h1>
          <button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-6 py-2 rounded text-white font-semibold transition"
          >
            {seedMutation.isPending ? 'Syncing...' : '🔄 Sync Catalog'}
          </button>
        </div>

        {message && (
          <div className={`px-4 py-2 rounded mb-4 ${message.includes('Error') ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8 space-y-4">
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
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
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
          <div className="text-center text-cyan-400">Loading...</div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {data?.items.map((ship) => (
                    <tr key={ship.id} className="hover:bg-slate-800 transition">
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
                            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-1 rounded text-sm text-white transition"
                          >
                            Retire
                          </button>
                        ) : (
                          <button
                            onClick={() => activateMutation.mutate(ship.id)}
                            disabled={activateMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-1 rounded text-sm text-white transition"
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
