import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import DeliveryHeadNavbar from './DeliveryHeadNavbar'; // Import the new DeliveryHeadNavbar

export default function DeliveryHeadLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Placeholder, sidebar might not be needed for delivery head

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-inter">
      {/* Delivery Head Navbar */}
      <DeliveryHeadNavbar setSidebarOpen={setSidebarOpen} />

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet /> {/* Renders the child routes */}
      </main>

      {/* Optional: Footer for Delivery Head, if needed */}
      {/* <Footer /> */}
    </div>
  );
}
