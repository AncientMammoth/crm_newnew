import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProjectById, fetchUpdatesByIds, updateRecord, fetchTasksByIds } from "../api";
import React, { useState, useEffect, useMemo, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

const PROJECT_STATUS_OPTIONS = [
  "Negotiation",
  "Need Analysis",
  "Closed Won",
  "Closed Lost",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProjectDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [fields, setFields] = useState({
    "Project Status": "",
    "Start Date": "",
    "End Date": "",
    "Project Value": "",
    "Project Description": "",
  });

  const { data: project, isLoading, error: fetchError } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (project?.fields) {
      setFields({
        "Project Status": project.fields["Project Status"] || "",
        "Start Date": project.fields["Start Date"] || "",
        "End Date": project.fields["End Date"] || "",
        "Project Value": project.fields["Project Value"] || "",
        "Project Description": project.fields["Project Description"] || "",
      });
    }
  }, [project]);

  const { mutate: updateProject, isPending: isUpdating, isSuccess, error: updateError } = useMutation({
    mutationFn: (updatedFields) => updateRecord("Projects", id, updatedFields),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["project", id]});
      setTimeout(() => {
        queryClient.setQueryData(["project", id], (oldData) => {
            if (oldData) {
                const newData = { ...oldData };
                delete newData.isSuccess;
                return newData;
            }
            return oldData;
        });
      }, 3000);
    },
  });

  const handleUpdate = (e) => {
    e.preventDefault();
    const numericValue = fields["Project Value"] === "" || fields["Project Value"] === null ? undefined : Number(fields["Project Value"]);
    updateProject({
        ...fields,
        "Project Value": numericValue,
    });
  };

  const updateIds = project?.fields?.Updates || [];
  const { data: updates, isLoading: updatesLoading } = useQuery({
    queryKey: ["projectUpdates", updateIds],
    queryFn: () => fetchUpdatesByIds(updateIds),
    enabled: updateIds.length > 0,
  });

  const taskIds = useMemo(() => {
    if (!updates) return [];
    const ids = updates.map((u) => u.fields.Task?.[0]).filter(Boolean);
    return [...new Set(ids)];
  }, [updates]);

  const { data: tasks } = useQuery({
    queryKey: ["tasksForProjectUpdates", taskIds],
    queryFn: () => fetchTasksByIds(taskIds),
    enabled: taskIds.length > 0,
  });

  const taskIdToName = useMemo(() => {
    if (!tasks) return {};
    return tasks.reduce((acc, task) => {
      acc[task.id] = task.fields["Task Name"] || task.id;
      return acc;
    }, {});
  }, [tasks]);


  if (isLoading) return <div className="text-center py-20 text-lg text-muted-foreground">Loading project details...</div>;
  if (fetchError) return <div className="text-red-500 text-center py-10">Error loading project: {fetchError.message}</div>;
  if (!project) return <div className="text-center py-10 text-muted-foreground">No project data found.</div>;

  const name = project.fields["Project Name"] || "Unnamed Project";
  const accountName = project.fields["Account Name (from Account)"]?.[0] || "N/A";
  const accountId = project.fields.Account?.[0];

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
                    <li>
                        <span className="font-semibold text-foreground">{name}</span>
                    </li>
                    </ol>
                </nav>

                <form onSubmit={handleUpdate} className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border mb-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-3xl font-light text-foreground">{name}</h1>
                            <p className="text-sm text-muted-foreground mt-1 font-light">
                            Account:{" "}
                            {accountId ? (
                                <Link to={`/accounts/${accountId}`} className="font-medium text-accent hover:underline">
                                {accountName}
                                </Link>
                            ) : (
                                <span className="font-medium text-foreground">{accountName}</span>
                            )}
                            </p>
                        </div>
                        {isSuccess && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg px-4 py-2 text-sm font-medium animate-pulse">
                            ✓ Project saved successfully!
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                            <label className="text-sm text-muted-foreground font-light mb-1 block">Project Status</label>
                            <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
                                <div className="relative">
                                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                                    <span className="block truncate text-foreground">{fields["Project Status"] || "Select status"}</span>
                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    </span>
                                </Listbox.Button>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {PROJECT_STATUS_OPTIONS.map((status) => (
                                        <Listbox.Option key={status} className={({ active }) => classNames('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')} value={status}>
                                        {({ selected }) => (
                                            <>
                                            <span className={classNames('block truncate', selected ? 'font-semibold' : 'font-normal')}>{status}</span>
                                            {selected ? (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                            ) : null}
                                            </>
                                        )}
                                        </Listbox.Option>
                                    ))}
                                    </Listbox.Options>
                                </Transition>
                                </div>
                            </Listbox>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground font-light mb-1 block">Project Value ($)</label>
                            <input
                                type="number"
                                min="0"
                                className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                                value={fields["Project Value"]}
                                onChange={e => setFields(f => ({...f, "Project Value": e.target.value}))}
                                placeholder="e.g., 5000"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground font-light mb-1 block">Start Date</label>
                            <input
                                type="date"
                                className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                value={fields["Start Date"]}
                                onChange={e => setFields(f => ({...f, "Start Date": e.target.value}))}
                            />
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground font-light mb-1 block">End Date</label>
                            <input
                                type="date"
                                className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                value={fields["End Date"]}
                                onChange={e => setFields(f => ({...f, "End Date": e.target.value}))}
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="text-sm text-muted-foreground font-light mb-1 block">Project Description</label>
                            <textarea
                                rows={4}
                                className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                                value={fields["Project Description"]}
                                onChange={e => setFields(f => ({...f, "Project Description": e.target.value}))}
                                placeholder="Add a detailed description for the project..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center mt-8">
                        {updateError && (
                            <p className="text-sm text-red-500 mr-4">{updateError.message || "Failed to save project."}</p>
                        )}
                        <button
                        type="submit"
                        disabled={isUpdating}
                        className={`rounded-lg px-6 py-2 text-sm font-semibold shadow-sm transition ${
                            isUpdating
                            ? "bg-primary/50 cursor-not-allowed text-background/50"
                            : "bg-primary hover:bg-primary/90 text-background"
                        }`}
                        >
                        {isUpdating ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>

                <div>
                    <h2 className="text-2xl font-light text-foreground mb-4 mt-10">Project Updates</h2>
                    <div className="space-y-4">
                    {updatesLoading ? (
                        <p className="text-muted-foreground font-light">Loading updates...</p>
                    ) : updates && updates.length > 0 ? (
                        updates.map((update) => {
                        const taskId = update.fields.Task?.[0];
                        const taskName = taskIdToName[taskId];
                        return (
                            <Link
                                to={`/updates/${update.id}`}
                                key={update.id}
                                className="block bg-secondary p-4 rounded-lg border border-border hover:bg-[#2E2E2E] transition-colors duration-200 group"
                            >
                                <p className="text-foreground whitespace-pre-wrap mb-3 font-light">
                                {update.fields.Notes || <span className="italic">No notes provided.</span>}
                                </p>
                                <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t border-border">
                                <span>
                                    <strong>Date:</strong> {new Date(update.fields.Date).toLocaleDateString()}
                                </span>
                                {taskId && taskName && (
                                    <span>
                                    <strong>Task: </strong>
                                    <Link to={`/tasks/${taskId}`} className="text-accent hover:underline font-medium" onClick={(e) => e.stopPropagation()}>
                                        {taskName}
                                    </Link>
                                    </span>
                                )}
                                </div>
                            </Link>
                        );
                        })
                    ) : (
                        <div className="text-center text-muted-foreground bg-secondary p-6 rounded-lg border border-border italic font-light">No updates have been recorded for this project.</div>
                    )}
                    </div>
                </div>
            </motion.div>
        </div>
    </div>
  );
}