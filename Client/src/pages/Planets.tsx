import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { planetsApi } from '../api/planetsApi';
import { GlassCard } from '../components/GlassCard';

export function Planets() {
  const { data: planets, isLoading, error } = useQuery({
    queryKey: ['planets'],
    queryFn: planetsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🌍</div>
          <p className="text-emerald-400">Loading planets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Error loading planets</p>
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 mt-4 inline-block">
            ← Back to Home
          </Link>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-emerald-400 mb-2 text-shadow">Planets</h1>
          <p className="text-gray-400">Worlds across the galaxy</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {planets?.map((planet) => (
            <Link
              key={planet.id}
              to={`/planets/${planet.id}`}
            >
              <GlassCard 
                variant="green" 
                className="p-4 h-full group"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">
                  {planet.name}
                </h3>
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  {planet.climate && <p className="capitalize">Climate: {planet.climate}</p>}
                  {planet.terrain && <p className="capitalize">Terrain: {planet.terrain}</p>}
                  {planet.population && <p>Population: {formatPopulation(planet.population)}</p>}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
