import { useMemo } from "react";
import { Link, useRoute } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  userRole: string;
}

export default function Sidebar({ isOpen, userRole }: SidebarProps) {
  const navLinks = useMemo(() => {
    const basePrefix = userRole === "admin" 
      ? "/admin" 
      : userRole === "faculty" 
        ? "/faculty" 
        : "/student";
      
    const commonNavLinks = [
      {
        icon: "ri-dashboard-line",
        label: "Dashboard",
        path: `${basePrefix}/dashboard`
      }
    ];
    
    // Admin-specific links
    if (userRole === "admin") {
      return [
        ...commonNavLinks,
        {
          icon: "ri-group-line",
          label: "Users",
          path: "/admin/users"
        },
        {
          icon: "ri-book-open-line",
          label: "Courses",
          path: "/admin/courses"
        },
        {
          icon: "ri-calendar-todo-line",
          label: "Assignments",
          path: "/admin/assignments"
        },
        {
          icon: "ri-file-list-3-line",
          label: "Grades",
          path: "/admin/grades"
        },
        {
          icon: "ri-settings-line",
          label: "Settings",
          path: "/admin/settings"
        },
        {
          icon: "ri-pie-chart-line",
          label: "Reports",
          path: "/admin/reports"
        },
        {
          icon: "ri-notification-line",
          label: "Announcements",
          path: "/admin/announcements"
        }
      ];
    }
    
    // Faculty-specific links
    if (userRole === "faculty") {
      return [
        ...commonNavLinks,
        {
          icon: "ri-book-open-line",
          label: "My Courses",
          path: "/faculty/courses"
        },
        {
          icon: "ri-calendar-todo-line",
          label: "Assignments",
          path: "/faculty/assignments"
        },
        {
          icon: "ri-file-list-3-line",
          label: "Grading",
          path: "/faculty/grading"
        },
        {
          icon: "ri-group-line",
          label: "Students",
          path: "/faculty/students"
        },
        {
          icon: "ri-notification-line",
          label: "Announcements",
          path: "/faculty/announcements"
        },
        {
          icon: "ri-pie-chart-line",
          label: "Analytics",
          path: "/faculty/analytics"
        }
      ];
    }
    
    // Student-specific links
    return [
      ...commonNavLinks,
      {
        icon: "ri-book-open-line",
        label: "My Courses",
        path: "/student/courses"
      },
      {
        icon: "ri-calendar-todo-line",
        label: "Assignments",
        path: "/student/assignments"
      },
      {
        icon: "ri-file-list-3-line",
        label: "Grades",
        path: "/student/grades"
      },
      {
        icon: "ri-calendar-line",
        label: "Schedule",
        path: "/student/schedule"
      },
      {
        icon: "ri-notification-line",
        label: "Announcements",
        path: "/student/announcements"
      }
    ];
  }, [userRole]);

  const baseClassNames = "w-64 bg-white shadow-md fixed h-full lg:sticky top-0 lg:top-auto transition-transform duration-300 z-20 overflow-y-auto";
  const visibilityClassNames = isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0";
  
  return (
    <aside id="sidebar" className={`${baseClassNames} ${visibilityClassNames}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <span className="text-primary text-xl mr-2 hidden lg:block">
            <i className="ri-dashboard-line"></i>
          </span>
          <h2 className="text-lg font-poppins font-medium text-textColor capitalize">
            {userRole} Portal
          </h2>
        </div>
      </div>
      
      <nav className="p-4">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Main</p>
        <ul>
          {navLinks.map((link, index) => (
            <NavItem 
              key={index}
              icon={link.icon}
              label={link.label}
              path={link.path}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

interface NavItemProps {
  icon: string;
  label: string;
  path: string;
}

function NavItem({ icon, label, path }: NavItemProps) {
  const [isActive] = useRoute(path);
  
  return (
    <li className="mb-1">
      <Link href={path}>
        <div className={`flex items-center p-3 rounded-lg text-textColor hover:bg-background ${isActive ? 'active-nav-item' : ''}`}>
          <i className={`${icon} text-xl mr-3`}></i>
          <span>{label}</span>
        </div>
      </Link>
    </li>
  );
}
