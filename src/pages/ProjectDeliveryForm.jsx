import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

// Utility function for class names
const cn = (...inputs) => inputs.filter(Boolean).join(' ');

// API calls for project delivery status
const createDeliveryStatus = async (data) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) throw new Error('Secret key not found. Please log in.');
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secretKey,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create delivery status.');
  }
  return response.json();
};

const updateDeliveryStatus = async ({ id, data }) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) throw new Error('Secret key not found. Please log in.');
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery-status/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-secret-key': secretKey,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update delivery status.');
  }
  return response.json();
};

const fetchMyProjects = async (projectIds) => {
  if (!projectIds || projectIds.length === 0) return [];
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) throw new Error('Secret key not found. Please log in.');

  // Assuming an API endpoint to fetch projects by their IDs for the current user
  // The existing /api/projects endpoint takes 'ids' query param
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/projects?ids=${projectIds.join(',')}`, {
    headers: {
      'x-secret-key': secretKey, // This might not be strictly needed for /api/projects if it's generally accessible
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch projects.');
  }
  return response.json();
};

const fetchSingleDeliveryStatus = async (id) => {
  const secretKey = localStorage.getItem('secretKey');
  if (!secretKey) throw new Error('Secret key not found. Please log in.');
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/delivery-status/my?ids=${id}`, { // Using /my endpoint with ID filter
    headers: {
      'x-secret-key': secretKey,
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch delivery status for editing.');
  }
  const data = await response.json();
  return data.length > 0 ? data[0] : null;
};


// Options for various fields
const PROJECT_TYPES = ['QVO', 'DT'];
const OUTPUT_FORMATS = ['mp3', 'mp4', 'wav', 'srt', 'vtt', 'doc', 'excel', 'ai', 'cdr'];
const CAPTION_TYPES = ['Open', 'Closed', 'N/A'];
const DELIVERABLES = ['highres', 'lowres', 'premix', 'mix'];
const VOICE_OVER_GENDERS = ['M', 'F'];
const BOOLEAN_OPTIONS = ['Yes', 'No', 'N/A']; // For fields that are nullable booleans

