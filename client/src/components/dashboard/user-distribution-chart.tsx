import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface DistributionData {
  role: string;
  count: number;
}

interface UserDistributionChartProps {
  data: DistributionData[];
  isLoading: boolean;
}

export default function UserDistributionChart({ data, isLoading }: UserDistributionChartProps) {
  const COLORS = ['#1E88E5', '#43A047', '#FFA000'];
  
  // Calculate percentages
  const total = data.reduce((acc, item) => acc + item.count, 0);
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: Math.round((item.count / total) * 100)
  }));
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 h-[350px]">
        <div className="mb-6">
          <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="flex justify-center mb-6">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold font-poppins">User Distribution</h3>
      </div>
      
      <div className="flex justify-center mb-6 h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="count"
              nameKey="role"
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} (${dataWithPercentage.find(item => item.role === name)?.percentage}%)`, name]}
              contentStyle={{ 
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #ECEFF1',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 gap-3 mt-4">
        {dataWithPercentage.map((item, index) => (
          <div key={item.role} className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{item.role}</span>
            </div>
            <span className="text-sm font-medium">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
