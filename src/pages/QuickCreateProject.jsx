import React, { useState, useEffect, Fragment } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const PROJECT_STATUS_OPTIONS = [
  "Need Analysis",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function QuickCreateProject({ accounts, onClose, defaultAccount }) {
  const queryClient = useQueryClient();

  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": PROJECT_STATUS_OPTIONS[0],
    "Start Date": new Date().toISOString().split('T')[0],
    "End Date": "",
    "Account": defaultAccount?.id || "",
    "Project Value": "",
    "Project Description": "",
  });

  useEffect(() => {
    setFields(f => ({
      ...f,
      "Account": defaultAccount?.id || "",
    }));
  }, [defaultAccount]);

  const [error, setError] = useState("");
  const projectOwnerId = localStorage.getItem("userRecordId") || "";

  const createProjectMutation = useMutation({
    mutationFn: (projectData) => createProject(projectData),
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({queryKey: ["projects"]});
      queryClient.invalidateQueries({queryKey: ["accountProjects", fields.Account]});

      const prevProjects = JSON.parse(localStorage.getItem("projectIds") || "[]");
      localStorage.setItem("projectIds", JSON.stringify([...prevProjects, newProject.id]));

      onClose();
    },
    onError: (err) => {
        setError("Failed to create project: " + (err.message || "Unknown error"));
      }
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields["Account"]) {
      setError("Please select an account");
      return;
    }

    setError("");

    createProjectMutation.mutate({
      "Project Name": fields["Project Name"],
      "Project Status": fields["Project Status"],
      "Start Date": fields["Start Date"],
      "End Date": fields["End Date"],
      "Account": fields["Account"] ? [fields["Account"]] : [],
      "Project Value": fields["Project Value"] ? Number(fields["Project Value"]) : undefined,
      "Project Description": fields["Project Description"],
      "Project Owner": projectOwnerId ? [projectOwnerId] : [],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
        <label className="block text-sm font-light text-muted-foreground mb-1">Project Name</label>
        <input
            required
            className="w-full px-4 py-2 border border-border bg-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-foreground placeholder-muted-foreground"
            placeholder="Enter project name"
            value={fields["Project Name"]}
            onChange={e => setFields(f => ({ ...f, "Project Name": e.target.value }))}
        />
        </div>

        <div>
        <label className="block text-sm font-light text-muted-foreground mb-1">Project Status</label>
        <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
            <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="block truncate text-foreground">{fields["Project Status"]}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-20 mt-1 w-full overflow-auto rounded-lg bg-secondary py-1 text-sm shadow-lg ring-1 ring-border focus:outline-none max-h-60">
                    {PROJECT_STATUS_OPTIONS.map((status) => (
                    <Listbox.Option key={status} value={status} className={({ active }) => classNames(active ? "bg-primary/20 text-white" : "text-foreground", "cursor-default select-none relative py-2 pl-10 pr-4")}>
                        {({ selected, active }) => (
                        <>
                            <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>{status}</span>
                            {selected && <span className={classNames(active ? "text-white" : "text-accent", "absolute inset-y-0 left-0 flex items-center pl-3")}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>}
                        </>
                        )}
                    </Listbox.Option>
                    ))}
                </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-light text-muted-foreground mb-1">Start Date</label>
            <input required type="date" className="w-full px-4 py-2 border border-border bg-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-foreground" value={fields["Start Date"]} onChange={e => setFields(f => ({ ...f, "Start Date": e.target.value }))} />
        </div>
        <div>
            <label className="block text-sm font-light text-muted-foreground mb-1">End Date</label>
            <input type="date" className="w-full px-4 py-2 border border-border bg-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-foreground" value={fields["End Date"]} onChange={e => setFields(f => ({ ...f, "End Date": e.target.value }))} />
        </div>
        </div>

        <div>
        <label className="block text-sm font-light text-muted-foreground mb-1">Account</label>
        <Listbox value={fields["Account"]} onChange={value => setFields(f => ({ ...f, "Account": value }))}>
            <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="block truncate text-foreground">{accounts.find(a => a.id === fields["Account"])?.fields["Account Name"] || "Select account"}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Listbox.Options className="absolute z-20 mt-1 w-full overflow-auto rounded-lg bg-secondary py-1 text-sm shadow-lg ring-1 ring-border focus:outline-none max-h-60">
                    {accounts.map((acc) => (
                    <Listbox.Option key={acc.id} value={acc.id} className={({ active }) => classNames(active ? "bg-primary/20 text-white" : "text-foreground", "cursor-default select-none relative py-2 pl-10 pr-4")}>
                        {({ selected, active }) => (
                        <>
                            <span className={classNames(selected ? "font-semibold" : "font-normal", "block truncate")}>{acc.fields["Account Name"]}</span>
                            {selected && <span className={classNames(active ? "text-white" : "text-accent", "absolute inset-y-0 left-0 flex items-center pl-3")}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>}
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
            <label className="block text-sm font-light text-muted-foreground mb-1">Project Value ($)</label>
            <input type="number" min="0" placeholder="Enter project value" className="w-full px-4 py-2 border border-border bg-secondary rounded-lg focus:ring-2 focus:ring-primary focus:border-primary shadow-sm text-foreground placeholder-muted-foreground" value={fields["Project Value"]} onChange={e => setFields(f => ({ ...f, "Project Value": e.target.value }))} />
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-2 text-center font-medium text-sm">{error}</div>}

        <button type="submit" disabled={createProjectMutation.isPending} className={`w-full py-3 px-6 rounded-lg font-semibold text-background transition-all ${createProjectMutation.isPending ? "bg-primary/50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 shadow-lg"}`}>
        {createProjectMutation.isPending ? "Creating Project..." : "Create Project"}
        </button>
    </form>
  );
}
