import { ReactNode } from "react";

interface StatsCardProps {
  icon: ReactNode;
  iconBgColor: string;
  title: string;
  value: string | number;
  trend?: {
    value: string | number;
    isPositive: boolean;
    label: string;
  };
}

export function StatsCard({
  icon,
  iconBgColor,
  title,
  value,
  trend
}: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${iconBgColor} mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center ${trend.isPositive ? 'text-secondary' : 'text-destructive'}`}>
            {trend.isPositive ? (
              <i className="ri-arrow-up-line mr-1"></i>
            ) : (
              <i className="ri-arrow-down-line mr-1"></i>
            )}
            {trend.value}
          </span>
          <span className="text-gray-500 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
