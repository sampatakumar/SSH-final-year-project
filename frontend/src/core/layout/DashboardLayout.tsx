import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="ssh-layout-root">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="ssh-main-wrapper">
        <Header onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="ssh-content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
