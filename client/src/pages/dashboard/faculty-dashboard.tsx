import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { getAssignmentDistributionData, getGradeDistributionData } from "@/lib/chart-data";

const COLORS = ["#1E88E5", "#43A047", "#FFA000", "#e53935"];

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState("");
  
  // Get faculty analytics
  const { data: facultyAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/analytics/faculty", user?.id],
    queryFn: () => {
      return fetch(`/api/analytics/faculty/${user?.id}`).then(res => res.json());
    },
    enabled: !!user?.id
  });
  
  // Get faculty courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses", user?.id],
    queryFn: () => {
      return fetch(`/api/courses?facultyId=${user?.id}`).then(res => res.json());
    },
    enabled: !!user?.id
  });
  
  // Get assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["/api/analytics/assignments"],
    queryFn: () => {
      return fetch("/api/analytics/assignments").then(res => res.json());
    }
  });
  
  // Chart data
  const assignmentDistributionData = getAssignmentDistributionData();
  const gradeDistributionData = getGradeDistributionData();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-poppins font-semibold">Faculty Dashboard</h2>
          <p className="text-gray-500">Manage your courses and assignments.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link href="/faculty/courses">
            <a className="btn-primary">
              <i className="ri-add-line mr-2"></i> Create New Course
            </a>
          </Link>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-book-open-line text-xl"></i>}
            iconBgColor="bg-blue-100 text-primary"
            title="My Courses"
            value={facultyAnalytics?.totalCourses || 0}
          />
        )}
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-user-line text-xl"></i>}
            iconBgColor="bg-green-100 text-secondary"
            title="Total Students"
            value={facultyAnalytics?.totalStudents || 0}
          />
        )}
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-calendar-todo-line text-xl"></i>}
            iconBgColor="bg-amber-100 text-accent"
            title="Assignments"
            value={facultyAnalytics?.totalAssignments || 0}
          />
        )}
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-file-list-3-line text-xl"></i>}
            iconBgColor="bg-red-100 text-destructive"
            title="Pending Grading"
            value={facultyAnalytics?.pendingSubmissions || 0}
          />
        )}
      </div>

      {/* My Courses */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">My Courses</h3>
          <div className="flex items-center">
            <div className="relative mr-2">
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="px-4 py-2 rounded-lg border text-sm w-48 md:w-64 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-2.5 text-gray-400">
                <i className="ri-search-line"></i>
              </span>
            </div>
            <select className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option>All Semesters</option>
              <option>Fall 2023</option>
              <option>Spring 2023</option>
              <option>Fall 2022</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingCourses ? (
            <>
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </>
          ) : courses?.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No courses found. Create your first course!</p>
              <Link href="/faculty/courses">
                <a className="btn-primary mt-4 inline-block">
                  <i className="ri-add-line mr-2"></i> Create New Course
                </a>
              </Link>
            </div>
          ) : (
            courses?.map((course) => {
              // Determine background color based on course name
              let bgColor = "bg-primary";
              if (course.name.toLowerCase().includes("web")) {
                bgColor = "bg-secondary";
              } else if (course.name.toLowerCase().includes("database")) {
                bgColor = "bg-accent";
              }
            
              return (
                <div key={course.id} className="border rounded-lg overflow-hidden card-hover transition-all duration-200">
                  <div className={`h-24 ${bgColor} flex items-center justify-center text-white`}>
                    <i className={course.name.toLowerCase().includes("programming") ? "ri-code-line text-4xl" : 
                                 course.name.toLowerCase().includes("web") ? "ri-code-box-line text-4xl" : 
                                 course.name.toLowerCase().includes("database") ? "ri-database-2-line text-4xl" : 
                                 "ri-book-open-line text-4xl"}></i>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-poppins font-medium">{course.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">{course.code} • {course.semester} {course.year}</p>
                      </div>
                      <span className={course.status === "active" ? "pill-active" : 
                                     course.status === "pending" ? "pill-pending" : 
                                     "pill-inactive"}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <div className="flex items-center mr-4">
                        <i className="ri-user-line mr-1 text-gray-500"></i>
                        <span className="text-gray-700">42 Students</span>
                      </div>
                      <div className="flex items-center">
                        <i className="ri-calendar-line mr-1 text-gray-500"></i>
                        <span className="text-gray-700">MWF 10:00-11:30</span>
                      </div>
                    </div>
                    <div className="mt-4 border-t pt-4 flex justify-between">
                      <Link href={`/faculty/courses/${course.id}`}>
                        <a className="text-sm text-primary font-medium">Course Details</a>
                      </Link>
                      <Link href={`/faculty/assignments?courseId=${course.id}`}>
                        <a className="text-sm text-gray-600 font-medium">Assignments</a>
                      </Link>
                      <Link href={`/faculty/grading?courseId=${course.id}`}>
                        <a className="text-sm text-gray-600 font-medium">Grades</a>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Recent Assignments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">Recent Assignments</h3>
          <Link href="/faculty/assignments">
            <a className="btn-primary">
              <i className="ri-add-line mr-1"></i> Create Assignment
            </a>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b">Assignment Name</th>
                <th className="px-4 py-3 border-b">Course</th>
                <th className="px-4 py-3 border-b">Due Date</th>
                <th className="px-4 py-3 border-b">Submissions</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingAssignments ? (
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
                // Would map through actual assignments here
                [1, 2, 3].map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary mr-3">
                          <i className="ri-file-text-line"></i>
                        </div>
                        <span className="font-medium">
                          {index === 0 ? "Project 1: Basic HTML/CSS" : 
                          index === 1 ? "Midterm Project: API Integration" : 
                          "SQL Design Exercise"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {index === 0 ? "Intro to Programming (CS101)" : 
                      index === 1 ? "Advanced Web Development (CS332)" : 
                      "Database Systems (CS310)"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {index === 0 ? "Oct 15, 2023" : 
                      index === 1 ? "Oct 22, 2023" : 
                      "Oct 5, 2023"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium">
                        {index === 0 ? "18/42" : 
                        index === 1 ? "9/28" : 
                        "36/36"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={index === 2 ? "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full" : "pill-active"}>
                        {index === 2 ? "Closed" : "Open"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <Link href={`/faculty/assignments/${index + 1}`}>
                          <a className="p-1 text-gray-500 hover:text-primary">
                            <i className="ri-eye-line"></i>
                          </a>
                        </Link>
                        <button className="p-1 text-gray-500 hover:text-primary">
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button className="p-1 text-gray-500 hover:text-destructive">
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Grade Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">Grade Distribution</h3>
          <select 
            className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id.toString()}>{course.name}</option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grade Distribution Chart */}
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-col">
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2">Course Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Class Average</p>
                  <p className="text-xl font-semibold">84%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Median Grade</p>
                  <p className="text-xl font-semibold">B+</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Highest Grade</p>
                  <p className="text-xl font-semibold">98%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Lowest Grade</p>
                  <p className="text-xl font-semibold">62%</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold mb-2">Upcoming Deadlines</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Project 1 Grading</p>
                    <p className="text-xs text-gray-500">Intro to Programming</p>
                  </div>
                  <span className="text-sm text-accent font-medium">Oct 18, 2023</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Midterm Exam</p>
                    <p className="text-xs text-gray-500">Database Systems</p>
                  </div>
                  <span className="text-sm text-accent font-medium">Oct 25, 2023</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
