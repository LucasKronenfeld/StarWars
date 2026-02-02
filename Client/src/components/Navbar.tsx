import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

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

          {isAuthenticated ? (
            <>
              <Link to="/fleet" className="text-gray-300 hover:text-cyan-400 transition">
                Fleet
              </Link>
              <Link to="/hangar" className="text-gray-300 hover:text-cyan-400 transition">
                Hangar
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-yellow-500 hover:text-yellow-400 transition font-semibold">
                  🔑 Admin
                </Link>
              )}
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
