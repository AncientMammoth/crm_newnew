import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

// API call to fetch a single project delivery status for delivery head
const fetchDeliveryStatusById = async (id) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) {
    throw new Error('Secret key not found. Please log in.');
  }
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery-head/delivery-status/${id}`, {
    headers: {
      'x-secret-key': secretKey,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch project delivery status details.');
  }
  return response.json();
};

// Helper to format boolean values
const formatBoolean = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'N/A';
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

export default function DeliveryProjectDetail() {
  const { id } = useParams();

  const {
    data: deliveryStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['deliveryStatus', id],
    queryFn: () => fetchDeliveryStatusById(id),
    enabled: !!id, // Only run query if ID is available
  });

  if (isLoading) {
    return (
      <div className="text-center py-20 text-lg text-muted-foreground">
        Loading delivery status details...
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

  if (!deliveryStatus) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Delivery status not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              <li className="flex items-center">
                <Link to="/delivery-head/projects" className="hover:text-accent transition-colors">All Project Deliveries</Link>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
              </li>
              <li>
                <span className="font-semibold text-foreground">Detail</span>
              </li>
            </ol>
          </nav>

          <div className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border mb-10">
            <h1 className="text-3xl font-light text-foreground mb-6">
              Delivery Status for {deliveryStatus.project_name || `Project ID: ${deliveryStatus.crm_project_id}`}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Common Parameters */}
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Project Type:</p>
                <p className="text-base text-foreground font-medium">{deliveryStatus.project_type || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Service Type:</p>
                <p className="text-base text-foreground font-medium">{deliveryStatus.service_type || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Number of Files:</p>
                <p className="text-base text-foreground font-medium">{deliveryStatus.number_of_files || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Deadline:</p>
                <p className="text-base text-foreground font-medium">{formatDate(deliveryStatus.deadline)}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Output Format:</p>
                <p className="text-base text-foreground font-medium">{deliveryStatus.output_format || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Open Project Files Provided:</p>
                <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.open_project_files_provided)}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Sales Executive:</p>
                <p className="text-base text-foreground font-medium">{deliveryStatus.sales_executive_name || 'N/A'}</p>
              </div>
              <div className="col-span-1">
                <p className="text-sm text-muted-foreground font-light">Created At:</p>
                <p className="text-base text-foreground font-medium">{formatDate(deliveryStatus.created_at)}</p>
              </div>

              {/* QVO-specific Parameters */}
              {deliveryStatus.project_type === 'QVO' && (
                <>
                  <div className="col-span-2 border-t border-border pt-6 mt-6">
                    <h2 className="text-xl font-light text-foreground mb-4">QVO Specifics</h2>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Total Duration (Minutes):</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.total_duration_minutes || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Language Pair:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.language_pair || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Target Language Dialect:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.target_language_dialect || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Voice Match Needed:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.voice_match_needed)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Lip Match Needed:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.lip_match_needed)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Sound Balancing Needed:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.sound_balancing_needed)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Premix Files Shared:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.premix_files_shared)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">M&E Files Shared:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.me_files_shared)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">High Res Video Shared:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.high_res_video_shared)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Caption Type:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.caption_type || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">On-Screen Editing Required:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.on_screen_editing_required)}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Deliverable:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.deliverable || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Voice Over Gender:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.voice_over_gender || 'N/A'}</p>
                  </div>
                </>
              )}

              {/* DT-specific Parameters */}
              {deliveryStatus.project_type === 'DT' && (
                <>
                  <div className="col-span-2 border-t border-border pt-6 mt-6">
                    <h2 className="text-xl font-light text-foreground mb-4">DT Specifics</h2>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Source Word Count:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.source_word_count || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Source Languages:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.source_languages || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Target Languages:</p>
                    <p className="text-base text-foreground font-medium">{deliveryStatus.target_languages || 'N/A'}</p>
                  </div>
                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground font-light">Formatting Required:</p>
                    <p className="text-base text-foreground font-medium">{formatBoolean(deliveryStatus.formatting_required)}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
