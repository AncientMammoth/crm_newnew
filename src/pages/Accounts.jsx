import React, { useState, useMemo, Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAccountsByIds } from "../api";
import AccountCard from "./AccountCard";
import SearchAndFilterBar from "./SearchAndFilterBar";
import QuickCreateProject from "./QuickCreateProject";
import { motion } from "framer-motion";
import { PlusIcon, BuildingOffice2Icon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function Accounts() {
  const accountIds = useMemo(() => JSON.parse(localStorage.getItem("accountIds") || "[]"), []);
  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ["accounts", accountIds],
    queryFn: () => fetchAccountsByIds(accountIds),
    enabled: accountIds.length > 0,
    onError: (err) => {
      console.error("[Accounts] Error fetching accounts:", err);
    },
  });

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  const accountTypeOptions = useMemo(() => {
    const types = new Set();
    accounts.forEach((acc) => {
      const t = acc.fields["Account Type"];
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const name = acc.fields["Account Name"]?.toLowerCase() || "";
      const type = acc.fields["Account Type"]?.toLowerCase() || "";
      const matchesSearch = name.includes(search.toLowerCase()) || 
                          type.includes(search.toLowerCase());
      const matchesType = typeFilter ? acc.fields["Account Type"] === typeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [accounts, search, typeFilter]);

  const handleCreateProject = (account) => {
    setSelectedAccount(account);
    setShowProjectModal(true);
  };
  
  const handleCloseModal = () => {
    setShowProjectModal(false);
    setSelectedAccount(null);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-20 text-muted-foreground font-light">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading accounts...
    </div>
  );
  
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-4 mt-4 max-w-4xl mx-auto">
      <p className="font-medium">Error loading accounts</p>
      <p className="text-sm mt-1">{error.message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-card w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                    <h1 className="text-4xl font-light text-foreground">My Managed Accounts</h1>
                    <p className="text-muted-foreground mt-1">Manage your customer accounts and create projects</p>
                    </div>
                    <Link
                        to="/create-account"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 font-semibold shadow-sm transition-colors"
                    >
                    <PlusIcon className="h-5 w-5" />
                    Create Account
                    </Link>
                </div>

                <SearchAndFilterBar
                    search={search}
                    setSearch={setSearch}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    accountTypeOptions={accountTypeOptions}
                />

                {filteredAccounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-[#333333] rounded-2xl py-16 px-4 text-center border border-border">
                    <div className="h-16 w-16 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                        <BuildingOffice2Icon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-light text-foreground mb-2">No accounts found</h3>
                    <p className="text-muted-foreground max-w-md font-light">
                        {search || typeFilter 
                        ? "Try adjusting your search or filter criteria to find what you're looking for." 
                        : "You don't have any accounts yet. Create your first account to get started."}
                    </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                    {filteredAccounts.map((account) => (
                        <AccountCard
                        key={account.id}
                        record={account}
                        onCreateProject={() => handleCreateProject(account)}
                        />
                    ))}
                    </div>
                )}

                {showProjectModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#333333] rounded-2xl shadow-xl max-w-xl w-full p-6 relative border border-border"
                        >
                            <button
                                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                                onClick={handleCloseModal}
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                            <h2 className="text-xl font-light text-foreground mb-5">Create New Project</h2>
                            <QuickCreateProject 
                                accounts={accounts} 
                                onClose={handleCloseModal}
                                defaultAccount={selectedAccount}
                            />
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    </div>
  );
}