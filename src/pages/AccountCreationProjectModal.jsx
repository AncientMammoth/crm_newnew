import React, { useState, useEffect } from "react";
import { createProject, updateUser } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";

const PROJECT_STATUS_OPTIONS = [
  "Negotiation",
  "Need Analysis",
  "Closed Won",
  "Closed Lost",
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AccountCreationProjectModal({ open, onClose, defaultAccount, accounts }) {
  const [fields, setFields] = useState({
    "Project Name": "",
    "Project Status": PROJECT_STATUS_OPTIONS[0],
    "Start Date": "",
    "End Date": "",
    "Account": defaultAccount?.id || "",
    "Project Value": "",
    "Project Description": "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setFields(f => ({
      ...f,
      "Account": defaultAccount?.id || "",
    }));
  }, [defaultAccount]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const projectOwnerId = localStorage.getItem("userRecordId") || "";
      const project = await createProject({
        "Project Name": fields["Project Name"],
        "Project Status": fields["Project Status"],
        "Start Date": fields["Start Date"],
        "End Date": fields["End Date"],
        "Account": fields["Account"] ? [fields["Account"]] : [],
        "Project Value": fields["Project Value"] ? Number(fields["Project Value"]) : undefined,
        "Project Description": fields["Project Description"],
        "Project Owner": projectOwnerId ? [projectOwnerId] : [],
      });
      if (project && project.id && projectOwnerId) {
        const prevProjects = JSON.parse(localStorage.getItem("projectIds") || "[]");
        const updatedProjects = [...new Set([...prevProjects, project.id])];
        await updateUser(projectOwnerId, { "Projects": updatedProjects });
        localStorage.setItem("projectIds", JSON.stringify(updatedProjects));
      }
      setFields({
        "Project Name": "",
        "Project Status": PROJECT_STATUS_OPTIONS[0],
        "Start Date": "",
        "End Date": "",
        "Account": defaultAccount?.id || "",
        "Project Value": "",
        "Project Description": "",
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      setError("Failed to create project.");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-500/30 to-purple-500/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 relative border border-gray-100">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Project</h2>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-center font-medium mb-4">
            Project created successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
            <input
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Enter project name"
              value={fields["Project Name"]}
              onChange={e => setFields(f => ({ ...f, "Project Name": e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Status</label>
            <Listbox value={fields["Project Status"]} onChange={value => setFields(f => ({ ...f, "Project Status": value }))}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 px-4 text-left border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate text-gray-700">{fields["Project Status"]}</span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-white py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {PROJECT_STATUS_OPTIONS.map((status) => (
                        <Listbox.Option
                          key={status}
                          value={status}
                          className={({ active }) =>
                            classNames(
                              active ? 'bg-blue-50' : 'text-gray-900',
                              'cursor-default select-none relative py-3 px-4'
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium text-blue-700' : 'font-normal'}`}>
                                {status}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                value={fields["Start Date"]}
                onChange={e => setFields(f => ({ ...f, "Start Date": e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                value={fields["End Date"]}
                onChange={e => setFields(f => ({ ...f, "End Date": e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
            <Listbox value={fields["Account"]} onChange={value => setFields(f => ({ ...f, "Account": value }))}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 px-4 text-left border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate text-gray-700">
                      {accounts.find(a => a.id === fields["Account"])?.fields["Account Name"] || "Select account"}
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-white py-2 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      {accounts.map((acc) => (
                        <Listbox.Option
                          key={acc.id}
                          value={acc.id}
                          className={({ active }) =>
                            classNames(
                              active ? 'bg-blue-50' : 'text-gray-900',
                              'cursor-default select-none relative py-3 px-4'
                            )
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span className={`block truncate ${selected ? 'font-medium text-blue-700' : 'font-normal'}`}>
                                {acc.fields["Account Name"]}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Value</label>
            <input
              type="number"
              min="0"
              placeholder="Enter project value"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              value={fields["Project Value"]}
              onChange={e => setFields(f => ({ ...f, "Project Value": e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <textarea
              placeholder="Enter project description"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm min-h-[100px]"
              value={fields["Project Description"]}
              onChange={e => setFields(f => ({ ...f, "Project Description": e.target.value }))}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-gray-600 to-purple-600 hover:from-gray-700 hover:to-purple-700 shadow-lg"
            }`}
          >
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </form>
      </div>
    </div>
  );
}
