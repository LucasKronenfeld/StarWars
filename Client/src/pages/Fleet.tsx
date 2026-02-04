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

  const isLoading = activeTab === 'fleet' ? fleetLoading : hangarLoading;
  const error = activeTab === 'fleet' ? fleetError : hangarError;

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-400 text-lg">Error loading {activeTab}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-7xl mx-auto">
        {/* Header with tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-yellow-400 text-shadow">Command Center</h1>
            <p className="text-gray-400 mt-1">Manage your fleet and custom ships</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-400 px-6 py-3 rounded-lg text-black font-semibold transition flex items-center gap-2"
            >
              ➕ Add Ships
            </button>
            <button
              onClick={() => navigate('/ship-builder')}
              className="bg-black/40 hover:bg-black/60 border border-yellow-500/50 hover:border-yellow-400 px-6 py-3 rounded-lg text-yellow-400 hover:text-yellow-300 font-semibold transition flex items-center gap-2"
            >
              🔧 Ship Builder
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-black/40 backdrop-blur-md p-1 rounded-lg w-fit mb-6 border border-white/10">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'fleet'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🚀 My Fleet ({fleet?.items.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('hangar')}
            className={`px-6 py-2 rounded-md font-medium transition ${
              activeTab === 'hangar'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            🔧 Custom Hangar ({hangarData?.totalCount || 0})
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">🚀</div>
              <p className="text-yellow-400">Loading...</p>
            </div>
          </div>
        ) : activeTab === 'fleet' ? (
          /* Fleet Tab Content */
          fleet?.items.length === 0 ? (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-gray-400 text-lg mb-6">Your fleet is empty.</p>
              <div className="flex justify-center gap-4">
                <Link
                  to="/catalog"
                  className="bg-yellow-500 hover:bg-yellow-400 px-6 py-3 rounded-lg text-black font-semibold transition"
                >
                  📦 Browse Catalog
                </Link>
                <button
                  onClick={() => navigate('/ship-builder')}
                  className="border border-yellow-500/50 hover:border-yellow-400 px-6 py-3 rounded-lg text-yellow-400 hover:text-yellow-300 font-semibold transition"
                >
                  🔧 Build Custom Ship
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/30 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Pilot / Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Quantity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fleet?.items.map((item) => (
                    <tr key={item.starshipId} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4 font-medium">
                        <Link
                          to={item.isCatalog ? `/catalog/${item.starshipId}` : `/hangar/${item.starshipId}`}
                          className="text-white hover:text-yellow-400 transition"
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
                            className="w-16 px-2 py-1 bg-black/40 border border-white/20 rounded text-white focus:border-yellow-500/50"
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
                              className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 px-3 py-1 rounded text-sm text-black font-medium transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="bg-black/40 hover:bg-black/60 border border-white/20 px-3 py-1 rounded text-sm text-white transition"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(item.starshipId, item.quantity)}
                              className="bg-black/40 hover:bg-black/60 border border-yellow-500/50 hover:border-yellow-400 px-3 py-1 rounded text-sm text-yellow-400 transition"
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
                              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400 disabled:bg-gray-600 px-3 py-1 rounded text-sm text-red-400 transition"
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
            <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔧</div>
              <p className="text-gray-400 text-lg mb-6">Your hangar is empty. Build or fork some ships!</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => navigate('/ship-builder')}
                  className="bg-yellow-500 hover:bg-yellow-400 px-6 py-3 rounded-lg text-black font-semibold transition"
                >
                  🔧 Build from Scratch
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
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Pilot</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {hangarData?.items.map((ship) => (
                      <tr key={ship.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <Link
                            to={`/hangar/${ship.id}`}
                            className="font-medium text-white hover:text-yellow-400 transition"
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
                            className="bg-black/40 hover:bg-black/60 border border-yellow-500/50 hover:border-yellow-400 px-4 py-1.5 rounded text-sm text-yellow-400 font-medium transition"
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
                            className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 hover:border-red-400 disabled:bg-gray-600 disabled:border-gray-600 disabled:cursor-not-allowed px-4 py-1.5 rounded text-sm text-red-400 font-medium transition"
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