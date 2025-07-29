import React, { useState, Fragment, useEffect } from "react";
import { createUpdate } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { PencilSquareIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { motion } from 'framer-motion';

const UPDATE_TYPE_OPTIONS = [
  "Call",
  "Email", 
  "Meeting",
  "Follow-up",
  "Internal Discussion",
  "Client Update"
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
  
  const Icon = type === 'success' ? CheckCircleIcon : ExclamationTriangleIcon;
  
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

export default function UpdateCreation() {
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [updateType, setUpdateType] = useState(UPDATE_TYPE_OPTIONS[0]);
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadUserProjects();
  }, []);

  const loadUserProjects = async () => {
    try {
      const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
      if (projectIds.length > 0) {
        const response = await fetch(`/api/projects?ids=${projectIds.join(',')}`);
        const projectsData = await response.json();
        setProjects(projectsData);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadProjectTasks = async (selectedProjectId) => {
    try {
      const response = await fetch(`/api/tasks/by-project/${selectedProjectId}`);
      const tasksData = await response.json();
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
      setTasks([]);
    }
  };

  const handleProjectChange = (selectedProjectId) => {
    setProjectId(selectedProjectId);
    setTaskId("");
    if (selectedProjectId) {
      loadProjectTasks(selectedProjectId);
    } else {
      setTasks([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!notes.trim() || !projectId) {
      showNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = {
        "Notes": notes.trim(),
        "Date": date,
        "Update Type": updateType,
        "Project": parseInt(projectId),
        "Task": taskId ? parseInt(taskId) : null,
        "Update Owner": localStorage.getItem("secretKey")
      };

      await createUpdate(updateData);
      
      showNotification("Update created successfully!", "success");
      
      // Reset form
      setNotes("");
      setDate(new Date().toISOString().split('T')[0]);
      setUpdateType(UPDATE_TYPE_OPTIONS[0]);
      setProjectId("");
      setTaskId("");
      setTasks([]);
      
    } catch (error) {
      console.error("Failed to create update:", error);
      showNotification(
        error.response?.data?.error || "Failed to create update. Please try again.",
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
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center">
                <PencilSquareIcon className="w-8 h-8 text-white mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Update</h1>
                  <p className="text-blue-100 mt-1">Record project progress and communications</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
              {/* Project Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  value={projectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Selection (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task (Optional)
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!projectId || tasks.length === 0}
                >
                  <option value="">No specific task</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.task_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Update Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Type *
                </label>
                <Listbox value={updateType} onChange={setUpdateType}>
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="block truncate">{updateType}</span>
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
                        {UPDATE_TYPE_OPTIONS.map((type, index) => (
                          <Listbox.Option
                            key={index}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                            value={type}
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {type}
                                </span>
                                {selected && (
                                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
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

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes *
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Enter update details..."
                  required
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
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Update'
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
