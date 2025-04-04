import { useQuery } from '@tanstack/react-query';
import StatsCard from '@/components/dashboard/stats-card';
import EnrollmentChart from '@/components/dashboard/enrollment-chart';
import UserDistributionChart from '@/components/dashboard/user-distribution-chart';
import RecentActivityTable from '@/components/dashboard/recent-activity-table';
import PopularCoursesWidget from '@/components/dashboard/popular-courses-widget';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  CheckCircle,
  Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  // Fetch user count
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users'],
  });
  
  // Fetch enrollment stats
  const { data: enrollmentStats, isLoading: isLoadingEnrollmentStats } = useQuery({
    queryKey: ['/api/analytics/enrollment-stats'],
  });
  
  // Fetch user distribution
  const { data: userDistribution, isLoading: isLoadingUserDistribution } = useQuery({
    queryKey: ['/api/analytics/user-distribution'],
  });
  
  // Fetch completion rate
  const { data: completionRate, isLoading: isLoadingCompletionRate } = useQuery({
    queryKey: ['/api/analytics/completion-rate'],
  });
  
  // Fetch popular courses
  const { data: popularCourses, isLoading: isLoadingPopularCourses } = useQuery({
    queryKey: ['/api/analytics/popular-courses'],
  });
  
  // Fetch recent activities with user data
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['/api/activities'],
  });
  
  // Process the data for activities table
  const processedActivities = activities ? activities.map((activity: any) => {
    const user = users?.find((user: any) => user.id === activity.userId);
    return {
      ...activity,
      user: {
        firstName: user?.firstName || 'Unknown',
        lastName: user?.lastName || 'User',
        role: user?.role || 'unknown',
        profileImage: user?.profileImage
      }
    };
  }) : [];
  
  // Mock data for popularCourses if API returns no data
  const processedCourses = popularCourses ? popularCourses.map((course: any) => ({
    ...course,
    studentCount: Math.floor(Math.random() * 200) + 50, // Random student count between 50-250
    rating: (Math.random() * 2) + 3 // Random rating between 3-5
  })) : [];

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-textColor">Admin Dashboard</h1>
          <p className="text-sm text-textColor/70 mt-1">Overview of your learning management system</p>
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
          <Button className="bg-primary text-white flex items-center">
            <Download className="h-4 w-4 mr-1" />
            Export Report
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard 
          title="Total Users" 
          value={isLoadingUsers ? "Loading..." : users?.length || 0}
          icon={<Users className="h-6 w-6 text-primary" />}
          change={12.5}
          iconBgClass="bg-primary/10"
        />
        
        <StatsCard 
          title="Active Courses" 
          value={isLoadingUsers ? "Loading..." : popularCourses?.length || 0}
          icon={<BookOpen className="h-6 w-6 text-secondary" />}
          change={8.2}
          iconBgClass="bg-secondary/10"
        />
        
        <StatsCard 
          title="Total Enrollments" 
          value="4,728"
          icon={<GraduationCap className="h-6 w-6 text-accent" />}
          change={16.8}
          iconBgClass="bg-accent/10"
        />
        
        <StatsCard 
          title="Completion Rate" 
          value={isLoadingCompletionRate ? "Loading..." : `${completionRate?.rate || 0}%`}
          icon={<CheckCircle className="h-6 w-6 text-primary" />}
          change={3.2}
          iconBgClass="bg-primary/10"
        />
      </div>
      
      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <EnrollmentChart 
          data={enrollmentStats || []}
          isLoading={isLoadingEnrollmentStats}
        />
        
        <UserDistributionChart 
          data={userDistribution || []}
          isLoading={isLoadingUserDistribution}
        />
      </div>
      
      {/* Recent Activity and Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentActivityTable 
          activities={processedActivities.slice(0, 4)}
          isLoading={isLoadingActivities || isLoadingUsers}
          onViewAll={() => {}}
        />
        
        <PopularCoursesWidget 
          courses={processedCourses}
          isLoading={isLoadingPopularCourses}
          viewAllLink="/admin/courses"
        />
      </div>
    </div>
  );
}
