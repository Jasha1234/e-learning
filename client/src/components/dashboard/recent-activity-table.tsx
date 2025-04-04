import { Activity } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityTableProps {
  activities: (Activity & { user: { firstName: string; lastName: string; role: string; profileImage?: string } })[];
  isLoading: boolean;
  onViewAll?: () => void;
}

export default function RecentActivityTable({ activities, isLoading, onViewAll }: RecentActivityTableProps) {
  // Function to determine badge class based on action
  const getBadgeClass = (action: string) => {
    if (action.includes('Enrollment') || action.includes('Login')) {
      return 'bg-primary/10 text-primary';
    }
    if (action.includes('Updated') || action.includes('Content')) {
      return 'bg-secondary/10 text-secondary';
    }
    if (action.includes('Assignment') || action.includes('Submission')) {
      return 'bg-accent/10 text-accent';
    }
    return 'bg-primary/10 text-primary';
  };
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border-b border-neutral pb-4">
              <div className="flex items-center">
                <Skeleton className="w-10 h-10 rounded-full mr-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="mt-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="mt-2">
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 lg:col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold font-poppins">Recent User Activity</h3>
        {onViewAll && (
          <Button variant="link" className="text-primary p-0" onClick={onViewAll}>
            View All
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-textColor/70 text-sm border-b border-neutral">
              <th className="pb-3 font-medium">User</th>
              <th className="pb-3 font-medium">Action</th>
              <th className="pb-3 font-medium">Detail</th>
              <th className="pb-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id} className="border-b border-neutral">
                <td className="py-4">
                  <div className="flex items-center">
                    <img 
                      src={activity.user.profileImage || "https://via.placeholder.com/32"} 
                      alt="User" 
                      className="w-8 h-8 rounded-full mr-3"
                    />
                    <div>
                      <p className="text-sm font-medium">{activity.user.firstName} {activity.user.lastName}</p>
                      <p className="text-xs text-textColor/60 capitalize">{activity.user.role}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 ${getBadgeClass(activity.action)} text-xs rounded-full`}>
                    {activity.action}
                  </span>
                </td>
                <td className="py-4 text-sm">{activity.detail}</td>
                <td className="py-4 text-sm text-textColor/60">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
