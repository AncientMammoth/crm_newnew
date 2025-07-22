import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

// API call to fetch project delivery statuses for the current sales executive
const fetchMyDeliveryStatuses = async () => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) {
    throw new Error('Secret key not found. Please log in.');
  }
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery-status/my`, {
    headers: {
      'x-secret-key': secretKey,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch your project delivery statuses.');
  }
  return response.json();
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export default function MyProjectDeliveries() {
  const {
    data: myDeliveryStatuses,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['myDeliveryStatuses'],
    queryFn: fetchMyDeliveryStatuses,
  });

  if (isLoading) {
    return (
      <div className="text-center py-20 text-lg text-muted-foreground">
        Loading your project delivery statuses...
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-light text-foreground">My Project Deliveries</h1>
            <Link
              to="/delivery/create"
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background shadow-sm hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
              New Delivery Status
            </Link>
          </div>

          {myDeliveryStatuses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-xl mb-2">No project delivery statuses found.</div>
              <p>Start by adding a new delivery status for your projects.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDeliveryStatuses.map((status) => (
                <div
                  key={status.id}
                  className="bg-secondary p-6 rounded-lg border border-border flex flex-col justify-between"
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
                    <p className="text-muted-foreground text-sm">
                      <span className="font-medium">Deadline:</span> {formatDate(status.deadline)}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      to={`/delivery/edit/${status.id}`}
                      className="inline-flex items-center rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-accent/90 transition-colors"
                    >
                      <PencilIcon className="-ml-0.5 mr-1.5 h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
