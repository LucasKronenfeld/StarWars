import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { GlassCard } from '../components/GlassCard';

const LOGIN_ERROR_KEY = 'login_error';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Initialize error from sessionStorage
  const [error, setError] = useState(() => sessionStorage.getItem(LOGIN_ERROR_KEY) || '');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Get the page user was trying to access, or default to /fleet
  const from = (location.state as { from?: string })?.from || '/fleet';

  // Clear error from sessionStorage when navigating away
  useEffect(() => {
    return () => {
      sessionStorage.removeItem(LOGIN_ERROR_KEY);
    };
  }, []);

  // Keep checking and restoring error from sessionStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const storedError = sessionStorage.getItem(LOGIN_ERROR_KEY);
      if (storedError && storedError !== error) {
        setError(storedError);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [error]);

  // Helper to set error and persist it
  const setPersistedError = (msg: string) => {
    if (msg) {
      sessionStorage.setItem(LOGIN_ERROR_KEY, msg);
    } else {
      sessionStorage.removeItem(LOGIN_ERROR_KEY);
    }
    setError(msg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any existing toasts from previous attempts
    toast.clearAll();

    // Client-side validation to prevent bad requests
    if (!email || !email.includes('@')) {
      setPersistedError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setPersistedError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      setPersistedError(''); // Clear error only on successful login
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err: any) {
      // Backend returns 401 (Unauthorized) for invalid credentials
      let errorMsg = 'Login failed. Please try again.';
      
      if (err.response?.status === 401) {
        // Check if backend provided a specific message
        errorMsg = err.response?.data?.message || 'Invalid email or password.';
      } else if (err.response?.status === 400) {
        errorMsg = 'Invalid request. Please check your information.';
      } else if (!err.response) {
        errorMsg = 'Cannot connect to server. Please check your connection.';
      }
      
      setPersistedError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 page-transition">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Empire branding */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 blur-3xl bg-red-500/20 rounded-full" />
            <img 
              src="/empireLogo.svg" 
              alt="Galactic Empire" 
              className="relative w-48 h-48 opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          <h2 className="mt-8 text-2xl font-bold text-white text-shadow">
            Welcome Back, Commander
          </h2>
          <p className="mt-3 text-gray-400 text-center max-w-sm">
            The Empire requires your presence. Access your fleet and continue your mission across the galaxy.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-red-500/50" />
            <span>Imperial Fleet Command</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-red-500/50" />
          </div>
        </div>

        {/* Right side - Login form */}
        <GlassCard variant="red" className="p-8 glow-red">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/empireLogo.svg" alt="Empire" className="w-16 h-16 opacity-70" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 text-center lg:text-left">
            Sign In
          </h1>
          <p className="text-gray-400 mb-8 text-center lg:text-left">
            Enter your credentials to access your fleet
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 
                         focus:ring-red-500/50 transition-all duration-200"
                placeholder="commander@empire.gov"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 
                         focus:ring-red-500/50 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 
                       hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white 
                       font-semibold rounded-lg shadow-lg shadow-red-500/25 hover:shadow-red-500/40 
                       transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link 
                to="/register" 
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Join the Resistance
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
