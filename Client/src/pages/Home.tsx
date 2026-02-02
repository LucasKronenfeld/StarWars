import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-6">
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-6xl font-bold text-cyan-400 mb-4">⚔️ Star Wars Fleet</h1>
        <p className="text-xl text-gray-300 mb-8">
          Manage your fleet across the galaxy. Browse, fork, and customize starships.
        </p>

        {isAuthenticated ? (
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/catalog"
              className="bg-cyan-600 hover:bg-cyan-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              Browse Catalog
            </Link>
            <Link
              to="/films"
              className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              🎬 Films
            </Link>
            <Link
              to="/hangar"
              className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              My Hangar
            </Link>
            <Link
              to="/fleet"
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              My Fleet
            </Link>
          </div>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/catalog"
              className="bg-cyan-600 hover:bg-cyan-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              Browse Catalog
            </Link>
            <Link
              to="/films"
              className="bg-yellow-600 hover:bg-yellow-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              🎬 Films
            </Link>
            <Link
              to="/register"
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded text-lg font-semibold transition"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-slate-700 hover:bg-slate-600 px-8 py-3 rounded text-lg font-semibold transition"
            >
              Login
            </Link>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/catalog" className="bg-slate-900 border border-cyan-500 hover:border-cyan-400 rounded-lg p-6 transition group">
            <h3 className="text-xl font-semibold text-cyan-400 mb-2 group-hover:text-cyan-300">📚 Catalog</h3>
            <p className="text-gray-400">
              Browse the complete Star Wars starship catalog with advanced filters.
            </p>
          </Link>
          <Link to="/films" className="bg-slate-900 border border-yellow-500 hover:border-yellow-400 rounded-lg p-6 transition group">
            <h3 className="text-xl font-semibold text-yellow-400 mb-2 group-hover:text-yellow-300">🎬 Films</h3>
            <p className="text-gray-400">
              Experience the saga through iconic opening crawls.
            </p>
          </Link>
          <div className="bg-slate-900 border border-purple-500 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-purple-400 mb-2">🔧 Customize</h3>
            <p className="text-gray-400">
              Fork catalog ships and create custom variants for your fleet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
