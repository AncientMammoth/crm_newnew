import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAdminProjectDetail } from '../api';
import { ArrowLeftIcon, BriefcaseIcon, ChatBubbleBottomCenterTextIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

export default function AdminProjectDetail() {
  const { id } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProjectDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchAdminProjectDetail(id);
        setProjectData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching project details:", err);
        setError("Could not load project details.");
      } finally {
        setLoading(false);
      }
    };
    loadProjectDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 border border-red-400 p-4 rounded-lg">{error}</div>;
  }

  if (!projectData) {
    return <div className="text-center text-muted-foreground">Project not found.</div>
  }

  const { project, tasks, updates } = projectData;

  return (
    <div className="px-4 sm:px-0 space-y-8">
      {/* Header */}
      <div>
        <Link to="/admin/projects" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeftIcon className="h-4 w-4" />
            Back to All Projects
        </Link>
        <h1 className="text-3xl font-bold text-foreground">{project.fields['Project Name']}</h1>
        <p className="mt-1 text-muted-foreground">
          Account: <span className="font-semibold">{project.fields['Account Name (from Account)']}</span> | Owner: <span className="font-semibold">{project.fields['Project Owner Name']}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            {project.fields['Project Description']}
        </p>
      </div>

      {/* Tasks Table */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6 text-primary" />
            Tasks ({tasks.length})
        </h2>
        <div className="mt-4 flow-root">
            <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-[#333333]">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Task Name</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Assigned To</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Status</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Due Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-[#333333]">
                        {tasks.length > 0 ? tasks.map((task) => (
                            <tr key={task.id}>
                                <td className="py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">{task.fields['Task Name']}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{task.fields['Assigned To Name']}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{task.fields['Status']}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{task.fields['Due Date']}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-muted-foreground">This project has no tasks.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Updates Table */}
      <div>
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <ChatBubbleBottomCenterTextIcon className="h-6 w-6 text-primary" />
            Updates ({updates.length})
        </h2>
        <div className="mt-4 flow-root">
            <div className="overflow-hidden shadow ring-1 ring-border ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-[#333333]">
                        <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">Date</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Notes</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Owner</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-[#333333]">
                        {updates.length > 0 ? updates.map((update) => (
                            <tr key={update.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-muted-foreground sm:pl-6">{new Date(update.fields['Date']).toLocaleDateString()}</td>
                                <td className="py-4 px-3 text-sm text-foreground">{update.fields['Notes']}</td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">{update.fields['Update Owner Name']}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="3" className="py-8 text-center text-muted-foreground">This project has no updates.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}