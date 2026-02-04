import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { planetsApi } from '../api/planetsApi';
import { GlassCard } from '../components/GlassCard';

export function PlanetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: planet, isLoading, error } = useQuery({
    queryKey: ['planet', id],
    queryFn: () => planetsApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌍</div>
          <p className="text-emerald-400">Loading planet...</p>
        </div>
      </div>
    );
  }

  if (error || !planet) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Planet not found</p>
          <button onClick={() => navigate(-1)} className="text-emerald-400 hover:text-emerald-300">
            ← Go Back
          </button>
        </GlassCard>
      </div>
    );
  }

  const formatPopulation = (pop: number | undefined) => {
    if (!pop) return null;
    if (pop >= 1_000_000_000) return `${(pop / 1_000_000_000).toFixed(1)}B`;
    if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
    if (pop >= 1_000) return `${(pop / 1_000).toFixed(1)}K`;
    return pop.toLocaleString();
  };

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="text-emerald-400 hover:text-emerald-300 mb-6 inline-flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <GlassCard variant="green" className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-emerald-400 mb-2 text-shadow">{planet.name}</h1>
            <p className="text-gray-400">Planetary Data</p>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {planet.population && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Population</div>
                <div className="text-xl font-semibold text-white">{formatPopulation(planet.population)}</div>
              </div>
            )}
            {planet.diameter && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Diameter</div>
                <div className="text-xl font-semibold text-white">{planet.diameter.toLocaleString()} km</div>
              </div>
            )}
            {planet.rotationPeriod && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rotation</div>
                <div className="text-xl font-semibold text-white">{planet.rotationPeriod} hours</div>
              </div>
            )}
            {planet.orbitalPeriod && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Orbital Period</div>
                <div className="text-xl font-semibold text-white">{planet.orbitalPeriod} days</div>
              </div>
            )}
          </div>

          {/* Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {planet.climate && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Climate</div>
                <div className="text-lg text-white capitalize">{planet.climate}</div>
              </div>
            )}
            {planet.terrain && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Terrain</div>
                <div className="text-lg text-white capitalize">{planet.terrain}</div>
              </div>
            )}
            {planet.gravity && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Gravity</div>
                <div className="text-lg text-white">{planet.gravity}</div>
              </div>
            )}
            {planet.surfaceWater !== undefined && planet.surfaceWater !== null && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Surface Water</div>
                <div className="text-lg text-white">{planet.surfaceWater}%</div>
              </div>
            )}
          </div>

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planet.films.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🎬</span> Films ({planet.films.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {planet.films.map((film) => (
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

            {planet.residents.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>👤</span> Residents ({planet.residents.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {planet.residents.map((resident) => (
                    <Link
                      key={resident.id}
                      to={`/people/${resident.id}`}
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 
                               px-3 py-1.5 rounded-lg text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {resident.name}
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
