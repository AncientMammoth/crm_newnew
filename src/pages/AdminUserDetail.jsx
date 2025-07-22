import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchAdminUserDetail } from '../api';
import { ArrowLeftIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminUserDetail(id);
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError("Could not load user details.");
      } finally {
        setLoading(false);
      }
    };
    loadUserDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 border border-red-400 p-4 rounded-lg">{error}</div>;
  }
  
  if (!userData) {
      return <div className="text-center text-muted-foreground">User not found.</div>
  }

  const { user, accounts } = userData;

  return (
    <div className="px-4 sm:px-0 space-y-8">
      <div>
        <Link to="/admin/users" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to All Users
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{user.user_name}</h1>
        <p className="mt-1 text-muted-foreground">
          Role: <span className="font-semibold">{user.user_type}</span>
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BuildingOffice2Icon className="h-6 w-6 text-primary" />
            Owned Accounts ({accounts.length})
        </h2>
        <div className="mt-4 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-[#333333]">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Account Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Type</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-[#333333]">
                                {accounts.length > 0 ? accounts.map((account) => (
                                    <tr 
                                        key={account.id} 
                                        className="hover:bg-secondary/50 cursor-pointer"
                                        onClick={() => navigate(`/admin/accounts/${account.id}`)}
                                    >
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{account.fields['Account Name']}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{account.fields['Account Type']}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="py-8 text-center text-muted-foreground">This user does not own any accounts.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}