import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { starshipsApi } from '../api/starshipsApi';
import { myStarshipsApi } from '../api/myStarshipsApi';
import { fleetApi } from '../api/fleetApi';
import { useToast } from '../contexts/ToastContext';
import { Badge } from './Badge';

interface AddToFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFleetShipIds: number[];
}

type ShipSource = 'catalog' | 'custom';

interface UnifiedShip {
  id: number;
  name: string;
  manufacturer?: string;
  starshipClass?: string;
  source: ShipSource;
  isForked: boolean;
  baseStarshipId?: number;
}

export function AddToFleetModal({ isOpen, onClose, existingFleetShipIds }: AddToFleetModalProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | ShipSource>('all');
  const [quantity, setQuantity] = useState(1);
  const [selectedShipId, setSelectedShipId] = useState<number | null>(null);

  // Load catalog ships
  const { data: catalogData, isLoading: catalogLoading } = useQuery({
    queryKey: ['catalog-ships-for-fleet'],
    queryFn: () => starshipsApi.list({ page: 1, pageSize: 1000 }),
    enabled: isOpen,
  });

  // Load user's custom ships
  const { data: customData, isLoading: customLoading } = useQuery({
    queryKey: ['custom-ships-for-fleet'],
    queryFn: () => myStarshipsApi.list({ page: 1, pageSize: 1000 }),
    enabled: isOpen,
  });

  const addToFleetMutation = useMutation({
    mutationFn: (data: { starshipId: number; quantity: number }) => 
      fleetApi.addItem(data),
    onSuccess: () => {
      toast.success('Added to fleet!');
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      setSelectedShipId(null);
      setQuantity(1);
      onClose();
    },
    onError: (err: any) => {
      if (err.response?.status === 400) {
        toast.error(err.response?.data || 'Cannot add this ship to fleet.');
      } else {
        toast.error('Failed to add to fleet. Please try again.');
      }
    },
  });

  // Combine and transform data
  const allShips = useMemo<UnifiedShip[]>(() => {
    const ships: UnifiedShip[] = [];

    // Add catalog ships
    if (catalogData?.items) {
      ships.push(
        ...catalogData.items.map((ship) => ({
          id: ship.id,
          name: ship.name,
          manufacturer: ship.manufacturer,
          starshipClass: ship.starshipClass,
          source: 'catalog' as ShipSource,
          isForked: false,
        }))
      );
    }

    // Add custom ships
    if (customData?.items) {
      ships.push(
        ...customData.items.map((ship) => ({
          id: ship.id,
          name: ship.name,
          manufacturer: ship.manufacturer,
          starshipClass: ship.starshipClass,
          source: 'custom' as ShipSource,
          isForked: !!ship.baseStarshipId,
          baseStarshipId: ship.baseStarshipId,
        }))
      );
    }

    return ships;
  }, [catalogData, customData]);

  // Filter ships
  const filteredShips = useMemo(() => {
    return allShips.filter((ship) => {
      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          ship.name.toLowerCase().includes(term) ||
          ship.manufacturer?.toLowerCase().includes(term) ||
          ship.starshipClass?.toLowerCase().includes(term);
        if (!matchesSearch) return false;
      }

      // Filter by source
      if (sourceFilter !== 'all' && ship.source !== sourceFilter) {
        return false;
      }

      return true;
    });
  }, [allShips, searchTerm, sourceFilter]);

  const handleAddToFleet = () => {
    if (selectedShipId) {
      addToFleetMutation.mutate({ starshipId: selectedShipId, quantity });
    }
  };

  const isLoading = catalogLoading || customLoading;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black/80 backdrop-blur-md border border-yellow-500/20 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-yellow-400">Add Ships to Fleet</h2>
              <p className="text-gray-400 text-sm mt-1">
                Select from catalog ships, your custom ships, or forked designs
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ships..."
              className="flex-1 min-w-[200px] px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
            />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as typeof sourceFilter)}
              className="px-4 py-2 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
            >
              <option value="all">All Sources</option>
              <option value="catalog">Catalog Only</option>
              <option value="custom">Custom Only</option>
            </select>
          </div>
        </div>

        {/* Ship List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center text-yellow-400 py-12">Loading ships...</div>
          ) : filteredShips.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              No ships found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShips.map((ship) => {
                const isInFleet = existingFleetShipIds.includes(ship.id);
                const isSelected = selectedShipId === ship.id;

                return (
                  <div
                    key={`${ship.source}-${ship.id}`}
                    role="button"
                    tabIndex={isInFleet ? -1 : 0}
                    onClick={() => {
                      if (!isInFleet) setSelectedShipId(ship.id);
                    }}
                    onKeyDown={(e) => {
                      if (!isInFleet && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        setSelectedShipId(ship.id);
                      }
                    }}
                    className={`text-left p-4 rounded-lg border-2 transition ${
                      isInFleet
                        ? 'bg-black/30 border-white/10 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-yellow-500/10 border-yellow-500/50 cursor-pointer'
                        : 'bg-black/40 border-white/10 hover:border-white/30 cursor-pointer'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{ship.name}</h3>
                      <div className="flex gap-1">
                        {ship.source === 'catalog' ? (
                          <Badge label="Stock" variant="info" />
                        ) : ship.isForked ? (
                          <Badge label="Forked" variant="warning" />
                        ) : (
                          <Badge label="Custom" variant="success" />
                        )}
                        {isInFleet && <Badge label="In Fleet" variant="info" />}
                      </div>
                    </div>
                    {ship.manufacturer && (
                      <p className="text-sm text-gray-400">{ship.manufacturer}</p>
                    )}
                    {ship.starshipClass && (
                      <p className="text-sm text-gray-500">{ship.starshipClass}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with quantity and action buttons */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-300">Quantity:</label>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={!selectedShipId}
                className="w-20 px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50 disabled:opacity-50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/30 rounded-lg text-white font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToFleet}
                disabled={!selectedShipId || addToFleetMutation.isPending}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-black font-semibold transition"
              >
                {addToFleetMutation.isPending ? 'Adding...' : 'Add to Fleet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
