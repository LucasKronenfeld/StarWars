import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { peopleApi } from '../api/peopleApi';
import { GlassCard } from '../components/GlassCard';

export function People() {
  const { data: people, isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: peopleApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">👤</div>
          <p className="text-yellow-400">Loading characters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Error loading characters</p>
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
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-shadow">Characters</h1>
          <p className="text-gray-400">Heroes, villains, and everyone in between</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {people?.map((person) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
            >
              <GlassCard 
                variant="yellow" 
                className="p-4 h-full group"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition">
                  {person.name}
                </h3>
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  {person.gender && <p className="capitalize">{person.gender}</p>}
                  {person.birthYear && <p>Born: {person.birthYear}</p>}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
