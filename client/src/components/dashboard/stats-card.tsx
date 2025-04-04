import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number;
  changeText?: string;
  iconBgClass?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeText = "from last month",
  iconBgClass = "bg-primary/10"
}: StatsCardProps) {
  const isPositive = change && change > 0;
  
  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-textColor/70">{title}</p>
          <h2 className="text-3xl font-bold font-poppins mt-1">{value}</h2>
        </div>
        <div className={cn("p-3 rounded-lg", iconBgClass)}>
          {icon}
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-sm font-medium flex items-center",
            isPositive ? "text-secondary" : "text-error"
          )}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </span>
          <span className="text-textColor/60 text-sm ml-2">{changeText}</span>
        </div>
      )}
    </div>
  );
}
