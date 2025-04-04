import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StatsCard } from "@/components/ui/stats-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AreaChart, Area } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getActivityData } from "@/lib/chart-data";

export default function AdminDashboard() {
  const [activityTimeframe, setActivityTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  
  const { data: userAnalytics, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/analytics/users"],
  });
  
  const { data: courseAnalytics, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/analytics/courses"],
  });
  
  const { data: assignmentAnalytics, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["/api/analytics/assignments"],
  });
  
  const { data: users, isLoading: isLoadingRecentUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { data: courses, isLoading: isLoadingRecentCourses } = useQuery({
    queryKey: ["/api/courses"],
  });
  
  // Get chart activity data
  const activityData = getActivityData(activityTimeframe);
  
  // Recent users (limited to 4)
  const recentUsers = users?.slice(0, 4) || [];
  
  // Recent courses (limited to 4)
  const recentCourses = courses?.slice(0, 4) || [];
  
  const getStatusPill = (status: string) => {
    switch (status) {
      case "active":
        return <span className="pill-active">Active</span>;
      case "pending":
        return <span className="pill-pending">Pending</span>;
      case "inactive":
        return <span className="pill-inactive">Inactive</span>;
      default:
        return <span className="pill-active">Active</span>;
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-poppins font-semibold">Admin Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here's what's happening with your platform today.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="btn-secondary">
            <i className="ri-download-line mr-2"></i> Export Data
          </button>
          <Link href="/admin/courses">
            <a className="btn-primary">
              <i className="ri-add-line mr-2"></i> Add New Course
            </a>
          </Link>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingUsers ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-group-line text-xl"></i>}
            iconBgColor="bg-blue-100 text-primary"
            title="Total Users"
            value={userAnalytics?.totalUsers || 0}
            trend={{
              value: "12%",
              isPositive: true,
              label: "Since last month"
            }}
          />
        )}
        
        {isLoadingCourses ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-book-open-line text-xl"></i>}
            iconBgColor="bg-green-100 text-secondary"
            title="Active Courses"
            value={courseAnalytics?.activeCount || 0}
            trend={{
              value: "7%",
              isPositive: true,
              label: "Since last month"
            }}
          />
        )}
        
        {isLoadingAssignments ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-file-list-3-line text-xl"></i>}
            iconBgColor="bg-amber-100 text-accent"
            title="Assignments"
            value={assignmentAnalytics?.totalAssignments || 0}
            trend={{
              value: "24%",
              isPositive: true,
              label: "Since last month"
            }}
          />
        )}
        
        <StatsCard 
          icon={<i className="ri-error-warning-line text-xl"></i>}
          iconBgColor="bg-red-100 text-destructive"
          title="Issues Reported"
          value={5}
          trend={{
            value: "8%",
            isPositive: false,
            label: "Since last month"
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-poppins font-semibold text-lg">Platform Activity</h3>
            <div className="flex space-x-2">
              <button 
                className={`px-3 py-1 text-xs rounded-full ${activityTimeframe === "daily" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setActivityTimeframe("daily")}
              >
                Daily
              </button>
              <button 
                className={`px-3 py-1 text-xs rounded-full ${activityTimeframe === "weekly" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setActivityTimeframe("weekly")}
              >
                Weekly
              </button>
              <button 
                className={`px-3 py-1 text-xs rounded-full ${activityTimeframe === "monthly" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                onClick={() => setActivityTimeframe("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
          
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="activeUsers" 
                  stroke="#1E88E5" 
                  fillOpacity={1} 
                  fill="url(#colorActive)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-poppins font-semibold text-lg">Recent Users</h3>
            <Link href="/admin/users">
              <a className="text-primary text-sm font-medium">View All</a>
            </Link>
          </div>
          
          <div className="space-y-4">
            {isLoadingRecentUsers ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                  <img 
                    src={user.profileImage || "https://via.placeholder.com/100"} 
                    alt={`${user.firstName} ${user.lastName}`} 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-xs text-gray-500">
                      {user.role === "faculty" 
                        ? `Faculty (${user.department || "General"})` 
                        : user.role === "student" 
                          ? `Student (${user.department || "General"})` 
                          : "Administrator"}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs 
                    ${user.role === "admin" 
                      ? "bg-secondary bg-opacity-10 text-secondary" 
                      : "bg-primary bg-opacity-10 text-primary"} 
                    rounded-full`}
                  >
                    {user.role === "admin" ? "Admin" : user.role === "faculty" ? "Active" : "New"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Courses Table */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">Recent Courses</h3>
          <div>
            <Link href="/admin/courses">
              <a className="btn-primary">
                <i className="ri-add-line mr-1"></i> Add Course
              </a>
            </Link>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b">Course Name</th>
                <th className="px-4 py-3 border-b">Code</th>
                <th className="px-4 py-3 border-b">Instructor</th>
                <th className="px-4 py-3 border-b">Students</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRecentCourses ? (
                <>
                  <tr>
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                </>
              ) : (
                recentCourses.map((course) => {
                  // Determine icon based on course name
                  let icon = "ri-book-line";
                  if (course.name.toLowerCase().includes("programming") || course.name.toLowerCase().includes("web")) {
                    icon = "ri-code-line";
                  } else if (course.name.toLowerCase().includes("math") || course.name.toLowerCase().includes("calculus")) {
                    icon = "ri-calculator-line";
                  } else if (course.name.toLowerCase().includes("biology") || course.name.toLowerCase().includes("science")) {
                    icon = "ri-flask-line";
                  } else if (course.name.toLowerCase().includes("database")) {
                    icon = "ri-database-2-line";
                  }

                  return (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary mr-3">
                            <i className={icon}></i>
                          </div>
                          <span className="font-medium">{course.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{course.code}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {course.facultyId ? `ID: ${course.facultyId}` : "Unassigned"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="font-medium">42</span> {/* This would need to be calculated from enrollments */}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusPill(course.status)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link href={`/admin/courses/${course.id}`}>
                            <a className="p-1 text-gray-500 hover:text-primary">
                              <i className="ri-pencil-line"></i>
                            </a>
                          </Link>
                          <button className="p-1 text-gray-500 hover:text-destructive">
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {recentCourses.length} of {courseAnalytics?.totalCourses || 0} courses
          </p>
          <div className="flex space-x-1">
            <Button variant="outline" size="icon" className="w-8 h-8 p-0">
              <i className="ri-arrow-left-s-line"></i>
            </Button>
            <Button variant="default" size="icon" className="w-8 h-8 p-0">
              1
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 p-0">
              2
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 p-0">
              3
            </Button>
            <Button variant="outline" size="icon" className="w-8 h-8 p-0">
              <i className="ri-arrow-right-s-line"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
