import { Outlet } from "react-router-dom";
import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function DashboardLayout() {
  return (
    // CHANGED: Added the 'font-light' class here.
    // This will apply the light font weight to all child elements,
    // including all the pages rendered by the <Outlet />.
    <div className="flex flex-col min-h-screen bg-card font-light">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