export default function ProjectDeliveryForm() {
  const { id: deliveryStatusId } = useParams(); // For editing existing entry
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!deliveryStatusId;

  const userProjectIds = JSON.parse(localStorage.getItem('projectIds') || '[]');

  // Fetch projects for the dropdown
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['myProjects', userProjectIds],
    queryFn: () => fetchMyProjects(userProjectIds),
    enabled: userProjectIds.length > 0,
  });

  // Fetch existing delivery status data if in edit mode
  const { data: existingDeliveryStatus, isLoading: existingStatusLoading, error: existingStatusError } = useQuery({
    queryKey: ['singleDeliveryStatus', deliveryStatusId],
    queryFn: () => fetchSingleDeliveryStatus(deliveryStatusId),
    enabled: isEditMode,
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      project_type: '',
      service_type: '',
      number_of_files: '',
      deadline: '',
      output_format: '',
      open_project_files_provided: 'N/A', // Default to N/A
      // QVO specific
      total_duration_minutes: '',
      language_pair: '',
      target_language_dialect: '',
      voice_match_needed: 'N/A',
      lip_match_needed: 'N/A',
      sound_balancing_needed: 'N/A',
      premix_files_shared: 'N/A',
      me_files_shared: 'N/A',
      high_res_video_shared: 'N/A',
      caption_type: 'N/A',
      on_screen_editing_required: 'N/A',
      deliverable: '',
      voice_over_gender: '',
      // DT specific
      source_word_count: '',
      source_languages: '',
      target_languages: '',
      formatting_required: 'N/A',
      crm_project_id: '', // To link to an existing project
    }
  });

  const projectType = watch('project_type');
  const selectedCrmProjectId = watch('crm_project_id');

  // Populate form fields when existingDeliveryStatus is loaded in edit mode
  useEffect(() => {
    if (isEditMode && existingDeliveryStatus) {
      // Map boolean from true/false/null to 'Yes'/'No'/'N/A' for form
      const mapDbBooleanToForm = (val) => {
        if (val === true) return 'Yes';
        if (val === false) return 'No';
        return 'N/A';
      };

      setValue('crm_project_id', existingDeliveryStatus.crm_project_id);
      setValue('project_type', existingDeliveryStatus.project_type);
      setValue('service_type', existingDeliveryStatus.service_type);
      setValue('number_of_files', existingDeliveryStatus.number_of_files);
      setValue('deadline', existingDeliveryStatus.deadline ? existingDeliveryStatus.deadline.split('T')[0] : '');
      setValue('output_format', existingDeliveryStatus.output_format);
      setValue('open_project_files_provided', mapDbBooleanToForm(existingDeliveryStatus.open_project_files_provided));

      if (existingDeliveryStatus.project_type === 'QVO') {
        setValue('total_duration_minutes', existingDeliveryStatus.total_duration_minutes);
        setValue('language_pair', existingDeliveryStatus.language_pair);
        setValue('target_language_dialect', existingDeliveryStatus.target_language_dialect);
        setValue('voice_match_needed', mapDbBooleanToForm(existingDeliveryStatus.voice_match_needed));
        setValue('lip_match_needed', mapDbBooleanToForm(existingDeliveryStatus.lip_match_needed));
        setValue('sound_balancing_needed', mapDbBooleanToForm(existingDeliveryStatus.sound_balancing_needed));
        setValue('premix_files_shared', mapDbBooleanToForm(existingDeliveryStatus.premix_files_shared));
        setValue('me_files_shared', mapDbBooleanToForm(existingDeliveryStatus.me_files_shared));
        setValue('high_res_video_shared', mapDbBooleanToForm(existingDeliveryStatus.high_res_video_shared));
        setValue('caption_type', existingDeliveryStatus.caption_type);
        setValue('on_screen_editing_required', mapDbBooleanToForm(existingDeliveryStatus.on_screen_editing_required));
        setValue('deliverable', existingDeliveryStatus.deliverable);
        setValue('voice_over_gender', existingDeliveryStatus.voice_over_gender);
      } else if (existingDeliveryStatus.project_type === 'DT') {
        setValue('source_word_count', existingDeliveryStatus.source_word_count);
        setValue('source_languages', existingDeliveryStatus.source_languages);
        setValue('target_languages', existingDeliveryStatus.target_languages);
        setValue('formatting_required', mapDbBooleanToForm(existingDeliveryStatus.formatting_required));
      }
    }
  }, [isEditMode, existingDeliveryStatus, setValue]);


  const createMutation = useMutation({
    mutationFn: createDeliveryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeliveryStatuses'] });
      navigate('/delivery');
    },
    onError: (err) => {
      console.error("Creation error:", err);
      // Using alert for now, replace with custom modal
      // alert(`Error creating delivery status: ${err.message}`); 
      // Instead of alert, let's use a more integrated message display if possible
      // For now, just log and let the form handle display if it has a way
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDeliveryStatuses'] });
      queryClient.invalidateQueries({ queryKey: ['singleDeliveryStatus', deliveryStatusId] });
      navigate('/delivery');
    },
    onError: (err) => {
      console.error("Update error:", err);
      // Using alert for now, replace with custom modal
      // alert(`Error updating delivery status: ${err.message}`);
      // For now, just log and let the form handle display if it has a way
    },
  });

  const onSubmit = (data) => {
    // Clean up data based on project type before sending
    const payload = { ...data };
    if (payload.project_type === 'QVO') {
      // Clear DT specific fields
      delete payload.source_word_count;
      delete payload.source_languages;
      delete payload.target_languages;
      delete payload.formatting_required;
    } else if (payload.project_type === 'DT') {
      // Clear QVO specific fields
      delete payload.total_duration_minutes;
      delete payload.language_pair;
      delete payload.target_language_dialect;
      delete payload.voice_match_needed;
      delete payload.lip_match_needed;
      delete payload.sound_balancing_needed;
      delete payload.premix_files_shared;
      delete payload.me_files_shared;
      delete payload.high_res_video_shared;
      delete payload.caption_type;
      delete payload.on_screen_editing_required;
      delete payload.deliverable;
      delete payload.voice_over_gender;
    }

    if (isEditMode) {
      updateMutation.mutate({ id: deliveryStatusId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (projectsLoading || (isEditMode && existingStatusLoading)) {
    return <div className="text-center py-20 text-lg text-muted-foreground">Loading form...</div>;
  }

  if (projectsError) {
    return <div className="text-red-500 text-center py-10">Error loading projects: {projectsError.message}</div>;
  }

  if (isEditMode && existingStatusError) {
    return <div className="text-red-500 text-center py-10">Error loading existing delivery status: {existingStatusError.message}</div>;
  }

  const currentProject = projects?.find(p => p.id === selectedCrmProjectId);
  const currentProjectName = currentProject?.fields?.['Project Name'] || 'Select a project';

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
                <Link to="/delivery" className="hover:text-accent transition-colors">My Deliveries</Link>
                <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
              </li>
              <li>
                <span className="font-semibold text-foreground">{isEditMode ? 'Edit' : 'Create'} Delivery Status</span>
              </li>
            </ol>
          </nav>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border mb-10">
            <h1 className="text-3xl font-light text-foreground mb-6">
              {isEditMode ? 'Edit Project Delivery Status' : 'Create New Project Delivery Status'}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* CRM Project Link */}
              <div className="col-span-full">
                <label htmlFor="crm_project_id" className="text-sm text-muted-foreground font-light mb-1 block">
                  Associated CRM Project <span className="text-red-500">*</span>
                </label>
                <Listbox
                  value={selectedCrmProjectId}
                  onChange={(value) => setValue('crm_project_id', value)}
                  disabled={isEditMode} // Cannot change project once created
                >
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="block truncate text-foreground">{currentProjectName}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {projects?.map((project) => (
                            <Listbox.Option
                              key={project.id}
                              className={({ active }) =>
                                cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                              }
                              value={project.id}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                    {project.fields['Project Name']}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
                {errors.crm_project_id && <p className="text-red-500 text-xs mt-1">{errors.crm_project_id.message}</p>}
              </div>

              {/* Project Type */}
              <div className="col-span-full">
                <label htmlFor="project_type" className="text-sm text-muted-foreground font-light mb-1 block">
                  Project Type <span className="text-red-500">*</span>
                </label>
                <Listbox
                  value={projectType}
                  onChange={(value) => setValue('project_type', value)}
                  disabled={isEditMode} // Cannot change type once created
                >
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        <span className="block truncate text-foreground">{projectType || "Select project type"}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {PROJECT_TYPES.map((type) => (
                            <Listbox.Option
                              key={type}
                              className={({ active }) =>
                                cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                              }
                              value={type}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                    {type}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </Transition>
                    </div>
                  )}
                </Listbox>
                {errors.project_type && <p className="text-red-500 text-xs mt-1">{errors.project_type.message}</p>}
              </div>

              {/* Common Fields */}
              <div>
                <label htmlFor="service_type" className="text-sm text-muted-foreground font-light mb-1 block">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="service_type"
                  {...register('service_type', { required: 'Service Type is required' })}
                  className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                  placeholder="e.g., AI Voiceover"
                />
                {errors.service_type && <p className="text-red-500 text-xs mt-1">{errors.service_type.message}</p>}
              </div>

              <div>
                <label htmlFor="number_of_files" className="text-sm text-muted-foreground font-light mb-1 block">
                  Number of Files
                </label>
                <input
                  type="number"
                  id="number_of_files"
                  {...register('number_of_files', { valueAsNumber: true })}
                  className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                  placeholder="e.g., 5"
                />
              </div>

              <div>
                <label htmlFor="deadline" className="text-sm text-muted-foreground font-light mb-1 block">
                  Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  {...register('deadline')}
                  className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                />
              </div>

              <div>
                <label htmlFor="output_format" className="text-sm text-muted-foreground font-light mb-1 block">
                  Output Format
                </label>
                <Listbox value={watch('output_format')} onChange={(value) => setValue('output_format', value)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                        <span className="block truncate text-foreground">{watch('output_format') || "Select format"}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {OUTPUT_FORMATS.map((format) => (
                            <Listbox.Option
                              key={format}
                              className={({ active }) =>
                                cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                              }
                              value={format}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                    {format}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
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
                <label htmlFor="open_project_files_provided" className="text-sm text-muted-foreground font-light mb-1 block">
                  Open Project Files Provided
                </label>
                <Listbox value={watch('open_project_files_provided')} onChange={(value) => setValue('open_project_files_provided', value)}>
                  {({ open }) => (
                    <div className="relative">
                      <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                        <span className="block truncate text-foreground">{watch('open_project_files_provided')}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                          <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </span>
                      </Listbox.Button>
                      <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                          {BOOLEAN_OPTIONS.map((option) => (
                            <Listbox.Option
                              key={option}
                              className={({ active }) =>
                                cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                              }
                              value={option}
                            >
                              {({ selected }) => (
                                <>
                                  <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                    {option}
                                  </span>
                                  {selected ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                  ) : null}
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

              {/* QVO Specific Fields */}
              {projectType === 'QVO' && (
                <>
                  <div className="col-span-full border-t border-border pt-6 mt-6">
                    <h2 className="text-xl font-light text-foreground mb-4">QVO Specifics</h2>
                  </div>
                  <div>
                    <label htmlFor="total_duration_minutes" className="text-sm text-muted-foreground font-light mb-1 block">
                      Total Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      id="total_duration_minutes"
                      {...register('total_duration_minutes', { valueAsNumber: true })}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., 60"
                    />
                  </div>
                  <div>
                    <label htmlFor="language_pair" className="text-sm text-muted-foreground font-light mb-1 block">
                      Language Pair
                    </label>
                    <input
                      type="text"
                      id="language_pair"
                      {...register('language_pair')}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., English to Hindi"
                    />
                  </div>
                  <div>
                    <label htmlFor="target_language_dialect" className="text-sm text-muted-foreground font-light mb-1 block">
                      Target Language Dialect
                    </label>
                    <input
                      type="text"
                      id="target_language_dialect"
                      {...register('target_language_dialect')}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., Indian Hindi"
                    />
                  </div>
                  <div>
                    <label htmlFor="voice_match_needed" className="text-sm text-muted-foreground font-light mb-1 block">
                      Voice Match Needed
                    </label>
                    <Listbox value={watch('voice_match_needed')} onChange={(value) => setValue('voice_match_needed', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('voice_match_needed')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="lip_match_needed" className="text-sm text-muted-foreground font-light mb-1 block">
                      Lip Match Needed
                    </label>
                    <Listbox value={watch('lip_match_needed')} onChange={(value) => setValue('lip_match_needed', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('lip_match_needed')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="sound_balancing_needed" className="text-sm text-muted-foreground font-light mb-1 block">
                      Sound Balancing Needed
                    </label>
                    <Listbox value={watch('sound_balancing_needed')} onChange={(value) => setValue('sound_balancing_needed', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('sound_balancing_needed')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="premix_files_shared" className="text-sm text-muted-foreground font-light mb-1 block">
                      Premix Files Shared
                    </label>
                    <Listbox value={watch('premix_files_shared')} onChange={(value) => setValue('premix_files_shared', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('premix_files_shared')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="me_files_shared" className="text-sm text-muted-foreground font-light mb-1 block">
                      M&E Files Shared
                    </label>
                    <Listbox value={watch('me_files_shared')} onChange={(value) => setValue('me_files_shared', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('me_files_shared')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="high_res_video_shared" className="text-sm text-muted-foreground font-light mb-1 block">
                      High Res Video Shared
                    </label>
                    <Listbox value={watch('high_res_video_shared')} onChange={(value) => setValue('high_res_video_shared', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('high_res_video_shared')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="caption_type" className="text-sm text-muted-foreground font-light mb-1 block">
                      Caption Type
                    </label>
                    <Listbox value={watch('caption_type')} onChange={(value) => setValue('caption_type', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('caption_type')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {CAPTION_TYPES.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="on_screen_editing_required" className="text-sm text-muted-foreground font-light mb-1 block">
                      On-Screen Editing Required
                    </label>
                    <Listbox value={watch('on_screen_editing_required')} onChange={(value) => setValue('on_screen_editing_required', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('on_screen_editing_required')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="deliverable" className="text-sm text-muted-foreground font-light mb-1 block">
                      Deliverable
                    </label>
                    <Listbox value={watch('deliverable')} onChange={(value) => setValue('deliverable', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('deliverable') || "Select deliverable"}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {DELIVERABLES.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                    <label htmlFor="voice_over_gender" className="text-sm text-muted-foreground font-light mb-1 block">
                      Voice Over Gender
                    </label>
                    <Listbox value={watch('voice_over_gender')} onChange={(value) => setValue('voice_over_gender', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('voice_over_gender') || "Select gender"}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {VOICE_OVER_GENDERS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                </>
              )}

              {/* DT Specific Fields */}
              {projectType === 'DT' && (
                <>
                  <div className="col-span-full border-t border-border pt-6 mt-6">
                    <h2 className="text-xl font-light text-foreground mb-4">DT Specifics</h2>
                  </div>
                  <div>
                    <label htmlFor="source_word_count" className="text-sm text-muted-foreground font-light mb-1 block">
                      Source Word Count
                    </label>
                    <input
                      type="number"
                      id="source_word_count"
                      {...register('source_word_count', { valueAsNumber: true })}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., 1000"
                    />
                  </div>
                  <div>
                    <label htmlFor="source_languages" className="text-sm text-muted-foreground font-light mb-1 block">
                      Source Languages
                    </label>
                    <input
                      type="text"
                      id="source_languages"
                      {...register('source_languages')}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., English"
                    />
                  </div>
                  <div>
                    <label htmlFor="target_languages" className="text-sm text-muted-foreground font-light mb-1 block">
                      Target Languages
                    </label>
                    <input
                      type="text"
                      id="target_languages"
                      {...register('target_languages')}
                      className="border border-border bg-secondary rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
                      placeholder="e.g., Hindi, Marathi"
                    />
                  </div>
                  <div>
                    <label htmlFor="formatting_required" className="text-sm text-muted-foreground font-light mb-1 block">
                      Formatting Required
                    </label>
                    <Listbox value={watch('formatting_required')} onChange={(value) => setValue('formatting_required', value)}>
                      {({ open }) => (
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-secondary py-2 pl-3 pr-10 text-left border border-border shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/50 sm:text-sm">
                            <span className="block truncate text-foreground">{watch('formatting_required')}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-secondary py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {BOOLEAN_OPTIONS.map((option) => (
                                <Listbox.Option
                                  key={option}
                                  className={({ active }) =>
                                    cn('relative cursor-default select-none py-2 pl-10 pr-4', active ? 'bg-primary/20 text-white' : 'text-foreground')
                                  }
                                  value={option}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={cn('block truncate', selected ? 'font-semibold' : 'font-normal')}>
                                        {option}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-accent">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
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
                </>
              )}
            </div>

            <div className="flex justify-end items-center mt-8">
              {(createMutation.isError || updateMutation.isError) && (
                <p className="text-sm text-red-500 mr-4">
                  {createMutation.error?.message || updateMutation.error?.message}
                </p>
              )}
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className={`rounded-lg px-6 py-2 text-sm font-semibold shadow-sm transition ${
                  createMutation.isPending || updateMutation.isPending
                    ? "bg-primary/50 cursor-not-allowed text-background/50"
                    : "bg-primary hover:bg-primary/90 text-background"
                }`}
              >
                {isEditMode ? (updateMutation.isPending ? "Saving Changes..." : "Save Changes") : (createMutation.isPending ? "Creating..." : "Create Delivery Status")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
