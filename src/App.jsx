import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import AccountCreation from './pages/AccountCreation';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectCreation from './pages/ProjectCreation';
import Updates from './pages/Updates';
import UpdateDetail from './pages/UpdateDetail';
import UpdateCreation from './pages/UpdateCreation';
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';
import CreateTask from './pages/CreateTask';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserList from './pages/AdminUserList';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminAccountList from './pages/AdminAccountList';
import AdminAccountDetail from './pages/AdminAccountDetail';
import AdminProjectList from './pages/AdminProjectList';
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminTaskList from './pages/AdminTaskList';
import AdminTaskDetail from './pages/AdminTaskDetail';
import AdminUpdateList from './pages/AdminUpdateList';
import DeliveryHeadDashboard from './pages/DeliveryHeadDashboard';
import DeliveryProjectList from './pages/DeliveryProjectList';
import DeliveryProjectDetail from './pages/DeliveryProjectDetail';
import MyProjectDeliveries from './pages/MyProjectDeliveries'; // Import the new component
import ProjectDeliveryForm from './pages/ProjectDeliveryForm'; // Import the new component

import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import DeliveryHeadLayout from './components/layout/DeliveryHeadLayout';

import './App.css';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('secretKey'));

  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem('userRole'));
      setIsLoggedIn(!!localStorage.getItem('secretKey'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // PrivateRoute component to protect routes based on authentication and role
  const PrivateRoute = ({ children, roles }) => {
    if (!isLoggedIn) {
      return <Navigate to="/login" replace />;
    }
    if (roles && !roles.includes(userRole)) {
      // Redirect to a forbidden page or home if role doesn't match
      return <Navigate to="/home" replace />; 
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Sales Executive Routes */}
        <Route 
          path="/" 
          element={
            <PrivateRoute roles={['sales_executive']}>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="accounts/:id" element={<AccountDetail />} />
          <Route path="create-account" element={<AccountCreation />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="create-project" element={<ProjectCreation />} />
          <Route path="updates" element={<Updates />} />
          <Route path="updates/:id" element={<UpdateDetail />} />
          <Route path="create-update" element={<UpdateCreation />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="create-task" element={<CreateTask />} />
          {/* FIX: Add route for MyProjectDeliveries */}
          <Route path="my-project-deliveries" element={<MyProjectDeliveries />} />
          {/* FIX: Add route for ProjectDeliveryForm */}
          <Route path="create-delivery-status" element={<ProjectDeliveryForm />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <PrivateRoute roles={['admin']}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUserList />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="accounts" element={<AdminAccountList />} />
          <Route path="accounts/:id" element={<AdminAccountDetail />} />
          <Route path="projects" element={<AdminProjectList />} />
          <Route path="projects/:id" element={<AdminProjectDetail />} />
          <Route path="tasks" element={<AdminTaskList />} />
          <Route path="tasks/:id" element={<AdminTaskDetail />} />
          <Route path="updates" element={<AdminUpdateList />} />
        </Route>

        {/* Delivery Head Routes */}
        <Route 
          path="/delivery-head" 
          element={
            <PrivateRoute roles={['delivery_head']}>
              <DeliveryHeadLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DeliveryHeadDashboard />} />
          <Route path="dashboard" element={<DeliveryHeadDashboard />} />
          <Route path="project-deliveries" element={<DeliveryProjectList />} />
          <Route path="project-deliveries/:id" element={<DeliveryProjectDetail />} />
        </Route>

        {/* Catch-all for unmatched routes - redirect to login or home */}
        <Route path="*" element={<Navigate to={isLoggedIn ? "/home" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
