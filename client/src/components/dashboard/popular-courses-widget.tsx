import { Course } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Palette, FileSpreadsheet, Users, Star } from 'lucide-react';
import { Link } from 'wouter';

interface CourseWithStats extends Course {
  studentCount: number;
  rating: number;
}

interface PopularCoursesWidgetProps {
  courses: CourseWithStats[];
  isLoading: boolean;
  viewAllLink?: string;
}

export default function PopularCoursesWidget({ 
  courses, 
  isLoading,
  viewAllLink
}: PopularCoursesWidgetProps) {
  // Function to get appropriate icon based on course category
  const getCourseIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'design':
        return <Palette className="h-5 w-5 text-primary" />;
      case 'data science':
        return <FileSpreadsheet className="h-5 w-5 text-primary" />;
      case 'computer science':
      default:
        return <BookOpen className="h-5 w-5 text-primary" />;
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-neutral rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Skeleton className="w-12 h-12 rounded-lg mr-3" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold font-poppins">Popular Courses</h3>
        {viewAllLink && (
          <Link href={viewAllLink}>
            <Button variant="link" className="text-primary p-0">
              View All
            </Button>
          </Link>
        )}
      </div>
      
      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="border border-neutral rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className="bg-primary/10 p-3 rounded-lg mr-3">
                {getCourseIcon(course.category)}
              </div>
              <div>
                <h4 className="font-medium text-sm">{course.title}</h4>
                <p className="text-xs text-textColor/60">{course.faculty?.firstName} {course.faculty?.lastName}</p>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-accent mr-1" />
                <span>{course.studentCount} students</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-secondary mr-1" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
