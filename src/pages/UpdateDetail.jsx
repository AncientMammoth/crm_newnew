import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUpdateById, fetchProjectById, fetchTaskById } from "../api/index.js";
import React from "react";
import { motion } from "framer-motion";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

export default function UpdateDetail() {
  const { id } = useParams();

  const { data: update, isLoading: updateLoading, error: updateError } = useQuery({
    queryKey: ["update", id],
    queryFn: () => fetchUpdateById(id),
    enabled: !!id,
  });

  const projectId = update?.fields.Project?.[0];
  const taskId = update?.fields.Task?.[0];

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

  const { data: task } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => fetchTaskById(taskId),
    enabled: !!taskId,
  });

  if (updateLoading) return <div className="text-center py-20 text-lg text-muted-foreground">Loading update details...</div>;
  if (updateError) return <div className="text-red-500 text-center py-10">Error loading update: {updateError.message}</div>;
  if (!update) return <div className="text-center py-10 text-muted-foreground">No update data found.</div>;

  const notes = update.fields.Notes || <span className="italic">No notes provided.</span>;
  const date = update.fields.Date ? new Date(update.fields.Date).toLocaleDateString() : "N/A";
  const type = update.fields["Update Type"] || "N/A";
  const ownerName = update.fields["Update Owner Name"]?.[0] || "N/A";
  const projectName = project?.fields["Project Name"] || "N/A";
  const taskName = task?.fields["Task Name"] || "N/A";

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
                        <Link to="/projects" className="hover:text-accent transition-colors">Projects</Link>
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
                    </li>
                    <li className="flex items-center">
                        <span className="truncate max-w-[200px] text-foreground">{projectName}</span>
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
                    </li>
                    <li>
                        <span className="font-semibold text-foreground">Update</span>
                    </li>
                    </ol>
                </nav>

                <div className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-3xl font-light text-foreground">Update Details</h1>
                        <span className="text-xs font-medium bg-primary/10 text-accent px-3 py-1 rounded-full border border-accent/20">{type}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-muted-foreground font-light">
                        <p><strong>Date:</strong> {date}</p>
                        <p><strong>Owner:</strong> {ownerName}</p>
                        <p>
                            <strong>Project:</strong>{" "}
                            {projectId ? (
                                <Link to={`/projects/${projectId}`} className="font-medium text-accent hover:underline">
                                    {projectName}
                                </Link>
                            ) : ( "N/A" )}
                        </p>
                        <p>
                            <strong>Task:</strong>{" "}
                            {taskId ? (
                                <Link to={`/tasks/${taskId}`} className="font-medium text-accent hover:underline">
                                    {taskName}
                                </Link>
                            ) : ( "N/A" )}
                        </p>
                    </div>
                    <div className="mt-8 pt-6 border-t border-border">
                        <h3 className="text-base font-semibold text-foreground mb-2">Notes</h3>
                        <p className="text-foreground whitespace-pre-wrap font-light">{notes}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  );
}
