import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layouts/header";
import Sidebar from "@/components/layouts/sidebar";
import Footer from "@/components/layouts/footer";
import { useAuth } from "@/hooks/use-auth";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();
  
  // Close sidebar on location change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);
  
  // Don't show sidebar and header on login page
  if (location === "/login") {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        {user && (
          <Sidebar 
            isOpen={sidebarOpen} 
            userRole={user.role} 
          />
        )}
        
        <main className="flex-1 p-4 lg:p-8 relative">
          {children}
        </main>
      </div>
      
      <Footer />
    </div>
  );
}
