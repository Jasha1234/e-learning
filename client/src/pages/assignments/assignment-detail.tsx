import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubmissionSchema } from "@shared/schema";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

// Extend the insert schema for form handling
const submissionFormSchema = z.object({
  content: z.string().min(1, "Submission content is required"),
  fileUrl: z.string().optional(),
});

type SubmissionFormValues = z.infer<typeof submissionFormSchema>;

// Extend the schema for grading
const gradingFormSchema = z.object({
  grade: z.number().min(0, "Grade cannot be negative").max(100, "Grade cannot exceed 100"),
  feedback: z.string().optional(),
  status: z.string(),
});

type GradingFormValues = z.infer<typeof gradingFormSchema>;

interface AssignmentDetailProps {
  id: string;
}

export default function AssignmentDetail({ id }: AssignmentDetailProps) {
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false);
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const assignmentId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Fetch assignment details
  const { data: assignment, isLoading: isLoadingAssignment } = useQuery({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  // Fetch course details for this assignment
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: [`/api/courses/${assignment?.courseId}`],
    enabled: !!assignment?.courseId,
  });

  // Fetch submissions for this assignment (for faculty/admin)
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: [`/api/submissions?assignmentId=${assignmentId}`],
    enabled: !!assignmentId && (user?.role === "faculty" || user?.role === "admin"),
  });

  // Fetch the student's own submission (for students)
  const { data: studentSubmission, isLoading: isLoadingStudentSubmission } = useQuery({
    queryKey: [`/api/submissions?assignmentId=${assignmentId}&studentId=${user?.id}`],
    enabled: !!assignmentId && !!user?.id && user?.role === "student",
  });

  // Setup submission form
  const submissionForm = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      content: "",
      fileUrl: "",
    },
  });

  // Setup grading form
  const gradingForm = useForm<GradingFormValues>({
    resolver: zodResolver(gradingFormSchema),
    defaultValues: {
      grade: 0,
      feedback: "",
      status: "graded",
    },
  });

  // When selecting a submission to grade, populate the form
  useEffect(() => {
    if (selectedSubmissionId && submissions) {
      const submission = submissions.find(s => s.id === selectedSubmissionId);
      if (submission) {
        gradingForm.setValue("grade", submission.grade || 0);
        gradingForm.setValue("feedback", submission.feedback || "");
        gradingForm.setValue("status", submission.status || "graded");
      }
    }
  }, [selectedSubmissionId, submissions, gradingForm]);

  // Create submission mutation
  const createSubmission = useMutation({
    mutationFn: async (values: SubmissionFormValues) => {
      const submissionData = {
        assignmentId,
        studentId: user?.id,
        ...values,
      };
      
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit assignment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions?assignmentId=${assignmentId}&studentId=${user?.id}`] });
      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
      setIsSubmissionDialogOpen(false);
      submissionForm.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit assignment",
      });
    },
  });

  // Update submission (grading) mutation
  const updateSubmission = useMutation({
    mutationFn: async (values: GradingFormValues) => {
      if (!selectedSubmissionId) {
        throw new Error("No submission selected");
      }
      
      const response = await fetch(`/api/submissions/${selectedSubmissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to grade submission");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/submissions?assignmentId=${assignmentId}`] });
      toast({
        title: "Success",
        description: "Submission graded successfully",
      });
      setIsGradingDialogOpen(false);
      gradingForm.reset();
      setSelectedSubmissionId(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to grade submission",
      });
    },
  });

  // Submission form submission
  function onSubmitSubmission(values: SubmissionFormValues) {
    createSubmission.mutate(values);
  }

  // Grading form submission
  function onSubmitGrading(values: GradingFormValues) {
    updateSubmission.mutate(values);
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

  // Calculate days remaining
  const getDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Overdue";
    } else if (diffDays === 0) {
      return "Due today";
    } else if (diffDays === 1) {
      return "Due tomorrow";
    } else {
      return `${diffDays} days remaining`;
    }
  };

  // Get user's role-based prefix path
  const getLinkPrefix = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "faculty") return "/faculty";
    return "/student";
  };

  const prefixPath = getLinkPrefix();

  // Check if the assignment is still open for submission
  const isAssignmentOpen = () => {
    if (!assignment) return false;
    return assignment.status === "published";
  };

  // Check if the student has already submitted
  const hasSubmitted = () => {
    if (!studentSubmission) return false;
    return studentSubmission.length > 0;
  };

  // Get submission status for student
  const getSubmissionStatus = () => {
    if (!studentSubmission || studentSubmission.length === 0) {
      return "Not submitted";
    }
    
    const submission = studentSubmission[0];
    
    if (submission.grade !== null && submission.grade !== undefined) {
      return `Graded: ${submission.grade}/${assignment?.totalPoints}`;
    }
    
    return submission.status.charAt(0).toUpperCase() + submission.status.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`${prefixPath}/${user?.role === "student" ? "courses" : "assignments"}`)}
            className="mr-2"
          >
            <i className="ri-arrow-left-line mr-2"></i> Back
          </Button>
          {isLoadingAssignment ? (
            <Skeleton className="h-9 w-48" />
          ) : (
            <h2 className="text-2xl font-poppins font-semibold">{assignment?.title}</h2>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {user?.role === "student" && isAssignmentOpen() && (
            <Dialog 
              open={isSubmissionDialogOpen} 
              onOpenChange={setIsSubmissionDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="default" disabled={!isAssignmentOpen()}>
                  <i className="ri-upload-2-line mr-2"></i> 
                  {hasSubmitted() ? "Update Submission" : "Submit Assignment"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Submit Assignment</DialogTitle>
                  <DialogDescription>
                    Submit your work for {assignment?.title}
                  </DialogDescription>
                </DialogHeader>
                <Form {...submissionForm}>
                  <form onSubmit={submissionForm.handleSubmit(onSubmitSubmission)} className="space-y-4">
                    <FormField
                      control={submissionForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Submission Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your answer or describe your submission" 
                              className="min-h-[200px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={submissionForm.control}
                      name="fileUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter a URL to your submission file (Google Drive, GitHub, etc.)" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="submit" disabled={createSubmission.isPending}>
                        {createSubmission.isPending ? "Submitting..." : hasSubmitted() ? "Update Submission" : "Submit Assignment"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
          {(user?.role === "admin" || user?.role === "faculty") && (
            <Button variant="outline">
              <i className="ri-edit-line mr-2"></i> Edit Assignment
            </Button>
          )}
        </div>
      </div>

      {isLoadingAssignment || isLoadingCourse ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center">
                  <CardTitle>{assignment?.title}</CardTitle>
                  <span className={`ml-3 ${
                    assignment?.status === "published" ? "pill-active" : 
                    assignment?.status === "draft" ? "pill-pending" : 
                    "px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                  }`}>
                    {assignment?.status?.charAt(0).toUpperCase() + assignment?.status?.slice(1)}
                  </span>
                </div>
                <CardDescription className="mt-1">
                  {course?.name} ({course?.code})
                </CardDescription>
              </div>
              <div className="mt-4 md:mt-0 text-sm">
                <div className="flex items-center space-x-3">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium">
                      {assignment?.type.charAt(0).toUpperCase() + assignment?.type.slice(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Points:</span>
                    <span className="ml-2 font-medium">{assignment?.totalPoints}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-gray-500">Due Date:</span>
                  <span className="ml-2 font-medium">{formatDate(assignment?.dueDate)}</span>
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                    new Date(assignment?.dueDate) < new Date() 
                      ? "bg-red-100 text-destructive" 
                      : "bg-amber-100 text-accent"
                  }`}>
                    {getDaysRemaining(assignment?.dueDate)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {user?.role === "student" && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Your Submission Status</h3>
                    <span className={`text-sm ${
                      !hasSubmitted() 
                        ? "text-accent" 
                        : studentSubmission?.[0]?.grade != null 
                          ? "text-secondary" 
                          : "text-primary"
                    }`}>
                      {getSubmissionStatus()}
                    </span>
                  </div>
                  {hasSubmitted() && studentSubmission?.[0]?.grade != null && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>Grade</span>
                        <span>
                          {studentSubmission[0].grade} / {assignment?.totalPoints}
                        </span>
                      </div>
                      <Progress 
                        value={(studentSubmission[0].grade / assignment?.totalPoints) * 100} 
                        className="h-2"
                      />
                      {studentSubmission[0].feedback && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-1">Instructor Feedback</h4>
                          <p className="text-sm bg-white p-3 rounded border">
                            {studentSubmission[0].feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <h3 className="text-lg font-medium mb-4">Assignment Description</h3>
                <div className="prose max-w-none">
                  <p>{assignment?.description}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Instructions</h3>
                <div className="prose max-w-none bg-gray-50 p-4 rounded-lg">
                  <p>{assignment?.instructions || "No detailed instructions provided."}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(user?.role === "admin" || user?.role === "faculty") && (
        <>
          <Dialog 
            open={isGradingDialogOpen} 
            onOpenChange={setIsGradingDialogOpen}
          >
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogDescription>
                  Review and grade the student's submission
                </DialogDescription>
              </DialogHeader>
              <Form {...gradingForm}>
                <form onSubmit={gradingForm.handleSubmit(onSubmitGrading)} className="space-y-4">
                  <FormField
                    control={gradingForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade (out of {assignment?.totalPoints})</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={assignment?.totalPoints || 100} 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gradingForm.control}
                    name="feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide feedback to the student" 
                            className="min-h-[100px]" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={gradingForm.control}
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
                            <SelectItem value="graded">Graded</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="resubmitted">Resubmitted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={updateSubmission.isPending}>
                      {updateSubmission.isPending ? "Saving..." : "Save Grade"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <div className="bg-white shadow rounded-lg">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Student Submissions</h3>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Submissions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Submissions</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Tabs defaultValue="list" className="w-full">
                <div className="p-4 border-b">
                  <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="list" className="p-4">
                  {isLoadingSubmissions ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : submissions?.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No submissions found for this assignment</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Submission Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Grade</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions?.map((submission) => (
                          <TableRow key={submission.id}>
                            <TableCell>
                              <div className="font-medium">Student ID: {submission.studentId}</div>
                            </TableCell>
                            <TableCell>{formatDate(submission.submissionDate)}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                submission.status === "submitted" ? "bg-blue-100 text-primary" :
                                submission.status === "graded" ? "bg-green-100 text-secondary" :
                                submission.status === "late" ? "bg-amber-100 text-accent" :
                                "bg-purple-100 text-purple-600"
                              }`}>
                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {submission.grade !== null && submission.grade !== undefined 
                                ? `${submission.grade}/${assignment?.totalPoints}` 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    // View submission details
                                  }}
                                >
                                  <i className="ri-eye-line text-gray-500 hover:text-primary"></i>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedSubmissionId(submission.id);
                                    setIsGradingDialogOpen(true);
                                  }}
                                >
                                  <i className="ri-pencil-line text-gray-500 hover:text-primary"></i>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
                
                <TabsContent value="stats" className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Total Submissions</h4>
                      <p className="text-2xl font-semibold mt-1">{submissions?.length || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Average Grade</h4>
                      <p className="text-2xl font-semibold mt-1">
                        {submissions && submissions.length > 0 && submissions.some(s => s.grade !== null)
                          ? Math.round(
                              submissions
                                .filter(s => s.grade !== null && s.grade !== undefined)
                                .reduce((sum, s) => sum + (s.grade || 0), 0) /
                              submissions.filter(s => s.grade !== null && s.grade !== undefined).length
                            )
                          : "-"}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500">Pending Grading</h4>
                      <p className="text-2xl font-semibold mt-1">
                        {submissions?.filter(s => s.grade === null || s.grade === undefined).length || 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-center py-12 bg-white rounded-lg border">
                    <div className="flex justify-center mb-4">
                      <i className="ri-bar-chart-line text-6xl text-gray-300"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Grade Distribution</h3>
                    <p className="text-gray-500 mb-4">Detailed grade analytics will be available here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}

      {user?.role === "student" && hasSubmitted() && (
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              Submitted on {formatDate(studentSubmission?.[0]?.submissionDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Submission Content</h4>
              <div className="bg-white border rounded p-3">
                <p>{studentSubmission?.[0]?.content}</p>
              </div>
              
              {studentSubmission?.[0]?.fileUrl && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Attached File</h4>
                  <div className="flex items-center bg-white border rounded p-3">
                    <i className="ri-link text-primary mr-2"></i>
                    <a 
                      href={studentSubmission[0].fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {studentSubmission[0].fileUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <p className="text-sm text-gray-500">
              Status: <span className="font-medium">{getSubmissionStatus()}</span>
            </p>
            {isAssignmentOpen() && (
              <Button variant="outline" onClick={() => setIsSubmissionDialogOpen(true)}>
                <i className="ri-edit-line mr-2"></i> Edit Submission
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
