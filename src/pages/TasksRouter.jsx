import React from 'react';
import AdminTasks from './AdminTasks'; // Admin's task overview page
import Tasks from './Tasks';           // User's task view

/**
 * This component acts as a router to display the correct
 * tasks page based on the user's role (admin or regular user).
 */
export default function TasksRouter() {
  //const isAdmin = localStorage.getItem('isAdmin') === 'true';

  // If the user is an admin, show their created tasks overview.
  // Otherwise, show the user's personal assigned task list.
  //return isAdmin ? <AdminTasks /> : <Tasks />;
  return <AdminTasks />;
}