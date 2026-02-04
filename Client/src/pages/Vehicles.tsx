import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../api/vehiclesApi';

export function Vehicles() {
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-orange-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚗</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading vehicles
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-orange-400 mb-2 text-center">Vehicles</h1>
        <p className="text-gray-400 text-center mb-8">Ground and atmospheric transports</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {vehicles?.map((vehicle) => (
            <Link
              key={vehicle.id}
              to={`/vehicles/${vehicle.id}`}
              className="bg-slate-900 border border-slate-700 hover:border-orange-500 rounded-lg p-4 transition group"
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
