import React, { useState, useMemo, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { api } from '../api'; // Import the axios instance

// Helper function for class names
function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

// API call to fetch all project delivery statuses for delivery head
const fetchAllDeliveryStatuses = async () => {
  // The secretKey is already handled by the axios interceptor in api/index.js
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) {
    throw new Error('Secret key not found. Please log in.');
  }

  try {
    // Use the 'api' axios instance for the request
    const response = await api.get('/delivery-head/delivery-status'); // Relative path is handled by axios baseURL
    return response.data; // Axios returns data directly in response.data
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch project delivery statuses.';
    throw new Error(errorMessage);
  }
};

export default function DeliveryProjectList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [projectTypeFilter, setProjectTypeFilter] = useState(''); // 'QVO', 'DT', or ''
  const [serviceTypeFilter, setServiceTypeFilter] = useState(''); // Specific service type

  const {
    data: deliveryStatuses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['allDeliveryStatuses'],
    queryFn: fetchAllDeliveryStatuses,
  });

  // Extract unique service types for filtering
  const serviceTypeOptions = useMemo(() => {
    const types = new Set();
    deliveryStatuses?.forEach(status => {
      if (status.service_type) {
        types.add(status.service_type);
      }
    });
    return ['', ...Array.from(types).sort()]; // Add empty string for 'All' option
  }, [deliveryStatuses]);

  const filteredDeliveryStatuses = useMemo(() => {
    if (!deliveryStatuses) return [];

    return deliveryStatuses.filter(status => {
      const matchesSearch = searchTerm
        ? (status.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           status.service_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           status.sales_executive_name?.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      const matchesProjectType = projectTypeFilter
        ? status.project_type === projectTypeFilter
        : true;

      const matchesServiceType = serviceTypeFilter
        ? status.service_type === serviceTypeFilter
        : true;

      return matchesSearch && matchesProjectType && matchesServiceType;
    });
  }, [deliveryStatuses, searchTerm, projectTypeFilter, serviceTypeFilter]);

  if (isLoading) {
    return (
      <div className="text-center py-20 text-lg text-muted-foreground">
        Loading project delivery statuses...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-10">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-light text-foreground mb-8">All Project Deliveries</h1>

          {/* Search and Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by project, service, or sales executive..."
              className="border border-border bg-secondary rounded-md px-4 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
            />

            {/* Project Type Filter */}
            <Listbox value={projectTypeFilter} onChange={setProjectTypeFilter}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <span className="block truncate text-foreground">
                      {projectTypeFilter || "All Project Types"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {['', 'QVO', 'DT'].map((type, idx) => (
                        <Listbox.Option
                          key={idx}
                          className={({ active }) =>
                            cn(
                              active ? "bg-primary/20 text-white" : "text-foreground",
                              "cursor-default select-none relative py-2 pl-10 pr-4"
                            )
                          }
                          value={type}
                        >
                          {({ selected }) => (
                            <>
                              <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                {type || "All Project Types"}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
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

            {/* Service Type Filter */}
            <Listbox value={serviceTypeFilter} onChange={setServiceTypeFilter}>
              {({ open }) => (
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-default rounded-md bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <span className="block truncate text-foreground">
                      {serviceTypeFilter || "All Service Types"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                  </Listbox.Button>
                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {serviceTypeOptions.map((type, idx) => (
                        <Listbox.Option
                          key={idx}
                          className={({ active }) =>
                            cn(
                              active ? "bg-primary/20 text-white" : "text-foreground",
                              "cursor-default select-none relative py-2 pl-10 pr-4"
                            )
                          }
                          value={type}
                        >
                          {({ selected }) => (
                            <>
                              <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                {type || "All Service Types"}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
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

          {filteredDeliveryStatuses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No project deliveries found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDeliveryStatuses.map((status) => (
                <Link
                  key={status.id}
                  to={`/delivery-head/projects/${status.id}`}
                  className="bg-secondary p-6 rounded-lg border border-border hover:bg-[#2E2E2E] transition-colors duration-200 flex flex-col justify-between"
                >
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {status.project_name || `Project ID: ${status.crm_project_id}`}
                    </h2>
                    <p className="text-muted-foreground text-sm mb-1">
                      <span className="font-medium">Type:</span> {status.project_type}
                    </p>
                    <p className="text-muted-foreground text-sm mb-1">
                      <span className="font-medium">Service:</span> {status.service_type}
                    </p>
                    <p className="text-muted-foreground text-sm mb-1">
                      <span className="font-medium">Sales Executive:</span> {status.sales_executive_name || 'N/A'}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      <span className="font-medium">Deadline:</span> {status.deadline ? new Date(status.deadline).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="mt-4 text-primary hover:underline self-end">View Details &rarr;</div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
