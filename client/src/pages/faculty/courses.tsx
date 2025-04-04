import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  FileText, 
  Users, 
  Search,
  ChartBarStacked 
} from 'lucide-react';
import { Link } from 'wouter';

// Form schema for course creation
const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function FacultyCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  
  // Fetch faculty courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses', { facultyId: user?.id }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/courses?facultyId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: CourseFormValues) => {
      const data = { ...courseData, facultyId: user?.id, isActive: true };
      const response = await apiRequest('POST', '/api/courses', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course created",
        description: "Your course has been created successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create course",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<CourseFormValues> }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course updated",
        description: "Your course has been updated successfully.",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update course",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Add course form
  const addForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });
  
  // Edit course form
  const editForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });
  
  // Filter courses based on search term
  const filteredCourses = courses?.filter((course: any) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      course.title.toLowerCase().includes(searchTermLower) ||
      course.description.toLowerCase().includes(searchTermLower) ||
      (course.category && course.category.toLowerCase().includes(searchTermLower))
    );
  });
  
  // Active and inactive courses
  const activeCourses = filteredCourses?.filter((course: any) => course.isActive) || [];
  const inactiveCourses = filteredCourses?.filter((course: any) => !course.isActive) || [];
  
  // Handle course edit
  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    editForm.reset({
      title: course.title,
      description: course.description,
      category: course.category || "",
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle add course submit
  const onAddSubmit = (data: CourseFormValues) => {
    createCourseMutation.mutate(data);
  };
  
  // Handle edit course submit
  const onEditSubmit = (data: CourseFormValues) => {
    if (!editingCourse) return;
    updateCourseMutation.mutate({ id: editingCourse.id, data });
  };
  
  // Course status toggle mutation
  const toggleCourseMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/courses/${id}`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course status updated",
        description: "Course status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update course status",
        description: (error as Error).message || "An error occurred",
      });
    },
  });
  
  // Mock data for enrollments
  const getRandomEnrollments = () => Math.floor(Math.random() * 80) + 20;
  const getRandomAssignments = () => Math.floor(Math.random() * 10) + 1;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">My Courses</h1>
          <p className="text-sm text-textColor/70 mt-1">Manage your courses and course content</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-textColor/40" />
            <Input
              placeholder="Search courses..."
              className="pl-9 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new course. You can add assignments and content later.
                </DialogDescription>
              </DialogHeader>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course title" {...field} />
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
                            placeholder="Enter course description" 
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Computer Science, Design, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={createCourseMutation.isPending}
                    >
                      {createCourseMutation.isPending ? "Creating..." : "Create Course"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Courses Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" className="relative">
            Active Courses
            {activeCourses.length > 0 && (
              <Badge className="ml-2 bg-primary/10 text-primary hover:bg-primary/20 absolute -top-2 -right-2">
                {activeCourses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inactive" className="relative">
            Inactive Courses
            {inactiveCourses.length > 0 && (
              <Badge className="ml-2 bg-neutral/10 text-textColor/60 hover:bg-neutral/20 absolute -top-2 -right-2">
                {inactiveCourses.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
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
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : activeCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCourses.map((course: any) => (
                <Card key={course.id} className="overflow-hidden">
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
                    <div className="flex justify-between items-center text-xs text-textColor/60">
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        <span>{getRandomEnrollments()} students</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        <span>{getRandomAssignments()} assignments</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Link href={`/faculty/courses/${course.id}/assignments`}>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-primary"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Assignments
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-textColor/60"
                      onClick={() => toggleCourseMutation.mutate({ id: course.id, isActive: false })}
                    >
                      <ChartBarStacked className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Courses</h3>
                <p className="text-textColor/60 max-w-md mb-6">
                  {searchTerm 
                    ? "No active courses match your search. Try a different search term." 
                    : "You don't have any active courses yet. Create a new course to get started."}
                </p>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Course
                  </Button>
                </DialogTrigger>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 2 }).map((_, index) => (
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
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : inactiveCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveCourses.map((course: any) => (
                <Card key={course.id} className="overflow-hidden opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-poppins">
                        {course.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    </div>
                    <CardDescription>
                      {course.category || 'Uncategorized'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-textColor/80 line-clamp-3 mb-4">
                      {course.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-textColor/60">
                      <div className="flex items-center">
                        <Users className="h-3.5 w-3.5 mr-1" />
                        <span>{getRandomEnrollments()} students</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        <span>{getRandomAssignments()} assignments</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => toggleCourseMutation.mutate({ id: course.id, isActive: true })}
                      className="bg-secondary"
                    >
                      Activate
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl p-12 text-center">
              <div className="flex flex-col items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/20 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Inactive Courses</h3>
                <p className="text-textColor/60 max-w-md">
                  {searchTerm 
                    ? "No inactive courses match your search. Try a different search term." 
                    : "You don't have any inactive courses. Courses you deactivate will appear here."}
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update your course details here. Students will be notified of any changes.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter course title" {...field} />
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
                        placeholder="Enter course description" 
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Science, Design, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
