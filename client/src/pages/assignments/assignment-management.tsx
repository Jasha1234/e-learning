import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssignmentSchema } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Extend the insert schema for form handling
const assignmentFormSchema = insertAssignmentSchema.extend({});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export default function AssignmentManagement() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Determine API endpoint based on user role
  const apiUrl = user?.role === "faculty" ? `/api/courses?facultyId=${user.id}` : "/api/courses";

  // Fetch user's courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: [apiUrl],
  });

  // Fetch assignments for selected course or all assignments if no course selected
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ["/api/assignments", selectedCourseId], 
    queryFn: async () => {
      if (!selectedCourseId) {
        // If no course is selected and we have courses, get assignments for the first course
        if (courses && courses.length > 0) {
          const response = await fetch(`/api/assignments?courseId=${courses[0].id}`);
          if (!response.ok) throw new Error("Failed to fetch assignments");
          return response.json();
        }
        return [];
      }
      
      const response = await fetch(`/api/assignments?courseId=${selectedCourseId}`);
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
    enabled: !!courses?.length,
  });

  // Setup form
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      courseId: selectedCourseId || undefined,
      title: "",
      description: "",
      dueDate: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().split("T")[0],
      totalPoints: 100,
      status: "draft",
      type: "assignment",
      instructions: "",
    },
  });

  // Update form values when selected course changes
  useState(() => {
    if (selectedCourseId) {
      form.setValue("courseId", selectedCourseId);
    } else if (courses && courses.length > 0) {
      form.setValue("courseId", courses[0].id);
    }
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
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", selectedCourseId] });
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      setIsOpen(false);
      form.reset();
      
      // Navigate to the new assignment
      const basePath = user?.role === "admin" ? "/admin" : "/faculty";
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

  // Delete assignment mutation
  const deleteAssignment = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/assignments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete assignment");
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments", selectedCourseId] });
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete assignment",
      });
    },
  });

  // Form submission
  function onSubmit(values: AssignmentFormValues) {
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

  // Get course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses?.find(c => c.id === courseId);
    return course ? course.name : `Course ${courseId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-poppins font-semibold">Assignment Management</h2>
          <p className="text-gray-500">Create and manage assignments for your courses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="default">
              <i className="ri-add-line mr-2"></i> Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Add a new assignment to your course.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCourses ? (
                            <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                          ) : courses?.length === 0 ? (
                            <SelectItem value="none" disabled>No courses available</SelectItem>
                          ) : (
                            courses?.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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
                  control={form.control}
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
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Course Assignments</h3>
            <div className="flex items-center space-x-2">
              <Select 
                defaultValue={selectedCourseId?.toString() || (courses && courses.length > 0 ? courses[0].id.toString() : "")}
                onValueChange={(value) => setSelectedCourseId(parseInt(value))}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCourses ? (
                    <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                  ) : courses?.length === 0 ? (
                    <SelectItem value="none" disabled>No courses available</SelectItem>
                  ) : (
                    courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Assignment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAssignments ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={6} className="h-16">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : assignments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <p className="text-gray-500 mb-4">No assignments found for this course</p>
                    <Button onClick={() => setIsOpen(true)}>
                      <i className="ri-add-line mr-2"></i> Create Assignment
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                assignments?.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[300px]">
                          {assignment.description || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.type === "assignment" ? "bg-blue-100 text-primary" :
                        assignment.type === "quiz" ? "bg-green-100 text-secondary" :
                        assignment.type === "exam" ? "bg-red-100 text-destructive" :
                        "bg-amber-100 text-accent"
                      }`}>
                        {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(assignment.dueDate)}</TableCell>
                    <TableCell>{assignment.totalPoints}</TableCell>
                    <TableCell>
                      <span className={`
                        ${assignment.status === "published" ? "pill-active" :
                        assignment.status === "draft" ? "pill-pending" :
                        "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"}
                      `}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/${user?.role === "admin" ? "admin" : "faculty"}/assignments/${assignment.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <i className="ri-eye-line text-gray-500 hover:text-primary"></i>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <i className="ri-pencil-line text-gray-500 hover:text-primary"></i>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
                              deleteAssignment.mutate(assignment.id);
                            }
                          }}
                        >
                          <i className="ri-delete-bin-line text-gray-500 hover:text-destructive"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoadingAssignments && assignments && assignments.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {assignments.length} assignments
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignment Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList>
                <TabsTrigger value="pending">Pending Grading</TabsTrigger>
                <TabsTrigger value="graded">Graded</TabsTrigger>
                <TabsTrigger value="late">Late Submissions</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="mt-4">
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Select an assignment to view pending submissions
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="graded" className="mt-4">
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Select an assignment to view graded submissions
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="late" className="mt-4">
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">
                    Select an assignment to view late submissions
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCourses || isLoadingAssignments ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border-l-4 border-primary rounded-r-lg">
                  <p className="text-sm text-gray-500">Total Assignments</p>
                  <p className="text-2xl font-semibold">{assignments?.length || 0}</p>
                </div>
                <div className="p-4 bg-green-50 border-l-4 border-secondary rounded-r-lg">
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="text-2xl font-semibold">
                    {assignments?.filter(a => a.status === "published").length || 0}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 border-l-4 border-accent rounded-r-lg">
                  <p className="text-sm text-gray-500">Due This Week</p>
                  <p className="text-2xl font-semibold">
                    {assignments?.filter(a => {
                      const dueDate = new Date(a.dueDate);
                      const today = new Date();
                      const nextWeek = new Date();
                      nextWeek.setDate(today.getDate() + 7);
                      return dueDate >= today && dueDate <= nextWeek;
                    }).length || 0}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
