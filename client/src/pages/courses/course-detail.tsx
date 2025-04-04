import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, insertAssignmentSchema } from "@shared/schema";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Extend the insert schema for form handling
const assignmentFormSchema = insertAssignmentSchema.extend({});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

interface CourseDetailProps {
  id: string;
}

export default function CourseDetail({ id }: CourseDetailProps) {
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const courseId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch course details
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Fetch assignments for this course
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: [`/api/assignments?courseId=${courseId}`],
    enabled: !!courseId,
  });

  // Fetch enrollments for this course
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: [`/api/enrollments?courseId=${courseId}`],
    enabled: !!courseId,
  });

  // Setup form for creating assignments
  const assignmentForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      courseId: courseId,
      title: "",
      description: "",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split("T")[0],
      totalPoints: 100,
      status: "draft",
      type: "assignment",
      instructions: "",
    },
  });

  // Create assignment mutation
  const createAssignment = useMutation({
    mutationFn: async (values: AssignmentFormValues) => {
      // Ensure date is in ISO format
      const dueDate = new Date(values.dueDate).toISOString();
      
      const assignmentData = {
        ...values,
        dueDate,
      };
      
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create assignment");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments?courseId=${courseId}`] });
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      setIsAssignmentDialogOpen(false);
      assignmentForm.reset({ ...assignmentForm.getValues(), title: "", description: "", instructions: "" });
      
      // Navigate to the new assignment
      const basePath = user?.role === "admin" ? "/admin" : user?.role === "faculty" ? "/faculty" : "/student";
      navigate(`${basePath}/assignments/${data.id}`);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create assignment",
      });
    },
  });

  // Assignment form submission
  function onSubmitAssignment(values: AssignmentFormValues) {
    createAssignment.mutate(values);
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // Determine appropriate link prefix based on user role
  const getLinkPrefix = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "faculty") return "/faculty";
    return "/student";
  };

  const prefixPath = getLinkPrefix();

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`${prefixPath}/courses`)}
            className="mr-2"
          >
            <i className="ri-arrow-left-line mr-2"></i> Back
          </Button>
          {isLoadingCourse ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <h2 className="text-2xl font-poppins font-semibold">{course?.name}</h2>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === "admin" || user?.role === "faculty") && (
            <>
              <Dialog 
                open={isAssignmentDialogOpen} 
                onOpenChange={setIsAssignmentDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="default">
                    <i className="ri-add-line mr-2"></i> Create Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                      Add a new assignment to this course.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...assignmentForm}>
                    <form onSubmit={assignmentForm.handleSubmit(onSubmitAssignment)} className="space-y-4">
                      <FormField
                        control={assignmentForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assignment Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Midterm Project" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={assignmentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="A brief description of the assignment" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={assignmentForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="assignment">Assignment</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                  <SelectItem value="exam">Exam</SelectItem>
                                  <SelectItem value="project">Project</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
                          name="totalPoints"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Points</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={1} 
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
                          control={assignmentForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Due Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={assignmentForm.control}
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
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="published">Published</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={assignmentForm.control}
                        name="instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Detailed Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Detailed instructions for students" 
                                className="min-h-32" 
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" disabled={createAssignment.isPending}>
                          {createAssignment.isPending ? "Creating..." : "Create Assignment"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button variant="outline">
                <i className="ri-edit-line mr-2"></i> Edit Course
              </Button>
            </>
          )}
          {user?.role === "student" && (
            <Button variant="default">
              <i className="ri-book-mark-line mr-2"></i> Enroll in Course
            </Button>
          )}
        </div>
      </div>

      {isLoadingCourse ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center">
                  <CardTitle>{course?.name}</CardTitle>
                  <span className={`ml-3 ${
                    course?.status === "active" ? "pill-active" : 
                    course?.status === "pending" ? "pill-pending" : 
                    "pill-inactive"
                  }`}>
                    {course?.status?.charAt(0).toUpperCase() + course?.status?.slice(1)}
                  </span>
                </div>
                <CardDescription className="mt-1">
                  {course?.code} • {course?.semester} {course?.year}
                </CardDescription>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-6 text-sm">
                <div>
                  <span className="text-gray-500">Start Date:</span>
                  <p className="font-medium">{formatDate(course?.startDate)}</p>
                </div>
                <div>
                  <span className="text-gray-500">End Date:</span>
                  <p className="font-medium">{formatDate(course?.endDate)}</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Course Description</h3>
                <p className="text-gray-600">
                  {course?.description || "No description provided for this course."}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-primary mb-2">
                    <i className="ri-user-line mr-2"></i>
                    <h4 className="font-medium">Instructor</h4>
                  </div>
                  <p>Faculty ID: {course?.facultyId || "Unassigned"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-secondary mb-2">
                    <i className="ri-group-line mr-2"></i>
                    <h4 className="font-medium">Enrolled Students</h4>
                  </div>
                  <p>{isLoadingEnrollments ? "Loading..." : enrollments?.length || 0} Students</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-accent mb-2">
                    <i className="ri-calendar-todo-line mr-2"></i>
                    <h4 className="font-medium">Assignments</h4>
                  </div>
                  <p>{isLoadingAssignments ? "Loading..." : assignments?.length || 0} Assignments</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="materials">Course Materials</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assignments" className="space-y-4 mt-4">
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Course Assignments</h3>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="assignment">Assignments</SelectItem>
                      <SelectItem value="quiz">Quizzes</SelectItem>
                      <SelectItem value="exam">Exams</SelectItem>
                      <SelectItem value="project">Projects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="p-4">
              {isLoadingAssignments ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : assignments?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No assignments found for this course</p>
                  {(user?.role === "admin" || user?.role === "faculty") && (
                    <Button onClick={() => setIsAssignmentDialogOpen(true)}>
                      <i className="ri-add-line mr-2"></i> Create Assignment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments?.map((assignment) => (
                    <Card key={assignment.id} className="card-hover">
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-full ${
                              assignment.type === "assignment" ? "bg-blue-100 text-primary" :
                              assignment.type === "quiz" ? "bg-green-100 text-secondary" :
                              assignment.type === "exam" ? "bg-red-100 text-destructive" :
                              "bg-amber-100 text-accent"
                            }`}>
                              <i className={`${
                                assignment.type === "assignment" ? "ri-file-text-line" :
                                assignment.type === "quiz" ? "ri-question-line" :
                                assignment.type === "exam" ? "ri-file-paper-line" :
                                "ri-folder-line"
                              } text-xl`}></i>
                            </div>
                            <div>
                              <h4 className="font-medium">
                                <Link href={`${prefixPath}/assignments/${assignment.id}`}>
                                  <a className="hover:text-primary">{assignment.title}</a>
                                </Link>
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)} • Due {formatDate(assignment.dueDate)}
                              </p>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {assignment.description || "No description provided."}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`
                              ${assignment.status === "published" ? "pill-active" :
                              assignment.status === "draft" ? "pill-pending" :
                              "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"}
                            `}>
                              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                            </span>
                            <span className="text-sm font-medium mt-2">{assignment.totalPoints} points</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Enrolled Students</h3>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search students..."
                      className="pl-8 w-64"
                    />
                    <i className="ri-search-line absolute left-2.5 top-2.5 text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              {isLoadingEnrollments ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : enrollments?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No students enrolled in this course yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {enrollments?.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex-1">
                        <p className="font-medium">Student ID: {enrollment.studentId}</p>
                        <div className="flex items-center mt-1">
                          <div className="text-sm text-gray-500 mr-4">
                            <span className="inline-block w-20">Progress:</span> {enrollment.progress}%
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="inline-block w-20">Grade:</span> {enrollment.grade || "Not graded"}
                          </div>
                        </div>
                      </div>
                      <span className={`
                        ${enrollment.status === "active" ? "pill-active" :
                        enrollment.status === "completed" ? "pill-active" :
                        "pill-inactive"}
                      `}>
                        {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="materials" className="space-y-4 mt-4">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <i className="ri-file-list-3-line text-6xl text-gray-300"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">No Course Materials Yet</h3>
            <p className="text-gray-500 mb-4">Course materials will be available here once added by the instructor.</p>
            {(user?.role === "admin" || user?.role === "faculty") && (
              <Button>
                <i className="ri-upload-line mr-2"></i> Upload Materials
              </Button>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="grades" className="space-y-4 mt-4">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <i className="ri-bar-chart-line text-6xl text-gray-300"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">Grade Analytics</h3>
            <p className="text-gray-500 mb-4">Grade analytics will be available here once assignments are graded.</p>
            {(user?.role === "admin" || user?.role === "faculty") && (
              <Button>
                <i className="ri-pie-chart-line mr-2"></i> View Grade Reports
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
