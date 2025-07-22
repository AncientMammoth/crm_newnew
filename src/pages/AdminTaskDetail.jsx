import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTaskById } from '../api';
import { ArrowLeftIcon, CalendarIcon, UserIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function AdminTaskDetail() {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getTaskDetails = async () => {
      try {
        setLoading(true);
        const fetchedTask = await fetchTaskById(taskId);
        if (!fetchedTask) {
          throw new Error('Task not found.');
        }
        setTask(fetchedTask);
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('Failed to load task details.');
      } finally {
        setLoading(false);
      }
    };

    getTaskDetails();
  }, [taskId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-lg">{error}</div>;
  }

  if (!task) {
    return <div className="text-center p-4 text-muted-foreground">Task not found.</div>;
  }

  const { fields } = task;
  const assignedTo = fields['Assigned To (Name)'] ? fields['Assigned To (Name)'][0] : 'Unassigned';
  const createdBy = fields['Created By (Name)'] ? fields['Created By (Name)'][0] : 'Unknown';

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-4">
        <Link
          to="/admin/tasks"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to All Tasks
        </Link>
      </div>

      <div className="bg-[#333333] p-6 sm:p-8 rounded-lg shadow-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2 sm:mb-0">{fields['Task Name']}</h1>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full self-start ${
            fields.Status === 'Done' ? 'bg-green-400/10 text-green-400 ring-1 ring-inset ring-green-400/20' :
            fields.Status === 'In Progress' ? 'bg-yellow-400/10 text-yellow-400 ring-1 ring-inset ring-yellow-400/20' :
            'bg-blue-400/10 text-blue-400 ring-1 ring-inset ring-blue-400/20'
          }`}>
            {fields.Status || 'To-Do'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-muted-foreground mb-8 border-y border-border py-6">
          <div className="flex items-start space-x-3">
            <UserIcon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
                <span className="font-semibold text-foreground">Assigned To</span>
                <p>{assignedTo}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <PencilIcon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
             <div>
                <span className="font-semibold text-foreground">Created By</span>
                <p>{createdBy}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CalendarIcon className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
                <span className="font-semibold text-foreground">Due Date</span>
                <p>{fields['Due Date'] ? new Date(fields['Due Date']).toLocaleDateString() : 'Not set'}</p>
            </div>
          </div>
        </div>

        {fields.Description && (
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Description</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <p>{fields.Description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}