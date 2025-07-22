import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchTasksByIds } from '../api'; // Your original API call is preserved

// Correct v2 Heroicons imports
import {
    BuildingOffice2Icon,
    BriefcaseIcon,
    DocumentTextIcon,
    ArrowTopRightOnSquareIcon,
    ListBulletIcon,
    CalendarDaysIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

// Import the UI components
import { Button } from '../components/ui/button';
import { ShineBorder } from '../components/ui/ShineBorder';

// NEW: Status colors that look good on a dark theme
const STATUS_COLORS = {
    "To Do": "bg-gray-500/20 text-gray-300",
    "In Progress": "bg-blue-500/20 text-blue-300",
    "Blocked": "bg-red-500/20 text-red-300",
    "Done": "bg-green-500/20 text-green-300",
};

export default function Home() {
    // All your original data fetching and state logic is preserved
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

    // This is the new JSX with all the rian.io styling and effects
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 space-y-24">

            {/* Section 1: Welcome Header with updated font styles */}
            <motion.header 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
            >
                <h1 className="font-light tracking-tight text-4xl md:text-6xl lg:text-7xl leading-tight text-foreground">
                    Welcome back, {userName}!
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground tracking-wide">
                    Here's a snapshot of your workspace. Let's get things done.
                </p>
            </motion.header>

            {/* Section 2: Summary Stat Cards with LOCALIZED aurora background */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                aria-labelledby="summary-heading"
                className="relative" // Parent container for the aurora
            >
                {/* THIS IS THE AURORA DIV - It sits behind the cards 
                <div 
                  className="absolute -top-32 left-1/2 -z-10 h-[40rem] w-[60rem] -translate-x-1/2 [background:radial-gradient(50%_50%_at_50%_50%,#7634d2_0%,rgba(255,255,255,0)_100%)] opacity-20"
                  aria-hidden="true" 
                />*/}

                <h2 id="summary-heading" className="sr-only">Summary Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {summaryStats.map((stat) => (
                        <div key={stat.title} className="relative group">
                            <div className="relative bg-[#333333] border border-border rounded-2xl p-6 flex flex-col justify-between h-full transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1">
                                <ShineBorder
                                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    shineColor={["#67F5C8", "#ADFF15", "#F1FA38"]}
                                    borderWidth={2}
                                />
                                <div className="relative z-10">
                                    <stat.Icon className="h-8 w-8 text-muted-foreground mb-4" />
                                    {/* CHANGED: font-semibold to font-light */}
                                    <h3 className="text-lg font-light text-foreground">{stat.title}</h3>
                                    {/* NOTE: Kept font-bold here for emphasis on the number */}
                                    <p className="text-5xl font-light text-foreground my-2">{stat.count}</p>
                                </div>
                                <Link to={stat.link} className="relative z-10 mt-4 text-sm font-medium text-muted-foreground hover:text-white flex items-center">
                                    View {stat.title}
                                    <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* Section 3: Upcoming Tasks & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="lg:col-span-2" 
                    aria-labelledby="tasks-heading"
                >
                    <div className="flex items-center justify-between mb-6">
                        {/* CHANGED: font-semibold to font-light */}
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
                                            {/* CHANGED: font-semibold to font-light */}
                                            <p className="font-light text-foreground">{task.fields["Task Name"]}</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Project: <Link to={`/projects/${task.fields.Project[0]}`} className="hover:underline">{task.fields["Project Name"]?.[0] || 'N/A'}</Link>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                                            <div className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[task.fields.Status] || 'bg-gray-500/20 text-gray-300'}`}>
                                                {task.fields.Status}
                                            </div>
                                            {/* CHANGED: font-semibold to font-light */}
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
                                {/* CHANGED: font-semibold to font-light */}
                                <h3 className="font-light text-lg">All caught up!</h3>
                                <p className="mt-1">You have no upcoming tasks. Great job!</p>
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    aria-labelledby="actions-heading"
                >
                    {/* CHANGED: font-semibold to font-light */}
                    <h2 id="actions-heading" className="text-2xl font-light text-foreground mb-6">Quick Actions</h2>
                    <div className="flex flex-col gap-4">
                        <Link to="/create-account">
                            <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Account</Button>
                        </Link>
                        <Link to="/create-project">
                            <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Project</Button>
                        </Link>
                        <Link to="/create-update">
                            <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Update</Button>
                        </Link>
                        <Link to="/create-task">
                            <Button className="w-full justify-start text-base py-6 bg-[#333333] hover:bg-[#2E2E2E] text-foreground border-transparent"><PlusIcon className="h-5 w-5 mr-3"/> New Task</Button>
                        </Link>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
