import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllProjectsForAdmin, fetchAllUsersForAdmin, fetchAllAccountsForAdmin } from '../api';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../hooks/useDebounce';

export default function AdminProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', ownerId: '', accountId: '' });
  const debouncedSearch = useDebounce(filters.search, 300);
  
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
      try {
        setLoading(true);
        const fetchedProjects = await fetchAllProjectsForAdmin({
            search: debouncedSearch,
            status: filters.status,
            ownerId: filters.ownerId,
            accountId: filters.accountId,
        });
        setProjects(fetchedProjects);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Could not load project data.");
      } finally {
        setLoading(false);
      }
  }, [debouncedSearch, filters.status, filters.ownerId, filters.accountId]);

  useEffect(() => {
    const loadFilterData = async () => {
        try {
            const [fetchedUsers, fetchedAccounts] = await Promise.all([
                fetchAllUsersForAdmin(),
                fetchAllAccountsForAdmin()
            ]);
            setUsers(fetchedUsers);
            setAccounts(fetchedAccounts);
        } catch (err) {
            console.error("Failed to load filter data", err);
        }
    };
    loadFilterData();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', status: '', ownerId: '', accountId: '' });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all projects across all accounts in the system.
          </p>
        </div>
      </div>

      {/* Enhanced Filter and Search Controls */}
      <div className="mt-6 p-4 bg-[#333333] border border-border rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search by Name</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <input type="search" name="search" id="search" className="block w-full rounded-md border-input bg-secondary py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" placeholder="Project name..." onChange={handleFilterChange} value={filters.search} />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
            <select id="status" name="status" className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" onChange={handleFilterChange} value={filters.status}>
                <option value="">All</option>
                <option value="Need Analysis">Need Analysis</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Closed Won">Closed Won</option>
                <option value="Closed Lost">Closed Lost</option>
            </select>
          </div>
          <div>
            <label htmlFor="ownerId" className="block text-sm font-medium text-muted-foreground mb-1">Owner</label>
            <select id="ownerId" name="ownerId" className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" onChange={handleFilterChange} value={filters.ownerId}>
                <option value="">All</option>
                {users.map(user => <option key={user.id} value={user.id}>{user.fields['User Name']}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-muted-foreground mb-1">Account</label>
            <select id="accountId" name="accountId" className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" onChange={handleFilterChange} value={filters.accountId}>
                <option value="">All</option>
                {accounts.map(account => <option key={account.id} value={account.id}>{account.fields['Account Name']}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
                <XMarkIcon className="h-4 w-4" />
                Clear Filters
            </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-[#333333]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Project Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Account</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Owner</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-[#333333]">
                  {loading ? (
                    <tr><td colSpan="5" className="py-8 text-center"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div></td></tr>
                  ) : error ? (
                    <tr><td colSpan="5" className="py-8 text-center text-red-500">{error}</td></tr>
                  ) : projects.length > 0 ? (
                    projects.map((project) => (
                        <tr key={project.id} className="hover:bg-secondary/50 cursor-pointer" onClick={() => navigate(`/admin/projects/${project.id}`)}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{project.fields['Project Name']}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.fields['Account Name (from Account)'] || 'N/A'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.fields['Project Owner Name'] || 'N/A'}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.fields['Project Status']}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">₹{(project.fields['Project Value'] || 0).toLocaleString()}</td>
                        </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">No projects found for the selected filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}