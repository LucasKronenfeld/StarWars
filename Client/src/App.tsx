import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { RequireAuth } from './auth/RequireAuth';
import { Navbar } from './components/Navbar';
import { PageShell } from './components/PageShell';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Catalog } from './pages/Catalog';
import { StarshipDetail } from './pages/StarshipDetail';
import { Films } from './pages/Films';
import { FilmDetail } from './pages/FilmDetail';
import { People } from './pages/People';
import { PersonDetail } from './pages/PersonDetail';
import { Species } from './pages/Species';
import { SpeciesDetail } from './pages/SpeciesDetail';
import { Vehicles } from './pages/Vehicles';
import { VehicleDetail } from './pages/VehicleDetail';
import { Planets } from './pages/Planets';
import { PlanetDetail } from './pages/PlanetDetail';
import { Fleet } from './pages/Fleet';
import { ShipBuilder } from './pages/ShipBuilder';
import { EditStarship } from './pages/EditStarship';
import { MyStarshipDetail } from './pages/MyStarshipDetail';
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
            <PageShell>
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/catalog/:id" element={<StarshipDetail />} />
                  <Route path="/films" element={<Films />} />
                  <Route path="/films/:id" element={<FilmDetail />} />
                  <Route path="/people" element={<People />} />
                  <Route path="/people/:id" element={<PersonDetail />} />
                  <Route path="/species" element={<Species />} />
                  <Route path="/species/:id" element={<SpeciesDetail />} />
                  <Route path="/vehicles" element={<Vehicles />} />
                  <Route path="/vehicles/:id" element={<VehicleDetail />} />
                  <Route path="/planets" element={<Planets />} />
                  <Route path="/planets/:id" element={<PlanetDetail />} />
                  <Route path="/fleet" element={<RequireAuth><Fleet /></RequireAuth>} />
                  <Route path="/ship-builder" element={<RequireAuth><ShipBuilder /></RequireAuth>} />
                  <Route path="/hangar" element={<Navigate to="/fleet" replace />} />
                  <Route path="/hangar/new" element={<Navigate to="/ship-builder" replace />} />
                  <Route path="/hangar/:id" element={<RequireAuth><MyStarshipDetail /></RequireAuth>} />
                  <Route path="/hangar/:id/edit" element={<RequireAuth><EditStarship /></RequireAuth>} />
                </Routes>
              </main>
            </PageShell>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
