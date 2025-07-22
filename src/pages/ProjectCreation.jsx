import React, { useState, useEffect, Fragment, useRef } from "react";
import { createProject, fetchAccountsByIds } from "../api/index.js";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Briefcase, Building2, Calendar, Workflow, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";
import { motion } from 'framer-motion';

const PROJECT_STATUS_OPTIONS = [
  "Negotiation",
  "Need Analysis",
  "Closed Won",
  "Closed Lost",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// A reusable Toast Notification component
const Notification = ({ show, onHide, message, type }) => {
  if (!show) return null;
    
  const baseClasses = "fixed top-20 right-5 w-full max-w-sm p-4 rounded-xl shadow-lg text-white transform transition-all duration-300 ease-in-out z-50";
  const typeClasses = { success: "bg-green-500", error: "bg-red-500" };
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;
  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0"><Icon className="h-6 w-6 text-white" aria-hidden="true" /></div>
        <div className="ml-3 w-0 flex-1 pt-0.5"><p className="text-sm font-medium">{message}</p></div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onHide} className="inline-flex rounded-md text-white hover:text-gray-200 focus:outline-none"><span className="sr-only">Close</span><XMarkIcon className="h-5 w-5" aria-hidden="true" /></button>
        </div>
      </div>
    </div>
  );
};

// A reusable Skeleton Loader component
const SkeletonLoader = () => (
    <div className="w-full p-4 border border-border bg-secondary rounded-md shadow"><div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-3 py-1"><div className="h-2 bg-muted-foreground/50 rounded"></div><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-muted-foreground/50 rounded col-span-2"></div><div className="h-2 bg-muted-foreground/50 rounded col-span-1"></div></div></div></div></div>
);

