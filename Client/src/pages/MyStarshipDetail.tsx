import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { myStarshipsApi } from '../api/myStarshipsApi';
import { Badge } from '../components/Badge';

export function MyStarshipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: ship, isLoading, error } = useQuery({
    queryKey: ['my-starship', id],
    queryFn: () => myStarshipsApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 text-cyan-400 flex items-center justify-center">Loading...</div>;
  }

  if (error || !ship) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Starship not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/fleet')}
          className="text-cyan-400 hover:text-cyan-300 mb-6"
        >
          ← Back to Fleet
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-cyan-400">{ship.name}</h1>
              {ship.model && <p className="text-gray-400 mt-1">{ship.model}</p>}
              {ship.manufacturer && <p className="text-gray-500">{ship.manufacturer}</p>}
            </div>
            <div className="flex gap-2">
              <Badge label={ship.baseStarshipId ? 'Forked' : 'Custom'} variant={ship.baseStarshipId ? 'warning' : 'success'} />
              {!ship.isActive && <Badge label="Inactive" variant="danger" />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Class</div>
              <div className="text-lg font-semibold">{ship.starshipClass || '—'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Cost</div>
              <div className="text-lg font-semibold">
                {ship.costInCredits !== undefined && ship.costInCredits !== null
                  ? `${ship.costInCredits.toLocaleString()} credits`
                  : '—'}
              </div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Pilot</div>
              <div className="text-lg font-semibold">
                {ship.pilotName && ship.pilotId ? (
                  <Link
                    to={`/people/${ship.pilotId}`}
                    className="text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {ship.pilotName}
                  </Link>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Length</div>
              <div className="text-lg font-semibold">{ship.length?.toLocaleString() || '—'} m</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Crew</div>
              <div className="text-lg font-semibold">{ship.crew?.toLocaleString() || '—'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Passengers</div>
              <div className="text-lg font-semibold">{ship.passengers?.toLocaleString() || '—'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Cargo</div>
              <div className="text-lg font-semibold">{ship.cargoCapacity?.toLocaleString() || '—'} kg</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">Hyperdrive</div>
              <div className="text-lg font-semibold">{ship.hyperdriveRating ?? '—'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4">
              <div className="text-xs text-gray-500 uppercase">MGLT</div>
              <div className="text-lg font-semibold">{ship.mglt ?? '—'}</div>
            </div>
            <div className="bg-slate-800/70 rounded-lg p-4 md:col-span-3">
              <div className="text-xs text-gray-500 uppercase">Consumables</div>
              <div className="text-lg font-semibold">{ship.consumables || '—'}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate(`/hangar/${ship.id}/edit`)}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg text-white font-semibold transition"
            >
              Edit Ship
            </button>
            {ship.baseStarshipId && (
              <Link
                to={`/catalog/${ship.baseStarshipId}`}
                className="border border-cyan-500 hover:border-cyan-400 px-6 py-2 rounded-lg text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                View Base Catalog Ship
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
