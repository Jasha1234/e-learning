import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrollmentData {
  date: string;
  count: number;
}

interface EnrollmentChartProps {
  data: EnrollmentData[];
  isLoading: boolean;
}

export default function EnrollmentChart({ data, isLoading }: EnrollmentChartProps) {
  const [timeRange, setTimeRange] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl p-6 h-[350px] col-span-2">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Skeleton className="h-[230px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 col-span-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold font-poppins">Enrollment Trends</h3>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${timeRange === 'monthly' ? 'bg-primary/10 text-primary' : 'text-textColor/70'}`}
            onClick={() => setTimeRange('monthly')}
          >
            Monthly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${timeRange === 'weekly' ? 'bg-primary/10 text-primary' : 'text-textColor/70'}`}
            onClick={() => setTimeRange('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`rounded-full ${timeRange === 'daily' ? 'bg-primary/10 text-primary' : 'text-textColor/70'}`}
            onClick={() => setTimeRange('daily')}
          >
            Daily
          </Button>
        </div>
      </div>
      
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#2C3E50' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#2C3E50' }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(30, 136, 229, 0.1)' }}
              contentStyle={{ 
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #ECEFF1',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="count" 
              fill="#1E88E5" 
              radius={[4, 4, 0, 0]}
              barSize={30}
              name="Enrollments"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
