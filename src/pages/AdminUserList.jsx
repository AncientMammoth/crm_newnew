import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllUsersForAdmin } from '../api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '../hooks/useDebounce';

export default function AdminUserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const navigate = useNavigate();

  const filteredUsers = users.filter(user => 
    user.fields['User Name'].toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await fetchAllUsersForAdmin();
        setUsers(fetchedUsers);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Could not load user data.");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A list of all users in the system. Click on a user to see their details.
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-[#333333] border border-border rounded-lg">
        <div className="max-w-sm">
            <label htmlFor="search" className="block text-sm font-medium text-muted-foreground mb-1">Search by Name</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <input type="search" name="search" id="search" className="block w-full rounded-md border-input bg-secondary py-2 pl-10 pr-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" placeholder="User name..." onChange={(e) => setSearchTerm(e.target.value)} value={searchTerm} />
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
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">User Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Role</th>
                    
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-[#333333]">
                  {loading ? (
                    <tr><td colSpan="3" className="py-8 text-center"><div className="flex justify-center items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div></td></tr>
                  ) : error ? (
                    <tr><td colSpan="3" className="py-8 text-center text-red-500">{error}</td></tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-secondary/50 cursor-pointer" onClick={() => navigate(`/admin/users/${user.id}`)}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{user.fields['User Name']}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${user.fields['User Type'] === 'admin' ? 'bg-green-400/10 text-green-400 ring-1 ring-inset ring-green-400/20' : 'bg-blue-400/10 text-blue-400 ring-1 ring-inset ring-blue-400/30'}`}>
                                    {user.fields['User Type']}
                                </span>
                            </td>
                        </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="py-8 text-center text-muted-foreground">No users found.</td></tr>
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