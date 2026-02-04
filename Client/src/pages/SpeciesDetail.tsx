import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { speciesApi } from '../api/speciesApi';

export function SpeciesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: species, isLoading, error } = useQuery({
    queryKey: ['species', id],
    queryFn: () => speciesApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-purple-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧬</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Species not found</div>
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
          <h1 className="text-4xl font-bold text-purple-400 mb-6">{species.name}</h1>

          {/* Classification Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {species.classification && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Classification</div>
                <div className="text-xl font-semibold capitalize">{species.classification}</div>
              </div>
            )}
            {species.designation && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Designation</div>
                <div className="text-xl font-semibold capitalize">{species.designation}</div>
              </div>
            )}
            {species.language && (
              <div className="bg-slate-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm">Language</div>
                <div className="text-xl font-semibold">{species.language}</div>
              </div>
            )}
          </div>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {species.averageHeight && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Average Height</div>
                <div className="text-lg">{species.averageHeight} cm</div>
              </div>
            )}
            {species.averageLifespan && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Average Lifespan</div>
                <div className="text-lg">{species.averageLifespan} years</div>
              </div>
            )}
            {species.skinColors && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Skin Colors</div>
                <div className="text-lg capitalize">{species.skinColors}</div>
              </div>
            )}
            {species.hairColors && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Hair Colors</div>
                <div className="text-lg capitalize">{species.hairColors}</div>
              </div>
            )}
            {species.eyeColors && (
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Eye Colors</div>
                <div className="text-lg capitalize">{species.eyeColors}</div>
              </div>
            )}
          </div>

          {/* Homeworld */}
          {species.homeworld && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Homeworld</h3>
              <Link
                to={`/planets/${species.homeworld.id}`}
                className="inline-block bg-slate-800 hover:bg-emerald-900 px-4 py-2 rounded text-emerald-400 hover:text-emerald-300 transition"
              >
                🌍 {species.homeworld.name}
              </Link>
            </div>
          )}

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {species.films.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Films ({species.films.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {species.films.map((film) => (
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

            {species.people.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-3">Notable Members ({species.people.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {species.people.map((person) => (
                    <Link
                      key={person.id}
                      to={`/people/${person.id}`}
                      className="bg-slate-700 hover:bg-yellow-900 px-3 py-1 rounded text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {person.name}
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
