import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200
     ${isActive 
       ? 'text-yellow-400' 
       : 'text-gray-300 hover:text-white'}
     after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0
     after:bg-yellow-400 after:transition-transform after:duration-200
     ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-100'}`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-3 text-base font-medium transition-colors duration-200 border-l-2
     ${isActive 
       ? 'text-yellow-400 border-yellow-400 bg-white/5' 
       : 'text-gray-300 border-transparent hover:text-white hover:bg-white/5 hover:border-white/30'}`;

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Far Left */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
            <img 
              src="/logo.svg" 
              alt="Star Wars Fleet" 
              className="h-8 w-auto transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-lg font-bold text-white tracking-wider hidden sm:block">
              STAR WARS <span className="text-yellow-400">FLEET</span>
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/catalog" className={navLinkClass}>
              Starships
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/fleet" className={navLinkClass}>
                Fleet
              </NavLink>
            )}
            <NavLink to="/films" className={navLinkClass}>
              Films
            </NavLink>
            <NavLink to="/people" className={navLinkClass}>
              Characters
            </NavLink>
            <NavLink to="/planets" className={navLinkClass}>
              Planets
            </NavLink>
            <NavLink to="/species" className={navLinkClass}>
              Species
            </NavLink>
            <NavLink to="/vehicles" className={navLinkClass}>
              Vehicles
            </NavLink>
          </div>

          {/* CTA Button - Far Right */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 
                         rounded-lg shadow-lg shadow-red-500/20 hover:shadow-red-500/40 
                         hover:from-red-500 hover:to-red-600 transition-all duration-200"
              >
                Log Out
              </button>
            ) : (
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-500 
                         rounded-lg shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 
                         hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200"
              >
                Get Started
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-black/95 backdrop-blur-md border-t border-white/10
                   ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="py-3 space-y-1">
          <NavLink 
            to="/catalog" 
            className={mobileNavLinkClass} 
            onClick={() => setMobileMenuOpen(false)}
          >
            Starships
          </NavLink>
          {isAuthenticated && (
            <NavLink 
              to="/fleet" 
              className={mobileNavLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              Fleet
            </NavLink>
          )}
          <NavLink 
            to="/films" 
            className={mobileNavLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Films
          </NavLink>
          <NavLink 
            to="/people" 
            className={mobileNavLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Characters
          </NavLink>
          <NavLink 
            to="/planets" 
            className={mobileNavLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Planets
          </NavLink>
          <NavLink 
            to="/species" 
            className={mobileNavLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Species
          </NavLink>
          <NavLink 
            to="/vehicles" 
            className={mobileNavLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Vehicles
          </NavLink>
          
          {/* Mobile CTA */}
          <div className="px-4 pt-4 pb-2">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="w-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 
                         rounded-lg shadow-lg hover:from-red-500 hover:to-red-600 transition-all duration-200"
              >
                Log Out
              </button>
            ) : (
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full px-5 py-3 text-sm font-semibold text-center text-black bg-gradient-to-r from-yellow-400 to-yellow-500 
                         rounded-lg shadow-lg hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
