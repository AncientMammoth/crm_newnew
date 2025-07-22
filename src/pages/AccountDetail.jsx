import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchAccountById, fetchProjectsByIds } from "../api";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

export default function AccountDetail() {
  const { id } = useParams();

  const { data: account, isLoading, error } = useQuery({
    queryKey: ["account", id],
    queryFn: () => fetchAccountById(id),
    enabled: !!id,
  });

  const projectIds = account?.fields?.Projects || [];
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["accountProjects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  if (isLoading) return <div className="text-center py-20 text-lg text-muted-foreground">Loading account details...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading account: {error.message}</div>;
  if (!account) return <div className="text-center py-10 text-muted-foreground">No account data found.</div>;

  const name = account.fields["Account Name"] || "Unnamed Account";
  const description = account.fields["Account Description"] || <span className="italic">No description provided.</span>;
  const type = account.fields["Account Type"] || "N/A";

  const statusColors = {
    "Need Analysis": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Negotiation": "bg-blue-500/10 text-blue-400 border-blue-500/20",
    "Closed Won": "bg-green-500/10 text-green-400 border-green-500/20",
    "Closed Lost": "bg-red-500/10 text-red-400 border-red-500/20",
  };

  return (
    <div className="min-h-screen bg-card w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
                    <ol className="list-none p-0 inline-flex items-center">
                    <li className="flex items-center">
                        <Link to="/accounts" className="hover:text-accent transition-colors">Accounts</Link>
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
                    </li>
                    <li>
                        <span className="font-semibold text-foreground">{name}</span>
                    </li>
                    </ol>
                </nav>

                <div className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border mb-10">
                    <h1 className="text-3xl font-light text-foreground">{name}</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-light">
                    <strong>Type:</strong> {type}
                    </p>
                    <p className="mt-4 text-foreground font-light">{description}</p>
                </div>

                <div>
                    <h2 className="text-2xl font-light text-foreground mb-4">Associated Projects</h2>
                    <div className="space-y-4">
                    {projectsLoading ? (
                        <p className="text-muted-foreground font-light">Loading projects...</p>
                    ) : projects && projects.length > 0 ? (
                        projects.map((project) => {
                            const statusColor = statusColors[project.fields["Project Status"]] || "bg-secondary text-muted-foreground border-border";
                            return (
                                <Link
                                    to={`/projects/${project.id}`}
                                    key={project.id}
                                    className="block bg-secondary p-4 rounded-lg border border-border hover:bg-[#2E2E2E] transition-colors duration-200"
                                >
                                    <div className="flex justify-between items-center">
                                    <span className="font-light text-accent">{project.fields["Project Name"]}</span>
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColor}`}>{project.fields["Project Status"]}</span>
                                    </div>
                                </Link>
                            )
                        })
                    ) : (
                        <div className="text-center text-muted-foreground bg-secondary p-6 rounded-lg border border-border italic font-light">No projects are associated with this account.</div>
                    )}
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  );
}
