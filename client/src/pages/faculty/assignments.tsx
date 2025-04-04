import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Form schema for assignment creation/editing
const assignmentFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.number(),
  dueDate: z.date().optional(),
  maxScore: z.number().min(1, "Maximum score must be at least 1"),
});

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

export default function FacultyAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);
  
  // Fetch faculty courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses', { facultyId: user?.id }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/courses?facultyId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments', { courseId: selectedCourseId }],
    queryFn: async ({ queryKey }) => {
      if (!selectedCourseId) return [];
      const response = await fetch(`/api/assignments?courseId=${selectedCourseId}`);
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    },
    enabled: !!selectedCourseId,
  });
  
  // Fetch submissions for a selected assignment
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions', { assignmentId: expandedSubmission }],
    queryFn: async ({ queryKey }) => {
      if (!expandedSubmission) return [];
      const response = await fetch(`/api/submissions?assignmentId=${expandedSubmission}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!expandedSubmission,
  });
  
  // Fetch users for submission display
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignmentData: AssignmentFormValues) => {
      const response = await apiRequest('POST', '/api/assignments', assignmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment created",
        description: "Your assignment has been created successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create assignment",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Update assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<AssignmentFormValues> }) => {
      const response = await apiRequest('PUT', `/api/assignments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment updated",
        description: "Your assignment has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update assignment",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/assignments/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: "Assignment deleted",
        description: "The assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete assignment",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Update submission mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { score: number; feedback: string } }) => {
      const response = await apiRequest('PUT', `/api/submissions/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      toast({
        title: "Submission graded",
        description: "The submission has been graded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to grade submission",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Add assignment form
  const addForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: selectedCourseId || (courses?.[0]?.id || 0),
      maxScore: 100,
    },
  });
  
  // Edit assignment form
  const editForm = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: 0,
      maxScore: 100,
    },
  });
  
  // Set initial course selection if available
  React.useEffect(() => {
    if (courses?.length && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);
  
  // Filter assignments based on search term
  const filteredAssignments = assignments?.filter((assignment: any) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      assignment.title.toLowerCase().includes(searchTermLower) ||
      assignment.description.toLowerCase().includes(searchTermLower)
    );
  }) || [];
  
  // Handle assignment edit
  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    editForm.reset({
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      dueDate: assignment.dueDate ? new Date(assignment.dueDate) : undefined,
      maxScore: assignment.maxScore,
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle add assignment submit
  const onAddSubmit = (data: AssignmentFormValues) => {
    createAssignmentMutation.mutate(data);
  };
  
  // Handle edit assignment submit
  const onEditSubmit = (data: AssignmentFormValues) => {
    if (!editingAssignment) return;
    updateAssignmentMutation.mutate({ id: editingAssignment.id, data });
  };
  
  // Handle delete assignment
  const handleDeleteAssignment = (id: number) => {
    deleteAssignmentMutation.mutate(id);
  };
  
  // Handle grade submission
  const handleGradeSubmission = (id: number, score: number, feedback: string) => {
    updateSubmissionMutation.mutate({ 
      id, 
      data: { score, feedback }
    });
  };
  
  // Find student name by ID
  const getStudentName = (studentId: number) => {
    const student = users?.find((user: any) => user.id === studentId);
    return student ? `${student.firstName} ${student.lastName}` : 'Unknown Student';
  };
  
  // Find course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses?.find((course: any) => course.id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  // Check if assignment is past due
  const isPastDue = (dueDate: string) => {
    if (!dueDate) return false;
    return isAfter(new Date(), parseISO(dueDate));
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Assignments</h1>
          <p className="text-sm text-textColor/70 mt-1">Create and manage assignments for your courses</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <Select 
            value={selectedCourseId?.toString() || ""} 
            onValueChange={(value) => setSelectedCourseId(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              {courses?.map((course: any) => (
                <SelectItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white" disabled={!selectedCourseId}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create a new assignment for {getCourseName(selectedCourseId || 0)}.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter assignment description" 
                            className="min-h-[100px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={selectedCourseId?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses?.map((course: any) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          The deadline for students to submit this assignment.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addForm.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            step={1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createAssignmentMutation.isPending}
                    >
                      {createAssignmentMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Search Bar */}
      {selectedCourseId && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textColor/40" />
            <Input
              placeholder="Search assignments..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}
      
      {/* Assignments List */}
      <div className="space-y-6">
        {isLoadingCourses || !selectedCourseId ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : isLoadingAssignments ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : filteredAssignments.length > 0 ? (
          <>
            <h2 className="text-lg font-medium font-poppins">
              Assignments for {getCourseName(selectedCourseId)}
            </h2>
            {filteredAssignments.map((assignment: any) => (
              <Card key={assignment.id} className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-poppins flex items-center">
                        {assignment.title}
                        {isPastDue(assignment.dueDate) && (
                          <Badge variant="outline" className="ml-2 text-error border-error text-xs">
                            Past Due
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {assignment.dueDate ? (
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Due: {format(new Date(assignment.dueDate), "PPP")}
                          </span>
                        ) : (
                          "No due date"
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center">
                      <Badge className="mr-2 bg-secondary/10 text-secondary hover:bg-secondary/20">
                        Max Score: {assignment.maxScore}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditAssignment(assignment)}
                        className="mr-1"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-textColor/80 mb-4">
                    {assignment.description}
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setExpandedSubmission(expandedSubmission === assignment.id ? null : assignment.id)}
                  >
                    <span>View Submissions</span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandedSubmission === assignment.id ? 'rotate-90' : ''}`} />
                  </Button>
                  
                  {expandedSubmission === assignment.id && (
                    <div className="mt-4 border rounded-lg p-2">
                      <h4 className="font-medium text-sm mb-2">Student Submissions</h4>
                      
                      {isLoadingSubmissions ? (
                        <div className="space-y-2">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ) : submissions?.length > 0 ? (
                        <div className="space-y-3">
                          {submissions.map((submission: any) => (
                            <div key={submission.id} className="border rounded-md p-3">
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-sm">
                                  {getStudentName(submission.studentId)}
                                </h5>
                                <p className="text-xs text-textColor/60">
                                  Submitted: {format(new Date(submission.submissionDate), "PP")}
                                </p>
                              </div>
                              <p className="text-sm mt-2 mb-3">{submission.content}</p>
                              
                              <div className="border-t pt-3 flex flex-col sm:flex-row gap-2">
                                <div className="flex-1">
                                  <label className="text-xs block mb-1">Score (out of {assignment.maxScore})</label>
                                  <Input 
                                    type="number" 
                                    min={0} 
                                    max={assignment.maxScore} 
                                    defaultValue={submission.score || 0}
                                    className="h-8"
                                    id={`score-${submission.id}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs block mb-1">Feedback</label>
                                  <Input 
                                    defaultValue={submission.feedback || ""}
                                    className="h-8"
                                    id={`feedback-${submission.id}`}
                                  />
                                </div>
                                <Button 
                                  size="sm"
                                  onClick={() => {
                                    const scoreEl = document.getElementById(`score-${submission.id}`) as HTMLInputElement;
                                    const feedbackEl = document.getElementById(`feedback-${submission.id}`) as HTMLInputElement;
                                    handleGradeSubmission(
                                      submission.id, 
                                      parseInt(scoreEl.value), 
                                      feedbackEl.value
                                    );
                                  }}
                                >
                                  Save Grade
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-textColor/60 py-2 text-center">
                          No submissions yet for this assignment.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <div className="bg-white shadow-sm rounded-xl p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <FileText className="h-16 w-16 text-primary/20 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignments Found</h3>
              <p className="text-textColor/60 max-w-md mb-6">
                {searchTerm 
                  ? "No assignments match your search. Try a different search term." 
                  : "You haven't created any assignments for this course yet."}
              </p>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Assignment
                </Button>
              </DialogTrigger>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update assignment details for {editingAssignment?.title}.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter assignment title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter assignment description" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The deadline for students to submit this assignment.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        step={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateAssignmentMutation.isPending}
                >
                  {updateAssignmentMutation.isPending ? "Updating..." : "Update Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
