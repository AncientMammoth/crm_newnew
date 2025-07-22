import React, { useState, useEffect, Fragment, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createUpdate, fetchProjectsByIds } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Briefcase, Calendar, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';

const UPDATE_TYPE_OPTIONS = ["Email", "Call", "Online Meeting", "Physical Meeting"];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

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
        <div className="ml-4 flex-shrink-0 flex"><button onClick={onHide} className="inline-flex rounded-md text-white hover:text-gray-200 focus:outline-none"><XMarkIcon className="h-5 w-5" aria-hidden="true" /></button></div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
    <div className="w-full p-4 border border-border bg-secondary rounded-md shadow"><div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-3 py-1"><div className="h-2 bg-muted-foreground/50 rounded"></div><div className="grid grid-cols-3 gap-4"><div className="h-2 bg-muted-foreground/50 rounded col-span-2"></div><div className="h-2 bg-muted-foreground/50 rounded col-span-1"></div></div></div></div></div>
);

export default function UpdateCreation() {
  const dateRef = useRef(null); // Ref for date input
  const [fields, setFields] = useState({
    "Notes": "", "Date": "", "Update Type": UPDATE_TYPE_OPTIONS[0], "Project": null,
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const navigate = useNavigate();

  const updateOwnerId = localStorage.getItem("userRecordId") || "";
  const userName = localStorage.getItem("userName") || "Current User";

  useEffect(() => {
    const ids = JSON.parse(localStorage.getItem("projectIds") || "[]");
    if (ids.length) {
        fetchProjectsByIds(ids).then(data => {
            setProjects(data);
            setProjectsLoading(false);
        });
    } else {
        setProjectsLoading(false);
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
    if (!fields["Notes"] || !fields["Project"] || !fields["Date"]) {
      setNotification({ show: true, message: "Please fill out all required fields.", type: 'error' });
      return;
    }
    setLoading(true);

    try {
      const update = await createUpdate({
        ...fields,
        Project: fields.Project?.id || null, 
        "Update Owner": updateOwnerId || null,
      });
      
      const prevUpdateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
      const newUpdateIds = [...new Set([...prevUpdateIds, update.id])];
      localStorage.setItem("updateIds", JSON.stringify(newUpdateIds));
      
      setNotification({ show: true, message: "Update created successfully!", type: 'success' });
      setTimeout(() => navigate(`/updates/${update.id}`), 2000);

    } catch (error) {
      setNotification({ show: true, message: error.message || "Failed to create update.", type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Notification show={notification.show} onHide={() => setNotification(p => ({...p, show: false}))} message={notification.message} type={notification.type}/>
      <div className="min-h-screen bg-card flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full space-y-8"
        >
            <div className="text-center">
                <h2 className="text-4xl font-light text-foreground">Log a New Update</h2>
                <p className="mt-2 text-lg text-muted-foreground">Keep a record of all your project interactions and progress.</p>
            </div>
          
            <div className="bg-[#333333] p-10 rounded-2xl border border-border">
                <form onSubmit={handleSubmit} className="space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {projectsLoading ? <SkeletonLoader /> : (
                            <Listbox value={fields["Project"]} onChange={value => setFields(f => ({ ...f, "Project": value }))}>
                                <div>
                                    <Listbox.Label className="block text-sm font-light text-muted-foreground">Project</Listbox.Label>
                                    <div className="mt-1 relative">
                                        <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                                            <span className="flex items-center"><Briefcase className="h-5 w-5 text-muted-foreground" /><span className="ml-3 block truncate text-foreground">{fields.Project ? fields.Project.fields["Project Name"] : "Select a project"}</span></span>
                                            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                                        </Listbox.Button>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                                {projects.map(p => (<Listbox.Option key={p.id} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={p}>{({ selected, active }) => (<><span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{p.fields["Project Name"]}</span>{selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}</Listbox.Option>))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </div>
                            </Listbox>
                        )}
                        <Listbox value={fields["Update Type"]} onChange={value => setFields(f => ({ ...f, "Update Type": value }))}>
                            <div>
                                <Listbox.Label className="block text-sm font-light text-muted-foreground">Update Type</Listbox.Label>
                                <div className="mt-1 relative">
                                    <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                                        <span className="flex items-center"><MessageSquare className="h-5 w-5 text-muted-foreground" /><span className="ml-3 block truncate text-foreground">{fields["Update Type"]}</span></span>
                                        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                                    </Listbox.Button>
                                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                            {UPDATE_TYPE_OPTIONS.map(type => (<Listbox.Option key={type} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={type}>{({ selected, active }) => (<><span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{type}</span>{selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}</Listbox.Option>))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </div>
                        </Listbox>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-light text-muted-foreground">Notes</label>
                        <div className="mt-1"><textarea id="notes" required rows="4" placeholder="Log the details of the update..." className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground" value={fields["Notes"]} onChange={e => setFields(f => ({ ...f, "Notes": e.target.value }))}></textarea></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                            <label className="block text-sm font-light text-muted-foreground">Date</label>
                            <div
                                onClick={() => dateRef.current?.showPicker?.()}
                                className="mt-1 relative flex items-center w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-3 py-3 text-left cursor-pointer focus-within:ring-1 focus-within:ring-primary focus-within:border-primary"
                            >
                                <Calendar className="h-5 w-5 text-foreground" />
                                <span className={`ml-3 block truncate ${fields["Date"] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {fields["Date"] ? new Date(fields["Date"] + 'T00:00:00').toLocaleDateString() : "Select a date"}
                                </span>
                                <input
                                    ref={dateRef}
                                    id="date"
                                    required
                                    type="date"
                                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                    value={fields["Date"]}
                                    onChange={e => setFields(f => ({ ...f, "Date": e.target.value }))}
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-light text-muted-foreground">Update Owner</label>
                            <div className="mt-1">
                                <span className="inline-block bg-secondary text-foreground text-sm font-medium mr-2 px-4 py-3 rounded-full border border-border">{userName}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading || projectsLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out">
                            {loading ? (<><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Logging Update...</>) : "Log Update"}
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
      </div>
    </>
  );
}