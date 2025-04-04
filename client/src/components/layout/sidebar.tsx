import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Settings, 
  LogOut, 
  User, 
  GraduationCap,
  FileText,
  ChevronRight
} from 'lucide-react';

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobileView && isOpen) {
      onClose();
    }
  }, [location, isMobileView, isOpen, onClose]);

  if (!user) return null;

  const adminNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { title: 'User Management', href: '/admin/users', icon: <Users className="h-5 w-5 mr-3" /> },
    { title: 'Course Management', href: '/admin/courses', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { title: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  const facultyNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/faculty', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { title: 'My Courses', href: '/faculty/courses', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { title: 'Assignments', href: '/faculty/assignments', icon: <FileText className="h-5 w-5 mr-3" /> },
  ];

  const studentNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/student', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { title: 'My Courses', href: '/student/courses', icon: <BookOpen className="h-5 w-5 mr-3" /> },
    { title: 'Assignments', href: '/student/assignments', icon: <FileText className="h-5 w-5 mr-3" /> },
  ];

  let navItems: NavItem[] = [];
  let portalTitle = '';
  let portalSwitchItems: { label: string, role: string, href: string, icon: React.ReactNode }[] = [];

  switch (user.role) {
    case 'admin':
      navItems = adminNavItems;
      portalTitle = 'Admin Portal';
      portalSwitchItems = [
        { 
          label: 'Faculty Portal', 
          role: 'faculty', 
          href: '/faculty', 
          icon: <User className="h-5 w-5 mr-3" /> 
        },
        { 
          label: 'Student Portal', 
          role: 'student', 
          href: '/student', 
          icon: <GraduationCap className="h-5 w-5 mr-3" /> 
        }
      ];
      break;
    case 'faculty':
      navItems = facultyNavItems;
      portalTitle = 'Faculty Portal';
      break;
    case 'student':
      navItems = studentNavItems;
      portalTitle = 'Student Portal';
      break;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block bg-white shadow-lg w-64 flex-shrink-0 h-screen sticky top-0 z-10",
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold font-poppins text-primary">EduLearn</h1>
          </div>
          
          {/* User Profile Section */}
          <div className="px-6 py-4 border-b border-neutral">
            <div className="flex items-center">
              <img 
                src={user.profileImage || "https://via.placeholder.com/40"} 
                alt="User profile" 
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                <div className="flex items-center text-xs text-secondary">
                  <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="mt-6 px-4">
            <p className="text-xs uppercase font-semibold text-textColor/60 mb-2 px-2">
              {portalTitle}
            </p>
            
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a 
                  className={cn(
                    "flex items-center px-2 py-3 mb-1 rounded-lg",
                    location === item.href 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "text-textColor hover:bg-primary/5"
                  )}
                >
                  {item.icon}
                  {item.title}
                </a>
              </Link>
            ))}
            
            {portalSwitchItems.length > 0 && (
              <>
                <p className="text-xs uppercase font-semibold text-textColor/60 mb-2 px-2 mt-6">
                  Switch Portal
                </p>
                
                {portalSwitchItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a className="flex items-center px-2 py-3 mb-1 rounded-lg text-textColor hover:bg-primary/5">
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          {/* Logout Button */}
          <div className="px-6 mt-auto absolute bottom-8 left-0 right-0">
            <Button 
              variant="ghost" 
              className="flex items-center px-4 py-3 text-textColor hover:text-primary w-full"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      <aside 
        className={cn(
          "fixed top-0 left-0 w-64 h-full bg-white shadow-lg transform transition-transform duration-200 z-30 lg:hidden overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-6 flex justify-between items-center">
            <h1 className="text-xl font-bold font-poppins text-primary">EduLearn</h1>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {/* User Profile Section */}
          <div className="px-6 py-4 border-b border-neutral">
            <div className="flex items-center">
              <img 
                src={user.profileImage || "https://via.placeholder.com/40"} 
                alt="User profile" 
                className="w-12 h-12 rounded-full"
              />
              <div className="ml-3">
                <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                <div className="flex items-center text-xs text-secondary">
                  <span className="bg-secondary/10 text-secondary px-2 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="mt-6 px-4">
            <p className="text-xs uppercase font-semibold text-textColor/60 mb-2 px-2">
              {portalTitle}
            </p>
            
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a 
                  className={cn(
                    "flex items-center px-2 py-3 mb-1 rounded-lg",
                    location === item.href 
                      ? "bg-primary/10 text-primary border-l-4 border-primary" 
                      : "text-textColor hover:bg-primary/5"
                  )}
                >
                  {item.icon}
                  {item.title}
                </a>
              </Link>
            ))}
            
            {portalSwitchItems.length > 0 && (
              <>
                <p className="text-xs uppercase font-semibold text-textColor/60 mb-2 px-2 mt-6">
                  Switch Portal
                </p>
                
                {portalSwitchItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a className="flex items-center px-2 py-3 mb-1 rounded-lg text-textColor hover:bg-primary/5">
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ))}
              </>
            )}
          </nav>
          
          {/* Logout Button */}
          <div className="px-6 mt-auto absolute bottom-8 left-0 right-0">
            <Button 
              variant="ghost" 
              className="flex items-center px-4 py-3 text-textColor hover:text-primary w-full"
              onClick={logout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
