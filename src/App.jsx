import { Routes, Route, Navigate } from "react-router-dom";
import React from "react";

// Page & Component Imports
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Updates from "./pages/Updates";
import UpdateDetail from "./pages/UpdateDetail";
import AccountCreation from "./pages/AccountCreation";
import ProjectCreation from "./pages/ProjectCreation";
import UpdateCreation from "./pages/UpdateCreation";
import TasksRouter from "./pages/TasksRouter";
import CreateTask from "./pages/CreateTask";
import Tasks from './pages/Tasks';
import TaskDetail from './pages/TaskDetail';

// Admin Component Imports
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserList from './pages/AdminUserList';
import AdminProjectList from './pages/AdminProjectList';
import AdminTaskList from './pages/AdminTaskList';
import AdminAccountList from './pages/AdminAccountList';
import AdminUpdateList from './pages/AdminUpdateList';
import AdminUserDetail from './pages/AdminUserDetail';
import AdminAccountDetail from './pages/AdminAccountDetail';
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminCreateTask from './pages/AdminCreateTask';
import AdminMyTasks from './pages/AdminMyTasks';
import AdminTaskDetail from './pages/AdminTaskDetail';

// New Delivery Head Component Imports
import DeliveryHeadLayout from './components/layout/DeliveryHeadLayout';
import DeliveryHeadDashboard from './pages/DeliveryHeadDashboard';
import DeliveryProjectList from './pages/DeliveryProjectList';
import DeliveryProjectDetail from './pages/DeliveryProjectDetail';

// New Sales Executive Delivery Pages
import ProjectDeliveryForm from './pages/ProjectDeliveryForm';
import MyProjectDeliveries from './pages/MyProjectDeliveries';


// Route Guards and Redirects
function PrivateRoute({ children, allowedRoles }) {
  const secretKey = localStorage.getItem("secretKey");
  const userRole = localStorage.getItem("userRole"); // Get user role from local storage

  if (!secretKey) {
    return <Navigate to="/login" />;
  }

  // Check if the user's role is allowed for this route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not allowed, redirect to home or login based on whether they are logged in
    return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'delivery_head' ? '/delivery-head/dashboard' : '/home'} />;
  }

  return children;
}

function HomeRedirect() {
    const userRole = localStorage.getItem("userRole");
    const secretKey = localStorage.getItem("secretKey");

    if (secretKey) {
        if (userRole === "admin") {
            return <Navigate to="/admin/dashboard" />;
        } else if (userRole === "delivery_head") {
            return <Navigate to="/delivery-head/dashboard" />;
        } else {
            return <Navigate to="/home" />; // Default for sales_executive
        }
    }
    
    return <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Standard User (Sales Executive) Routes */}
      <Route
        path="/"
        element={
          <PrivateRoute allowedRoles={['sales_executive']}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="home" element={<Home />} />
        <Route path="accounts" element={<Accounts />} /> 
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="updates" element={<Updates />} />
        <Route path="updates/:id" element={<UpdateDetail />} />
        <Route path="create-account" element={<AccountCreation />} />
        <Route path="create-project" element={<ProjectCreation />} />
        <Route path="create-update" element={<UpdateCreation />} />
        <Route path="tasks" element={<TasksRouter />} />
        <Route path="create-task" element={<CreateTask />} />
        <Route path="my-tasks" element={<Tasks />} />
        <Route path="tasks/:taskId" element={<TaskDetail />} />
        {/* New Delivery Status Routes for Sales Executive */}
        <Route path="delivery" element={<MyProjectDeliveries />} /> {/* List of their own deliveries */}
        <Route path="delivery/create" element={<ProjectDeliveryForm />} /> {/* Form to create/edit */}
        <Route path="delivery/edit/:id" element={<ProjectDeliveryForm />} /> {/* Edit existing delivery status */}
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUserList />} />
        <Route path="users/:id" element={<AdminUserDetail />} />
        <Route path="accounts" element={<AdminAccountList />} />
        <Route path="accounts/:id" element={<AdminAccountDetail />} />
        <Route path="projects" element={<AdminProjectList />} />
        <Route path="projects/:id" element={<AdminProjectDetail />} />
        <Route path="tasks" element={<AdminTaskList />} />
        <Route path="tasks/:taskId" element={<AdminTaskDetail />} />
        <Route path="my-tasks" element={<AdminMyTasks />} />
        <Route path="create-task" element={<AdminCreateTask />} />
        <Route path="updates" element={<AdminUpdateList />} />
      </Route>

      {/* Delivery Head Routes */}
      <Route
        path="/delivery-head"
        element={
          <PrivateRoute allowedRoles={['delivery_head']}>
            <DeliveryHeadLayout />
          </PrivateRoute>
        }
      >
        <Route path="dashboard" element={<DeliveryHeadDashboard />} />
        <Route path="projects" element={<DeliveryProjectList />} />
        <Route path="projects/:id" element={<DeliveryProjectDetail />} />
      </Route>
    </Routes>
  );
}
