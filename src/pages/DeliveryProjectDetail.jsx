import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api'; // Import the axios instance

// API call to fetch a single project delivery status by ID for delivery head
const fetchDeliveryStatusDetail = async (id) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) {
    throw new Error('Secret key not found. Please log in.');
  }
  try {
    const response = await api.get(`/delivery-head/delivery-status/${id}`);
    return response.data; // Axios returns data directly in response.data
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch project delivery status details.';
    throw new Error(errorMessage);
  }
};

// Helper to format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

// Helper to display boolean values
const displayBoolean = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'N/A';
};

export default function DeliveryProjectDetail() {
  const { id } = useParams(); // Get the ID from the URL

  const {
    data: deliveryStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['deliveryStatusDetail', id],
    queryFn: () => fetchDeliveryStatusDetail(id),
    enabled: !!id, // Only run the query if ID is available
  });

  if (isLoading) {
    return (
      <div className="text-center py-20 text-lg text-muted-foreground">
        Loading project delivery details...
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
        Project delivery status not found.
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
          <h1 className="text-4xl font-light text-foreground mb-8">
            Delivery Details for "{deliveryStatus.project_name || `Project ID: ${deliveryStatus.crm_project_id}`}"
          </h1>

          <div className="bg-secondary p-8 rounded-lg shadow-md border border-border space-y-4">
            <DetailItem label="CRM Project ID" value={deliveryStatus.crm_project_id} />
            <DetailItem label="Sales Executive" value={deliveryStatus.sales_executive_name || 'N/A'} />
            <DetailItem label="Project Type" value={deliveryStatus.project_type} />
            <DetailItem label="Service Type" value={deliveryStatus.service_type} />
            <DetailItem label="Deadline" value={formatDate(deliveryStatus.deadline)} />
            <DetailItem label="Output Format" value={deliveryStatus.output_format || 'N/A'} />
            <DetailItem label="Open Project Files Provided" value={displayBoolean(deliveryStatus.open_project_files_provided)} />

            {deliveryStatus.project_type === 'QVO' && (
              <>
                <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">QVO Specific Details</h2>
                <DetailItem label="Number of Files" value={deliveryStatus.number_of_files || 'N/A'} />
                <DetailItem label="Total Duration (Minutes)" value={deliveryStatus.total_duration_minutes || 'N/A'} />
                <DetailItem label="Language Pair" value={deliveryStatus.language_pair || 'N/A'} />
                <DetailItem label="Target Language Dialect" value={deliveryStatus.target_language_dialect || 'N/A'} />
                <DetailItem label="Voice Over Gender" value={deliveryStatus.voice_over_gender || 'N/A'} />
                <DetailItem label="Voice Match Needed" value={displayBoolean(deliveryStatus.voice_match_needed)} />
                <DetailItem label="Lip Match Needed" value={displayBoolean(deliveryStatus.lip_match_needed)} />
                <DetailItem label="Sound Balancing Needed" value={displayBoolean(deliveryStatus.sound_balancing_needed)} />
                <DetailItem label="Premix Files Shared" value={displayBoolean(deliveryStatus.premix_files_shared)} />
                <DetailItem label="M&E Files Shared" value={displayBoolean(deliveryStatus.me_files_shared)} />
                <DetailItem label="High-Res Video Shared" value={displayBoolean(deliveryStatus.high_res_video_shared)} />
                <DetailItem label="Caption Type" value={deliveryStatus.caption_type || 'N/A'} />
                <DetailItem label="On-Screen Editing Required" value={displayBoolean(deliveryStatus.on_screen_editing_required)} />
                <DetailItem label="Deliverable" value={deliveryStatus.deliverable || 'N/A'} />
              </>
            )}

            {deliveryStatus.project_type === 'DT' && (
              <>
                <h2 className="text-xl font-semibold text-foreground mt-6 mb-2">DT Specific Details</h2>
                <DetailItem label="Source Word Count" value={deliveryStatus.source_word_count || 'N/A'} />
                <DetailItem label="Source Languages" value={deliveryStatus.source_languages || 'N/A'} />
                <DetailItem label="Target Languages" value={deliveryStatus.target_languages || 'N/A'} />
                <DetailItem label="Formatting Required" value={displayBoolean(deliveryStatus.formatting_required)} />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Reusable component for displaying detail items
const DetailItem = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-border pb-2 last:border-b-0 last:pb-0">
    <span className="text-muted-foreground font-medium">{label}:</span>
    <span className="text-foreground">{value}</span>
  </div>
);
