import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { useToast } from '../contexts/ToastContext';

export function Hangar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-starships', page],
    queryFn: () => myStarshipsApi.list({ page, pageSize: 25 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => myStarshipsApi.delete(id),
    onSuccess: () => {
      toast.success('Ship deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: () => {
      toast.error('Failed to delete ship.');
    },
  });

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-400 text-lg">Error loading hangar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 text-shadow">My Hangar</h1>
          <button
            onClick={() => navigate('/hangar/new')}
            className="bg-yellow-500 hover:bg-yellow-400 px-6 py-3 rounded-lg text-black font-semibold transition flex items-center gap-2"
          >
            ➕ Create New Ship
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">🔧</div>
              <p className="text-yellow-400">Loading hangar...</p>
            </div>
          </div>
        ) : data?.items.length === 0 ? (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-6">Your hangar is empty.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/hangar/new')}
                className="bg-yellow-500 hover:bg-yellow-400 px-6 py-3 rounded-lg text-black font-semibold transition"
              >
                🚀 Create from scratch
              </button>
              <Link
                to="/catalog"
                className="border border-yellow-500/50 hover:border-yellow-400 px-6 py-3 rounded-lg text-yellow-400 hover:text-yellow-300 font-semibold transition"
              >
                📦 Fork from Catalog
              </Link>
            </div>
          </div>
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
                      <td className="px-6 py-4">
                        <Link 
                          to={`/hangar/${ship.id}/edit`}
                          className="font-medium text-white hover:text-yellow-400 transition"
                        >
                          {ship.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{ship.manufacturer || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">{ship.starshipClass || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge label="Custom" variant="success" />
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => navigate(`/hangar/${ship.id}/edit`)}
                          className="bg-black/40 hover:bg-black/60 border border-yellow-500/50 hover:border-yellow-400 px-4 py-1.5 rounded text-sm text-yellow-400 font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this ship? This cannot be undone.')) {
                              deleteMutation.mutate(ship.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400 disabled:bg-gray-600 disabled:border-gray-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm text-red-400 font-medium transition"
                        >
                          {deleteMutation.isPending ? '...' : 'Delete'}
                        </button>
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
