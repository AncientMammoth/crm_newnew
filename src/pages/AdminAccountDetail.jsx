import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchAdminAccountDetail } from '../api';
import { ArrowLeftIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function AdminAccountDetail() {
  const { id } = useParams();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const loadAccountDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminAccountDetail(id);
        setAccountData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching account details:", err);
        setError("Could not load account details.");
      } finally {
        setLoading(false);
      }
    };
    loadAccountDetails();
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

  if (!accountData) {
    return <div className="text-center text-muted-foreground">Account not found.</div>
  }

  const { account, projects } = accountData;

  return (
    <div className="px-4 sm:px-0 space-y-8">
      <div>
        <Link to="/admin/accounts" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to All Accounts
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{account.fields['Account Name']}</h1>
        <p className="mt-1 text-muted-foreground">
          Type: <span className="font-semibold">{account.fields['Account Type']}</span> | Owner: <span className="font-semibold">{account.fields['Account Owner Name']}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {account.fields['Account Description']}
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <BriefcaseIcon className="h-6 w-6 text-primary" />
            Associated Projects ({projects.length})
        </h2>
        <div className="mt-4 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-[#333333]">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Project Name</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Owner</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-[#333333]">
                                {projects.length > 0 ? projects.map((project) => (
                                    <tr 
                                        key={project.id}
                                        className="hover:bg-secondary/50 cursor-pointer"
                                        onClick={() => navigate(`/admin/projects/${project.id}`)}
                                    >
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{project.fields['Project Name']}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.fields['Project Status']}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{project.fields['Project Owner Name']}</td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">₹{(project.fields['Project Value'] || 0).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-muted-foreground">This account has no projects.</td>
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