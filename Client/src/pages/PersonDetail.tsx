import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { peopleApi } from '../api/peopleApi';

export function PersonDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: person, isLoading, error } = useQuery({
    queryKey: ['person', id],
    queryFn: () => peopleApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-yellow-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Person not found</div>
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
          <h1 className="text-4xl font-bold text-yellow-400 mb-6">{person.name}</h1>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {person.height && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Height</div>
                <div className="text-xl font-semibold">{person.height} cm</div>
              </div>
            )}
            {person.mass && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Mass</div>
                <div className="text-xl font-semibold">{person.mass} kg</div>
              </div>
            )}
            {person.gender && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Gender</div>
                <div className="text-xl font-semibold capitalize">{person.gender}</div>
              </div>
            )}
            {person.birthYear && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Birth Year</div>
                <div className="text-xl font-semibold">{person.birthYear}</div>
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {person.hairColor && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Hair Color</div>
                <div className="text-lg capitalize">{person.hairColor}</div>
              </div>
            )}
            {person.skinColor && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Skin Color</div>
                <div className="text-lg capitalize">{person.skinColor}</div>
              </div>
            )}
            {person.eyeColor && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Eye Color</div>
                <div className="text-lg capitalize">{person.eyeColor}</div>
              </div>
            )}
          </div>

          {/* Homeworld */}
          {person.homeworld && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Homeworld</h3>
              <Link
                to={`/planets/${person.homeworld.id}`}
                className="inline-block bg-slate-800 hover:bg-emerald-900 px-4 py-2 rounded text-emerald-400 hover:text-emerald-300 transition"
              >
                🌍 {person.homeworld.name}
              </Link>
            </div>
          )}

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {person.films.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Films ({person.films.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {person.films.map((film) => (
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

            {person.starships.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-cyan-400 font-semibold mb-3">Starships ({person.starships.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {person.starships.map((ship) => (
                    <Link
                      key={ship.id}
                      to={`/catalog/${ship.id}`}
                      className="bg-slate-700 hover:bg-cyan-900 px-3 py-1 rounded text-sm text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {ship.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {person.vehicles.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-orange-400 font-semibold mb-3">Vehicles ({person.vehicles.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {person.vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      to={`/vehicles/${vehicle.id}`}
                      className="bg-slate-700 hover:bg-orange-900 px-3 py-1 rounded text-sm text-orange-400 hover:text-orange-300 transition"
                    >
                      {vehicle.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {person.species.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-purple-400 font-semibold mb-3">Species ({person.species.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {person.species.map((species) => (
                    <Link
                      key={species.id}
                      to={`/species/${species.id}`}
                      className="bg-slate-700 hover:bg-purple-900 px-3 py-1 rounded text-sm text-purple-400 hover:text-purple-300 transition"
                    >
                      {species.name}
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
