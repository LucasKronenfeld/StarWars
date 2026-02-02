import { useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fleetApi } from '../api/fleetApi';
import { Badge } from '../components/Badge';
import { useToast } from '../contexts/ToastContext';

export function Fleet() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editNickname, setEditNickname] = useState('');

  const { data: fleet, isLoading, error } = useQuery({
    queryKey: ['fleet'],
    queryFn: () => fleetApi.get(),
  });

  const updateMutation = useMutation({
    mutationFn: (starshipId: number) =>
      fleetApi.updateItem(starshipId, {
        quantity: editQuantity,
        nickname: editNickname || undefined,
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

  const removeMutation = useMutation({
    mutationFn: (starshipId: number) => fleetApi.removeItem(starshipId),
    onSuccess: () => {
      toast.success('Removed from fleet.');
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: () => {
      toast.error('Failed to remove item from fleet.');
    },
  });

  const handleEdit = (starshipId: number, quantity: number, nickname: string | undefined) => {
    setEditingId(starshipId);
    setEditQuantity(quantity);
    setEditNickname(nickname || '');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading fleet
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">My Fleet</h1>

        {fleet?.items.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            Your fleet is empty. Visit the catalog to add ships!
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-800 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nickname</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {fleet?.items.map((item) => (
                  <tr key={item.starshipId} className="hover:bg-slate-800 transition">
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-gray-400">
                      <Badge label={item.isCatalog ? 'Stock' : 'Custom'} variant={item.isCatalog ? 'info' : 'success'} />
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {!item.isActive && <Badge label="Retired" variant="danger" />}
                    </td>
                    <td className="px-6 py-4 text-gray-400">{item.nickname || '—'}</td>
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
                            onClick={() => updateMutation.mutate(item.starshipId)}
                            disabled={updateMutation.isPending}
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
                            onClick={() => handleEdit(item.starshipId, item.quantity, item.nickname)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm text-white transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Remove from fleet?')) {
                                removeMutation.mutate(item.starshipId);
                              }
                            }}
                            disabled={removeMutation.isPending}
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
        )}
      </div>
    </div>
  );
}
