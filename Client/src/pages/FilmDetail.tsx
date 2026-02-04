import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const { data: film, isLoading, error } = useQuery({
    queryKey: ['film', id],
    queryFn: () => filmsApi.getById(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🎬</div>
          <p className="text-yellow-400">Loading film...</p>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 rounded-xl p-8 text-center">
          <p className="text-red-400 text-lg mb-4">Film not found</p>
          <button onClick={() => navigate(-1)} className="text-yellow-400 hover:text-yellow-300">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const episodeSubtitle = `Episode ${toRoman(film.episodeId)}`;

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

        {/* Film header */}
        <div className="text-center mb-8">
          <p className="text-yellow-400 font-semibold tracking-widest uppercase">{episodeSubtitle}</p>
          <h1 className="text-4xl font-bold text-white mt-1 text-shadow">{film.title}</h1>
          {film.releaseDate && (
            <p className="text-gray-400 mt-2">
              Released {new Date(film.releaseDate).toLocaleDateString('en-US', { 
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
            <div className="bg-black/40 backdrop-blur-md border border-yellow-500/20 rounded-xl p-5">
              <h3 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
                <span>👤</span> Characters ({film.characters.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {film.characters.slice(0, 10).map((char) => (
                  <Link
                    key={char.id}
                    to={`/people/${char.id}`}
                    className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 
                             px-3 py-1.5 rounded-lg text-sm text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {char.name}
                  </Link>
                ))}
                {film.characters.length > 10 && (
                  <span className="text-gray-500 text-sm px-3 py-1.5">+{film.characters.length - 10} more</span>
                )}
              </div>
            </div>
          )}

          {film.planets.length > 0 && (
            <div className="bg-black/40 backdrop-blur-md border border-emerald-500/20 rounded-xl p-5">
              <h3 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                <span>🌍</span> Planets ({film.planets.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {film.planets.map((planet) => (
                  <Link
                    key={planet.id}
                    to={`/planets/${planet.id}`}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 
                             px-3 py-1.5 rounded-lg text-sm text-emerald-400 hover:text-emerald-300 transition"
                  >
                    {planet.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {film.starships.length > 0 && (
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/20 rounded-xl p-5">
              <h3 className="text-cyan-400 font-semibold mb-4 flex items-center gap-2">
                <span>🚀</span> Starships ({film.starships.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {film.starships.map((ship) => (
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

          {film.vehicles.length > 0 && (
            <div className="bg-black/40 backdrop-blur-md border border-orange-500/20 rounded-xl p-5">
              <h3 className="text-orange-400 font-semibold mb-4 flex items-center gap-2">
                <span>🚗</span> Vehicles ({film.vehicles.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {film.vehicles.map((vehicle) => (
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

          {film.species.length > 0 && (
            <div className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-xl p-5">
              <h3 className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
                <span>🧬</span> Species ({film.species.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {film.species.map((sp) => (
                  <Link
                    key={sp.id}
                    to={`/species/${sp.id}`}
                    className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 
                             px-3 py-1.5 rounded-lg text-sm text-purple-400 hover:text-purple-300 transition"
                  >
                    {sp.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
