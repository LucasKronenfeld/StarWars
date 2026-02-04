import { useEffect } from 'react';
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🚀</div>
          <p className="text-cyan-400">Loading starship...</p>
        </div>
      </div>
    );
  }

  if (error || !ship) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Starship not found</p>
          <Link to="/catalog" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isRetired = false; // Catalog only shows active ships, but keeping for future

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/catalog"
          className="text-cyan-400 hover:text-cyan-300 mb-6 inline-flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Catalog
        </Link>

        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 hover:border-cyan-500/40 rounded-xl p-8 transition-all duration-300">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400 mb-2 text-shadow">{ship.name}</h1>
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
            <div className="bg-black/20 rounded-lg p-5 border border-white/5 mb-6">
              <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                <span>🎬</span> Appears in Films ({ship.films.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ship.films.map((film) => (
                  <Link
                    key={film.id}
                    to={`/films/${film.id}`}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 
                             px-3 py-1.5 rounded-lg text-sm text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {film.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Pilots Section */}
          {ship.pilots && ship.pilots.length > 0 && (
            <div className="bg-black/20 rounded-lg p-5 border border-white/5 mb-6">
              <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                <span>👤</span> Known Pilots ({ship.pilots.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ship.pilots.map((pilot) => (
                  <Link
                    key={pilot.id}
                    to={`/people/${pilot.id}`}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 
                             px-3 py-1.5 rounded-lg text-sm text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {pilot.name}
                  </Link>
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
            <div className="bg-black/30 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-6 mt-4">
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
    <div className={`bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5 ${className}`}>
      <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-medium text-white">{value || '—'}</p>
    </div>
  );
}
