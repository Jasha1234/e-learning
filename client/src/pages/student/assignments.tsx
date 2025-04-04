import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isPast, isAfter } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Send,
  BookOpen,
  ChevronRight,
  Trophy,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Form schema for submission
const submissionFormSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState<any | null>(null);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  
  // Fetch student enrollments
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments', { studentId: user?.id }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/enrollments?studentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch enrolled courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });
  
  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments', { courseId: selectedCourseId }],
    queryFn: async ({ queryKey }) => {
      if (!selectedCourseId) {
        // Get assignments for all enrolled courses
        const enrolledCourseIds = enrollments?.map((e: any) => e.courseId) || [];
        if (enrolledCourseIds.length === 0) return [];
        
        const assignmentPromises = enrolledCourseIds.map((courseId: number) => 
          fetch(`/api/assignments?courseId=${courseId}`).then(res => res.json())
        );
        
        const results = await Promise.all(assignmentPromises);
        return results.flat();
      } else {
        // Get assignments for selected course
        const response = await fetch(`/api/assignments?courseId=${selectedCourseId}`);
        if (!response.ok) throw new Error('Failed to fetch assignments');
        return response.json();
      }
    },
    enabled: isLoadingEnrollments === false,
  });
  
  // Fetch student submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions', { studentId: user?.id }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/submissions?studentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Create submission mutation
  const createSubmissionMutation = useMutation({
    mutationFn: async (data: { assignmentId: number; content: string }) => {
      const submissionData = {
        assignmentId: data.assignmentId,
        studentId: user?.id,
        content: data.content,
      };
      const response = await apiRequest('POST', '/api/submissions', submissionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/submissions'] });
      toast({
        title: "Assignment submitted",
        description: "Your assignment has been submitted successfully.",
      });
      setIsSubmitDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit assignment",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Submission form
  const submissionForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Filter assignments based on search term and selected course
  const filteredAssignments = assignments?.filter((assignment: any) => {
    const matchesSearch = searchTerm === "" || 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourseId === null || assignment.courseId === selectedCourseId;
    
    return matchesSearch && matchesCourse;
  }) || [];
  
  // Sort assignments: upcoming (sorted by due date), submitted, overdue
  const submittedAssignmentIds = submissions?.map((sub: any) => sub.assignmentId) || [];
  
  const upcomingAssignments = filteredAssignments
    .filter((assignment: any) => 
      !submittedAssignmentIds.includes(assignment.id) && 
      (!assignment.dueDate || !isPast(new Date(assignment.dueDate)))
    )
    .sort((a: any, b: any) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  
  const overdueAssignments = filteredAssignments
    .filter((assignment: any) => 
      !submittedAssignmentIds.includes(assignment.id) && 
      assignment.dueDate && isPast(new Date(assignment.dueDate))
    )
    .sort((a: any, b: any) => 
      new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    );
  
  const submittedAssignments = filteredAssignments
    .filter((assignment: any) => submittedAssignmentIds.includes(assignment.id))
    .sort((a: any, b: any) => {
      const subA = getSubmission(a.id);
      const subB = getSubmission(b.id);
      return new Date(subB?.submissionDate || 0).getTime() - 
             new Date(subA?.submissionDate || 0).getTime();
    });
  
  // Find course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses?.find((course: any) => course.id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  // Get submission for assignment
  const getSubmission = (assignmentId: number) => {
    return submissions?.find((sub: any) => sub.assignmentId === assignmentId);
  };
  
  // Handle submit assignment
  const handleSubmitAssignment = (assignment: any) => {
    setSubmittingAssignment(assignment);
    submissionForm.reset({ content: "" });
    setIsSubmitDialogOpen(true);
  };
  
  // On submit form
  const onSubmitForm = (data: SubmissionFormValues) => {
    if (!submittingAssignment) return;
    
    createSubmissionMutation.mutate({
      assignmentId: submittingAssignment.id,
      content: data.content,
    });
  };
  
  // Determine if assignment is near due (within 2 days)
  const isNearDue = (dueDate: string) => {
    if (!dueDate) return false;
    const due = parseISO(dueDate);
    const now = new Date();
    const twoDaysLater = new Date(now);
    twoDaysLater.setDate(now.getDate() + 2);
    
    return isPast(due) === false && isAfter(twoDaysLater, due);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">My Assignments</h1>
          <p className="text-sm text-textColor/70 mt-1">View and submit your course assignments</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textColor/40" />
            <Input
              placeholder="Search assignments..."
              className="pl-9 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={selectedCourseId?.toString() || ""} 
            onValueChange={(value) => setSelectedCourseId(value === "" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {enrollments?.map((enrollment: any) => {
                const courseName = getCourseName(enrollment.courseId);
                return (
                  <SelectItem 
                    key={enrollment.courseId} 
                    value={enrollment.courseId.toString()}
                  >
                    {courseName}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Assignments Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="relative">
            Upcoming
            {upcomingAssignments.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 absolute -top-2 -right-2">
                {upcomingAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="submitted" className="relative">
            Submitted
            {submittedAssignments.length > 0 && (
              <Badge className="ml-2 bg-secondary/10 text-secondary hover:bg-secondary/20 absolute -top-2 -right-2">
                {submittedAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overdue" className="relative">
            Overdue
            {overdueAssignments.length > 0 && (
              <Badge className="ml-2 bg-error/10 text-error hover:bg-error/20 absolute -top-2 -right-2">
                {overdueAssignments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Upcoming Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : upcomingAssignments.length > 0 ? (
            <>
              {upcomingAssignments.map((assignment: any) => (
                <Card key={assignment.id} className={cn(
                  "shadow-sm", 
                  isNearDue(assignment.dueDate) && "border-error/30"
                )}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-poppins flex items-center">
                          {assignment.title}
                          {isNearDue(assignment.dueDate) && (
                            <Badge variant="outline" className="ml-2 text-error border-error text-xs">
                              Due Soon
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {getCourseName(assignment.courseId)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-secondary/10 text-secondary hover:bg-secondary/20">
                          Max Score: {assignment.maxScore}
                        </Badge>
                        {assignment.dueDate && (
                          <div className="flex items-center text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>Due: {format(new Date(assignment.dueDate), "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-textColor/80 mb-4">
                      {assignment.description}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full md:w-auto"
                      onClick={() => handleSubmitAssignment(assignment)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Assignment
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle className="h-16 w-16 text-secondary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Upcoming Assignments</h3>
                <p className="text-textColor/60 max-w-md">
                  {searchTerm 
                    ? "No upcoming assignments match your search. Try a different search term." 
                    : "You're all caught up! There are no pending assignments at the moment."}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Submitted Tab */}
        <TabsContent value="submitted" className="space-y-4">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : submittedAssignments.length > 0 ? (
            <>
              {submittedAssignments.map((assignment: any) => {
                const submission = getSubmission(assignment.id);
                
                return (
                  <Card key={assignment.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg font-poppins flex items-center">
                            {assignment.title}
                            <Badge className="ml-2 bg-secondary/10 text-secondary hover:bg-secondary/20 text-xs">
                              Submitted
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {getCourseName(assignment.courseId)}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission?.score !== undefined && submission?.score !== null && (
                            <Badge className="bg-accent/10 text-accent hover:bg-accent/20 flex items-center">
                              <Trophy className="h-3 w-3 mr-1" />
                              Score: {submission.score}/{assignment.maxScore}
                            </Badge>
                          )}
                          <div className="flex items-center text-xs font-medium">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>Submitted: {format(new Date(submission?.submissionDate || Date.now()), "PPP")}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Your Submission:</h4>
                          <p className="text-sm text-textColor/80 bg-neutral/10 p-3 rounded-md">
                            {submission?.content}
                          </p>
                        </div>
                        
                        {submission?.feedback && (
                          <div>
                            <h4 className="text-sm font-medium mb-1">Instructor Feedback:</h4>
                            <p className="text-sm text-textColor/80 bg-secondary/5 p-3 rounded-md">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Submitted Assignments</h3>
                <p className="text-textColor/60 max-w-md">
                  {searchTerm 
                    ? "No submitted assignments match your search. Try a different search term." 
                    : "You haven't submitted any assignments yet."}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Overdue Tab */}
        <TabsContent value="overdue" className="space-y-4">
          {isLoadingAssignments || isLoadingSubmissions ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : overdueAssignments.length > 0 ? (
            <>
              {overdueAssignments.map((assignment: any) => (
                <Card key={assignment.id} className="shadow-sm border-error/40">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg font-poppins flex items-center">
                          {assignment.title}
                          <Badge variant="outline" className="ml-2 text-error border-error text-xs">
                            Overdue
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {getCourseName(assignment.courseId)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center">
                        <Badge className="mr-2 bg-secondary/10 text-secondary hover:bg-secondary/20">
                          Max Score: {assignment.maxScore}
                        </Badge>
                        {assignment.dueDate && (
                          <div className="flex items-center text-xs font-medium text-error">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                            <span>Due: {format(new Date(assignment.dueDate), "PPP")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-textColor/80 mb-4">
                      {assignment.description}
                    </p>
                    <div className="bg-error/10 border border-error/20 rounded-md p-3 text-sm mb-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-error mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-error">This assignment is past due</p>
                          <p className="text-textColor/70">Contact your instructor to check if late submissions are accepted.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      className="w-full md:w-auto"
                      variant="outline"
                      onClick={() => handleSubmitAssignment(assignment)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Submit Late
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle className="h-16 w-16 text-secondary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Overdue Assignments</h3>
                <p className="text-textColor/60 max-w-md">
                  {searchTerm 
                    ? "No overdue assignments match your search. Try a different search term." 
                    : "Great job! You don't have any overdue assignments."}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              You are submitting: <span className="font-medium">{submittingAssignment?.title}</span>
              {submittingAssignment?.dueDate && isPast(new Date(submittingAssignment.dueDate)) && (
                <p className="text-error mt-1 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  This assignment is past due ({format(new Date(submittingAssignment.dueDate), "PPP")})
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...submissionForm}>
            <form onSubmit={submissionForm.handleSubmit(onSubmitForm)} className="space-y-4">
              <FormField
                control={submissionForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Submission</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter your assignment solution..."
                        className="min-h-[200px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-neutral/10 p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Assignment Details
                </h4>
                <p className="text-sm text-textColor/80 mb-2">
                  {submittingAssignment?.description}
                </p>
                <div className="text-xs text-textColor/60">
                  <p>Course: {submittingAssignment ? getCourseName(submittingAssignment.courseId) : ""}</p>
                  <p>Max Score: {submittingAssignment?.maxScore}</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createSubmissionMutation.isPending}
                >
                  {createSubmissionMutation.isPending ? "Submitting..." : "Submit Assignment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
