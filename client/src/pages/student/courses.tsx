import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Search, Users, BookMarked, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from '@/components/ui/dialog';
import { Progress } from "@/components/ui/progress";

export default function StudentCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState<number | null>(null);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isUnenrollDialogOpen, setIsUnenrollDialogOpen] = useState(false);
  
  // Fetch available courses
  const { data: availableCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses', { active: true }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/courses?active=true`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });
  
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
  
  // Fetch faculty users for course instructor details
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Enroll in course mutation
  const enrollCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const data = {
        studentId: user?.id,
        courseId: courseId,
        progress: 0
      };
      const response = await apiRequest('POST', '/api/enrollments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: "Enrolled successfully",
        description: "You have been enrolled in the course.",
      });
      setIsEnrollDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to enroll",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Unenroll from course mutation
  const unenrollCourseMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      const response = await apiRequest('DELETE', `/api/enrollments/${enrollmentId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      toast({
        title: "Unenrolled successfully",
        description: "You have been unenrolled from the course.",
      });
      setIsUnenrollDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to unenroll",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Filter courses based on search term
  const filteredCourses = availableCourses?.filter((course: any) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchTermLower) ||
      course.description.toLowerCase().includes(searchTermLower) ||
      (course.category && course.category.toLowerCase().includes(searchTermLower))
    );
  }) || [];
  
  // Get enrolled course details
  const enrolledCourseIds = enrollments?.map((enrollment: any) => enrollment.courseId) || [];
  const enrolledCourses = filteredCourses?.filter((course: any) => enrolledCourseIds.includes(course.id)) || [];
  const availableForEnrollment = filteredCourses?.filter((course: any) => !enrolledCourseIds.includes(course.id)) || [];
  
  // Get enrollment by course ID
  const getEnrollment = (courseId: number) => {
    return enrollments?.find((enrollment: any) => enrollment.courseId === courseId);
  };
  
  // Get faculty details by ID
  const getFacultyDetails = (facultyId: number) => {
    const faculty = users?.find((user: any) => user.id === facultyId);
    return faculty ? {
      name: `${faculty.firstName} ${faculty.lastName}`,
      profileImage: faculty.profileImage
    } : {
      name: 'Unknown Instructor',
      profileImage: undefined
    };
  };
  
  // Handle enroll in course
  const handleEnroll = (courseId: number) => {
    setEnrollingCourseId(courseId);
    setIsEnrollDialogOpen(true);
  };
  
  // Handle unenroll from course
  const handleUnenroll = (courseId: number) => {
    const enrollment = getEnrollment(courseId);
    if (enrollment) {
      setUnenrollingCourseId(enrollment.id);
      setIsUnenrollDialogOpen(true);
    }
  };
  
  // Confirm enrollment
  const confirmEnroll = () => {
    if (enrollingCourseId) {
      enrollCourseMutation.mutate(enrollingCourseId);
    }
  };
  
  // Confirm unenrollment
  const confirmUnenroll = () => {
    if (unenrollingCourseId) {
      unenrollCourseMutation.mutate(unenrollingCourseId);
    }
  };
  
  // Get course name by ID
  const getCourseName = (courseId: number) => {
    const course = availableCourses?.find((course: any) => course.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Course Catalog</h1>
          <p className="text-sm text-textColor/70 mt-1">Browse and manage your course enrollments</p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textColor/40" />
            <Input
              placeholder="Search courses..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Courses Tabs */}
      <Tabs defaultValue="enrolled" className="space-y-6">
        <TabsList>
          <TabsTrigger value="enrolled" className="relative">
            My Courses
            {enrolledCourses.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 absolute -top-2 -right-2">
                {enrolledCourses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available" className="relative">
            Available Courses
            {availableForEnrollment.length > 0 && (
              <Badge className="ml-2 bg-secondary/10 text-secondary hover:bg-secondary/20 absolute -top-2 -right-2">
                {availableForEnrollment.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* My Courses Tab */}
        <TabsContent value="enrolled" className="space-y-4">
          {isLoadingEnrollments || isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course: any) => {
                const enrollment = getEnrollment(course.id);
                const faculty = getFacultyDetails(course.facultyId);
                
                return (
                  <Card key={course.id} className="overflow-hidden shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-poppins">
                        {course.title}
                      </CardTitle>
                      <CardDescription>
                        {course.category || 'Uncategorized'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-textColor/80 line-clamp-3 mb-4">
                        {course.description}
                      </p>
                      
                      <div className="flex justify-between items-center text-xs text-textColor/60 mb-4">
                        <div className="flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          <span>Instructor: {faculty.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>Progress: {enrollment?.progress || 0}%</span>
                        </div>
                      </div>
                      
                      <Progress value={enrollment?.progress || 0} className="h-2 mb-4" />
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={enrollment?.completed ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"}>
                          {enrollment?.completed ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {enrollment?.completed ? "Completed" : "In Progress"}
                        </Badge>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-error hover:bg-error/10 hover:text-error"
                          onClick={() => handleUnenroll(course.id)}
                        >
                          Unenroll
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button className="w-full bg-primary">
                        <BookMarked className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">Not Enrolled in Any Courses</h3>
                <p className="text-textColor/60 max-w-md mb-6">
                  {searchTerm 
                    ? "No enrolled courses match your search. Try a different search term." 
                    : "You aren't enrolled in any courses yet. Browse available courses to get started."}
                </p>
                <Button onClick={() => document.getElementById('available-tab')?.click()}>
                  Browse Available Courses
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Available Courses Tab */}
        <TabsContent value="available" className="space-y-4" id="available-tab">
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : availableForEnrollment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableForEnrollment.map((course: any) => {
                const faculty = getFacultyDetails(course.facultyId);
                
                return (
                  <Card key={course.id} className="overflow-hidden shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-poppins">
                        {course.title}
                      </CardTitle>
                      <CardDescription>
                        {course.category || 'Uncategorized'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-textColor/80 line-clamp-3 mb-4">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-textColor/60 mb-2">
                        <div className="flex items-center">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          <span>Instructor: {faculty.name}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button 
                        className="w-full bg-secondary"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll Now
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Available Courses</h3>
                <p className="text-textColor/60 max-w-md">
                  {searchTerm 
                    ? "No available courses match your search. Try a different search term." 
                    : "There are no available courses at the moment or you're already enrolled in all available courses."}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Enrollment Confirmation Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enroll in Course</DialogTitle>
            <DialogDescription>
              You are about to enroll in <span className="font-medium">{getCourseName(enrollingCourseId || 0)}</span>. 
              Do you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmEnroll}
              disabled={enrollCourseMutation.isPending}
              className="bg-secondary"
            >
              {enrollCourseMutation.isPending ? "Enrolling..." : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unenrollment Confirmation Dialog */}
      <Dialog open={isUnenrollDialogOpen} onOpenChange={setIsUnenrollDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unenroll from Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll from <span className="font-medium">{
                getCourseName(availableCourses?.find((course: any) => 
                  getEnrollment(course.id)?.id === unenrollingCourseId
                )?.id || 0)
              }</span>? 
              
              <p className="mt-2 text-error">Warning: Your progress and submissions will be preserved, but you will need to re-enroll to access the course again.</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUnenrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmUnenroll}
              disabled={unenrollCourseMutation.isPending}
              className="bg-error hover:bg-error/90"
            >
              {unenrollCourseMutation.isPending ? "Unenrolling..." : "Confirm Unenrollment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
