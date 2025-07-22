import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllAccountsForAdmin, fetchAllUsersForAdmin } from '../api';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AdminAccountList() {
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ ownerId: '' });
  const navigate = useNavigate();

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedAccounts = await fetchAllAccountsForAdmin(filters);
      setAccounts(fetchedAccounts);
      setError(null);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Could not load account data.");
    } finally {
      setLoading(false);
    }
  }, [filters.ownerId]);
  
  useEffect(() => {
    const loadFilterData = async () => {
        try {
            const fetchedUsers = await fetchAllUsersForAdmin();
            setUsers(fetchedUsers);
        } catch (err) {
            console.error("Failed to load user data for filters", err);
        }
    };
    loadFilterData();
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const clearFilters = () => {
    setFilters({ ownerId: '' });
  };

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
            <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
            <p className="mt-2 text-sm text-muted-foreground">A list of all accounts in the system.</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-[#333333] border border-border rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
                <label htmlFor="ownerId" className="block text-sm font-medium text-muted-foreground mb-1">Filter by Owner</label>
                <select name="ownerId" id="ownerId" onChange={handleFilterChange} value={filters.ownerId} className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm">
                    <option value="">All Owners</option>
                    {users.map(user => <option key={user.id} value={user.id}>{user.fields['User Name']}</option>)}
                </select>
            </div>
            <div className="flex items-end">
                <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors">
                    <XMarkIcon className="h-4 w-4" />
                    Clear Filter
                </button>
            </div>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-[#333333]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Account Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-[#333333]">
                  {loading ? (
                    <tr><td colSpan="3" className="py-8 text-center"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div></td></tr>
                  ) : error ? (
                    <tr><td colSpan="3" className="py-8 text-center text-red-500">{error}</td></tr>
                  ) : accounts.length > 0 ? (
                    accounts.map((account) => (
                        <tr key={account.id} className="hover:bg-secondary/50 cursor-pointer" onClick={() => navigate(`/admin/accounts/${account.id}`)}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{account.fields['Account Name']}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{account.fields['Account Type']}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{account.fields['Account Owner Name']}</td>
                        </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="py-8 text-center text-muted-foreground">No accounts found for the selected filter.</td></tr>
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