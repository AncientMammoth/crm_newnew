import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '../api'; // Import the axios instance

// Helper to convert 'Yes'/'No'/'N/A' to boolean/null for backend
const convertToBooleanOrNull = (value) => {
  if (value === 'Yes') return true;
  if (value === 'No') return false;
  return null; // For 'N/A' or any other value
};

// Helper to convert boolean/null from backend to 'Yes'/'No'/'N/A' for frontend display
const convertBooleanToDisplay = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'N/A';
};

// Fetch a single delivery status for editing
const fetchDeliveryStatusForEdit = async (id) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) {
    throw new Error('Secret key not found. Please log in.');
  }
  try {
    const response = await api.get(`/delivery-status/my?ids=${id}`);
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    throw new Error('Delivery status not found.');
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch delivery status for edit.';
    throw new Error(errorMessage);
  }
};

// Fetch projects for the dropdown
const fetchProjects = async () => {
  const secretKey = localStorage.getItem('secretKey');
  const projectIdsString = localStorage.getItem('projectIds');
  if (!secretKey || !projectIdsString) {
    throw new Error('Authentication or project data missing. Please log in.');
  }
  const projectIds = JSON.parse(projectIdsString);
  if (projectIds.length === 0) return [];

  try {
    const response = await api.get(`/projects?ids=${projectIds.join(',')}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch projects.';
    throw new Error(errorMessage);
  }
};

export default function ProjectDeliveryForm() {
  const { id } = useParams(); // Get ID from URL for edit mode
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = !!id;

  const { data: existingStatus, isLoading: isLoadingStatus, error: statusError } = useQuery({
    queryKey: ['deliveryStatus', id],
    queryFn: () => fetchDeliveryStatusForEdit(id),
    enabled: isEditMode, // Only run this query if in edit mode
  });

  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const [formData, setFormData] = useState({
    crm_project_id: '',
    project_type: '',
    service_type: '',
    number_of_files: '',
    deadline: '',
    output_format: '',
    open_project_files_provided: 'N/A',
    total_duration_minutes: '',
    language_pair: '',
    target_language_dialect: '',
    voice_match_needed: 'N/A',
    lip_match_needed: 'N/A',
    sound_balancing_needed: 'N/A',
    premix_files_shared: 'N/A',
    me_files_shared: 'N/A',
    high_res_video_shared: 'N/A',
    caption_type: '',
    on_screen_editing_required: 'N/A',
    deliverable: '',
    voice_over_gender: '',
    source_word_count: '',
    source_languages: '',
    target_languages: '',
    formatting_required: 'N/A',
  });

  useEffect(() => {
    if (isEditMode && existingStatus) {
      setFormData({
        crm_project_id: existingStatus.crm_project_id || '',
        project_type: existingStatus.project_type || '',
        service_type: existingStatus.service_type || '',
        number_of_files: existingStatus.number_of_files || '',
        deadline: existingStatus.deadline ? new Date(existingStatus.deadline).toISOString().split('T')[0] : '',
        output_format: existingStatus.output_format || '',
        open_project_files_provided: convertBooleanToDisplay(existingStatus.open_project_files_provided),
        total_duration_minutes: existingStatus.total_duration_minutes || '',
        language_pair: existingStatus.language_pair || '',
        target_language_dialect: existingStatus.target_language_dialect || '',
        voice_match_needed: convertBooleanToDisplay(existingStatus.voice_match_needed),
        lip_match_needed: convertBooleanToDisplay(existingStatus.lip_match_needed),
        sound_balancing_needed: convertBooleanToDisplay(existingStatus.sound_balancing_needed),
        premix_files_shared: convertBooleanToDisplay(existingStatus.premix_files_shared),
        me_files_shared: convertBooleanToDisplay(existingStatus.me_files_shared),
        high_res_video_shared: convertBooleanToDisplay(existingStatus.high_res_video_shared),
        caption_type: existingStatus.caption_type || '',
        on_screen_editing_required: convertBooleanToDisplay(existingStatus.on_screen_editing_required),
        deliverable: existingStatus.deliverable || '',
        voice_over_gender: existingStatus.voice_over_gender || '',
        source_word_count: existingStatus.source_word_count || '',
        source_languages: existingStatus.source_languages || '',
        target_languages: existingStatus.target_languages || '',
        formatting_required: convertBooleanToDisplay(existingStatus.formatting_required),
      });
    }
  }, [isEditMode, existingStatus]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const createDeliveryStatus = useMutation({
    mutationFn: async (newStatus) => {
      const secretKey = localStorage.getItem('secretKey');
      if (!secretKey) throw new Error('Secret key not found.');
      try {
        const response = await api.post('/delivery-status', newStatus);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || error.message || 'Failed to create delivery status.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myDeliveryStatuses']);
      navigate('/my-project-deliveries');
    },
    onError: (err) => {
      alert(`Error creating delivery status: ${err.message}`);
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, updatedStatus }) => {
      const secretKey = localStorage.getItem('secretKey');
      if (!secretKey) throw new Error('Secret key not found.');
      try {
        const response = await api.put(`/delivery-status/${id}`, updatedStatus);
        return response.data;
      } catch (error) {
        throw new Error(error.response?.data?.error || error.message || 'Failed to update delivery status.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myDeliveryStatuses']);
      queryClient.invalidateQueries(['deliveryStatus', id]); // Invalidate specific status for re-fetch
      navigate('/my-project-deliveries');
    },
    onError: (err) => {
      alert(`Error updating delivery status: ${err.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Filter out fields not relevant to the selected project type
    const dataToSubmit = { ...formData };
    if (dataToSubmit.project_type === 'QVO') {
      delete dataToSubmit.source_word_count;
      delete dataToSubmit.source_languages;
      delete dataToSubmit.target_languages;
      delete dataToSubmit.formatting_required;
    } else if (dataToSubmit.project_type === 'DT') {
      delete dataToSubmit.total_duration_minutes;
      delete dataToSubmit.language_pair;
      delete dataToSubmit.target_language_dialect;
      delete dataToSubmit.voice_match_needed;
      delete dataToSubmit.lip_match_needed;
      delete dataToSubmit.sound_balancing_needed;
      delete dataToSubmit.premix_files_shared;
      delete dataToSubmit.me_files_shared;
      delete dataToSubmit.high_res_video_shared;
      delete dataToSubmit.caption_type;
      delete dataToSubmit.on_screen_editing_required;
      delete dataToSubmit.deliverable;
      delete dataToSubmit.voice_over_gender;
    }

    if (isEditMode) {
      updateDeliveryStatus.mutate({ id, updatedStatus: dataToSubmit });
    } else {
      createDeliveryStatus.mutate(dataToSubmit);
    }
  };

  if (isLoadingStatus || isLoadingProjects) {
    return (
      <div className="text-center py-20 text-lg text-muted-foreground">
        Loading form...
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="text-red-500 text-center py-10">
        Error loading delivery status: {statusError.message}
      </div>
    );
  }

  if (projectsError) {
    return (
      <div className="text-red-500 text-center py-10">
        Error loading projects: {projectsError.message}
      </div>
    );
  }

  const projectTypeOptions = [
    { value: '', label: 'Select Project Type' },
    { value: 'QVO', label: 'QVO (Quality Voice Over)' },
    { value: 'DT', label: 'DT (Document Translation)' },
  ];

  const booleanOptions = ['Yes', 'No', 'N/A'];

  return (
    <div className="min-h-screen bg-card w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-light text-foreground mb-8">
            {isEditMode ? 'Edit Project Delivery Status' : 'Create New Project Delivery Status'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 bg-secondary p-8 rounded-lg shadow-md border border-border">
            {/* CRM Project ID - Dropdown */}
            <div>
              <label htmlFor="crm_project_id" className="block text-sm font-medium text-muted-foreground mb-1">
                CRM Project
              </label>
              <select
                id="crm_project_id"
                name="crm_project_id"
                value={formData.crm_project_id}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">Select a Project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.project_name} (ID: {project.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Project Type */}
            <div>
              <label htmlFor="project_type" className="block text-sm font-medium text-muted-foreground mb-1">
                Project Type
              </label>
              <select
                id="project_type"
                name="project_type"
                value={formData.project_type}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {projectTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label htmlFor="service_type" className="block text-sm font-medium text-muted-foreground mb-1">
                Service Type
              </label>
              <input
                type="text"
                id="service_type"
                name="service_type"
                value={formData.service_type}
                onChange={handleChange}
                required
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            {/* Fields for QVO Project Type */}
            {formData.project_type === 'QVO' && (
              <>
                <div>
                  <label htmlFor="number_of_files" className="block text-sm font-medium text-muted-foreground mb-1">
                    Number of Files
                  </label>
                  <input
                    type="number"
                    id="number_of_files"
                    name="number_of_files"
                    value={formData.number_of_files}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="total_duration_minutes" className="block text-sm font-medium text-muted-foreground mb-1">
                    Total Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    id="total_duration_minutes"
                    name="total_duration_minutes"
                    value={formData.total_duration_minutes}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="language_pair" className="block text-sm font-medium text-muted-foreground mb-1">
                    Language Pair
                  </label>
                  <input
                    type="text"
                    id="language_pair"
                    name="language_pair"
                    value={formData.language_pair}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="target_language_dialect" className="block text-sm font-medium text-muted-foreground mb-1">
                    Target Language Dialect
                  </label>
                  <input
                    type="text"
                    id="target_language_dialect"
                    name="target_language_dialect"
                    value={formData.target_language_dialect}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="voice_over_gender" className="block text-sm font-medium text-muted-foreground mb-1">
                    Voice Over Gender
                  </label>
                  <input
                    type="text"
                    id="voice_over_gender"
                    name="voice_over_gender"
                    value={formData.voice_over_gender}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="voice_match_needed" className="block text-sm font-medium text-muted-foreground mb-1">
                    Voice Match Needed?
                  </label>
                  <select
                    id="voice_match_needed"
                    name="voice_match_needed"
                    value={formData.voice_match_needed}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="lip_match_needed" className="block text-sm font-medium text-muted-foreground mb-1">
                    Lip Match Needed?
                  </label>
                  <select
                    id="lip_match_needed"
                    name="lip_match_needed"
                    value={formData.lip_match_needed}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sound_balancing_needed" className="block text-sm font-medium text-muted-foreground mb-1">
                    Sound Balancing Needed?
                  </label>
                  <select
                    id="sound_balancing_needed"
                    name="sound_balancing_needed"
                    value={formData.sound_balancing_needed}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="premix_files_shared" className="block text-sm font-medium text-muted-foreground mb-1">
                    Premix Files Shared?
                  </label>
                  <select
                    id="premix_files_shared"
                    name="premix_files_shared"
                    value={formData.premix_files_shared}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="me_files_shared" className="block text-sm font-medium text-muted-foreground mb-1">
                    M&E Files Shared?
                  </label>
                  <select
                    id="me_files_shared"
                    name="me_files_shared"
                    value={formData.me_files_shared}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="high_res_video_shared" className="block text-sm font-medium text-muted-foreground mb-1">
                    High-Res Video Shared?
                  </label>
                  <select
                    id="high_res_video_shared"
                    name="high_res_video_shared"
                    value={formData.high_res_video_shared}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="caption_type" className="block text-sm font-medium text-muted-foreground mb-1">
                    Caption Type
                  </label>
                  <input
                    type="text"
                    id="caption_type"
                    name="caption_type"
                    value={formData.caption_type}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="on_screen_editing_required" className="block text-sm font-medium text-muted-foreground mb-1">
                    On-Screen Editing Required?
                  </label>
                  <select
                    id="on_screen_editing_required"
                    name="on_screen_editing_required"
                    value={formData.on_screen_editing_required}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="deliverable" className="block text-sm font-medium text-muted-foreground mb-1">
                    Deliverable
                  </label>
                  <input
                    type="text"
                    id="deliverable"
                    name="deliverable"
                    value={formData.deliverable}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </>
            )}

            {/* Fields for DT Project Type */}
            {formData.project_type === 'DT' && (
              <>
                <div>
                  <label htmlFor="source_word_count" className="block text-sm font-medium text-muted-foreground mb-1">
                    Source Word Count
                  </label>
                  <input
                    type="number"
                    id="source_word_count"
                    name="source_word_count"
                    value={formData.source_word_count}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="source_languages" className="block text-sm font-medium text-muted-foreground mb-1">
                    Source Languages
                  </label>
                  <input
                    type="text"
                    id="source_languages"
                    name="source_languages"
                    value={formData.source_languages}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="target_languages" className="block text-sm font-medium text-muted-foreground mb-1">
                    Target Languages
                  </label>
                  <input
                    type="text"
                    id="target_languages"
                    name="target_languages"
                    value={formData.target_languages}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="formatting_required" className="block text-sm font-medium text-muted-foreground mb-1">
                    Formatting Required?
                  </label>
                  <select
                    id="formatting_required"
                    name="formatting_required"
                    value={formData.formatting_required}
                    onChange={handleChange}
                    className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    {booleanOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Common Fields */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-muted-foreground mb-1">
                Deadline
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="output_format" className="block text-sm font-medium text-muted-foreground mb-1">
                Output Format
              </label>
              <input
                type="text"
                id="output_format"
                name="output_format"
                value={formData.output_format}
                onChange={handleChange}
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="open_project_files_provided" className="block text-sm font-medium text-muted-foreground mb-1">
                Open Project Files Provided?
              </label>
              <select
                id="open_project_files_provided"
                name="open_project_files_provided"
                value={formData.open_project_files_provided}
                onChange={handleChange}
                className="block w-full rounded-md border-border bg-input py-2 px-3 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                {booleanOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background shadow-sm hover:bg-primary/90 transition-colors"
                disabled={createDeliveryStatus.isPending || updateDeliveryStatus.isPending}
              >
                {createDeliveryStatus.isPending || updateDeliveryStatus.isPending ? 'Saving...' : (isEditMode ? 'Update Status' : 'Create Status')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
  