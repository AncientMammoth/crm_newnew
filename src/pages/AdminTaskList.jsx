import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAllTasksForAdmin } from '../api';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function AdminTaskList() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getTasks = async () => {
      try {
        setLoading(true);
        const fetchedTasks = await fetchAllTasksForAdmin();
        setTasks(fetchedTasks);
      } catch (err) {
        console.error("Error fetching all tasks:", err);
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    getTasks();
  }, []);

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

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-foreground">All Tasks</h1>
          <p className="mt-2 text-sm text-muted-foreground">A list of all tasks across all projects in the system.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
              type="button"
              onClick={() => navigate('/admin/create-task')}
              className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Create Task
          </button>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-[#333333]">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Task Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Project</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Assigned To</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-[#333333]">
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <tr key={task.id} className="hover:bg-secondary/50 cursor-pointer" onClick={() => navigate(`/admin/tasks/${task.id}`)}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{task.fields['Task Name']}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{task.fields['Project Name'] || 'N/A'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{task.fields['Assigned To (Name)'] || 'Unassigned'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                           <span className={`px-2 py-1 text-xs rounded-full inline-block ${
                              task.fields.Status === 'Done' ? 'bg-green-400/10 text-green-400 ring-1 ring-inset ring-green-400/20' :
                              task.fields.Status === 'In Progress' ? 'bg-yellow-400/10 text-yellow-400 ring-1 ring-inset ring-yellow-400/20' :
                              'bg-blue-400/10 text-blue-400 ring-1 ring-inset ring-blue-400/20'
                            }`}>
                              {task.fields.Status || 'To-Do'}
                            </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                          {task.fields['Due Date'] ? new Date(task.fields['Due Date']).toLocaleDateString() : 'Not set'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">No tasks found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}