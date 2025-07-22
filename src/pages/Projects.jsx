import React, { useState, useEffect, useMemo, Fragment } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchProjectsByIds,
  fetchAllUpdates,
  processUpdatesByProject,
  createUpdate,
  updateUser,
  formatDateForAirtable,
  fetchAccountsByIds, // Import the function to fetch accounts
} from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import ProjectCard from "./ProjectCard";
import UpdateDisplay from "./UpdateDisplay";
import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";


function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getTodayIST() {
  const now = new Date();
  // Adjust to IST
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 60 * 60000);
  return ist.toISOString().slice(0, 10);
}

function getLastNDays(n) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const STATUS_OPTIONS = [
  "",
  "Need Analysis",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const UPDATE_TYPES = ["Call", "Email", "Meeting", "Note"];

export default function Projects() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(getTodayIST());
  const [expandedNote, setExpandedNote] = useState(null);
  const [notesByProject, setNotesByProject] = useState({});
  const [updateTypeByProject, setUpdateTypeByProject] = useState({});
  const [errorByProject, setErrorByProject] = useState({});
  const [filteredUpdatesByProject, setFilteredUpdatesByProject] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [successProjectId, setSuccessProjectId] = useState(null);

  const updateOwnerId = localStorage.getItem("userRecordId") || "";
  const userName = localStorage.getItem("userName") || "Current User";
  
  const [projectIds] = useState(() => JSON.parse(localStorage.getItem("projectIds") || "[]"));
  const [accountIds] = useState(() => JSON.parse(localStorage.getItem("accountIds") || "[]"));

  const {
    data: projects,
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", projectIds],
    queryFn: () => fetchProjectsByIds(projectIds),
    enabled: projectIds.length > 0,
  });

  const {
    data: allUpdates = [],
    isLoading: updatesLoading,
    error: updatesError,
  } = useQuery({
    queryKey: ["allUpdates"],
    queryFn: fetchAllUpdates,
  });

  // Fetch all accounts to get their full names
  const { data: accountsData } = useQuery({
    queryKey: ["accounts", accountIds],
    queryFn: () => fetchAccountsByIds(accountIds),
    enabled: accountIds.length > 0,
  });
  
  // Create a lookup map for account names
  const accountMap = useMemo(() => {
    if (!accountsData) return new Map();
    return new Map(accountsData.map(acc => [acc.id, acc.fields["Account Name"]]));
  }, [accountsData]);

  const processedUpdates = useMemo(() => {
    if (allUpdates.length > 0 && projectIds.length > 0) {
      return processUpdatesByProject(allUpdates, projectIds);
    }
    return {};
  }, [allUpdates, projectIds]);

  useEffect(() => {
    if (allUpdates.length > 0 && projectIds.length > 0 && !updatesLoading) {
      const formattedDate = formatDateForAirtable(selectedDate);
      
      const filtered = {};
      Object.keys(processedUpdates).forEach((projectId) => {
        const projectUpdates = processedUpdates[projectId] || [];
        const updatesForDate = projectUpdates.filter(
          (update) => update.fields.Date === formattedDate
        );
        filtered[projectId] =
          updatesForDate.length > 0 ? updatesForDate[0] : null;
      });
      
      setFilteredUpdatesByProject(filtered);
    }
  }, [selectedDate, processedUpdates, updatesLoading, projectIds]);

  const createUpdateMutation = useMutation({
    mutationFn: async ({ projectId, notes, updateType }) => {
      const update = await createUpdate({
        Notes: notes,
        Date: selectedDate,
        "Update Type": updateType,
        Project: projectId, // Corrected this line
        "Update Owner": updateOwnerId, // Corrected this line
      });

      if (update && update.id && updateOwnerId) {
        const prevUpdates = JSON.parse(
          localStorage.getItem("updateIds") || "[]"
        );
        const updatedUpdates = [...new Set([...prevUpdates, update.id])];
        await updateUser(updateOwnerId, { Updates: updatedUpdates });
        localStorage.setItem("updateIds", JSON.stringify(updatedUpdates));
      }

      return update;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({queryKey: ["allUpdates"]});
      setSuccessProjectId(variables.projectId);
      
      setTimeout(() => {
        setSuccessProjectId(null);
      }, 3000);
    },
    onError: (err, variables) => {
      setErrorByProject((prev) => ({
        ...prev,
        [variables.projectId]: err.message || "Failed to create update.",
      }));
    },
  });

  const handleDateChange = (date) => setSelectedDate(date);
  const handleNotesChange = (projectId, value) =>
    setNotesByProject((prev) => ({ ...prev, [projectId]: value }));
  const handleTypeChange = (projectId, value) =>
    setUpdateTypeByProject((prev) => ({ ...prev, [projectId]: value }));
  const handleCreateUpdate = (projectId) => {
    const notes = notesByProject[projectId]?.trim();
    const updateType = updateTypeByProject[projectId] || "Call";
    setErrorByProject((prev) => ({ ...prev, [projectId]: undefined }));
    if (!notes || !updateType) return;
    createUpdateMutation.mutate(
      { projectId, notes, updateType },
      {
        onSuccess: () => {
          setNotesByProject((prev) => ({ ...prev, [projectId]: "" }));
          setUpdateTypeByProject((prev) => ({ ...prev, [projectId]: "" }));
        },
      }
    );
  };

  const isLoading = projectsLoading || updatesLoading;
  const error = projectsError || updatesError;

  const last10Days = getLastNDays(10);

  const filteredProjects = useMemo(() => {
      if(!projects) return [];
      return projects.filter((project) => {
        const name = project.fields["Project Name"]?.toLowerCase() || "";
        const status = project.fields["Project Status"]?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();

        const matchesSearch = name.includes(search) || status.includes(search);
        const matchesStatus = statusFilter
        ? status === statusFilter.toLowerCase()
        : true;

        return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter])

  return (
    <div className="min-h-screen bg-card w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h1 className="text-4xl font-light text-foreground">My Projects</h1>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <label className="text-sm font-light text-muted-foreground">Date:</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="border border-border bg-secondary text-foreground rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                    />
                    <div className="flex gap-1 flex-wrap mt-2 sm:mt-0">
                        {last10Days.map((date) => (
                        <button
                            key={date}
                            onClick={() => handleDateChange(date)}
                            className={classNames(
                            "text-xs font-light px-2 py-1 rounded-md border transition-colors duration-200",
                            selectedDate === date
                                ? "bg-primary text-background border-primary"
                                : "bg-secondary text-foreground hover:bg-[#2E2E2E] border-border"
                            )}
                            title={date}
                        >
                            {new Date(date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            })}
                        </button>
                        ))}
                    </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by project name or status..."
                    className="border border-border bg-secondary rounded-md px-4 py-2 text-sm w-full sm:w-1/2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                    />

                    <div className="w-full sm:w-1/3">
                    <Listbox value={statusFilter} onChange={setStatusFilter}>
                        {({ open }) => (
                        <div className="relative">
                            <Listbox.Button className="relative w-full cursor-default rounded-md bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                            <span className="block truncate text-foreground">
                                {statusFilter || "All Statuses"}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronUpDownIcon
                                className="h-5 w-5 text-muted-foreground"
                                aria-hidden="true"
                                />
                            </span>
                            </Listbox.Button>
                            <Transition
                            show={open}
                            as={Fragment} 
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                {STATUS_OPTIONS.map((option, idx) => (
                                <Listbox.Option
                                    key={idx}
                                    className={({ active }) =>
                                    classNames(
                                        active ? "bg-primary/20 text-white" : "text-foreground",
                                        "cursor-default select-none relative py-2 pl-10 pr-4"
                                    )
                                    }
                                    value={option}
                                >
                                    {({ selected, active }) => (
                                    <>
                                        <span
                                        className={classNames(
                                            selected ? "font-semibold" : "font-normal",
                                            "block truncate"
                                        )}
                                        >
                                        {option || "All Statuses"}
                                        </span>
                                        {selected && (
                                        <span
                                            className={classNames(
                                            active ? "text-white" : "text-accent",
                                            "absolute inset-y-0 left-0 flex items-center pl-3"
                                            )}
                                        >
                                            <CheckIcon className="h-5 w-5" />
                                        </span>
                                        )}
                                    </>
                                    )}
                                </Listbox.Option>
                                ))}
                            </Listbox.Options>
                            </Transition>
                        </div>
                        )}
                    </Listbox>
                    </div>
                </div>
            </motion.div>

            {isLoading ? (
                <div className="text-center py-20 text-muted-foreground">Loading projects...</div>
            ) : error ? (
                <div className="text-center py-10 text-red-500">
                    Error: {error.message}
                </div>
            ) : !projects?.length ? (
                <div className="text-center py-20 text-muted-foreground">
                    <div className="text-xl mb-2">No projects found</div>
                    <p>Projects linked to your profile will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProjects.length === 0 ? (
                    <div className="text-center text-muted-foreground py-10">
                        No projects match your filters.
                    </div>
                    ) : (
                    filteredProjects.map((record) => {
                        const accountId = record.fields.Account?.[0];
                        const fullAccountName = accountMap.get(accountId);

                        return (
                            <ProjectCard
                                key={record.id}
                                record={record}
                                isSuccess={successProjectId === record.id}
                                update={filteredUpdatesByProject[record.id]}
                                notes={notesByProject[record.id] || ""}
                                updateType={updateTypeByProject[record.id] || "Call"}
                                updateTypeOptions={UPDATE_TYPES}
                                error={errorByProject[record.id]}
                                onNotesChange={(val) => handleNotesChange(record.id, val)}
                                onTypeChange={(val) => handleTypeChange(record.id, val)}
                                onCreateUpdate={() => handleCreateUpdate(record.id)}
                                onExpandNote={(update) =>
                                    setExpandedNote({ projectId: record.id, update })
                                }
                                userName={userName}
                                updateOwnerId={updateOwnerId}
                                fullAccountName={fullAccountName} // Pass the full name down
                            />
                        );
                    })
                    )}
                </div>
            )}


            {expandedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 transition-all backdrop-blur-sm">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#333333] rounded-2xl border border-border shadow-lg max-w-lg w-full p-6 relative"
                >
                    <button
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setExpandedNote(null)}
                    aria-label="Close"
                    >
                    <XMarkIcon className="h-6 w-6"/>
                    </button>
                    <h3 className="text-lg font-light text-foreground mb-4">Update Details</h3>
                    <UpdateDisplay
                    update={expandedNote.update}
                    userName={userName}
                    expanded
                    />
                </motion.div>
                </div>
            )}
        </div>
    </div>
  );
}