import { useState } from "react";
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
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
            <span>Login with demo accounts:</span>
          </div>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <div className="px-2 py-1 bg-gray-100 rounded-full">admin / password123</div>
            <div className="px-2 py-1 bg-gray-100 rounded-full">faculty1 / password123</div>
            <div className="px-2 py-1 bg-gray-100 rounded-full">student1 / password123</div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
