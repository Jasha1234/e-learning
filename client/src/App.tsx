import { useState, useEffect } from "react";
import { Switch, Route, useLocation, useRoute } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import AppShell from "@/components/layouts/app-shell";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/dashboard/admin-dashboard";
import FacultyDashboard from "@/pages/dashboard/faculty-dashboard";
import StudentDashboard from "@/pages/dashboard/student-dashboard";
import UserManagement from "@/pages/users/user-management";
import CourseManagement from "@/pages/courses/course-management";
import CourseDetail from "@/pages/courses/course-detail";
import AssignmentManagement from "@/pages/assignments/assignment-management";
import AssignmentDetail from "@/pages/assignments/assignment-detail";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

function PrivateRoute({ 
  component: Component, 
  roles = ["admin", "faculty", "student"],
  ...rest 
}: { 
  component: React.ComponentType<any>, 
  roles?: string[],
  [key: string]: any 
}) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (!loading && user && !roles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "faculty") {
        navigate("/faculty/dashboard");
      } else if (user.role === "student") {
        navigate("/student/dashboard");
      }
    }
  }, [user, loading, navigate, roles]);
  
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-lg font-medium">Loading...</div>
      </div>
    );
  }
  
  if (!user || !roles.includes(user.role)) {
    return null;
  }
  
  return <Component {...rest} />;
}

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <PrivateRoute component={AdminDashboard} roles={["admin"]} />
      </Route>
      
      <Route path="/admin/users">
        <PrivateRoute component={UserManagement} roles={["admin"]} />
      </Route>
      
      <Route path="/admin/courses">
        <PrivateRoute component={CourseManagement} roles={["admin"]} />
      </Route>
      
      <Route path="/admin/courses/:id">
        {(params) => (
          <PrivateRoute component={CourseDetail} roles={["admin"]} id={params.id} />
        )}
      </Route>
      
      {/* Faculty Routes */}
      <Route path="/faculty/dashboard">
        <PrivateRoute component={FacultyDashboard} roles={["faculty"]} />
      </Route>
      
      <Route path="/faculty/courses">
        <PrivateRoute component={CourseManagement} roles={["faculty"]} />
      </Route>
      
      <Route path="/faculty/courses/:id">
        {(params) => (
          <PrivateRoute component={CourseDetail} roles={["faculty"]} id={params.id} />
        )}
      </Route>
      
      <Route path="/faculty/assignments">
        <PrivateRoute component={AssignmentManagement} roles={["faculty"]} />
      </Route>
      
      <Route path="/faculty/assignments/:id">
        {(params) => (
          <PrivateRoute component={AssignmentDetail} roles={["faculty"]} id={params.id} />
        )}
      </Route>
      
      {/* Student Routes */}
      <Route path="/student/dashboard">
        <PrivateRoute component={StudentDashboard} roles={["student"]} />
      </Route>
      
      <Route path="/student/courses">
        <PrivateRoute component={CourseManagement} roles={["student"]} />
      </Route>
      
      <Route path="/student/courses/:id">
        {(params) => (
          <PrivateRoute component={CourseDetail} roles={["student"]} id={params.id} />
        )}
      </Route>
      
      <Route path="/student/assignments">
        <PrivateRoute component={AssignmentManagement} roles={["student"]} />
      </Route>
      
      <Route path="/student/assignments/:id">
        {(params) => (
          <PrivateRoute component={AssignmentDetail} roles={["student"]} id={params.id} />
        )}
      </Route>
      
      <Route path="/student/grades">
        <PrivateRoute component={() => <h1 className="p-6 text-2xl">Student Grades</h1>} roles={["student"]} />
      </Route>
      
      <Route path="/student/schedule">
        <PrivateRoute component={() => <h1 className="p-6 text-2xl">Student Schedule</h1>} roles={["student"]} />
      </Route>
      
      <Route path="/student/announcements">
        <PrivateRoute component={() => <h1 className="p-6 text-2xl">Student Announcements</h1>} roles={["student"]} />
      </Route>
      
      {/* Default route redirect */}
      <Route path="/">
        {() => {
          const [, navigate] = useLocation();
          
          useEffect(() => {
            if (user) {
              if (user.role === "admin") {
                navigate("/admin/dashboard");
              } else if (user.role === "faculty") {
                navigate("/faculty/dashboard");
              } else if (user.role === "student") {
                navigate("/student/dashboard");
              }
            } else {
              navigate("/login");
            }
          }, [user, navigate]);
          
          return null;
        }}
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell>
          <Router />
        </AppShell>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
