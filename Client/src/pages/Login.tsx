import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../contexts/ToastContext';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6 text-center">Login</h1>

        {error && (
          <div className="bg-red-900 border border-red-600 text-red-200 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              placeholder="your@email.com"
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
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded transition"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
