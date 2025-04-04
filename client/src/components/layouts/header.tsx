import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const switchPortal = (role: string) => {
    setUserMenuOpen(false);
    
    // We're not actually changing the user's role, just redirecting to a different view
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "faculty") {
      navigate("/faculty/dashboard");
    } else if (role === "student") {
      navigate("/student/dashboard");
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex justify-between items-center px-4 py-2 lg:px-8">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="mr-4 lg:hidden text-primary text-2xl"
          >
            <i className="ri-menu-line"></i>
          </button>
          <a href="#" className="flex items-center">
            <span className="text-primary text-2xl mr-2">
              <i className="ri-book-open-line"></i>
            </span>
            <h1 className="text-xl font-poppins font-semibold text-primary">EduLearn</h1>
          </a>
        </div>
        
        <div className="flex items-center">
          <div className="relative mr-4">
            <input 
              type="text" 
              placeholder="Search..." 
              className="px-4 py-2 rounded-lg bg-background text-sm w-40 lg:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="absolute right-3 top-2.5 text-gray-400">
              <i className="ri-search-line"></i>
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative text-gray-500 hover:text-primary">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="relative" ref={userMenuRef}>
              <button 
                className="flex items-center focus:outline-none"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <img 
                  src={user?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"} 
                  alt="User profile" 
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                />
                <span className="hidden md:block ml-2 text-sm font-medium">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </span>
                <i className="ri-arrow-down-s-line ml-1"></i>
              </button>
              
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-background">
                    Profile
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-background">
                    Settings
                  </a>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  {/* Only show portal switching options if user has access to them */}
                  {user?.role === "admin" && (
                    <button 
                      onClick={() => switchPortal("admin")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-background"
                    >
                      Admin Portal
                    </button>
                  )}
                  
                  {user?.role === "admin" && (
                    <button
                      onClick={() => switchPortal("faculty")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-background"
                    >
                      Faculty Portal
                    </button>
                  )}
                  
                  {user?.role === "admin" && (
                    <button
                      onClick={() => switchPortal("student")}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-background"
                    >
                      Student Portal
                    </button>
                  )}
                  
                  <div className="border-t border-gray-200"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-background"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
