import React, { useState, useEffect, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { api, triggerDataRefresh } from '../api';

// Helper to convert 'Yes'/'No'/'N/A' to boolean/null for backend
const convertToBooleanOrNull = (value) => {
  if (value === 'Yes') return true;
  if (value === 'No') return false;
  return null;
};

// Helper to convert boolean/null from backend to 'Yes'/'No'/'N/A' for frontend display
const convertBooleanToDisplay = (value) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'N/A';
};

// Reusable Notification Component
const Notification = ({ show, onHide, message, type }) => {
  if (!show) return null;

  const baseClasses = "fixed top-20 right-5 w-full max-w-sm p-4 rounded-xl shadow-lg text-white transform transition-all duration-300 ease-in-out z-50";
  const typeClasses = {
    success: "bg-green-500",
    error: "bg-red-500",
  };
  const Icon = type === 'success' ? CheckCircle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${baseClasses} ${typeClasses[type]}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button onClick={onHide} className="inline-flex rounded-md text-white hover:text-gray-200 focus:outline-none">
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
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

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ProjectDeliveryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isEditMode = !!id;

  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const { data: existingStatus, isLoading: isLoadingStatus, error: statusError } = useQuery({
    queryKey: ['deliveryStatus', id],
    queryFn: () => fetchDeliveryStatusForEdit(id),
    enabled: isEditMode,
  });

  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const [selectedProject, setSelectedProject] = useState(null);

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
    if (projects && projects.length > 0 && formData.crm_project_id) {
        const currentProject = projects.find(p => p.id === formData.crm_project_id);
        setSelectedProject(currentProject || null);
    }
  }, [formData.crm_project_id, projects]);


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

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
      setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProjectChange = (project) => {
    setSelectedProject(project);
    setFormData((prev) => ({ ...prev, crm_project_id: project.id }));
  };


  const createDeliveryStatus = useMutation({
    mutationFn: async (newStatus) => {
      const secretKey = localStorage.getItem('secretKey');
      if (!secretKey) throw new Error('Secret key not found.');
      const payload = { ...newStatus };
      Object.keys(payload).forEach(key => {
        if (['open_project_files_provided', 'voice_match_needed', 'lip_match_needed', 'sound_balancing_needed', 'premix_files_shared', 'me_files_shared', 'high_res_video_shared', 'on_screen_editing_required', 'formatting_required'].includes(key)) {
            payload[key] = convertToBooleanOrNull(payload[key]);
        }
      });
      const response = await api.post('/delivery-status', payload);
      return response.data;
    },
    onSuccess: () => {
      triggerDataRefresh();
      showNotification('Delivery status created successfully!');
      setTimeout(() => navigate(-1), 2000);
    },
    onError: (err) => {
      showNotification(err.message || 'Failed to create status.', 'error');
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: async ({ id, updatedStatus }) => {
      const secretKey = localStorage.getItem('secretKey');
      if (!secretKey) throw new Error('Secret key not found.');
      const payload = { ...updatedStatus };
      Object.keys(payload).forEach(key => {
        if (['open_project_files_provided', 'voice_match_needed', 'lip_match_needed', 'sound_balancing_needed', 'premix_files_shared', 'me_files_shared', 'high_res_video_shared', 'on_screen_editing_required', 'formatting_required'].includes(key)) {
            payload[key] = convertToBooleanOrNull(payload[key]);
        }
      });
      const response = await api.put(`/delivery-status/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      triggerDataRefresh();
      showNotification('Delivery status updated successfully!');
      setTimeout(() => navigate(-1), 2000);
    },
    onError: (err) => {
      showNotification(err.message || 'Failed to update status.', 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
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

  const renderDropdown = (name, label, options) => (
    <Listbox value={formData[name]} onChange={(value) => handleSelectChange(name, value)}>
      <div>
        <Listbox.Label className="block text-sm font-light text-muted-foreground">{label}</Listbox.Label>
        <div className="mt-1 relative">
          <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
            <span className="block truncate text-foreground">{(options.find(opt => opt.value === formData[name])?.label) || 'Select...'}</span>
            <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {options.map(option => (
                <Listbox.Option key={option.value} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={option.value}>
                  {({ selected, active }) => (
                    <>
                      <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>{option.label}</span>
                      {selected ? <span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </div>
    </Listbox>
  );

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

  const booleanOptions = [
      { value: 'N/A', label: 'N/A' },
      { value: 'Yes', label: 'Yes' },
      { value: 'No', label: 'No' },
  ];

  return (
    <>
      <Notification
        show={notification.show}
        onHide={() => setNotification({ ...notification, show: false })}
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
               <h1 className="text-4xl font-light text-foreground">
                  {isEditMode ? 'Edit Project Delivery Status' : 'Create New Project Delivery Status'}
               </h1>
               <p className="mt-2 text-lg text-muted-foreground">Fill in the details for the project delivery.</p>
            </div>

          <div className="bg-[#333333] p-10 rounded-2xl border border-border">
            <form onSubmit={handleSubmit} className="space-y-8">
              <Listbox value={selectedProject} onChange={handleProjectChange}>
                  <div>
                      <Listbox.Label className="block text-sm font-light text-muted-foreground">CRM Project</Listbox.Label>
                      <div className="mt-1 relative">
                          <Listbox.Button className="relative w-full bg-secondary border border-border rounded-md shadow-sm pl-3 pr-10 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
                              <span className="block truncate text-foreground">{selectedProject ? `${selectedProject.project_name} (ID: ${selectedProject.id})` : "Select a Project"}</span>
                              <span className="ml-3 absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"><ChevronUpDownIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" /></span>
                          </Listbox.Button>
                          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                              <Listbox.Options className="absolute z-10 mt-1 w-full bg-secondary shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                                  {projects?.map((project) => (
                                      <Listbox.Option key={project.id} className={({ active }) => classNames(active ? 'text-white bg-primary/20' : 'text-foreground', 'cursor-default select-none relative py-2 pl-3 pr-9')} value={project}>
                                          {({ selected, active }) => (
                                              <>
                                                  <span className={classNames(selected ? 'font-semibold' : 'font-normal', 'block truncate')}>
                                                      {project.project_name} (ID: {project.id})
                                                  </span>
                                                  {selected ? <span className={classNames(active ? 'text-white' : 'text-accent', 'absolute inset-y-0 right-0 flex items-center pr-4')}><CheckIcon className="h-5 w-5" aria-hidden="true" /></span> : null}
                                              </>
                                          )}
                                      </Listbox.Option>
                                  ))}
                              </Listbox.Options>
                          </Transition>
                      </div>
                  </div>
              </Listbox>

              {renderDropdown('project_type', 'Project Type', projectTypeOptions)}

              <div>
                <label htmlFor="service_type" className="block text-sm font-light text-muted-foreground">
                  Service Type
                </label>
                <div className="mt-1">
                   <input
                      type="text"
                      id="service_type"
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      required
                      className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"
                  />
                </div>
              </div>

              {formData.project_type === 'QVO' && (
                <>
                  <div>
                    <label htmlFor="number_of_files" className="block text-sm font-light text-muted-foreground">Number of Files</label>
                    <div className="mt-1">
                    <input type="number" id="number_of_files" name="number_of_files" value={formData.number_of_files} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="total_duration_minutes" className="block text-sm font-light text-muted-foreground">Total Duration (Minutes)</label>
                    <div className="mt-1">
                    <input type="number" id="total_duration_minutes" name="total_duration_minutes" value={formData.total_duration_minutes} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="language_pair" className="block text-sm font-light text-muted-foreground">Language Pair</label>
                    <div className="mt-1">
                    <input type="text" id="language_pair" name="language_pair" value={formData.language_pair} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="target_language_dialect" className="block text-sm font-light text-muted-foreground">Target Language Dialect</label>
                    <div className="mt-1">
                    <input type="text" id="target_language_dialect" name="target_language_dialect" value={formData.target_language_dialect} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="voice_over_gender" className="block text-sm font-light text-muted-foreground">Voice Over Gender</label>
                    <div className="mt-1">
                    <input type="text" id="voice_over_gender" name="voice_over_gender" value={formData.voice_over_gender} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  {renderDropdown('voice_match_needed', 'Voice Match Needed?', booleanOptions)}
                  {renderDropdown('lip_match_needed', 'Lip Match Needed?', booleanOptions)}
                  {renderDropdown('sound_balancing_needed', 'Sound Balancing Needed?', booleanOptions)}
                  {renderDropdown('premix_files_shared', 'Premix Files Shared?', booleanOptions)}
                  {renderDropdown('me_files_shared', 'M&E Files Shared?', booleanOptions)}
                  {renderDropdown('high_res_video_shared', 'High-Res Video Shared?', booleanOptions)}
                  <div>
                    <label htmlFor="caption_type" className="block text-sm font-light text-muted-foreground">Caption Type</label>
                    <div className="mt-1">
                    <input type="text" id="caption_type" name="caption_type" value={formData.caption_type} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  {renderDropdown('on_screen_editing_required', 'On-Screen Editing Required?', booleanOptions)}
                  <div>
                    <label htmlFor="deliverable" className="block text-sm font-light text-muted-foreground">Deliverable</label>
                    <div className="mt-1">
                    <input type="text" id="deliverable" name="deliverable" value={formData.deliverable} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                </>
              )}

              {formData.project_type === 'DT' && (
                <>
                  <div>
                    <label htmlFor="source_word_count" className="block text-sm font-light text-muted-foreground">Source Word Count</label>
                    <div className="mt-1">
                    <input type="number" id="source_word_count" name="source_word_count" value={formData.source_word_count} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="source_languages" className="block text-sm font-light text-muted-foreground">Source Languages</label>
                    <div className="mt-1">
                    <input type="text" id="source_languages" name="source_languages" value={formData.source_languages} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="target_languages" className="block text-sm font-light text-muted-foreground">Target Languages</label>
                    <div className="mt-1">
                    <input type="text" id="target_languages" name="target_languages" value={formData.target_languages} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                    </div>
                  </div>
                  {renderDropdown('formatting_required', 'Formatting Required?', booleanOptions)}
                </>
              )}

              <div>
                <label htmlFor="deadline" className="block text-sm font-light text-muted-foreground">Deadline</label>
                <div className="mt-1">
                <input type="date" id="deadline" name="deadline" value={formData.deadline} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                </div>
              </div>

              <div>
                <label htmlFor="output_format" className="block text-sm font-light text-muted-foreground">Output Format</label>
                <div className="mt-1">
                <input type="text" id="output_format" name="output_format" value={formData.output_format} onChange={handleChange} className="shadow-sm focus:ring-primary focus:border-primary mt-1 block w-full sm:text-sm border border-border bg-secondary rounded-md p-3 text-foreground placeholder-muted-foreground"/>
                </div>
              </div>

              {renderDropdown('open_project_files_provided', 'Open Project Files Provided?', booleanOptions)}

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-background bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ease-in-out"
                  disabled={createDeliveryStatus.isPending || updateDeliveryStatus.isPending}
                >
                  {createDeliveryStatus.isPending || updateDeliveryStatus.isPending ? 'Saving...' : (isEditMode ? 'Update Status' : 'Create Status')}
                </button>
              </div>
            </form>
            </div>
          </motion.div>
      </div>
    </>
  );
}