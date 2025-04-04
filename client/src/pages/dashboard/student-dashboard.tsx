import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { StatsCard } from "@/components/ui/stats-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { getCourseProgressData, getStudentPerformanceData } from "@/lib/chart-data";

export default function StudentDashboard() {
  const { user } = useAuth();
  
  // Get student analytics
  const { data: studentAnalytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["/api/analytics/student", user?.id],
    queryFn: () => {
      return fetch(`/api/analytics/student/${user?.id}`).then(res => res.json());
    },
    enabled: !!user?.id
  });
  
  // Get student courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ["/api/courses", { studentId: user?.id }],
    queryFn: () => {
      return fetch(`/api/courses?studentId=${user?.id}`).then(res => res.json());
    },
    enabled: !!user?.id
  });
  
  // Get student assignments (pending/upcoming)
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ["/api/submissions", { studentId: user?.id }],
    queryFn: () => {
      return fetch(`/api/submissions?studentId=${user?.id}`).then(res => res.json());
    },
    enabled: !!user?.id
  });
  
  // Chart data
  const courseProgressData = getCourseProgressData();
  const studentPerformanceData = getStudentPerformanceData();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-poppins font-semibold">Student Dashboard</h2>
          <p className="text-gray-500">Welcome back! Here's your current academic progress.</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link href="/student/courses">
            <div className="btn-primary cursor-pointer">
              <i className="ri-search-line mr-2"></i> Browse Courses
            </div>
          </Link>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-book-open-line text-xl"></i>}
            iconBgColor="bg-blue-100 text-primary"
            title="Enrolled Courses"
            value={studentAnalytics?.totalCourses || 0}
          />
        )}
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-file-list-3-line text-xl"></i>}
            iconBgColor="bg-green-100 text-secondary"
            title="Assignments"
            value={studentAnalytics?.totalAssignments || 0}
          />
        )}
        
        {isLoadingAnalytics ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard 
            icon={<i className="ri-time-line text-xl"></i>}
            iconBgColor="bg-amber-100 text-accent"
            title="Pending"
            value={studentAnalytics?.pendingAssignments || 0}
          />
        )}
        
        <StatsCard 
          icon={<i className="ri-medal-line text-xl"></i>}
          iconBgColor="bg-purple-100 text-purple-600"
          title="GPA"
          value="3.8"
        />
      </div>

      {/* Upcoming Assignments */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">Upcoming Assignments</h3>
          <select className="px-4 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>All Courses</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3 border-b">Assignment</th>
                <th className="px-4 py-3 border-b">Course</th>
                <th className="px-4 py-3 border-b">Due Date</th>
                <th className="px-4 py-3 border-b">Status</th>
                <th className="px-4 py-3 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingSubmissions ? (
                <>
                  <tr>
                    <td colSpan={5} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-4 py-4">
                      <Skeleton className="h-10 w-full" />
                    </td>
                  </tr>
                </>
              ) : (
                // Would map through student assignments here
                [1, 2, 3].map((_, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${
                          index === 0 ? "bg-blue-100 text-primary" : 
                          index === 1 ? "bg-amber-100 text-accent" : 
                          "bg-blue-100 text-primary"
                        } flex items-center justify-center mr-3`}>
                          <i className="ri-file-text-line"></i>
                        </div>
                        <span className="font-medium">
                          {index === 0 ? "Project 1: Basic HTML/CSS" : 
                          index === 1 ? "Quiz 3: Normalization" : 
                          "Homework 5: Integration"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {index === 0 ? "Intro to Programming" : 
                      index === 1 ? "Database Systems" : 
                      "Calculus II"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      {index === 0 ? "Oct 15, 2023 (3 days left)" : 
                      index === 1 ? "Oct 12, 2023 (Today)" : 
                      "Oct 20, 2023 (8 days left)"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={index === 1 ? "pill-inactive" : "pill-pending"}>
                        {index === 1 ? "Due Today!" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Link href={`/student/assignments/${index + 1}`}>
                        <div className="px-3 py-1 bg-primary text-white rounded-lg text-xs cursor-pointer">
                          Start Assignment
                        </div>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Courses Cards */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-poppins font-semibold text-lg">My Courses</h3>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-xs bg-primary text-white rounded-full">Current</button>
            <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">Past</button>
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
              <p className="text-gray-500">You are not enrolled in any courses yet.</p>
              <Link href="/student/courses">
                <div className="btn-primary mt-4 inline-block cursor-pointer">
                  <i className="ri-search-line mr-2"></i> Browse Courses
                </div>
              </Link>
            </div>
          ) : (
            courses?.map((course, index) => {
              // Determine background color based on index
              let bgColor = "bg-primary";
              let icon = "ri-code-line";
              
              if (index === 1) {
                bgColor = "bg-accent";
                icon = "ri-database-2-line";
              } else if (index === 2) {
                bgColor = "bg-blue-400";
                icon = "ri-calculator-line";
              }
              
              return (
                <div key={course.id} className="border rounded-lg overflow-hidden card-hover transition-all duration-200">
                  <div className={`h-24 ${bgColor} flex items-center justify-center text-white relative`}>
                    <i className={`${icon} text-4xl`}></i>
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white bg-opacity-25 rounded-lg backdrop-blur-sm">
                      <span className="text-xs text-white font-medium">{course.semester} {course.year}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div>
                      <h4 className="font-poppins font-medium">{course.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">Prof. Faculty ID: {course.facultyId} • {course.code}</p>
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Progress</p>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className={`${bgColor} h-2 rounded-full`} 
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="ml-3 text-sm font-medium">{course.progress || 0}%</span>
                    </div>
                    <div className="mt-4 text-sm flex items-center text-gray-500">
                      <i className="ri-calendar-line mr-1"></i>
                      <span>
                        {index === 0 ? "MWF 10:00-11:30" : 
                        index === 1 ? "MWF 1:00-2:30" : 
                        "TTh 2:00-3:30"}
                      </span>
                    </div>
                    <div className="mt-4 border-t pt-4 flex justify-between">
                      <Link href={`/student/courses/${course.id}`}>
                        <div className="text-sm text-primary font-medium cursor-pointer">View Course</div>
                      </Link>
                      <button className="text-sm text-gray-600 font-medium">Materials</button>
                      <button className="text-sm text-gray-600 font-medium">Grades</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Academic Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-poppins font-semibold text-lg mb-6">Grade Summary</h3>
          
          <div className="w-full h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={studentPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#1E88E5" 
                  activeDot={{ r: 8 }} 
                  name="Score" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                <span className="text-sm text-gray-700">Introduction to Programming</span>
              </div>
              <span className="text-sm font-medium">A- (92%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
                <span className="text-sm text-gray-700">Database Systems</span>
              </div>
              <span className="text-sm font-medium">B+ (88%)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-400 mr-2"></div>
                <span className="text-sm text-gray-700">Calculus II</span>
              </div>
              <span className="text-sm font-medium">A (95%)</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-poppins font-semibold text-lg mb-6">Schedule</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center font-semibold mr-4">
                MON
              </div>
              <div className="flex-1 space-y-2">
                <div className="p-2 rounded-lg bg-blue-50 border-l-4 border-primary">
                  <p className="text-sm font-medium">Introduction to Programming</p>
                  <p className="text-xs text-gray-500">10:00 - 11:30 AM • Room 302</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border-l-4 border-accent">
                  <p className="text-sm font-medium">Database Systems</p>
                  <p className="text-xs text-gray-500">1:00 - 2:30 PM • Room 201</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center font-semibold mr-4">
                TUE
              </div>
              <div className="flex-1 space-y-2">
                <div className="p-2 rounded-lg bg-blue-50 border-l-4 border-blue-400">
                  <p className="text-sm font-medium">Calculus II</p>
                  <p className="text-xs text-gray-500">2:00 - 3:30 PM • Room 105</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center font-semibold mr-4">
                WED
              </div>
              <div className="flex-1 space-y-2">
                <div className="p-2 rounded-lg bg-blue-50 border-l-4 border-primary">
                  <p className="text-sm font-medium">Introduction to Programming</p>
                  <p className="text-xs text-gray-500">10:00 - 11:30 AM • Room 302</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 border-l-4 border-accent">
                  <p className="text-sm font-medium">Database Systems</p>
                  <p className="text-xs text-gray-500">1:00 - 2:30 PM • Room 201</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
