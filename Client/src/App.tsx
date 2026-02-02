import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { RequireAuth, RequireAdmin } from './auth/RequireAuth';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Catalog } from './pages/Catalog';
import { StarshipDetail } from './pages/StarshipDetail';
import { Films } from './pages/Films';
import { FilmDetail } from './pages/FilmDetail';
import { Fleet } from './pages/Fleet';
import { Hangar } from './pages/Hangar';
import { CreateStarship } from './pages/CreateStarship';
import { EditStarship } from './pages/EditStarship';
import { AdminCatalog } from './pages/AdminCatalog';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-slate-950 text-white">
              <Navbar />
              <main className="pb-8">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/catalog/:id" element={<StarshipDetail />} />
                  <Route path="/films" element={<Films />} />
                  <Route path="/films/:id" element={<FilmDetail />} />
                  <Route path="/fleet" element={<RequireAuth><Fleet /></RequireAuth>} />
                  <Route path="/hangar" element={<RequireAuth><Hangar /></RequireAuth>} />
                  <Route path="/hangar/new" element={<RequireAuth><CreateStarship /></RequireAuth>} />
                  <Route path="/hangar/:id/edit" element={<RequireAuth><EditStarship /></RequireAuth>} />
                  <Route path="/admin" element={<RequireAdmin><AdminCatalog /></RequireAdmin>} />
                </Routes>
              </main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
