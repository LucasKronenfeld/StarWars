import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { speciesApi } from '../api/speciesApi';
import { GlassCard } from '../components/GlassCard';

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
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🧬</div>
          <p className="text-purple-400">Loading species...</p>
        </div>
      </div>
    );
  }

  if (error || !species) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Species not found</p>
          <button onClick={() => navigate(-1)} className="text-purple-400 hover:text-purple-300">
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
          className="text-purple-400 hover:text-purple-300 mb-6 inline-flex items-center gap-2 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <GlassCard variant="purple" className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-purple-400 mb-2 text-shadow">{species.name}</h1>
            <p className="text-gray-400">Species Profile</p>
          </div>

          {/* Classification Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {species.classification && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Classification</div>
                <div className="text-xl font-semibold text-white capitalize">{species.classification}</div>
              </div>
            )}
            {species.designation && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Designation</div>
                <div className="text-xl font-semibold text-white capitalize">{species.designation}</div>
              </div>
            )}
            {species.language && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 text-center border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Language</div>
                <div className="text-xl font-semibold text-white">{species.language}</div>
              </div>
            )}
          </div>

          {/* Physical Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {species.averageHeight && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Average Height</div>
                <div className="text-lg text-white">{species.averageHeight} cm</div>
              </div>
            )}
            {species.averageLifespan && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Average Lifespan</div>
                <div className="text-lg text-white">{species.averageLifespan} years</div>
              </div>
            )}
            {species.skinColors && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Skin Colors</div>
                <div className="text-lg text-white capitalize">{species.skinColors}</div>
              </div>
            )}
            {species.hairColors && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Hair Colors</div>
                <div className="text-lg text-white capitalize">{species.hairColors}</div>
              </div>
            )}
            {species.eyeColors && (
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/5">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Eye Colors</div>
                <div className="text-lg text-white capitalize">{species.eyeColors}</div>
              </div>
            )}
          </div>

          {/* Homeworld */}
          {species.homeworld && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Homeworld</h3>
              <Link
                to={`/planets/${species.homeworld.id}`}
                className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 
                         px-4 py-2 rounded-lg text-emerald-400 hover:text-emerald-300 transition"
              >
                <span>🌍</span>
                {species.homeworld.name}
              </Link>
            </div>
          )}

          {/* Related Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {species.films.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>🎬</span> Films ({species.films.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {species.films.map((film) => (
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

            {species.people.length > 0 && (
              <div className="bg-black/20 rounded-lg p-5 border border-white/5">
                <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                  <span>👤</span> Notable Members ({species.people.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {species.people.map((person) => (
                    <Link
                      key={person.id}
                      to={`/people/${person.id}`}
                      className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 
                               px-3 py-1.5 rounded-lg text-sm text-yellow-400 hover:text-yellow-300 transition"
                    >
                      {person.name}
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
