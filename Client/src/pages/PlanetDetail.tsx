import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { planetsApi } from '../api/planetsApi';

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
      <div className="min-h-screen bg-slate-950 text-emerald-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !planet) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Planet not found</div>
        <button onClick={() => navigate(-1)} className="text-emerald-400 hover:text-emerald-300">
          ← Back
        </button>
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
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-emerald-400 hover:text-emerald-300 mb-6 inline-block">
          ← Back
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-emerald-400 mb-6">{planet.name}</h1>

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {planet.population && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Population</div>
                <div className="text-xl font-semibold">{formatPopulation(planet.population)}</div>
              </div>
            )}
            {planet.diameter && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Diameter</div>
                <div className="text-xl font-semibold">{planet.diameter.toLocaleString()} km</div>
              </div>
            )}
            {planet.rotationPeriod && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Rotation Period</div>
                <div className="text-xl font-semibold">{planet.rotationPeriod} hours</div>
              </div>
            )}
            {planet.orbitalPeriod && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Orbital Period</div>
                <div className="text-xl font-semibold">{planet.orbitalPeriod} days</div>
              </div>
            )}
          </div>

          {/* Environment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {planet.climate && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Climate</div>
                <div className="text-lg capitalize">{planet.climate}</div>
              </div>
            )}
            {planet.terrain && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Terrain</div>
                <div className="text-lg capitalize">{planet.terrain}</div>
              </div>
            )}
            {planet.gravity && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Gravity</div>
                <div className="text-lg">{planet.gravity}</div>
              </div>
            )}
            {planet.surfaceWater !== undefined && planet.surfaceWater !== null && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Surface Water</div>
                <div className="text-lg">{planet.surfaceWater}%</div>
              </div>
            )}
          </div>

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {planet.films.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Films ({planet.films.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {planet.films.map((film) => (
                    <Link
                      key={film.id}
                      to={`/films/${film.id}`}
                      className="bg-slate-700 hover:bg-yellow-900 px-3 py-1 rounded text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {film.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {planet.residents.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Residents ({planet.residents.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {planet.residents.map((resident) => (
                    <Link
                      key={resident.id}
                      to={`/people/${resident.id}`}
                      className="bg-slate-700 hover:bg-yellow-900 px-3 py-1 rounded text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {resident.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
