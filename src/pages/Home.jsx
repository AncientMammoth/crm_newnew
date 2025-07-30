import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { fetchTasksByIds } from '../api';
import { ShineBorder } from '../components/ui/ShineBorder'; // Import the ShineBorder component

// Heroicons imports
import {
    BuildingOffice2Icon,
    BriefcaseIcon,
    DocumentTextIcon,
    PlusIcon,
    CheckCircleIcon,
    ClockIcon,
    ShoppingCartIcon, // Icon for New Order
} from '@heroicons/react/24/outline';

// Status colors remain the same
const STATUS_COLORS = {
    "To Do": "bg-gray-500/20 text-gray-300",
    "In Progress": "bg-blue-500/20 text-blue-300",
    "Blocked": "bg-red-500/20 text-red-300",
    "Done": "bg-green-500/20 text-green-300",
};


export default function Home() {
    const userName = localStorage.getItem("userName") || "User";
    const accountIds = JSON.parse(localStorage.getItem("accountIds") || "[]");
    const projectIds = JSON.parse(localStorage.getItem("projectIds") || "[]");
    const updateIds = JSON.parse(localStorage.getItem("updateIds") || "[]");
    const taskIds = useMemo(() => JSON.parse(localStorage.getItem("taskIds") || "[]"), []);

    const today = useMemo(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    }, []);

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
    
    const quickActions = [
        { title: "New Order", link: "/delivery/create", Icon: PlusIcon },
        { title: "New Task", link: "/create-task", Icon: PlusIcon },
        { title: "New Project", link: "/create-project", Icon: PlusIcon },
        { title: "New Update", link: "/create-update", Icon: PlusIcon },
        { title: "New Account", link: "/create-account", Icon: PlusIcon },
    ];

    // Card component for DRY code
    const Card = ({ children, className = '' }) => (
        <div className={`bg-[#333333] border border-border rounded-2xl p-6 ${className}`}>
            {children}
        </div>
    );


    return (
        <div className="w-full bg-card min-h-screen">
            <main className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* --- HEADER --- */}
                <motion.header 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10 text-center" // Centered the header text
                >
                    <h1 className="text-5xl font-light text-foreground"> {/* Increased font size */}
                        Welcome back, {userName}
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Today is {today}.
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
                            <h2 className="text-xl font-light text-foreground mb-5 text-left">Key Metrics</h2>
                            <div className="space-y-5">
                                {summaryStats.map(stat => (
                                    <Link to={stat.link} key={stat.title} className="block group relative">
                                        <Card className="transition-all duration-300 group-hover:bg-[#3a3a3a]">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <stat.Icon className="h-6 w-6 text-muted-foreground" />
                                                    <h3 className="text-md font-light text-foreground ml-3">{stat.title}</h3>
                                                </div>
                                                <p className="text-3xl font-light text-foreground">{stat.count}</p>
                                            </div>
                                        </Card>
                                        <ShineBorder 
                                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            borderWidth={1}
                                            shineColor={["#67F5C8", "#ADFF15", "#F1FA38"]}
                                        />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    </motion.div>

                    {/* --- CENTER COLUMN: UPCOMING TASKS --- */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="lg:col-span-6"
                    >
                        <section>
                             <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-light text-foreground">Upcoming Tasks</h2>
                                <Link to="/my-tasks" className="text-sm font-light text-muted-foreground hover:text-white">
                                    View all &rarr;
                                </Link>
                            </div>
                            <Card className="p-0 overflow-hidden transition-all duration-300">
                                {tasksLoading ? (
                                    <p className="p-10 text-center text-muted-foreground">Loading tasks...</p>
                                ) : upcomingTasks.length > 0 ? (
                                    <ul className="divide-y divide-border">
                                        {upcomingTasks.map(task => (
                                            <li key={task.id} className="px-6 py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-[#3a3a3a] transition-colors">
                                                <div>
                                                    <p className="font-light text-foreground">{task.fields["Task Name"]}</p>
                                                    <p className="text-sm text-muted-foreground">{task.fields["Project Name"]?.[0] || 'N/A'}</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                     <div className={`text-xs font-light px-3 py-1 rounded-full ${STATUS_COLORS[task.fields.Status] || 'bg-gray-500/20 text-gray-300'}`}>
                                                        {task.fields.Status}
                                                    </div>
                                                    <p className="text-sm font-light text-muted-foreground">
                                                        {new Date(task.fields["Due Date"]).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="p-10 text-center">
                                        <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto" />
                                        <p className="mt-2 font-light text-lg text-foreground">You're all caught up!</p>
                                    </div>
                                )}
                            </Card>
                        </section>
                    </motion.div>

                     {/* --- RIGHT COLUMN: QUICK ACTIONS --- */}
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="lg:col-span-3"
                    >
                         <section>
                            <h2 className="text-xl font-light text-foreground mb-5">Quick Actions</h2>
                            <div className="flex flex-col gap-4">
                                {quickActions.map(action => {
                                    const ActionIcon = action.Icon;
                                    return (
                                        <Link key={action.title} to={action.link} className="relative group">
                                            <button className="w-full text-left font-light text-base px-4 py-4 bg-[#333333] group-hover:bg-[#3a3a3a] text-foreground border border-transparent rounded-lg flex items-center transition-colors">
                                                <ActionIcon className="h-5 w-5 mr-3 text-muted-foreground"/> 
                                                {action.title}
                                            </button>
                                            <ShineBorder 
                                                className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                borderWidth={1}
                                                shineColor={["#67F5C8", "#ADFF15", "#F1FA38"]}
                                            />
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
