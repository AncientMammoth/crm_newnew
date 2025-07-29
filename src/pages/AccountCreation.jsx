import React, { useState, Fragment, useEffect } from "react";
import { createAccount } from "../api";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { AlertTriangle, CheckCircle, User } from "lucide-react";
import { motion } from 'framer-motion';

const ACCOUNT_TYPE_OPTIONS = [
  "Channel Partner",
  "Client",
  "Vendor",
  "Technology Partner",
  "Internal Initiative",
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

export default function AccountCreation() {
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState(ACCOUNT_TYPE_OPTIONS[0]);
  const [accountDescription, setAccountDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Retrieve the user's name from localStorage.
    // Fallback to "Current User" if a name isn't stored.
    const name = localStorage.getItem("userName") || "Current User";
    setOwnerName(name);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 5000);
  };

  const validateField = (name, value) => {
    if (!value.trim()) {
      return `${name} is required.`;
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

    const nameError = validateField("Account Name", accountName);
    if (nameError) {
      setErrors({ "Account Name": nameError });
      showNotification("Please fill out all required fields.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const accountData = {
        "Account Name": accountName.trim(),
        "Account Type": accountType,
        "Account Description": accountDescription.trim(),
        "Account Owner": [localStorage.getItem("secretKey")]
      };

      await createAccount(accountData);

      showNotification("Account created successfully!", "success");

      // Reset form
      setAccountName("");
      setAccountType(ACCOUNT_TYPE_OPTIONS[0]);
      setAccountDescription("");

    } catch (error) {
      console.error("Failed to create account:", error);
      showNotification(
        error.response?.data?.error || "Failed to create account. Please try again.",
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
              Create a New Account
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Add a new client, partner, or vendor to your CRM.
            </p>
          </div>

          <div className="bg-[#333333] p-10 rounded-2xl border border-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="account-name" className="block text-sm font-light text-muted-foreground mb-1">Account Name</label>
                  <input
                    id="account-name"
                    name="Account Name"
                    required
                    type="text"
                    placeholder="e.g., Stark Industries"
                    className={`appearance-none relative block w-full px-3 py-3 border ${errors['Account Name'] ? 'border-red-500' : 'border-border'} bg-secondary placeholder-muted-foreground text-foreground rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    onBlur={handleBlur}
                  />
                  {errors['Account Name'] && <p className="mt-2 text-sm text-red-500">{errors['Account Name']}</p>}
                </div>

                <Listbox value={accountType} onChange={setAccountType}>
                  <div>
                    <Listbox.Label className="block text-sm font-light text-muted-foreground">Account Type</Listbox.Label>
                    <div className="mt-1 relative">
                      <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                        <span className="flex items-center">
                          <BuildingOfficeIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="ml-3 block truncate text-foreground">{accountType}</span>
                        </span>
                        <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          {ACCOUNT_TYPE_OPTIONS.map((type, index) => (
                            <Listbox.Option key={index} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={type}>
                              {({ selected, active }) => (
                                <>
                                  <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{type}</span>
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

              {/* New Disabled Account Owner Field */}
              <div>
                <label htmlFor="account-owner" className="block text-sm font-light text-muted-foreground mb-1">Account Owner</label>
                <div className="relative">
                     <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                        id="account-owner"
                        name="Account Owner"
                        type="text"
                        value={ownerName}
                        disabled
                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-border bg-secondary/50 placeholder-muted-foreground text-foreground rounded-md sm:text-sm disabled:cursor-not-allowed"
                    />
                </div>
              </div>


              <div>
                <label htmlFor="account-description" className="block text-sm font-light text-muted-foreground">Account Description</label>
                <div className="mt-1">
                  <textarea
                    id="account-description"
                    rows="4"
                    placeholder="Add a detailed description for the account..."
                    className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"
                    value={accountDescription}
                    onChange={(e) => setAccountDescription(e.target.value)}
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
                      Creating Account...
                    </>
                  ) : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}