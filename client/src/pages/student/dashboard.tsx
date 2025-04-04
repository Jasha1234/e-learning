import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import StatsCard from '@/components/dashboard/stats-card';
import RecentActivityTable from '@/components/dashboard/recent-activity-table';
import { format, parseISO, isPast, addDays } from 'date-fns';
import { 
  BookOpen, 
  FileText, 
  Award, 
  Clock,
  CalendarDays,
  AlertTriangle
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
  const { user } = useAuth();
  
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
  
  // Fetch courses for enrolled courses
  const { data: courses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses', { active: true }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/courses?active=true`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    },
  });
  
  // Fetch assignments
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['/api/assignments'],
    queryFn: async () => {
      // In a real application, we would fetch assignments specific to enrolled courses
      // For simplicity, let's assume we get all assignments and filter afterwards
      const courseIds = enrollments?.map((e: any) => e.courseId) || [];
      const assignmentPromises = courseIds.map((courseId: number) => 
        fetch(`/api/assignments?courseId=${courseId}`).then(res => res.json())
      );
      
      const results = await Promise.all(assignmentPromises);
      return results.flat();
    },
    enabled: !!enrollments?.length,
  });
  
  // Fetch submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['/api/submissions', { studentId: user?.id }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/submissions?studentId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities', { userId: user?.id, limit: 5 }],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/activities?userId=${user?.id}&limit=5`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  // Fetch users for activity display
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
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
  
  // Calculate stats from enrollments, assignments, and submissions
  const stats = {
    totalCourses: enrollments?.length || 0,
    totalAssignments: assignments?.length || 0,
    completedAssignments: submissions?.length || 0,
    upcomingAssignments: assignments?.filter((a: any) => 
      !submissions?.find((s: any) => s.assignmentId === a.id) && 
      (!a.dueDate || !isPast(new Date(a.dueDate)))
    ).length || 0,
    averageScore: submissions?.length
      ? Math.round(
          submissions.reduce((acc: number, sub: any) => acc + (sub.score || 0), 0) / 
          submissions.length
        )
      : 0,
  };
  
  // Find course name by ID
  const getCourseName = (courseId: number) => {
    const course = courses?.find((course: any) => course.id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  // Calculate and prepare progress data for courses
  const courseProgress = enrollments?.map((enrollment: any) => {
    return {
      courseId: enrollment.courseId,
      courseName: getCourseName(enrollment.courseId),
      progress: enrollment.progress,
    };
  }) || [];
  
  // Find upcoming assignments
  const upcomingAssignments = assignments
    ?.filter((a: any) => {
      // Only show assignments that haven't been submitted yet
      const hasSubmitted = submissions?.some((s: any) => s.assignmentId === a.id);
      // Only show assignments with due dates in the future or without due dates
      const isUpcoming = !a.dueDate || !isPast(new Date(a.dueDate));
      return !hasSubmitted && isUpcoming;
    })
    .sort((a: any, b: any) => {
      // Sort by due date (closest first)
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 3);
  
  // Mock grade data for visualization
  const gradeData = [
    { name: 'Assignment 1', score: 85 },
    { name: 'Assignment 2', score: 92 },
    { name: 'Assignment 3', score: 78 },
    { name: 'Assignment 4', score: 88 },
    { name: 'Assignment 5', score: 95 },
  ];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Student Dashboard</h1>
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
          <Link href="/student/courses">
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
          value={stats.totalCourses}
          icon={<BookOpen className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
        
        <StatsCard 
          title="Assignments Completed" 
          value={`${stats.completedAssignments}/${stats.totalAssignments}`}
          icon={<FileText className="h-6 w-6 text-secondary" />}
          iconBgClass="bg-secondary/10"
        />
        
        <StatsCard 
          title="Average Score" 
          value={`${stats.averageScore}%`}
          icon={<Award className="h-6 w-6 text-accent" />}
          iconBgClass="bg-accent/10"
        />
        
        <StatsCard 
          title="Upcoming Deadlines" 
          value={stats.upcomingAssignments}
          icon={<Clock className="h-6 w-6 text-primary" />}
          iconBgClass="bg-primary/10"
        />
      </div>
      
      {/* Charts and Upcoming Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Course Progress Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-poppins">Your Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#2C3E50' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 12, fill: '#2C3E50' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Score']}
                    cursor={{ fill: 'rgba(30, 136, 229, 0.1)' }}
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #ECEFF1',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="score" 
                    fill="#1E88E5" 
                    radius={[4, 4, 0, 0]}
                    name="Score"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Assignments */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-poppins">Upcoming Assignments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingAssignments ? (
              <div className="p-4 text-center text-textColor/60">
                Loading assignments...
              </div>
            ) : upcomingAssignments?.length > 0 ? (
              <div className="divide-y">
                {upcomingAssignments.map((assignment: any) => (
                  <div key={assignment.id} className="p-4 hover:bg-neutral/5 transition-colors">
                    <div className="flex items-start">
                      <div className={`p-2 rounded-full mr-4 ${
                        isPast(addDays(new Date(assignment.dueDate), -1)) 
                          ? 'bg-error/10 text-error' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {isPast(addDays(new Date(assignment.dueDate), -1)) 
                          ? <AlertTriangle className="h-5 w-5" />
                          : <CalendarDays className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{assignment.title}</h4>
                        <p className="text-xs text-textColor/60">{getCourseName(assignment.courseId)}</p>
                        <p className="text-xs font-medium mt-1">
                          {assignment.dueDate 
                            ? `Due: ${format(new Date(assignment.dueDate), "PPP")}` 
                            : "No due date"
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-textColor/60">
                <FileText className="h-12 w-12 mx-auto mb-3 text-primary/20" />
                <p>No upcoming assignments!</p>
                <p className="text-xs mt-1">You're all caught up.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Course Progress and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium font-poppins">Course Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEnrollments || isLoadingCourses ? (
              <div className="text-center text-textColor/60">
                Loading course progress...
              </div>
            ) : courseProgress.length > 0 ? (
              <div className="space-y-6">
                {courseProgress.map((course: any) => (
                  <div key={course.courseId}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium">{course.courseName}</h4>
                      <span className="text-sm">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-textColor/60 py-4">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-primary/20" />
                <p>You're not enrolled in any courses yet</p>
                <Link href="/student/courses">
                  <Button variant="link" className="mt-2">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Activity */}
        <RecentActivityTable 
          activities={processedActivities}
          isLoading={isLoadingActivities || isLoadingUsers}
          onViewAll={() => {}}
          className="lg:col-span-2"
        />
      </div>
    </div>
  );
}
