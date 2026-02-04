import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { planetsApi } from '../api/planetsApi';

export function Planets() {
  const { data: planets, isLoading, error } = useQuery({
    queryKey: ['planets'],
    queryFn: planetsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-emerald-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading planets
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
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-emerald-400 mb-2 text-center">Planets</h1>
        <p className="text-gray-400 text-center mb-8">Worlds across the galaxy</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {planets?.map((planet) => (
            <Link
              key={planet.id}
              to={`/planets/${planet.id}`}
              className="bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-lg p-4 transition group"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">
                {planet.name}
              </h3>
              <div className="mt-2 text-sm text-gray-400 space-y-1">
                {planet.climate && <p className="capitalize">Climate: {planet.climate}</p>}
                {planet.terrain && <p className="capitalize">Terrain: {planet.terrain}</p>}
                {planet.population && <p>Population: {formatPopulation(planet.population)}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
