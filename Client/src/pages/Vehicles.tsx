import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';
import { GlassCard } from '../components/GlassCard';

export function Vehicles() {
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🚗</div>
          <p className="text-orange-400">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Error loading vehicles</p>
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 mt-4 inline-block">
            ← Back to Home
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-orange-400 mb-2 text-shadow">Vehicles</h1>
          <p className="text-gray-400">Ground and atmospheric transports</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vehicles?.map((vehicle) => (
            <Link
              key={vehicle.id}
              to={`/vehicles/${vehicle.id}`}
            >
              <GlassCard 
                className="p-4 h-full group border-orange-500/30 hover:border-orange-400/50"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-orange-400 transition">
                  {vehicle.name}
                </h3>
                {vehicle.model && (
                  <p className="text-gray-500 text-sm">{vehicle.model}</p>
                )}
                <div className="mt-2 text-sm text-gray-400 space-y-1">
                  {vehicle.manufacturer && <p>{vehicle.manufacturer}</p>}
                  {vehicle.vehicleClass && <p className="capitalize">{vehicle.vehicleClass}</p>}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
