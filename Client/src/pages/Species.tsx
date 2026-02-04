import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { speciesApi } from '../api/speciesApi';

export function Species() {
  const { data: species, isLoading, error } = useQuery({
    queryKey: ['species-list'],
    queryFn: speciesApi.getAll,
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading species
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-400 mb-2 text-center">Species</h1>
        <p className="text-gray-400 text-center mb-8">The diverse lifeforms of the galaxy</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {species?.map((s) => (
            <Link
              key={s.id}
              to={`/species/${s.id}`}
              className="bg-slate-900 border border-slate-700 hover:border-purple-500 rounded-lg p-4 transition group"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition">
                {s.name}
              </h3>
              <div className="mt-2 text-sm text-gray-400 space-y-1">
                {s.classification && <p className="capitalize">{s.classification}</p>}
                {s.language && <p>Language: {s.language}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
