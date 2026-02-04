import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { speciesApi } from '../api/speciesApi';
import { GlassCard } from '../components/GlassCard';

export function Species() {
  const { data: species, isLoading, error } = useQuery({
    queryKey: ['species-list'],
    queryFn: speciesApi.getAll,
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

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Error loading species</p>
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 mt-4 inline-block">
            ← Back to Home
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-purple-400 mb-2 text-shadow">Species</h1>
          <p className="text-gray-400">The diverse lifeforms of the galaxy</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {species?.map((s) => (
            <Link
              key={s.id}
              to={`/species/${s.id}`}
            >
              <GlassCard 
                variant="purple" 
                className="p-4 h-full group"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition">
                  {s.name}
                </h3>
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  {s.classification && <p className="capitalize">{s.classification}</p>}
                  {s.language && <p>Language: {s.language}</p>}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
