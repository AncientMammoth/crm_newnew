import React, { useState, Fragment, useEffect } from "react";
import { createProject } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { FolderIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';

const PROJECT_STATUS_OPTIONS = [
  "Not Started",
  "In Progress", 
  "On Hold",
  "Completed",
  "Cancelled"
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
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex items-center">
        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
        <p className="text-sm font-medium flex-1">{message}</p>
        <button 
          onClick={onHide}
          className="ml-3 text-white hover:text-gray-200"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function ProjectCreation() {
  const [projectName, setProjectName] = useState("");
  const [projectStatus, setProjectStatus] = useState(PROJECT_STATUS_OPTIONS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadUserAccounts();
  }, []);

  const loadUserAccounts = async () => {
    try {
      const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
      if (accountIds.length > 0) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectName.trim() || !accountId) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      showNotification("End date cannot be before start date", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        "Project Name": projectName.trim(),
        "Project Status": projectStatus,
        "Start Date": startDate || null,
        "End Date": endDate || null,
        "Account": [parseInt(accountId)],
        "Project Value": projectValue ? parseFloat(projectValue) : null,
        "Project Description": projectDescription.trim(),
        "Project Owner": [localStorage.getItem("secretKey")] // FIX: Use secretKey in array format
      };

      await createProject(projectData);
      
      showNotification("Project created successfully!", "success");
      
      // Reset form
      setProjectName("");
      setProjectStatus(PROJECT_STATUS_OPTIONS[0]);
      setStartDate("");
      setEndDate("");
      setProjectValue("");
      setProjectDescription("");
      setAccountId("");
      
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
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center">
                <FolderIcon className="w-8 h-8 text-white mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Project</h1>
                  <p className="text-purple-100 mt-1">Start a new project for your account</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project name..."
                  required
                />
              </div>

              {/* Project Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Status *
                </label>
                <Listbox value={projectStatus} onChange={setProjectStatus}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <span className="block truncate">{projectStatus}</span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {PROJECT_STATUS_OPTIONS.map((status, index) => (
                          <Listbox.Option
                            key={index}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-purple-100 text-purple-900' : 'text-gray-900'
                              }`
                            }
                            value={status}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {status}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-purple-600">
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
                </Listbox>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Project Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Value (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={projectValue}
                  onChange={(e) => setProjectValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter project value..."
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Enter project description (optional)..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}