export default function ProjectCreation() {
  const startDateRef = useRef(null); // Ref for start date
  const endDateRef = useRef(null);   // Ref for end date
  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": PROJECT_STATUS_OPTIONS[0],
    "Start Date": "",
    "End Date": "",
    "Account": null,
    "Project Value": "",
    "Project Description": "",
  });
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const projectOwnerId = localStorage.getItem("userRecordId") || "";

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("accountIds") || "[]");
    if (ids.length) {
      fetchAccountsByIds(ids).then(data => {
        setAccounts(data);
        setAccountsLoading(false);
      });
    } else {
        setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => setNotification(p => ({ ...p, show: false })), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields["Project Name"] || !fields["Account"]) {
        setNotification({ show: true, message: "Project Name and Account are required.", type: 'error' });
        return;
    }
    setLoading(true);
    try {
      const projectData = {
          ...fields,
          "Account": fields.Account?.id ? [fields.Account.id] : [],
          "Project Owner": projectOwnerId ? [projectOwnerId] : []
      };
      const project = await createProject(projectData);

      const prevProjectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
      const newProjectIds = [...new Set([...prevProjectIds, project.id])];
      localStorage.setItem("projectIds", JSON.stringify(newProjectIds));

      setNotification({ show: true, message: "Project created successfully!", type: 'success' });
      // Reset form or navigate away
      setFields({ "Project Name": "", "Project Status": PROJECT_STATUS_OPTIONS[0], "Start Date": "", "End Date": "", "Account": null, "Project Value": "", "Project Description": ""});

    } catch (error) {
      setNotification({ show: true, message: error.message || "Failed to create project.", type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Notification show={notification.show} onHide={() => setNotification(p => ({...p, show: false}))} message={notification.message} type={notification.type} />
      <div className="min-h-screen bg-card flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full space-y-8"
        >
            <div className="text-center">
                <h2 className="text-4xl font-light text-foreground">Create a New Project</h2>
                <p className="mt-2 text-lg text-muted-foreground">Organize your work into projects and assign them to accounts.</p>
            </div>
          
            <div className="bg-[#333333] p-10 rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div>
                        <label htmlFor="project-name" className="block text-sm font-light text-muted-foreground mb-1">Project Name</label>
                        <input id="project-name" required type="text" placeholder="e.g., Q4 Enterprise Solutions" className="appearance-none relative block w-full px-3 py-3 border border-border bg-secondary placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" value={fields["Project Name"]} onChange={e => setFields(f => ({ ...f, "Project Name": e.target.value }))} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {accountsLoading ? <SkeletonLoader /> : (
                            <Listbox value={fields["Account"]} onChange={value => setFields(f => ({ ...f, "Account": value }))}>
                                <div>
                                    <Listbox.Label className="block text-sm font-light text-muted-foreground">Account</Listbox.Label>
                                    <div className="mt-1 relative">
                                        <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                                            <span className="flex items-center"><Building2 className="h-5 w-5 text-muted-foreground" /><span className="ml-3 block truncate text-foreground">{fields.Account ? fields.Account.fields["Account Name"] : "Select an account"}</span></span>
                                            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                                        </Listbox.Button>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                {accounts.map(acc => (<Listbox.Option key={acc.id} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={acc}>{({ selected, active }) => (<><span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{acc.fields["Account Name"]}</span>{selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}</Listbox.Option>))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </div>
                            </Listbox>
                        )}
                        <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
                            <div>
                                <Listbox.Label className="block text-sm font-light text-muted-foreground">Project Status</Listbox.Label>
                                <div className="mt-1 relative">
                                    <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                                        <span className="flex items-center"><Workflow className="h-5 w-5 text-muted-foreground" /><span className="ml-3 block truncate text-foreground">{fields["Project Status"]}</span></span>
                                        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                                    </Listbox.Button>
                                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                            {PROJECT_STATUS_OPTIONS.map(status => (<Listbox.Option key={status} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={status}>{({ selected, active }) => (<><span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{status}</span>{selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}</Listbox.Option>))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </div>
                        </Listbox>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-sm font-light text-muted-foreground">Start Date</label>
                            <div
                              onClick={() => startDateRef.current?.showPicker?.()}
                              className="mt-1 relative flex items-center w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-3 py-3 text-left cursor-pointer focus-within:ring-1 focus-within:ring-primary focus-within:border-primary"
                            >
                                <Calendar className="h-5 w-5 text-foreground" />
                                <span className={`ml-3 block truncate ${fields["Start Date"] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {fields["Start Date"] ? new Date(fields["Start Date"] + 'T00:00:00').toLocaleDateString() : "Select a date"}
                                </span>
                                <input
                                    ref={startDateRef}
                                    id="start-date"
                                    type="date"
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    value={fields["Start Date"]}
                                    onChange={e => setFields(f => ({ ...f, "Start Date": e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-light text-muted-foreground">End Date</label>
                            <div
                              onClick={() => endDateRef.current?.showPicker?.()}
                              className="mt-1 relative flex items-center w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-3 py-3 text-left cursor-pointer focus-within:ring-1 focus-within:ring-primary focus-within:border-primary"
                            >
                                <Calendar className="h-5 w-5 text-foreground" />
                                <span className={`ml-3 block truncate ${fields["End Date"] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {fields["End Date"] ? new Date(fields["End Date"] + 'T00:00:00').toLocaleDateString() : "Select a date"}
                                </span>
                                <input
                                    ref={endDateRef}
                                    id="end-date"
                                    type="date"
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    value={fields["End Date"]}
                                    onChange={e => setFields(f => ({ ...f, "End Date": e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                     <div>
                        <label htmlFor="project-value" className="block text-sm font-light text-muted-foreground mb-1">Project Value</label>
                        <div className="relative mt-1">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input id="project-value" type="number" placeholder="e.g., 50000" className="appearance-none relative block w-full px-3 py-3 pl-10 border border-border bg-secondary placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" value={fields["Project Value"]} onChange={e => setFields(f => ({ ...f, "Project Value": e.target.value }))} />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-light text-muted-foreground">Project Description</label>
                        <div className="mt-1"><textarea id="description" rows="4" placeholder="Add a detailed description for the project..." className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground" value={fields["Project Description"]} onChange={e => setFields(f => ({ ...f, "Project Description": e.target.value }))}></textarea></div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading || accountsLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out">
                            {loading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating Project...</>) : "Create Project"}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
      </div>
    </>
  );
}