import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { starshipsApi } from '../api/starshipsApi';
import type { StarshipsQuery } from '../api/starshipsApi';
import { Pagination } from '../components/Pagination';
import { GlassCard } from '../components/GlassCard';

export function Catalog() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<StarshipsQuery>({});

  const query: StarshipsQuery = {
    page,
    pageSize: 25,
    search: search || undefined,
    ...filters,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['starships', query],
    queryFn: () => starshipsApi.list(query),
  });

  const { data: filtersData } = useQuery({
    queryKey: ['starship-filters'],
    queryFn: () => starshipsApi.getFilters(),
  });

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <GlassCard variant="red" className="p-8 text-center">
          <p className="text-red-400 text-lg">Error loading starships</p>
          <Link to="/" className="text-yellow-400 hover:text-yellow-300 mt-4 inline-block">
            ← Back to Home
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6 page-transition">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2 text-shadow">Starship Catalog</h1>
          <p className="text-gray-400">Browse and explore the complete starship database</p>
        </div>

        {/* Search and Filters */}
        <GlassCard variant="cyan" className="p-6 mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name..."
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                       placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 
                       focus:ring-cyan-500/50 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Manufacturer
              </label>
              <select
                value={filters.manufacturer || ''}
                onChange={(e) => {
                  setFilters({ ...filters, manufacturer: e.target.value || undefined });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="">All Manufacturers</option>
                {filtersData?.manufacturers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Class
              </label>
              <select
                value={filters.class || ''}
                onChange={(e) => {
                  setFilters({ ...filters, class: e.target.value || undefined });
                  setPage(1);
                }}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="">All Classes</option>
                {filtersData?.classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort
              </label>
              <select
                value={filters.sort || 'name'}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-white 
                         focus:outline-none focus:border-cyan-500/50 transition-all duration-200"
              >
                <option value="name">Name</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="starshipClass">Class</option>
                <option value="costInCredits">Cost</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">🚀</div>
              <p className="text-cyan-400">Loading starships...</p>
            </div>
          </div>
        ) : data?.items.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="text-gray-400">No starships found matching your criteria.</p>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="overflow-hidden">
              <table className="w-full">
                <thead className="bg-black/40 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-yellow-400">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">Model</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hidden lg:table-cell">Manufacturer</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300 hidden sm:table-cell">Class</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.items.map((ship) => (
                    <tr
                      key={ship.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/catalog/${ship.id}`}
                          className="font-medium text-white hover:text-yellow-400 transition"
                        >
                          {ship.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-400 hidden md:table-cell">{ship.model || '—'}</td>
                      <td className="px-6 py-4 text-gray-400 hidden lg:table-cell">{ship.manufacturer || '—'}</td>
                      <td className="px-6 py-4 text-gray-400 hidden sm:table-cell">{ship.starshipClass || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {ship.costInCredits ? ship.costInCredits.toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>

            <Pagination
              page={page}
              pageSize={25}
              totalCount={data?.totalCount || 0}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
