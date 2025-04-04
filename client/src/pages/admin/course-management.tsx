import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth';
import { BookOpen, Plus, Edit, Trash2, Search, Users, Clock } from 'lucide-react';

// Form schema for course creation/editing
const courseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  facultyId: z.number(),
  category: z.string().optional(),
  isActive: z.boolean().default(true),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function CourseManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);
  
  // Fetch all courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses'],
  });
  
  // Fetch faculty users for the dropdown
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Filter faculty users
  const facultyUsers = users?.filter((user: any) => user.role === 'faculty') || [];
  
  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: CourseFormValues) => {
      const response = await apiRequest('POST', '/api/courses', courseData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course created",
        description: "Course has been created successfully.",
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
        description: "Course has been updated successfully.",
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
  
  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/courses/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Course deleted",
        description: "Course has been deleted successfully.",
      });
      setDeletingCourseId(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete course",
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
      facultyId: facultyUsers[0]?.id || 0,
      category: "",
      isActive: true,
    },
  });
  
  // Edit course form
  const editForm = useForm<Partial<CourseFormValues>>({
    resolver: zodResolver(courseFormSchema.partial()),
    defaultValues: {
      title: "",
      description: "",
      facultyId: 0,
      category: "",
      isActive: true,
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
  
  // Handle course edit
  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    editForm.reset({
      title: course.title,
      description: course.description,
      facultyId: course.facultyId,
      category: course.category || "",
      isActive: course.isActive,
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle add course submit
  const onAddSubmit = (data: CourseFormValues) => {
    createCourseMutation.mutate(data);
  };
  
  // Handle edit course submit
  const onEditSubmit = (data: Partial<CourseFormValues>) => {
    if (!editingCourse) return;
    
    // Only include fields that have values
    const updatedData: Partial<CourseFormValues> = {};
    Object.keys(data).forEach(key => {
      const value = data[key as keyof typeof data];
      if (value !== undefined) {
        updatedData[key as keyof typeof data] = value;
      }
    });
    
    updateCourseMutation.mutate({ id: editingCourse.id, data: updatedData });
  };
  
  // Handle delete course
  const handleDeleteCourse = () => {
    if (deletingCourseId) {
      deleteCourseMutation.mutate(deletingCourseId);
    }
  };
  
  // Helper function to find faculty name by ID
  const getFacultyName = (facultyId: number) => {
    const faculty = users?.find((user: any) => user.id === facultyId);
    return faculty ? `${faculty.firstName} ${faculty.lastName}` : 'Unknown Faculty';
  };
  
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Course Management</h1>
          <p className="text-sm text-textColor/70 mt-1">Manage all courses in the system</p>
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
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new course in the system.
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
                  <FormField
                    control={addForm.control}
                    name="facultyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Faculty</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a faculty member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {facultyUsers.map((faculty: any) => (
                              <SelectItem key={faculty.id} value={faculty.id.toString()}>
                                {faculty.firstName} {faculty.lastName}
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
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Active Course</FormLabel>
                          <FormDescription>
                            Make this course available for enrollment
                          </FormDescription>
                        </div>
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
      
      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingCourses ? (
          Array.from({ length: 6 }).map((_, index) => (
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
          ))
        ) : filteredCourses?.length ? (
          filteredCourses.map((course: any) => (
            <Card key={course.id} className={`overflow-hidden ${!course.isActive ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-poppins">
                    {course.title}
                  </CardTitle>
                  {!course.isActive && (
                    <span className="bg-neutral/10 text-textColor/60 text-xs px-2 py-1 rounded-full">
                      Inactive
                    </span>
                  )}
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
                    <span>Faculty: {getFacultyName(course.facultyId)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <span>Added: {new Date().toLocaleDateString()}</span>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-error hover:text-error/90"
                      onClick={() => setDeletingCourseId(course.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the course
                        and all associated assignments and enrollments.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeletingCourseId(null)}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteCourse}
                        className="bg-error hover:bg-error/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-textColor/60">
            <BookOpen className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-2">No Courses Found</h3>
            <p className="text-sm max-w-md text-center">
              {searchTerm 
                ? "No courses match your search criteria. Try a different search term." 
                : "There are no courses in the system yet. Click 'Add Course' to create your first course."}
            </p>
          </div>
        )}
      </div>
      
      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course information. Leave fields blank to keep current values.
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
              <FormField
                control={editForm.control}
                name="facultyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Faculty</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a faculty member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {facultyUsers.map((faculty: any) => (
                          <SelectItem key={faculty.id} value={faculty.id.toString()}>
                            {faculty.firstName} {faculty.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Course</FormLabel>
                      <FormDescription>
                        Make this course available for enrollment
                      </FormDescription>
                    </div>
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
