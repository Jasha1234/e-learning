import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, RegisterData } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { login, register, user } = useAuth();
  const { toast } = useToast();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  // Use useEffect for navigation to avoid hook rule violations
  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "faculty") {
        navigate("/faculty/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }
  }, [user, navigate]);
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
    },
  });
  
  async function onLoginSubmit(values: LoginFormValues) {
    setIsLoginLoading(true);
    
    try {
      const user = await login(values.username, values.password);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName} ${user.lastName}!`,
      });
      
      // Redirect to the appropriate dashboard based on role
      if (user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (user.role === "faculty") {
        navigate("/faculty/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
      });
    } finally {
      setIsLoginLoading(false);
    }
  }
  
  async function onRegisterSubmit(values: RegisterFormValues) {
    setIsRegisterLoading(true);
    
    try {
      const registerData: RegisterData = {
        ...values,
        role: "student" // Default role for new registrations
      };
      
      const user = await register(registerData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.firstName} ${user.lastName}!`,
      });
      
      // Redirect to student dashboard
      navigate("/student/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: "Failed to register. Username may already exist.",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  }
  
  return (
    <div className="min-h-screen flex items-stretch">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <span className="text-primary text-4xl">
                <i className="ri-book-open-line"></i>
              </span>
            </div>
            <CardTitle className="text-2xl font-poppins text-primary">EduLearn Platform</CardTitle>
            <CardDescription>Sign in or create a new account</CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full bg-primary" disabled={isLoginLoading}>
                      {isLoginLoading ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">
                            <i className="ri-loader-4-line"></i>
                          </span>
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full bg-primary" disabled={isRegisterLoading}>
                      {isRegisterLoading ? (
                        <div className="flex items-center">
                          <span className="animate-spin mr-2">
                            <i className="ri-loader-4-line"></i>
                          </span>
                          Creating Account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-center text-sm text-gray-500">
              <span>Quick access:</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  loginForm.setValue("username", "admin");
                  loginForm.setValue("password", "password123");
                }}
                className="text-xs"
              >
                Admin Demo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  loginForm.setValue("username", "faculty1");
                  loginForm.setValue("password", "password123");
                }}
                className="text-xs"
              >
                Faculty Demo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  loginForm.setValue("username", "student1");
                  loginForm.setValue("password", "password123");
                }}
                className="text-xs"
              >
                Student Demo
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right side - Hero */}
      <div className="hidden md:w-1/2 md:flex bg-primary/10 flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Welcome to EduLearn</h1>
          <p className="text-lg mb-6">
            A comprehensive e-learning platform designed to enhance educational experiences
            for students, faculty, and administrators.
          </p>
          <div className="space-y-4">
            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">For Students</h3>
              <p>Access courses, submit assignments, check grades, and connect with instructors.</p>
            </div>
            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">For Faculty</h3>
              <p>Create courses, manage assignments, grade submissions, and engage with students.</p>
            </div>
            <div className="bg-white/90 p-4 rounded-lg shadow-sm">
              <h3 className="font-medium text-lg mb-2">For Administrators</h3>
              <p>Oversee platform operations, manage users, and analyze educational outcomes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}