import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { filmsApi } from '../api/filmsApi';
import OpeningCrawl from '../components/OpeningCrawl';

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

export function FilmDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: film, isLoading, error } = useQuery({
    queryKey: ['film', id],
    queryFn: () => filmsApi.getById(Number(id)),
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

  if (error || !film) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="text-red-400 text-xl mb-4">Film not found</div>
        <Link to="/films" className="text-yellow-400 hover:text-yellow-300">
          ← Back to Films
        </Link>
      </div>
    );
  }

  const episodeSubtitle = `Episode ${toRoman(film.episodeId)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/films" className="text-yellow-400 hover:text-yellow-300 mb-6 inline-block">
          ← Back to Films
        </Link>

        {/* Film header */}
        <div className="text-center mb-8">
          <p className="text-yellow-400 font-semibold">{episodeSubtitle}</p>
          <h1 className="text-4xl font-bold text-white mt-1">{film.title}</h1>
          {film.releaseDate && (
            <p className="text-gray-400 mt-2">
              Released: {new Date(film.releaseDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
          {film.director && (
            <p className="text-gray-500 text-sm mt-1">
              Directed by {film.director}
            </p>
          )}
        </div>

        {/* Opening Crawl */}
        {film.openingCrawl ? (
          <OpeningCrawl
            title={film.title}
            subtitle={episodeSubtitle}
            crawl={film.openingCrawl}
          />
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-gray-400">
            No opening crawl available for this film.
          </div>
        )}

        {/* Film details */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {film.characters.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Characters ({film.characters.length})</h3>
              <div className="flex flex-wrap gap-2">
                {film.characters.slice(0, 10).map((char) => (
                  <span key={char.id} className="bg-slate-800 px-2 py-1 rounded text-sm text-gray-300">
                    {char.name}
                  </span>
                ))}
                {film.characters.length > 10 && (
                  <span className="text-gray-500 text-sm">+{film.characters.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {film.planets.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Planets ({film.planets.length})</h3>
              <div className="flex flex-wrap gap-2">
                {film.planets.map((planet) => (
                  <span key={planet.id} className="bg-slate-800 px-2 py-1 rounded text-sm text-gray-300">
                    {planet.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {film.starships.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Starships ({film.starships.length})</h3>
              <div className="flex flex-wrap gap-2">
                {film.starships.map((ship) => (
                  <Link 
                    key={ship.id} 
                    to={`/catalog/${ship.id}`}
                    className="bg-slate-800 hover:bg-cyan-900 px-2 py-1 rounded text-sm text-cyan-400 hover:text-cyan-300 transition"
                  >
                    {ship.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {film.vehicles.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Vehicles ({film.vehicles.length})</h3>
              <div className="flex flex-wrap gap-2">
                {film.vehicles.map((vehicle) => (
                  <span key={vehicle.id} className="bg-slate-800 px-2 py-1 rounded text-sm text-gray-300">
                    {vehicle.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {film.species.length > 0 && (
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="text-yellow-400 font-semibold mb-3">Species ({film.species.length})</h3>
              <div className="flex flex-wrap gap-2">
                {film.species.map((sp) => (
                  <span key={sp.id} className="bg-slate-800 px-2 py-1 rounded text-sm text-gray-300">
                    {sp.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
