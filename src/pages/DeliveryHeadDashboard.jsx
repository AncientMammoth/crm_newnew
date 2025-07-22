import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function DeliveryHeadDashboard() {
  const userName = localStorage.getItem('userName') || 'Delivery Head';

  return (
    <div className="min-h-screen bg-card w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-light text-foreground mb-6">
            Welcome, {userName}!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            This is your dashboard for monitoring project delivery statuses.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              to="/delivery-head/projects"
              className="bg-secondary p-6 rounded-lg border border-border hover:bg-[#2E2E2E] transition-colors duration-200 flex flex-col items-start"
            >
              <h2 className="text-xl font-semibold text-foreground mb-2">View All Project Deliveries</h2>
              <p className="text-muted-foreground text-sm">Access a comprehensive list of all projects and their delivery statuses.</p>
              <div className="mt-4 text-primary hover:underline">Go to Project Deliveries &rarr;</div>
            </Link>

            {/* Add more cards for other potential delivery head functionalities */}
            {/* <div className="bg-secondary p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-2">Delivery Analytics</h2>
              <p className="text-muted-foreground text-sm">Analyze delivery trends and performance metrics.</p>
            </div>
            <div className="bg-secondary p-6 rounded-lg border border-border">
              <h2 className="text-xl font-semibold text-foreground mb-2">Team Performance</h2>
              <p className="text-muted-foreground text-sm">Monitor the performance of sales executives in delivery updates.</p>
            </div> */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
