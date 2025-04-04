import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import AdminDashboard from "@/pages/admin/dashboard";
import UserManagement from "@/pages/admin/user-management";
import CourseManagement from "@/pages/admin/course-management";
import Settings from "@/pages/admin/settings";
import FacultyDashboard from "@/pages/faculty/dashboard";
import FacultyCourses from "@/pages/faculty/courses";
import FacultyAssignments from "@/pages/faculty/assignments";
import StudentDashboard from "@/pages/student/dashboard";
import StudentCourses from "@/pages/student/courses";
import StudentAssignments from "@/pages/student/assignments";
import Layout from "@/components/layout/layout";
import { AuthProvider, useAuth } from "@/lib/auth";

// Protected route component
function ProtectedRoute({ component: Component, roles, ...rest }: { component: React.ComponentType<any>, roles?: string[], [x: string]: any }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (roles && !roles.includes(user.role)) {
    navigate("/");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Admin Routes */}
      <Route path="/admin">
        {() => (
          <Layout>
            <ProtectedRoute component={AdminDashboard} roles={["admin"]} />
          </Layout>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <Layout>
            <ProtectedRoute component={UserManagement} roles={["admin"]} />
          </Layout>
        )}
      </Route>
      <Route path="/admin/courses">
        {() => (
          <Layout>
            <ProtectedRoute component={CourseManagement} roles={["admin"]} />
          </Layout>
        )}
      </Route>
      <Route path="/admin/settings">
        {() => (
          <Layout>
            <ProtectedRoute component={Settings} roles={["admin"]} />
          </Layout>
        )}
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty">
        {() => (
          <Layout>
            <ProtectedRoute component={FacultyDashboard} roles={["faculty"]} />
          </Layout>
        )}
      </Route>
      <Route path="/faculty/courses">
        {() => (
          <Layout>
            <ProtectedRoute component={FacultyCourses} roles={["faculty"]} />
          </Layout>
        )}
      </Route>
      <Route path="/faculty/assignments">
        {() => (
          <Layout>
            <ProtectedRoute component={FacultyAssignments} roles={["faculty"]} />
          </Layout>
        )}
      </Route>

      {/* Student Routes */}
      <Route path="/student">
        {() => (
          <Layout>
            <ProtectedRoute component={StudentDashboard} roles={["student"]} />
          </Layout>
        )}
      </Route>
      <Route path="/student/courses">
        {() => (
          <Layout>
            <ProtectedRoute component={StudentCourses} roles={["student"]} />
          </Layout>
        )}
      </Route>
      <Route path="/student/assignments">
        {() => (
          <Layout>
            <ProtectedRoute component={StudentAssignments} roles={["student"]} />
          </Layout>
        )}
      </Route>

      {/* Default route based on user role */}
      <Route path="/">
        {() => {
          const { user, isLoading } = useAuth();
          
          if (isLoading) {
            return <div className="h-screen flex items-center justify-center">Loading...</div>;
          }
          
          if (!user) {
            return <Login />;
          }
          
          // Redirect based on user role
          if (user.role === "admin") {
            return (
              <Layout>
                <AdminDashboard />
              </Layout>
            );
          } else if (user.role === "faculty") {
            return (
              <Layout>
                <FacultyDashboard />
              </Layout>
            );
          } else if (user.role === "student") {
            return (
              <Layout>
                <StudentDashboard />
              </Layout>
            );
          }
          
          return <NotFound />;
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
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
