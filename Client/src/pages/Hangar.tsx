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
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading hangar
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400">My Hangar</h1>
          <button
            onClick={() => navigate('/hangar/new')}
            className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2"
          >
            ➕ Create New Ship
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-cyan-400 py-12">Loading hangar...</div>
        ) : data?.items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-6">Your hangar is empty.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/hangar/new')}
                className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg text-white font-semibold transition"
              >
                🚀 Create from scratch
              </button>
              <Link
                to="/catalog"
                className="border border-cyan-500 hover:border-cyan-400 px-6 py-3 rounded-lg text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                📦 Fork from Catalog
              </Link>
            </div>
          </div>
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
                    <tr key={ship.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <Link 
                          to={`/hangar/${ship.id}/edit`}
                          className="font-medium text-white hover:text-cyan-400 transition"
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
                          className="bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded text-sm text-white font-medium transition"
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
                          className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm text-white font-medium transition"
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
