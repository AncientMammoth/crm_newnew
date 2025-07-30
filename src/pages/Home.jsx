import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchTasksByIds } from '../api';

// Heroicons imports remain the same
import {
    BuildingOffice2Icon,
    BriefcaseIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ListBulletIcon,
    CalendarDaysIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

// UI components remain the same
import { Button } from '../components/ui/button';
import { ShineBorder } from '../components/ui/ShineBorder';

const STATUS_COLORS = {
    "To Do": "bg-gray-500/20 text-gray-300",
    "In Progress": "bg-blue-500/20 text-blue-300",
    "Blocked": "bg-red-500/20 text-red-300",
    "Done": "bg-green-500/20 text-green-300",
};

export default function Home() {
    // Data fetching logic remains unchanged
    const userName = localStorage.getItem("userName") || "User";
    const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
    const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
    const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
    const taskIds = useMemo(() => JSON.parse(localStorage.getItem("taskIds") || "[]"), []);

    const summaryStats = [
        { title: 'Managed Accounts', count: accountIds.length, link: '/accounts', Icon: BuildingOffice2Icon },
        { title: 'Active Projects', count: projectIds.length, link: '/projects', Icon: BriefcaseIcon },
        { title: 'Recent Updates', count: updateIds.length, link: '/updates', Icon: DocumentTextIcon },
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

    // NEW REORGANIZED JSX
    return (
        // Container moved up with less padding-top and more compact spacing
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">

            {/* Welcome Header remains at the top */}
            <motion.header 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12" // Added margin-bottom for spacing
            >
                <h1 className="font-light tracking-tight text-4xl md:text-5xl text-foreground">
                    Welcome back, {userName}!
                </h1>
                <p className="mt-2 text-lg text-muted-foreground tracking-wide">
                    Here's what's on your plate today.
                </p>
            </motion.header>

            {/* NEW: Two-column grid for the main dashboard content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* --- LEFT COLUMN (2/3 width) --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-2 space-y-8"
                >
                    {/* Upcoming Tasks Section */}
                    <section aria-labelledby="tasks-heading">
                        <div className="flex items-center justify-between mb-6">
                            <h2 id="tasks-heading" className="text-2xl font-light text-foreground flex items-center">
                                <ListBulletIcon className="h-6 w-6 mr-3 text-muted-foreground" />
                                Upcoming Tasks
                            </h2>
                            <Link to="/my-tasks" className="text-sm font-medium text-muted-foreground hover:text-white">
                                View All &rarr;
                            </Link>
                        </div>
                        <div className="bg-[#333333] border border-border rounded-2xl overflow-hidden">
                            {tasksLoading ? (
                                <p className="text-center text-muted-foreground p-12">Loading tasks...</p>
                            ) : upcomingTasks.length > 0 ? (
                                <ul className="divide-y divide-border">
                                    {upcomingTasks.map((task) => (
                                        <li key={task.id} className="p-5 hover:bg-white/5 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1 mb-3 sm:mb-0">
                                                <p className="font-light text-foreground">{task.fields["Task Name"]}</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Project: <Link to={`/projects/${task.fields.Project[0]}`} className="hover:underline">{task.fields["Project Name"]?.[0] || 'N/A'}</Link>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                                                <div className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[task.fields.Status] || 'bg-gray-500/20 text-gray-300'}`}>
                                                    {task.fields.Status}
                                                </div>
                                                <div className="flex items-center text-sm text-red-400 font-light">
                                                    <CalendarDaysIcon className="h-4 w-4 mr-1.5" />
                                                    Due: {new Date(task.fields["Due Date"]).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center text-muted-foreground p-12">
                                    <h3 className="font-light text-lg">All caught up!</h3>
                                    <p className="mt-1">You have no upcoming tasks. Great job!</p>
                                </div>
                            )}
                        </div>
                    </section>
                </motion.div>

                {/* --- RIGHT COLUMN (1/3 width) --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-1 space-y-8"
                >
                    {/* Quick Actions Section */}
                    <section aria-labelledby="actions-heading">
                        <h2 id="actions-heading" className="text-2xl font-light text-foreground mb-6">Quick Actions</h2>
                        <div className="flex flex-col gap-4">
                            <Link to="/create-task">
                                <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Task</Button>
                            </Link>
                             <Link to="/create-project">
                                <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Project</Button>
                            </Link>
                            <Link to="/create-update">
                                <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Update</Button>
                            </Link>
                             <Link to="/create-account">
                                <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Account</Button>
                            </Link>
                        </div>
                    </section>

                    {/* Summary Stats Section */}
                    <section aria-labelledby="summary-heading">
                        <h2 id="summary-heading" className="text-2xl font-light text-foreground mb-6">Overview</h2>
                        {/* Cards are now stacked vertically */}
                        <div className="space-y-4">
                            {summaryStats.map((stat) => (
                                <div key={stat.title} className="relative group">
                                    <div className="relative bg-[#333333] border border-border rounded-2xl p-6 flex items-center justify-between transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1">
                                        <div className="flex items-center">
                                            <stat.Icon className="h-7 w-7 text-muted-foreground mr-4" />
                                            <div>
                                                <h3 className="text-md font-light text-foreground">{stat.title}</h3>
                                                <Link to={stat.link} className="text-xs text-muted-foreground hover:text-white">View All</Link>
                                            </div>
                                        </div>
                                        <p className="text-4xl font-light text-foreground">{stat.count}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}