import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { peopleApi } from '../api/peopleApi';

export function People() {
  const { data: people, isLoading, error } = useQuery({
    queryKey: ['people'],
    queryFn: peopleApi.getAll,
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
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading people
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-center">Characters</h1>
        <p className="text-gray-400 text-center mb-8">Heroes, villains, and everyone in between</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {people?.map((person) => (
            <Link
              key={person.id}
              to={`/people/${person.id}`}
              className="bg-slate-900 border border-slate-700 hover:border-yellow-500 rounded-lg p-4 transition group"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-yellow-400 transition">
                {person.name}
              </h3>
              <div className="mt-2 text-sm text-gray-400 space-y-1">
                {person.gender && <p className="capitalize">{person.gender}</p>}
                {person.birthYear && <p>Born: {person.birthYear}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
