import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { peopleApi } from '../api/peopleApi';
import { GlassCard } from '../components/GlassCard';

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">👤</div>
          <p className="text-yellow-400">Loading character...</p>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Character not found</p>
          <button onClick={() => navigate(-1)} className="text-yellow-400 hover:text-yellow-300">
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
          className="text-yellow-400 hover:text-yellow-300 mb-6 inline-flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <GlassCard variant="yellow" className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-shadow">{person.name}</h1>
            <p className="text-gray-400">Character Profile</p>
          </div>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {person.height && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Height</div>
                <div className="text-xl font-semibold text-white">{person.height} cm</div>
              </div>
            )}
            {person.mass && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Mass</div>
                <div className="text-xl font-semibold text-white">{person.mass} kg</div>
              </div>
            )}
            {person.gender && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Gender</div>
                <div className="text-xl font-semibold text-white capitalize">{person.gender}</div>
              </div>
            )}
            {person.birthYear && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Birth Year</div>
                <div className="text-xl font-semibold text-white">{person.birthYear}</div>
              </div>
            )}
          </div>

          {/* Appearance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {person.hairColor && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Hair Color</div>
                <div className="text-lg text-white capitalize">{person.hairColor}</div>
              </div>
            )}
            {person.skinColor && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Skin Color</div>
                <div className="text-lg text-white capitalize">{person.skinColor}</div>
              </div>
            )}
            {person.eyeColor && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Eye Color</div>
                <div className="text-lg text-white capitalize">{person.eyeColor}</div>
              </div>
            )}
          </div>

          {/* Homeworld */}
          {person.homeworld && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Homeworld</h3>
              <Link
                to={`/planets/${person.homeworld.id}`}
                className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 
                         px-4 py-2 rounded-lg text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>🌍</span>
                {person.homeworld.name}
              </Link>
            </div>
          )}

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {person.films.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🎬</span> Films ({person.films.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {person.films.map((film) => (
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

            {person.starships.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🚀</span> Starships ({person.starships.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {person.starships.map((ship) => (
                    <Link
                      key={ship.id}
                      to={`/catalog/${ship.id}`}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 
                               px-3 py-1.5 rounded-lg text-sm text-cyan-400 hover:text-cyan-300 transition"
                    >
                      {ship.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {person.vehicles.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-orange-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🚗</span> Vehicles ({person.vehicles.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {person.vehicles.map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      to={`/vehicles/${vehicle.id}`}
                      className="bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 
                               px-3 py-1.5 rounded-lg text-sm text-orange-400 hover:text-orange-300 transition"
                    >
                      {vehicle.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {person.species.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🧬</span> Species ({person.species.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {person.species.map((species) => (
                    <Link
                      key={species.id}
                      to={`/species/${species.id}`}
                      className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 
                               px-3 py-1.5 rounded-lg text-sm text-purple-400 hover:text-purple-300 transition"
                    >
                      {species.name}
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
