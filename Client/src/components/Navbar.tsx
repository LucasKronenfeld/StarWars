import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [exploreOpen, setExploreOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-cyan-500 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-cyan-400">
          ⚔️ Star Wars Fleet
        </Link>

        <div className="flex gap-6 items-center">
          {/* Public links always visible */}
          <Link to="/catalog" className="text-gray-300 hover:text-cyan-400 transition">
            Catalog
          </Link>
          <Link to="/films" className="text-gray-300 hover:text-yellow-400 transition">
            Films
          </Link>
          
          {/* Explore dropdown */}
          <div className="relative">
            <button
              onClick={() => setExploreOpen(!exploreOpen)}
              onBlur={() => setTimeout(() => setExploreOpen(false), 200)}
              className="text-gray-300 hover:text-emerald-400 transition flex items-center gap-1"
            >
              Explore
              <svg className={`w-4 h-4 transition ${exploreOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {exploreOpen && (
              <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg py-2 min-w-[140px] z-50">
                <Link to="/people" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-yellow-400 transition">
                  👤 Characters
                </Link>
                <Link to="/planets" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-emerald-400 transition">
                  🌍 Planets
                </Link>
                <Link to="/species" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-purple-400 transition">
                  🧬 Species
                </Link>
                <Link to="/vehicles" className="block px-4 py-2 text-gray-300 hover:bg-slate-700 hover:text-orange-400 transition">
                  🚗 Vehicles
                </Link>
              </div>
            )}
          </div>

          {isAuthenticated ? (
            <>
              <Link to="/fleet" className="text-gray-300 hover:text-cyan-400 transition">
                Fleet
              </Link>
              <div className="text-sm text-gray-400">
                {user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-cyan-400 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded text-white transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
