import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filmsApi } from '../api/filmsApi';

export function Films() {
  const { data: films, isLoading, error } = useQuery({
    queryKey: ['films'],
    queryFn: filmsApi.getAll,
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Failed to load films</div>
        <Link to="/" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const sortedFilms = (films ?? []).slice().sort((a, b) => a.episodeId - b.episodeId);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-center">Star Wars Films</h1>
        <p className="text-gray-400 text-center mb-8">Experience the saga through the opening crawls</p>

        {sortedFilms.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-gray-400">
            No films available.
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedFilms.map((film) => (
              <Link
                key={film.id}
                to={`/films/${film.id}`}
                className="bg-slate-900 border border-slate-700 hover:border-yellow-500 rounded-lg p-6 transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-semibold">Episode {toRoman(film.episodeId)}</p>
                    <h2 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition">
                      {film.title}
                    </h2>
                    {film.releaseDate && (
                      <p className="text-gray-500 text-sm mt-1">
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
