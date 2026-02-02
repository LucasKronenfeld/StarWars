import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { starshipsApi } from '../api/starshipsApi';
import { fleetApi } from '../api/fleetApi';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Badge } from '../components/Badge';

export function StarshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const { data: ship, isLoading, error } = useQuery({
    queryKey: ['starship', id],
    queryFn: () => starshipsApi.getById(Number(id)),
    enabled: !!id,
  });

  const forkMutation = useMutation({
    mutationFn: () => starshipsApi.fork(Number(id), { addToFleet: true }),
    onSuccess: (result) => {
      toast.success('Fork created in your Hangar!');
      queryClient.invalidateQueries({ queryKey: ['my-starships'] });
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
      navigate(`/hangar/${result.id}/edit`);
    },
    onError: (err: any) => {
      if (err.response?.status === 401) {
        toast.error('Please log in to fork ships.');
      } else {
        toast.error('Failed to fork starship. Please try again.');
      }
    },
  });

  const addToFleetMutation = useMutation({
    mutationFn: () =>
      fleetApi.addItem({
        starshipId: Number(id),
        quantity: 1,
      }),
    onSuccess: () => {
      toast.success('Added to your fleet!');
      queryClient.invalidateQueries({ queryKey: ['fleet'] });
    },
    onError: (err: any) => {
      if (err.response?.status === 401) {
        toast.error('Please log in to add to fleet.');
      } else if (err.response?.status === 400) {
        toast.error(err.response?.data || 'Cannot add this ship to fleet.');
      } else {
        toast.error('Failed to add to fleet. Please try again.');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading starship...</div>
      </div>
    );
  }

  if (error || !ship) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-xl">Starship not found</div>
        <Link to="/catalog" className="text-cyan-400 hover:text-cyan-300">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isRetired = false; // Catalog only shows active ships, but keeping for future

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/catalog"
          className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block"
        >
          ← Back to Catalog
        </Link>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2">{ship.name}</h1>
              {ship.model && (
                <p className="text-gray-400">{ship.model}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Badge label="Stock" variant="info" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <StatItem label="Manufacturer" value={ship.manufacturer} />
            <StatItem label="Class" value={ship.starshipClass} />
            <StatItem 
              label="Cost" 
              value={ship.costInCredits ? `${ship.costInCredits.toLocaleString()} credits` : undefined} 
            />
            <StatItem 
              label="Length" 
              value={ship.length ? `${ship.length.toLocaleString()}m` : undefined} 
            />
            <StatItem label="Crew" value={ship.crew?.toLocaleString()} />
            <StatItem label="Passengers" value={ship.passengers?.toLocaleString()} />
            <StatItem 
              label="Cargo Capacity" 
              value={ship.cargoCapacity ? ship.cargoCapacity.toLocaleString() : undefined} 
            />
            <StatItem label="Hyperdrive Rating" value={ship.hyperdriveRating?.toString()} />
            <StatItem label="MGLT" value={ship.mglt?.toString()} />
            <StatItem label="Max Speed" value={ship.maxAtmospheringSpeed} />
            <StatItem label="Consumables" value={ship.consumables} className="md:col-span-2" />
          </div>

          {/* Films Section */}
          {ship.films && ship.films.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Appears in Films</h3>
              <div className="flex flex-wrap gap-2">
                {ship.films.map((film) => (
                  <Link
                    key={film.id}
                    to={`/films/${film.id}`}
                    className="bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700 px-3 py-1 rounded text-yellow-300 text-sm transition"
                  >
                    {film.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pilots Section */}
          {ship.pilots && ship.pilots.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Known Pilots</h3>
              <div className="flex flex-wrap gap-2">
                {ship.pilots.map((pilot) => (
                  <span
                    key={pilot.id}
                    className="bg-slate-800 px-3 py-1 rounded text-gray-300 text-sm"
                  >
                    {pilot.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {isAuthenticated ? (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => forkMutation.mutate()}
                disabled={forkMutation.isPending || isRetired}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2"
              >
                {forkMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span> Forking...
                  </>
                ) : (
                  <>🔧 Fork to Hangar</>
                )}
              </button>
              <button
                onClick={() => addToFleetMutation.mutate()}
                disabled={addToFleetMutation.isPending || isRetired}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-semibold transition flex items-center gap-2"
              >
                {addToFleetMutation.isPending ? (
                  <>
                    <span className="animate-spin">⏳</span> Adding...
                  </>
                ) : (
                  <>➕ Add to Fleet</>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 mt-4">
              <p className="text-gray-300 mb-4">
                <span className="text-yellow-400">Login required</span> to fork ships or add them to your fleet.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/login"
                  className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg text-white font-semibold transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="border border-gray-500 hover:border-gray-400 px-6 py-2 rounded-lg text-gray-300 hover:text-white transition"
                >
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatItem({ 
  label, 
  value, 
  className = '' 
}: { 
  label: string; 
  value?: string; 
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="text-lg font-medium">{value || '—'}</p>
    </div>
  );
}
