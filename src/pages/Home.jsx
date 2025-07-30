import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchTasksByIds } from '../api';

// Heroicons imports
import {
    BuildingOffice2Icon,
    BriefcaseIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ListBulletIcon,
    PlusIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ClockIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';

// NEW: Status object for better organization
const STATUS_INFO = {
    "To Do": {
        icon: ClockIcon,
        color: "text-blue-400",
        bg: "bg-blue-500/10"
    },
    "In Progress": {
        icon: ClockIcon, // Or a different icon for in progress
        color: "text-amber-400",
        bg: "bg-amber-500/10"
    },
    "Blocked": {
        icon: ExclamationCircleIcon,
        color: "text-red-400",
        bg: "bg-red-500/10"
    },
    "Done": {
        icon: CheckCircleIcon,
        color: "text-green-400",
        bg: "bg-green-500/10"
    },
};


export default function Home() {
    const userName = localStorage.getItem("userName") || "User";
    const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
    const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
    const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
    const taskIds = useMemo(() => JSON.parse(localStorage.getItem("taskIds") || "[]"), []);

    // Memoize date formatting to prevent re-calculation on every render
    const today = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }, []);


    const summaryStats = [
        { title: 'Managed Accounts', count: accountIds.length, link: '/accounts', Icon: BuildingOffice2Icon, color: "text-sky-400" },
        { title: 'Active Projects', count: projectIds.length, link: '/projects', Icon: BriefcaseIcon, color: "text-purple-400" },
        { title: 'Recent Updates', count: updateIds.length, link: '/updates', Icon: DocumentTextIcon, color: "text-emerald-400" },
    ];

    const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
        queryKey: ['homePageTasks', taskIds],
        queryFn: () => fetchTasksByIds(taskIds),
        enabled: taskIds.length > 0,
    });

    const upcomingTasks = useMemo(() => {
        if (!allTasks) return [];
        return allTasks
            .filter(task => task.fields.Status !== 'Done')
            .sort((a, b) => new Date(a.fields['Due Date']) - new Date(b.fields['Due Date']))
            .slice(0, 5);
    }, [allTasks]);
    
    const quickActions = [
        { title: "New Task", link: "/create-task" },
        { title: "New Project", link: "/create-project" },
        { title: "New Update", link: "/create-update" },
        { title: "New Account", link: "/create-account" },
    ];


    return (
        <div className="w-full bg-[#1c1c1c] min-h-screen">
            <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* --- HEADER --- */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-gray-100">
                        Good morning, {userName}
                    </h1>
                    <p className="mt-1 text-lg text-gray-400">
                        Here's your day at a glance. Today is {today}.
                    </p>
                </motion.header>

                {/* --- DASHBOARD GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* --- LEFT COLUMN: KEY METRICS --- */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-3 space-y-8"
                    >
                        <section>
                            <h2 className="text-lg font-semibold text-gray-200 mb-4">Key Metrics</h2>
                            <div className="space-y-4">
                                {summaryStats.map(stat => (
                                    <div key={stat.title} className="bg-[#2a2a2a] border border-gray-700/50 rounded-lg p-4 group transition-all hover:border-gray-500 hover:shadow-lg">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm text-gray-400">{stat.title}</p>
                                                <p className="text-4xl font-bold text-gray-50 mt-1">{stat.count}</p>
                                            </div>
                                            <stat.Icon className={`h-6 w-6 ${stat.color}`} />
                                        </div>
                                        <Link to={stat.link} className="text-sm font-medium text-blue-400 mt-4 inline-block group-hover:underline">
                                            View all &rarr;
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </motion.div>

                    {/* --- CENTER COLUMN: ACTION HUB --- */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-6 space-y-8"
                    >
                        {/* Upcoming Tasks */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-200">Upcoming Tasks</h2>
                                <Link to="/my-tasks" className="text-sm font-medium text-blue-400 hover:underline">
                                    View all tasks
                                </Link>
                            </div>
                             <div className="bg-[#2a2a2a] border border-gray-700/50 rounded-lg">
                                {tasksLoading ? ( // CORRECTED: Was 'isLoading', now 'tasksLoading'
                                    <p className="p-6 text-center text-gray-400">Loading your tasks...</p>
                                ) : upcomingTasks.length > 0 ? (
                                    <ul className="divide-y divide-gray-700/50">
                                        {upcomingTasks.map(task => {
                                            const status = STATUS_INFO[task.fields.Status] || STATUS_INFO["To Do"];
                                            const StatusIcon = status.icon;
                                            return (
                                                <li key={task.id} className="p-4 hover:bg-gray-700/20 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-100">{task.fields["Task Name"]}</p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Project: {task.fields["Project Name"]?.[0] || 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center space-x-4 ml-4">
                                                            <div className={`flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                                                                <StatusIcon className="h-4 w-4 mr-1.5" />
                                                                <span>{task.fields.Status}</span>
                                                            </div>
                                                            <span className="text-sm text-gray-300">
                                                                {new Date(task.fields["Due Date"]).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : (
                                    <div className="p-8 text-center">
                                        <CheckCircleIcon className="h-10 w-10 text-green-500 mx-auto" />
                                        <p className="mt-2 font-semibold text-gray-100">All caught up!</p>
                                        <p className="text-sm text-gray-400">You have no pending tasks.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </motion.div>

                     {/* --- RIGHT COLUMN: QUICK ACTIONS --- */}
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="lg:col-span-3 space-y-8"
                    >
                         <section>
                            <h2 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {quickActions.map(action => (
                                     <Link 
                                        key={action.title} 
                                        to={action.link}
                                        className="bg-blue-600 text-white rounded-lg p-4 text-center font-semibold hover:bg-blue-500 transition-all duration-200 flex flex-col items-center justify-center"
                                     >
                                        <PlusIcon className="h-6 w-6 mb-1" />
                                        <span>{action.title}</span>
                                     </Link>
                                ))}
                            </div>
                        </section>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}