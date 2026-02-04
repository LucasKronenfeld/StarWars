import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../api/fleetApi';
import { myStarshipsApi } from '../api/myStarshipsApi';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { AddToFleetModal } from '../components/AddToFleetModal';
import { useToast } from '../contexts/ToastContext';

type Tab = 'fleet' | 'hangar';

export function Fleet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('fleet');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [hangarPage, setHangarPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fleet data
  const { data: fleet, isLoading: fleetLoading, error: fleetError } = useQuery({
    queryKey: ['fleet'],
    queryFn: () => fleetApi.get(),
  });

  // Hangar data (custom ships)
  const { data: hangarData, isLoading: hangarLoading, error: hangarError } = useQuery({
    queryKey: ['my-starships', hangarPage],
    queryFn: () => myStarshipsApi.list({ page: hangarPage, pageSize: 25 }),
  });

  // Fleet mutations
  const updateFleetMutation = useMutation({
    mutationFn: (starshipId: number) =>
      fleetApi.updateItem(starshipId, {
        quantity: editQuantity,
      }),
    onSuccess: () => {
      toast.success('Fleet updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setEditingId(null);
    },
    onError: () => {
      toast.error('Failed to update fleet item.');
    },
  });

  const removeFromFleetMutation = useMutation({
    mutationFn: (starshipId: number) => fleetApi.removeItem(starshipId),
    onSuccess: () => {
      toast.success('Removed from fleet.');
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: () => {
      toast.error('Failed to remove item from fleet.');
    },
  });

  // Hangar mutations
  const deleteShipMutation = useMutation({
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

  const handleEdit = (starshipId: number, quantity: number) => {
    setEditingId(starshipId);
    setEditQuantity(quantity);
  };

  const formatCredits = (value?: number) => {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString();
  };

  const isLoading = activeTab === 'fleet' ? fleetLoading : hangarLoading;
  const error = activeTab === 'fleet' ? fleetError : hangarError;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading {activeTab}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400">Command Center</h1>
            <p className="text-gray-400 mt-1">Manage your fleet and custom ships</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2"
            >
              ➕ Add Ships
            </button>
            <button
              onClick={() => navigate('/ship-builder')}
              className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2"
            >
              🔧 Ship Builder
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg w-fit mb-6">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'fleet'
                ? 'bg-cyan-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🚀 My Fleet ({fleet?.items.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('hangar')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'hangar'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔧 Custom Hangar ({hangarData?.totalCount || 0})
          </button>
        </div>

        {isLoading ? (
          <div className="text-center text-cyan-400 py-12">Loading...</div>
        ) : activeTab === 'fleet' ? (
          /* Fleet Tab Content */
          fleet?.items.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-400 text-lg mb-6">Your fleet is empty.</p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/catalog"
                  className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-lg text-white font-semibold transition"
                >
                  📦 Browse Catalog
                </Link>
                <button
                  onClick={() => navigate('/ship-builder')}
                  className="border border-purple-500 hover:border-purple-400 px-6 py-3 rounded-lg text-purple-400 hover:text-purple-300 font-semibold transition"
                >
                  🔧 Build Custom Ship
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Pilot / Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {fleet?.items.map((item) => (
                    <tr key={item.starshipId} className="hover:bg-slate-800 transition">
                      <td className="px-6 py-4 font-medium">
                        <Link
                          to={item.isCatalog ? `/catalog/${item.starshipId}` : `/hangar/${item.starshipId}`}
                          className="text-white hover:text-cyan-400 transition"
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <Badge label={item.isCatalog ? 'Stock' : 'Custom'} variant={item.isCatalog ? 'info' : 'success'} />
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {item.pilotName && item.pilotId ? (
                          <Link
                            to={`/people/${item.pilotId}`}
                            className="text-yellow-400 hover:text-yellow-300 transition"
                          >
                            {item.pilotName}
                          </Link>
                        ) : (
                          item.starshipClass || '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{item.manufacturer || '—'}</td>
                      <td className="px-6 py-4">
                        {editingId === item.starshipId ? (
                          <input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white"
                          />
                        ) : (
                          <span>{item.quantity}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        {editingId === item.starshipId ? (
                          <>
                            <button
                              onClick={() => updateFleetMutation.mutate(item.starshipId)}
                              disabled={updateFleetMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm text-white transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-slate-600 hover:bg-slate-700 px-3 py-1 rounded text-sm text-white transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item.starshipId, item.quantity)}
                              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Remove from fleet?')) {
                                  removeFromFleetMutation.mutate(item.starshipId);
                                }
                              }}
                              disabled={removeFromFleetMutation.isPending}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm text-white transition"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Hangar Tab Content */
          hangarData?.items.length === 0 ? (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔧</div>
              <p className="text-gray-400 text-lg mb-6">Your hangar is empty. Build or fork some ships!</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/ship-builder')}
                  className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg text-white font-semibold transition"
                >
                  🔧 Build from Scratch
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
                      <th className="px-6 py-3 text-left text-sm font-semibold">Pilot</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {hangarData?.items.map((ship) => (
                      <tr key={ship.id} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-4">
                          <Link
                            to={`/hangar/${ship.id}`}
                            className="font-medium text-white hover:text-cyan-400 transition"
                          >
                            {ship.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-400">{ship.manufacturer || '—'}</td>
                        <td className="px-6 py-4 text-gray-400">{ship.starshipClass || '—'}</td>
                        <td className="px-6 py-4 text-gray-400">
                          {ship.pilotName ? (
                            <Link
                              to={`/people/${ship.pilotId}`}
                              className="text-yellow-400 hover:text-yellow-300 transition"
                            >
                              {ship.pilotName}
                            </Link>
                          ) : (
                            '—'
                          )}
                        </td>
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
                                deleteShipMutation.mutate(ship.id);
                              }
                            }}
                            disabled={deleteShipMutation.isPending}
                            className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm text-white font-medium transition"
                          >
                            {deleteShipMutation.isPending ? '...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={hangarPage}
                pageSize={25}
                totalCount={hangarData?.totalCount || 0}
                onPageChange={setHangarPage}
              />
            </>
          )
        )}

        {/* Add to Fleet Modal */}
        <AddToFleetModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          existingFleetShipIds={fleet?.items.map(item => item.starshipId) || []}
        />
      </div>
    </div>
  );
}