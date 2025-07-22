import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, BriefcaseIcon, ClipboardDocumentListIcon, BuildingOffice2Icon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { fetchAllUsersForAdmin, fetchAllProjectsForAdmin, fetchAllTasksForAdmin, fetchAllAccountsForAdmin, fetchAllUpdatesForAdmin } from '../api';

// StatCard component with enhanced UI based on the theme
const StatCard = ({ title, value, icon, to }) => (
  <Link 
    to={to} 
    className="bg-[#333333] border border-border rounded-xl p-6 flex items-center justify-between group hover:border-accent transition-all duration-300"
  >
    <div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-4xl font-bold text-foreground group-hover:text-accent transition-colors">{value}</p>
    </div>
    <div className="p-4 bg-secondary rounded-full border border-border group-hover:border-accent/30 transition-colors">
      {React.cloneElement(icon, { className: "h-8 w-8 text-muted-foreground group-hover:text-accent transition-colors"})}
    </div>
  </Link>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ userCount: 0, projectCount: 0, taskCount: 0, accountCount: 0, updateCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [users, projects, tasks, accounts, updates] = await Promise.all([
          fetchAllUsersForAdmin(),
          fetchAllProjectsForAdmin(),
          fetchAllTasksForAdmin(),
          fetchAllAccountsForAdmin(),
          fetchAllUpdatesForAdmin()
        ]);
        setStats({
          userCount: users.length,
          projectCount: projects.length,
          taskCount: tasks.length,
          accountCount: accounts.length,
          updateCount: updates.length
        });
        setError(null);
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
        setError("Could not load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) {
    return <div className="text-center text-red-400 bg-red-900/20 border border-red-500/30 p-4 rounded-lg">{error}</div>;
  }
  
  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
          </div>
      );
  }

  return (
    <div className="space-y-8 px-4 sm:px-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          An overview of all data across the platform.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Users" 
          value={stats.userCount} 
          icon={<UsersIcon />}
          to="/admin/users"
        />
        <StatCard 
          title="Total Accounts" 
          value={stats.accountCount} 
          icon={<BuildingOffice2Icon />}
          to="/admin/accounts"
        />
        <StatCard 
          title="Total Projects" 
          value={stats.projectCount} 
          icon={<BriefcaseIcon />}
          to="/admin/projects"
        />
        <StatCard 
          title="Total Tasks" 
          value={stats.taskCount} 
          icon={<ClipboardDocumentListIcon />}
          to="/admin/tasks"
        />
        <StatCard 
          title="Total Updates" 
          value={stats.updateCount} 
          icon={<ChatBubbleBottomCenterTextIcon />}
          to="/admin/updates"
        />
      </div>

      <div className="bg-secondary border border-border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-foreground">Welcome, Admin!</h2>
        <p className="mt-2 text-muted-foreground">
          From this panel, you can manage all users, oversee every project, and assign tasks. Use the navigation above to get started.
        </p>
      </div>
    </div>
  );
}
