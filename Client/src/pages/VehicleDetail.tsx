import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';

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
      <div className="min-h-screen bg-slate-950 text-orange-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚗</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Vehicle not found</div>
        <button onClick={() => navigate(-1)} className="text-cyan-400 hover:text-cyan-300">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-cyan-400 hover:text-cyan-300 mb-6 inline-block">
          ← Back
        </button>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-8">
          <h1 className="text-4xl font-bold text-orange-400 mb-2">{vehicle.name}</h1>
          {vehicle.model && (
            <p className="text-gray-400 text-lg mb-6">{vehicle.model}</p>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {vehicle.vehicleClass && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Class</div>
                <div className="text-xl font-semibold">{vehicle.vehicleClass}</div>
              </div>
            )}
            {vehicle.manufacturer && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Manufacturer</div>
                <div className="text-lg">{vehicle.manufacturer}</div>
              </div>
            )}
            {vehicle.costInCredits && vehicle.costInCredits !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Cost</div>
                <div className="text-xl font-semibold">{Number(vehicle.costInCredits).toLocaleString()} credits</div>
              </div>
            )}
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {vehicle.length && vehicle.length !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Length</div>
                <div className="text-lg">{vehicle.length}m</div>
              </div>
            )}
            {vehicle.maxAtmospheringSpeed && vehicle.maxAtmospheringSpeed !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Max Speed</div>
                <div className="text-lg">{vehicle.maxAtmospheringSpeed}</div>
              </div>
            )}
            {vehicle.crew && vehicle.crew !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Crew</div>
                <div className="text-lg">{vehicle.crew}</div>
              </div>
            )}
            {vehicle.passengers && vehicle.passengers !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Passengers</div>
                <div className="text-lg">{vehicle.passengers}</div>
              </div>
            )}
            {vehicle.cargoCapacity && vehicle.cargoCapacity !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Cargo Capacity</div>
                <div className="text-lg">{Number(vehicle.cargoCapacity).toLocaleString()} kg</div>
              </div>
            )}
            {vehicle.consumables && vehicle.consumables !== 'unknown' && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Consumables</div>
                <div className="text-lg">{vehicle.consumables}</div>
              </div>
            )}
          </div>

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vehicle.films.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Films ({vehicle.films.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.films.map((film) => (
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

            {vehicle.pilots.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Pilots ({vehicle.pilots.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {vehicle.pilots.map((pilot) => (
                    <Link
                      key={pilot.id}
                      to={`/people/${pilot.id}`}
                      className="bg-slate-700 hover:bg-yellow-900 px-3 py-1 rounded text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {pilot.name}
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
