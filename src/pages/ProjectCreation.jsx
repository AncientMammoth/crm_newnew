import React, { useState, Fragment, useEffect, useRef } from "react";
import { createProject } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Folder, Calendar, AlertTriangle, CheckCircle, Briefcase } from "lucide-react";
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
  const typeClasses = {
    success: "bg-green-500",
    error: "bg-red-500",
  };
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onHide} className="inline-flex rounded-md text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProjectCreation() {
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": PROJECT_STATUS_OPTIONS[0],
    "Start Date": "",
    "End Date": "",
    "Account": null,
    "Project Value": "",
    "Project Description": ""
  });
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadUserAccounts();
  }, []);

  const loadUserAccounts = async () => {
    try {
      const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
      if (accountIds.length > 0) {
        // This is a mock API call. Replace with your actual API call.
        const response = await fetch(`/api/accounts?ids=${accountIds.join(',')}`);
        const accountsData = await response.json();
        setAccounts(accountsData);
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const validateField = (name, value) => {
    if (name === "Project Name" && !value.trim()) {
      return `Project Name is required.`;
    }
    if (name === "Account" && !value) {
        return `Account is required.`;
    }
    return '';
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    let hasErrors = false;
    const newErrors = {};

    if (!fields["Project Name"].trim()) {
        newErrors["Project Name"] = "Project Name is required.";
        hasErrors = true;
    }
    if (!fields["Account"]) {
        newErrors["Account"] = "Account is required.";
        hasErrors = true;
    }

    if (fields["End Date"] && fields["Start Date"] && new Date(fields["End Date"]) < new Date(fields["Start Date"])) {
        newErrors["End Date"] = "End date cannot be before start date.";
        hasErrors = true;
    }

    if (hasErrors) {
        setErrors(newErrors);
        showNotification("Please fill out all required fields and correct any errors.", "error");
        return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        "Project Name": fields["Project Name"].trim(),
        "Project Status": fields["Project Status"],
        "Start Date": fields["Start Date"] || null,
        "End Date": fields["End Date"] || null,
        "Account": [fields["Account"]?.id],
        "Project Value": fields["Project Value"] ? parseFloat(fields["Project Value"]) : null,
        "Project Description": fields["Project Description"].trim(),
        "Project Owner": [localStorage.getItem("secretKey")]
      };

      await createProject(projectData);

      showNotification("Project created successfully!", "success");

      // Reset form
      setFields({
        "Project Name": "",
        "Project Status": PROJECT_STATUS_OPTIONS[0],
        "Start Date": "",
        "End Date": "",
        "Account": null,
        "Project Value": "",
        "Project Description": ""
      });

    } catch (error) {
      console.error("Failed to create project:", error);
      showNotification(
        error.response?.data?.error || "Failed to create project. Please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Notification
        show={notification.show}
        onHide={() => setNotification({ show: false, message: '', type: 'success' })}
        message={notification.message}
        type={notification.type}
      />

      <div className="min-h-screen bg-card flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl w-full space-y-8"
        >
          <div className="text-center">
            <h2 className="text-4xl font-light text-foreground">
              Create a New Project
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Start a new project for your account.
            </p>
          </div>

          <div className="bg-[#333333] p-10 rounded-2xl border border-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="project-name" className="block text-sm font-light text-muted-foreground mb-1">Project Name</label>
                <input
                  id="project-name"
                  name="Project Name"
                  required
                  type="text"
                  placeholder="e.g., Website Redesign"
                  className={`appearance-none relative block w-full px-3 py-3 border ${errors['Project Name'] ? 'border-red-500' : 'border-border'} bg-secondary placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                  value={fields["Project Name"]}
                  onChange={e => setFields(f => ({ ...f, "Project Name": e.target.value }))}
                  onBlur={handleBlur}
                />
                {errors['Project Name'] && <p className="mt-2 text-sm text-red-500">{errors['Project Name']}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Listbox value={fields["Account"]} onChange={value => setFields(f => ({ ...f, "Account": value }))}>
                    <div>
                        <Listbox.Label className="block text-sm font-light text-muted-foreground">Account</Listbox.Label>
                        <div className="mt-1 relative">
                        <Listbox.Button className={`relative w-full bg-secondary border ${errors['Account'] ? 'border-red-500' : 'border-border'} rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm`}>
                            <span className="flex items-center">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                <span className="ml-3 block truncate text-foreground">{fields["Account"] ? fields["Account"].account_name : "Select an account"}</span>
                            </span>
                            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                        </Listbox.Button>
                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                {accounts.map(account => (
                                <Listbox.Option key={account.id} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={account}>
                                    {({ selected, active }) => (
                                    <>
                                        <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{account.account_name}</span>
                                        {selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                    </>
                                    )}
                                </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                        {errors['Account'] && <p className="mt-2 text-sm text-red-500">{errors['Account']}</p>}
                        </div>
                    </div>
                </Listbox>

                <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
                  <div>
                    <Listbox.Label className="block text-sm font-light text-muted-foreground">Project Status</Listbox.Label>
                    <div className="mt-1 relative">
                      <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                        <span className="flex items-center">
                          <Folder className="h-5 w-5 text-muted-foreground" />
                          <span className="ml-3 block truncate text-foreground">{fields["Project Status"]}</span>
                        </span>
                        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {PROJECT_STATUS_OPTIONS.map(status => (
                            <Listbox.Option key={status} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={status}>
                              {({ selected, active }) => (
                                <>
                                  <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{status}</span>
                                  {selected ? (<span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span>) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
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
                    className={`mt-1 relative flex items-center w-full bg-secondary border ${errors['Start Date'] ? 'border-red-500' : 'border-border'} rounded-md shadow-sm pl-3 pr-3 py-3 text-left cursor-pointer focus-within:ring-1 focus-within:ring-primary focus-within:border-primary`}
                  >
                    <Calendar className="h-5 w-5 text-foreground" />
                    <span className={`ml-3 block truncate ${fields["Start Date"] ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {fields["Start Date"] ? new Date(fields["Start Date"] + 'T00:00:00').toLocaleDateString() : "Select a date"}
                    </span>
                    <input
                      ref={startDateRef}
                      id="start-date"
                      name="Start Date"
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
                    className={`mt-1 relative flex items-center w-full bg-secondary border ${errors['End Date'] ? 'border-red-500' : 'border-border'} rounded-md shadow-sm pl-3 pr-3 py-3 text-left cursor-pointer focus-within:ring-1 focus-within:ring-primary focus-within:border-primary`}
                  >
                    <Calendar className="h-5 w-5 text-foreground" />
                    <span className={`ml-3 block truncate ${fields["End Date"] ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {fields["End Date"] ? new Date(fields["End Date"] + 'T00:00:00').toLocaleDateString() : "Select a date"}
                    </span>
                    <input
                      ref={endDateRef}
                      id="end-date"
                      name="End Date"
                      type="date"
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                      value={fields["End Date"]}
                      onChange={e => setFields(f => ({ ...f, "End Date": e.target.value }))}
                    />
                  </div>
                   {errors['End Date'] && <p className="mt-2 text-sm text-red-500">{errors['End Date']}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="project-value" className="block text-sm font-light text-muted-foreground mb-1">Project Value (Optional)</label>
                <input
                  id="project-value"
                  name="Project Value"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 50000"
                  className="appearance-none relative block w-full px-3 py-3 border border-border bg-secondary placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  value={fields["Project Value"]}
                  onChange={e => setFields(f => ({ ...f, "Project Value": e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="project-description" className="block text-sm font-light text-muted-foreground">Project Description</label>
                <div className="mt-1">
                  <textarea
                    id="project-description"
                    rows="4"
                    placeholder="Add a detailed description for the project..."
                    className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"
                    value={fields["Project Description"]}
                    onChange={e => setFields(f => ({ ...f, "Project Description": e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Project...
                    </>
                  ) : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}