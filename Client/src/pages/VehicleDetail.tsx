import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';
import { GlassCard } from '../components/GlassCard';

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: vehicle, isLoading, error } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🚗</div>
          <p className="text-orange-400">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Vehicle not found</p>
          <button onClick={() => navigate(-1)} className="text-orange-400 hover:text-orange-300">
            ← Go Back
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="text-orange-400 hover:text-orange-300 mb-6 inline-flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <GlassCard className="p-8 border-orange-500/20 hover:border-orange-500/40">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-orange-400 mb-2 text-shadow">{vehicle.name}</h1>
            {vehicle.model && (
              <p className="text-gray-400 text-lg">{vehicle.model}</p>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {vehicle.vehicleClass && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Class</div>
                <div className="text-xl font-semibold text-white">{vehicle.vehicleClass}</div>
              </div>
            )}
            {vehicle.manufacturer && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Manufacturer</div>
                <div className="text-lg text-white">{vehicle.manufacturer}</div>
              </div>
            )}
            {vehicle.costInCredits && vehicle.costInCredits !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cost</div>
                <div className="text-xl font-semibold text-white">{Number(vehicle.costInCredits).toLocaleString()} credits</div>
              </div>
            )}
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {vehicle.length && vehicle.length !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Length</div>
                <div className="text-lg text-white">{vehicle.length}m</div>
              </div>
            )}
            {vehicle.maxAtmospheringSpeed && vehicle.maxAtmospheringSpeed !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Max Speed</div>
                <div className="text-lg text-white">{vehicle.maxAtmospheringSpeed}</div>
              </div>
            )}
            {vehicle.crew && vehicle.crew !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Crew</div>
                <div className="text-lg text-white">{vehicle.crew}</div>
              </div>
            )}
            {vehicle.passengers && vehicle.passengers !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Passengers</div>
                <div className="text-lg text-white">{vehicle.passengers}</div>
              </div>
            )}
            {vehicle.cargoCapacity && vehicle.cargoCapacity !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Cargo</div>
                <div className="text-lg text-white">{Number(vehicle.cargoCapacity).toLocaleString()} kg</div>
              </div>
            )}
            {vehicle.consumables && vehicle.consumables !== 'unknown' && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Consumables</div>
                <div className="text-lg text-white">{vehicle.consumables}</div>
              </div>
            )}
          </div>

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicle.films.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🎬</span> Films ({vehicle.films.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.films.map((film) => (
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

            {vehicle.pilots.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>👤</span> Pilots ({vehicle.pilots.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.pilots.map((pilot) => (
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
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
