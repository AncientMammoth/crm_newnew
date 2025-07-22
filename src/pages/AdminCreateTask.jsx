import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { createTask, fetchAllUsersForAdmin, fetchAllProjectsForAdmin } from '../api';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AdminCreateTask() {
  const { register, handleSubmit, formState: { errors }, control, setValue } = useForm();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  // Watch for changes in the 'assignedToId' field
  const assignedToUserAirtableId = useWatch({
    control,
    name: "assignedToId",
  });

  // Fetch all users on initial component load
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchAllUsersForAdmin();
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Failed to load users for form", err);
        setError("Could not load the list of users.");
      }
    };
    loadUsers();
  }, []);

  // This effect runs whenever the selected user changes
  useEffect(() => {
    const fetchProjectsForUser = async () => {
      if (!assignedToUserAirtableId) {
        setProjects([]);
        setValue('projectId', '');
        return;
      }
      
      try {
        setIsProjectsLoading(true);
        setError(null);
        setValue('projectId', '');

        const selectedUser = users.find(u => u.fields['Secret Key'] === assignedToUserAirtableId);
        if (!selectedUser) {
            setProjects([]);
            return;
        };

        const userInternalId = selectedUser.id;
        
        const fetchedProjects = await fetchAllProjectsForAdmin({ ownerId: userInternalId });
        setProjects(fetchedProjects);
      } catch (err) {
        console.error("Failed to load projects for user", err);
        setError("Could not load projects for the selected user.");
        setProjects([]);
      } finally {
        setIsProjectsLoading(false);
      }
    };

    fetchProjectsForUser();
  }, [assignedToUserAirtableId, users, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);
    
    const adminAirtableId = localStorage.getItem('userRecordId');

    // --- FIX: Send IDs as single values, not arrays ---
    const taskData = {
      "Task Name": data.taskName,
      "Description": data.description,
      "Project": data.projectId,
      "Assigned To": data.assignedToId,
      "Due Date": data.dueDate,
      "Status": data.status,
      "Created By": adminAirtableId,
    };
    
    try {
      await createTask(taskData);
      navigate('/admin/tasks');
    } catch (err) {
      console.error("Failed to create task:", err);
      setError("An error occurred while creating the task. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <Link to="/admin/tasks" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to All Tasks
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-8 bg-[#333333] border border-border rounded-lg">
        <div className="space-y-4">
            <h2 className="text-2xl font-bold leading-7 text-foreground">Create and Assign a New Task</h2>
            <p className="text-sm leading-6 text-muted-foreground">
                Fill out the details below to create a new task and assign it to any user.
            </p>
        </div>

        {error && <div className="text-center text-red-400 bg-red-900/20 border border-red-500/30 p-3 rounded-md">{error}</div>}

        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
                <label htmlFor="taskName" className="block text-sm font-medium leading-6 text-muted-foreground">Task Name</label>
                <div className="mt-2">
                    <input type="text" {...register("taskName", { required: "Task name is required" })} className="block w-full rounded-md border-input bg-secondary py-2 px-3 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"/>
                    {errors.taskName && <p className="mt-2 text-sm text-red-500">{errors.taskName.message}</p>}
                </div>
            </div>

            <div className="col-span-full">
                <label htmlFor="description" className="block text-sm font-medium leading-6 text-muted-foreground">Description</label>
                <div className="mt-2">
                    <textarea {...register("description")} rows={3} className="block w-full rounded-md border-input bg-secondary py-2 px-3 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"/>
                </div>
            </div>
            
            <div className="sm:col-span-3">
                <label htmlFor="assignedToId" className="block text-sm font-medium leading-6 text-muted-foreground">Assign To</label>
                <div className="mt-2">
                    <select {...register("assignedToId", { required: "You must assign the task to a user" })} className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm">
                        <option value="">Select a user...</option>
                        {users.map(user => <option key={user.id} value={user.fields['Secret Key']}>{user.fields['User Name']}</option>)}
                    </select>
                    {errors.assignedToId && <p className="mt-2 text-sm text-red-500">{errors.assignedToId.message}</p>}
                </div>
            </div>

            <div className="sm:col-span-3">
                <label htmlFor="projectId" className="block text-sm font-medium leading-6 text-muted-foreground">Project</label>
                <div className="mt-2">
                    <select 
                        {...register("projectId", { required: "You must link the task to a project" })} 
                        className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!assignedToUserAirtableId || isProjectsLoading}
                    >
                        <option value="">
                            {!assignedToUserAirtableId 
                                ? "Select a user first" 
                                : isProjectsLoading 
                                ? "Loading projects..." 
                                : projects.length > 0
                                ? "Select a project..."
                                : "No projects for this user"}
                        </option>
                        {projects.map(project => <option key={project.id} value={project.id}>{project.fields['Project Name']}</option>)}
                    </select>
                    {errors.projectId && <p className="mt-2 text-sm text-red-500">{errors.projectId.message}</p>}
                </div>
            </div>

            <div className="sm:col-span-3">
                <label htmlFor="status" className="block text-sm font-medium leading-6 text-muted-foreground">Status</label>
                <div className="mt-2">
                    <select {...register("status")} defaultValue="To Do" className="block w-full rounded-md border-input bg-secondary py-2 pl-3 pr-10 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm">
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                    </select>
                </div>
            </div>

            <div className="sm:col-span-3">
                <label htmlFor="dueDate" className="block text-sm font-medium leading-6 text-muted-foreground">Due Date</label>
                <div className="mt-2">
                    <input type="date" {...register("dueDate")} className="block w-full rounded-md border-input bg-secondary py-2 px-3 text-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm" />
                </div>
            </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-x-6">
            <button type="button" onClick={() => navigate('/admin/tasks')} className="text-sm font-semibold leading-6 text-muted-foreground hover:text-foreground">
                Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">
                {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
        </div>
      </form>
    </div>
  );
}
