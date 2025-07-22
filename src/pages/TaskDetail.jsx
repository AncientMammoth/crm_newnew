import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTaskById, updateTask } from '../api';
import { ArrowLeftIcon, CalendarIcon, UserIcon, FolderIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function TaskDetail() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getTask = async () => {
      try {
        setLoading(true);
        const fetchedTask = await fetchTaskById(taskId);
        if (fetchedTask) {
          setTask(fetchedTask);
        } else {
          setError("No task data found.");
        }
      } catch (err) {
        console.error("Error fetching task details:", err);
        setError("Could not load task details.");
      } finally {
        setLoading(false);
      }
    };
    getTask();
  }, [taskId]);

  const handleStatusChange = async (newStatus) => {
    if (!task) return;
    try {
      const updatedTask = await updateTask(task.id, { Status: newStatus });
      setTask(updatedTask);
    } catch (err) {
      console.error("Failed to update task status:", err);
      // Optionally show an error to the user
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-10">{error}</div>;
  }

  if (!task) {
    return <div className="text-center py-10 text-muted-foreground">No task data found.</div>;
  }

  const { fields } = task;
  const createdBy = fields['Created By (Name)'] || 'Unknown';
  const projectName = fields['Project Name'] || 'N/A';
  const projectId = fields.Project?.[0];


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
                <ol className="list-none p-0 inline-flex items-center">
                <li className="flex items-center">
                    <Link to="/projects" className="hover:text-accent transition-colors">Projects</Link>
                    <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
                </li>
                {projectId && (
                    <li className="flex items-center">
                        <Link to={`/projects/${projectId}`} className="hover:text-accent transition-colors truncate max-w-[200px]">{projectName}</Link>
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground mx-1" />
                    </li>
                )}
                <li>
                    <span className="font-semibold text-foreground">Task</span>
                </li>
                </ol>
            </nav>

            <div className="bg-[#333333] p-6 sm:p-8 rounded-2xl border border-border">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border">
                    <h1 className="text-3xl lg:text-4xl font-light text-foreground tracking-tight">
                        {fields['Task Name']}
                    </h1>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                        <select
                        value={fields.Status || 'To Do'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="block w-full rounded-lg border-border bg-secondary py-2 pl-3 pr-10 text-foreground font-semibold focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                        >
                        <option>To Do</option>
                        <option>In Progress</option>
                        <option>Done</option>
                        </select>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-6">
                    <div className="flex items-start gap-4">
                        <FolderIcon className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground font-light">Project</p>
                            <p className="font-medium text-foreground mt-1">{projectName}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <UserIcon className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground font-light">Created By</p>
                            <p className="font-medium text-foreground mt-1">{createdBy}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <CalendarIcon className="h-5 w-5 text-accent mt-1 flex-shrink-0" />
                        <div>
                            <p className="text-sm text-muted-foreground font-light">Due Date</p>
                            <p className="font-medium text-foreground mt-1">{fields['Due Date'] ? new Date(fields['Due Date']).toLocaleDateString() : 'Not set'}</p>
                        </div>
                    </div>
                </div>

                {/* Description Section */}
                {fields.Description && (
                <div className="border-t border-border pt-6">
                    <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed font-light">
                    {fields.Description}
                    </p>
                </div>
                )}
            </div>
        </motion.div>
    </div>
  );
}
