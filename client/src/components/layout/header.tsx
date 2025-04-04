import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="lg:hidden bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center">
        <Button variant="ghost" className="mr-4 text-primary p-1" onClick={onToggleSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold font-poppins text-primary">EduLearn</h1>
      </div>
      <div className="flex items-center">
        <div className="relative mr-2">
          <Bell className="h-6 w-6 text-textColor" />
          <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-accent"></span>
        </div>
        <img 
          src={user.profileImage || "https://via.placeholder.com/32"} 
          alt="User profile" 
          className="w-8 h-8 rounded-full"
        />
      </div>
    </div>
  );
}
