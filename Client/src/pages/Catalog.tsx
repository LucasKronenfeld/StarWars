import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { starshipsApi } from '../api/starshipsApi';
import type { StarshipsQuery } from '../api/starshipsApi';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';

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
      <div className="min-h-screen bg-slate-950 text-red-400 flex items-center justify-center">
        Error loading starships
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">Starship Catalog</h1>

        {/* Search and Filters */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 mb-8 space-y-4">
          <div>
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
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
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
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
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
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
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
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="name">Name</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="starshipClass">Class</option>
                <option value="costInCredits">Cost</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center text-cyan-400 py-12">Loading starships...</div>
        ) : data?.items.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-12 text-center">
            <p className="text-gray-400">No starships found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-800 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Model</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Class</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {data?.items.map((ship) => (
                    <tr
                      key={ship.id}
                      className="hover:bg-slate-800/50 transition"
                    >
                      <td className="px-6 py-4">
                        <Link
                          to={`/catalog/${ship.id}`}
                          className="font-medium text-white hover:text-cyan-400 transition"
                        >
                          {ship.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{ship.model || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">{ship.manufacturer || '—'}</td>
                      <td className="px-6 py-4 text-gray-400">{ship.starshipClass || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge label="Stock" variant="info" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
