import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { GlassCard } from '../components/GlassCard';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation to prevent bad requests
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check for common password requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      return;
    }

    setLoading(true);

    try {
      await register(email, password);
      navigate('/fleet');
    } catch (err: any) {
      // Backend returns { errors: string[] } on 400
      const errorData = err.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Join all error messages from ASP.NET Identity
        setError(errorData.errors.join(' '));
      } else if (err.response?.status === 400) {
        setError('Registration failed. Please check your information and try again.');
      } else {
        setError('Registration failed. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 page-transition">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Register form */}
        <GlassCard variant="cyan" className="p-8 glow-cyan order-2 lg:order-1">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/resistanceLogo.svg" alt="Resistance" className="w-16 h-16 opacity-70" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 text-center lg:text-left">
            Join the Resistance
          </h1>
          <p className="text-gray-400 mb-8 text-center lg:text-left">
            Create your account and start building your fleet
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 
                         focus:ring-cyan-500/50 transition-all duration-200"
                placeholder="pilot@resistance.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 
                         focus:ring-cyan-500/50 transition-all duration-200"
                placeholder="••••••••"
              />
              <p className="mt-2 text-xs text-gray-500">
                Must include uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 
                         focus:ring-cyan-500/50 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 
                       hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 text-white 
                       font-semibold rounded-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 
                       transition-all duration-200 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </GlassCard>

        {/* Right side - Resistance branding */}
        <div className="hidden lg:flex flex-col items-center justify-center p-8 order-1 lg:order-2">
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className="absolute inset-0 blur-3xl bg-cyan-500/20 rounded-full" />
            <img 
              src="/resistanceLogo.svg" 
              alt="The Resistance" 
              className="relative w-48 h-48 opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
          <h2 className="mt-8 text-2xl font-bold text-white text-shadow">
            The Galaxy Needs You
          </h2>
          <p className="mt-3 text-gray-400 text-center max-w-sm">
            Join the Resistance and help restore peace to the galaxy. Build your fleet, customize your ships, and prepare for battle.
          </p>
          
          {/* Benefits list */}
          <ul className="mt-8 space-y-3 text-sm text-gray-400">
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Access the complete starship catalog
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Build and customize your own ships
            </li>
            <li className="flex items-center gap-3">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Assemble your personal fleet
            </li>
          </ul>

          <div className="mt-8 flex items-center gap-3 text-sm text-gray-500">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-cyan-500/50" />
            <span>Resistance Fleet Command</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-cyan-500/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
