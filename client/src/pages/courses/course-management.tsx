import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the insert schema for form handling
const courseFormSchema = insertCourseSchema.extend({});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CourseManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Determine API endpoint based on user role
  const apiUrl = user?.role === "faculty" ? `/api/courses?facultyId=${user.id}` : "/api/courses";

  // Fetch courses
  const { data: courses, isLoading } = useQuery({
    queryKey: [apiUrl],
  });

  // Fetch faculty users for admin
  const { data: facultyUsers, isLoading: isLoadingFaculty } = useQuery({
    queryKey: ["/api/users"],
    select: (data) => data.filter((user) => user.role === "faculty"),
    enabled: user?.role === "admin",
  });

  // Setup form with default values
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      facultyId: user?.role === "faculty" ? user.id : undefined,
      semester: "Fall",
      year: new Date().getFullYear(),
      status: "active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split("T")[0],
    },
  });

  // Create course mutation
  const createCourse = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      // Ensure dates are in ISO format
      const startDate = new Date(values.startDate).toISOString();
      const endDate = new Date(values.endDate).toISOString();
      
      const courseData = {
        ...values,
        startDate,
        endDate,
      };
      
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create course");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [apiUrl] });
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setIsOpen(false);
      form.reset();
      
      // Navigate to the new course
      if (user?.role === "admin") {
        navigate(`/admin/courses/${data.id}`);
      } else if (user?.role === "faculty") {
        navigate(`/faculty/courses/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create course",
      });
    },
  });

  // Delete course mutation
  const deleteCourse = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete course");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [apiUrl] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete course",
      });
    },
  });

  // Form submission
  function onSubmit(values: CourseFormValues) {
    createCourse.mutate(values);
  }

  // Filter courses based on active tab
  const filteredCourses = courses?.filter((course) => {
    if (activeTab === "all") return true;
    return course.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-poppins font-semibold">
            {user?.role === "faculty" ? "My Courses" : "Course Management"}
          </h2>
          <p className="text-gray-500">
            {user?.role === "faculty" ? "Manage your teaching courses" : "Manage all platform courses"}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <i className="ri-add-line mr-2"></i> Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new course on the platform.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Introduction to Programming" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code</FormLabel>
                        <FormControl>
                          <Input placeholder="CS101" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A brief description of the course" 
                          className="min-h-24" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {user?.role === "admin" && (
                  <FormField
                    control={form.control}
                    name="facultyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instructor</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an instructor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingFaculty ? (
                              <SelectItem value="loading" disabled>Loading faculty...</SelectItem>
                            ) : facultyUsers?.length === 0 ? (
                              <SelectItem value="none" disabled>No faculty available</SelectItem>
                            ) : (
                              facultyUsers?.map((faculty) => (
                                <SelectItem key={faculty.id} value={faculty.id.toString()}>
                                  {`${faculty.firstName} ${faculty.lastName}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Fall">Fall</SelectItem>
                            <SelectItem value="Spring">Spring</SelectItem>
                            <SelectItem value="Summer">Summer</SelectItem>
                            <SelectItem value="Winter">Winter</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={2000} 
                            max={2100} 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createCourse.isPending}>
                    {createCourse.isPending ? "Creating..." : "Create Course"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="all">All Courses</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search courses..."
                    className="pl-8 w-64"
                  />
                  <i className="ri-search-line absolute left-2.5 top-2.5 text-gray-400"></i>
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value="fall2023">Fall 2023</SelectItem>
                    <SelectItem value="spring2023">Spring 2023</SelectItem>
                    <SelectItem value="fall2022">Fall 2022</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <TabsContent value="all" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-64 w-full" />
                ))
              ) : filteredCourses?.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-500 mb-4">No courses found</p>
                  <Button onClick={() => setIsOpen(true)}>
                    <i className="ri-add-line mr-2"></i> Create Course
                  </Button>
                </div>
              ) : (
                filteredCourses?.map((course) => {
                  // Determine icon and color based on course name
                  let icon = "ri-book-line";
                  let bgColor = "bg-primary";
                  
                  if (course.name.toLowerCase().includes("programming") || course.name.toLowerCase().includes("coding")) {
                    icon = "ri-code-line";
                    bgColor = "bg-primary";
                  } else if (course.name.toLowerCase().includes("web")) {
                    icon = "ri-code-box-line";
                    bgColor = "bg-secondary";
                  } else if (course.name.toLowerCase().includes("database")) {
                    icon = "ri-database-2-line";
                    bgColor = "bg-accent";
                  } else if (course.name.toLowerCase().includes("math") || course.name.toLowerCase().includes("calculus")) {
                    icon = "ri-calculator-line";
                    bgColor = "bg-blue-400";
                  } else if (course.name.toLowerCase().includes("science") || course.name.toLowerCase().includes("biology")) {
                    icon = "ri-flask-line";
                    bgColor = "bg-green-400";
                  } else if (course.name.toLowerCase().includes("literature") || course.name.toLowerCase().includes("writing")) {
                    icon = "ri-book-open-line";
                    bgColor = "bg-amber-400";
                  }
                  
                  return (
                    <Card key={course.id} className="overflow-hidden card-hover">
                      <div className={`h-24 ${bgColor} flex items-center justify-center text-white`}>
                        <i className={`${icon} text-4xl`}></i>
                      </div>
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{course.name}</CardTitle>
                            <CardDescription className="text-sm mt-1">
                              {course.code} • {course.semester} {course.year}
                            </CardDescription>
                          </div>
                          <span className={
                            course.status === "active" ? "pill-active" :
                            course.status === "pending" ? "pill-pending" : "pill-inactive"
                          }>
                            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {course.description || "No description provided."}
                        </p>
                        <div className="mt-4 flex items-center text-sm">
                          <div className="flex items-center mr-4">
                            <i className="ri-user-line mr-1 text-gray-500"></i>
                            <span className="text-gray-700">Instructor ID: {course.facultyId || "Unassigned"}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 border-t">
                        <div className="flex justify-between w-full">
                          <Link 
                            href={`/${user?.role === "admin" ? "admin" : "faculty"}/courses/${course.id}`}
                          >
                            <Button variant="link" className="text-primary p-0 h-auto">
                              View Details
                            </Button>
                          </Link>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <i className="ri-pencil-line text-gray-500 hover:text-primary"></i>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${course.name}"?`)) {
                                  deleteCourse.mutate(course.id);
                                }
                              }}
                            >
                              <i className="ri-delete-bin-line text-gray-500 hover:text-destructive"></i>
                            </Button>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Same content as "all" but filtered by status */}
              {/* This content is rendered dynamically based on the filtered courses */}
            </div>
          </TabsContent>
          
          <TabsContent value="pending" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Same content as "all" but filtered by status */}
              {/* This content is rendered dynamically based on the filtered courses */}
            </div>
          </TabsContent>
          
          <TabsContent value="inactive" className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Same content as "all" but filtered by status */}
              {/* This content is rendered dynamically based on the filtered courses */}
            </div>
          </TabsContent>
          
          {!isLoading && filteredCourses && filteredCourses.length > 0 && (
            <div className="p-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {filteredCourses.length} of {courses?.length || 0} courses
              </div>
              <div className="flex space-x-1">
                <Button variant="outline" size="sm" disabled>
                  <i className="ri-arrow-left-s-line"></i>
                </Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm" disabled>
                  <i className="ri-arrow-right-s-line"></i>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
