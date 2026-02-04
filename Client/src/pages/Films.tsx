import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filmsApi } from '../api/filmsApi';
import { GlassCard } from '../components/GlassCard';

export function Films() {
  const { data: films, isLoading, error } = useQuery({
    queryKey: ['films'],
    queryFn: filmsApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎬</div>
          <p className="text-yellow-400">Loading films...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Failed to load films</p>
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 mt-4 inline-block">
            ← Back to Home
          </Link>
        </GlassCard>
      </div>
    );
  }

  const sortedFilms = (films ?? []).slice().sort((a, b) => a.episodeId - b.episodeId);

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-shadow">Star Wars Films</h1>
          <p className="text-gray-400">Experience the saga through the opening crawls</p>
        </div>

        {sortedFilms.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-400">No films available.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {sortedFilms.map((film) => (
              <Link
                key={film.id}
                to={`/films/${film.id}`}
              >
                <GlassCard 
                  variant="yellow" 
                  className="p-6 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-400/80 text-sm font-semibold tracking-wider uppercase">
                        Episode {toRoman(film.episodeId)}
                      </p>
                      <h2 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition mt-1">
                        {film.title}
                      </h2>
                      {film.releaseDate && (
                        <p className="text-gray-500 text-sm mt-2">
                          Released {new Date(film.releaseDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                    <div className="text-gray-500 group-hover:text-yellow-400 transition text-2xl">
                      →
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function toRoman(num: number): string {
  const map: [number, string][] = [
    [6, 'VI'],
    [5, 'V'],
    [4, 'IV'],
    [3, 'III'],
    [2, 'II'],
    [1, 'I'],
  ];
  for (const [value, roman] of map) {
    if (num === value) return roman;
  }
  return num.toString();
}
