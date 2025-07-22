import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchUpdatesByIds, fetchProjectsByIds } from '../api';
import UpdateDisplay from './UpdateDisplay';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon } from '@heroicons/react/20/solid';

export default function Updates() {
  const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
  const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
  const userName = localStorage.getItem("userName") || "Current User";

  const { data: updates, isLoading: updatesLoading, error: updatesError } = useQuery({
    queryKey: ["userSpecificUpdates", updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: updateIds.length > 0,
    onError: (err) => {
      console.error("[UpdatesPage] Error fetching user-specific updates:", err);
    },
  });
  
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ["projects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });
  
  const projectMap = useMemo(() => {
    if (!projectsData) return new Map();
    return new Map(projectsData.map(p => [p.id, p.fields["Project Name"]]));
  }, [projectsData]);

  const isLoading = updatesLoading || projectsLoading;
  const error = updatesError || projectsError;

  if (isLoading) return <div className="text-center py-20 text-lg text-muted-foreground">Loading your updates...</div>;
  if (error) return <div className="text-red-500 text-center py-10">Error loading your updates: {error.message}</div>;

  return (
    <div className="min-h-screen bg-card w-full">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-light text-foreground">My Updates</h1>
                    <Link to="/create-update" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 font-semibold shadow-sm transition-colors">
                    <PlusIcon className="h-5 w-5" />
                    New Update
                    </Link>
                </div>

                {(!updates || updates.length === 0) ? (
                    <div className="text-center py-20 text-muted-foreground bg-[#333333] rounded-2xl border border-border">
                        <h2 className="text-2xl font-light mb-2">No Updates Found</h2>
                        <p>You have not created any updates yet.</p>
                        <Link to="/create-update" className="mt-4 inline-block px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors">
                        Create Your First Update
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {updates.filter(Boolean).map((record) => {
                        if (!record.fields) return null;

                        const projectId = record.fields.Project?.[0];
                        const fullProjectName = projectMap.get(projectId);
                        const fallbackProjectName = record.fields["Project Name"]?.[0] || "N/A";
                        const projectName = fullProjectName || fallbackProjectName;
                        
                        const taskName = record.fields["Task Name"]?.[0] || "";
                        const taskId = record.fields.Task?.[0];

                        const updateForDisplay = {
                            id: record.id,
                            fields: record.fields,
                        };

                        return (
                            <motion.div 
                                key={record.id} 
                                className="bg-[#333333] p-5 rounded-2xl border border-border"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                            <div className="pb-4 mb-4 border-b border-border">
                                <p className="text-sm text-muted-foreground font-light">
                                Associated with: 
                                {projectId ? (
                                    <Link to={`/projects/${projectId}`} className="font-medium text-accent hover:underline ml-1">
                                        {projectName}
                                    </Link>
                                ) : <span className="font-medium text-foreground ml-1">{projectName}</span>}
                                
                                {taskName && taskId && (
                                    <>
                                    <span className="mx-2">/</span>
                                    <Link to={`/tasks/${taskId}`} className="font-medium text-foreground hover:underline">
                                        {taskName}
                                    </Link>
                                    </>
                                )}
                                </p>
                            </div>

                            <UpdateDisplay
                                update={updateForDisplay}
                                userName={userName}
                            />
                            <div className="mt-4 text-right">
                                <Link
                                to={`/updates/${record.id}`}
                                className="inline-block px-4 py-2 bg-secondary text-sm font-medium text-foreground rounded-lg hover:bg-[#2E2E2E] transition-colors border border-border"
                                >
                                View Details
                                </Link>
                            </div>
                            </motion.div>
                        );
                        })}
                    </div>
                )}
            </motion.div>
        </div>
    </div>
  );
}