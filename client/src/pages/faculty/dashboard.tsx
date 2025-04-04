import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import StatsCard from '@/components/dashboard/stats-card';
import EnrollmentChart from '@/components/dashboard/enrollment-chart';
import RecentActivityTable from '@/components/dashboard/recent-activity-table';
import PopularCoursesWidget from '@/components/dashboard/popular-courses-widget';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Clock,
  CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from 'wouter';

export default function FacultyDashboard() {
  const { user } = useAuth();
  
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
  
  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities', { limit: 5 }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/activities?limit=5`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
  });
  
  // Fetch all users for activity display
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch assignments for this faculty's courses
  const { data: assignmentsByCount, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments/count'],
    queryFn: async () => {
      // Mock data for assignments count - in a real app you would fetch this from API
      return { active: 12, submitted: 48, graded: 32 };
    },
  });
  
  // Process the data for activities table
  const processedActivities = activities ? activities.map((activity: any) => {
    const userInfo = users?.find((u: any) => u.id === activity.userId);
    return {
      ...activity,
      user: {
        firstName: userInfo?.firstName || 'Unknown',
        lastName: userInfo?.lastName || 'User',
        role: userInfo?.role || 'unknown',
        profileImage: userInfo?.profileImage
      }
    };
  }) : [];
  
  // Mock data for enrollment stats
  const enrollmentData = [
    { date: "Jan", count: 10 },
    { date: "Feb", count: 15 },
    { date: "Mar", count: 20 },
    { date: "Apr", count: 25 },
    { date: "May", count: 30 },
    { date: "Jun", count: 35 },
    { date: "Jul", count: 25 },
    { date: "Aug", count: 30 },
    { date: "Sep", count: 45 },
    { date: "Oct", count: 50 },
    { date: "Nov", count: 40 },
    { date: "Dec", count: 35 },
  ];
  
  // Process courses for the popular courses widget
  const processedCourses = courses ? courses.map((course: any) => ({
    ...course,
    studentCount: Math.floor(Math.random() * 150) + 50, // Mock data
    rating: (Math.random() * 1) + 4 // Mock rating between 4-5
  })) : [];

  // Mock upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Assignment Deadline",
      course: "Introduction to Computer Science",
      date: "Tomorrow, 11:59 PM",
      type: "deadline"
    },
    {
      id: 2,
      title: "Course Update",
      course: "UI/UX Design Principles",
      date: "Wednesday, 3:00 PM",
      type: "update"
    },
    {
      id: 3,
      title: "Office Hours",
      course: "Data Science Fundamentals",
      date: "Friday, 2:00 PM - 4:00 PM",
      type: "meeting"
    }
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Faculty Dashboard</h1>
          <p className="text-sm text-textColor/70 mt-1">Welcome back, {user?.firstName}!</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Select defaultValue="30">
            <SelectTrigger className="bg-white shadow-sm border-neutral w-[160px]">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/faculty/courses">
            <Button className="bg-primary text-white flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              My Courses
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Active Courses" 
          value={isLoadingCourses ? "Loading..." : courses?.length || 0}
          icon={<BookOpen className="h-6 w-6 text-primary" />}
          change={8.3}
          iconBgClass="bg-primary/10"
        />
        
        <StatsCard 
          title="Active Assignments" 
          value={isLoadingAssignments ? "Loading..." : assignmentsByCount?.active || 0}
          icon={<FileText className="h-6 w-6 text-secondary" />}
          change={4.2}
          iconBgClass="bg-secondary/10"
        />
        
        <StatsCard 
          title="Total Students" 
          value={isLoadingCourses ? "Loading..." : processedCourses.reduce((acc, course) => acc + course.studentCount, 0)}
          icon={<GraduationCap className="h-6 w-6 text-accent" />}
          change={12.8}
          iconBgClass="bg-accent/10"
        />
        
        <StatsCard 
          title="Pending Submissions" 
          value={isLoadingAssignments ? "Loading..." : assignmentsByCount?.submitted - assignmentsByCount?.graded || 0}
          icon={<Clock className="h-6 w-6 text-error" />}
          change={-3.2}
          changeText="to be graded"
          iconBgClass="bg-error/10"
        />
      </div>
      
      {/* Analytics and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <EnrollmentChart 
          data={enrollmentData}
          isLoading={false} // Using mock data
        />
        
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-poppins">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 hover:bg-neutral/5 transition-colors">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-full mr-4 ${
                      event.type === 'deadline' ? 'bg-error/10 text-error' :
                      event.type === 'update' ? 'bg-secondary/10 text-secondary' :
                      'bg-primary/10 text-primary'
                    }`}>
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-textColor/60">{event.course}</p>
                      <p className="text-xs font-medium mt-1">{event.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity and Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivityTable 
          activities={processedActivities}
          isLoading={isLoadingActivities || isLoadingUsers}
          onViewAll={() => {}}
        />
        
        <PopularCoursesWidget 
          courses={processedCourses}
          isLoading={isLoadingCourses}
          viewAllLink="/faculty/courses"
        />
      </div>
    </div>
  );
}
