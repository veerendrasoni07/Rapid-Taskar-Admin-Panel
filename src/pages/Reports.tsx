import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';

export default function Reports() {
  const { data: revenueResponse, isLoading: loadingRevenue } = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: () => adminService.getRevenueReport(),
  });

  const { data: topServicesResponse, isLoading: loadingTopServices } = useQuery({
    queryKey: ['reports', 'top-services'],
    queryFn: () => adminService.getTopServicesReport(),
  });

  // Extract data arrays from backend response
  const revenueData = revenueResponse?.data?.revenue || [];
  const topServicesData = topServicesResponse?.data?.services || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Reports & Analytics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-text mb-6">Revenue Over Time</h2>
          <div className="h-[300px] w-full">
            {loadingRevenue ? (
              <div className="w-full h-full flex items-center justify-center text-secondary">Loading...</div>
            ) : revenueData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-secondary">No revenue data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E7EB" />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6B6B76' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6B6B76' }} tickFormatter={(value) => `$${value}`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B6B76' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E6E7EB' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" name="Revenue" dataKey="revenue" stroke="#5B4BDB" strokeWidth={3} dot={{ r: 4, fill: '#5B4BDB' }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" name="Bookings" dataKey="bookings" stroke="#20A464" strokeWidth={3} dot={{ r: 4, fill: '#20A464' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Services Chart */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-lg font-medium text-text mb-6">Top Services (By Volume)</h2>
          <div className="h-[300px] w-full">
            {loadingTopServices ? (
              <div className="w-full h-full flex items-center justify-center text-secondary">Loading...</div>
            ) : topServicesData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-secondary">No services data available</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6E7EB" />
                  <XAxis dataKey="serviceName" axisLine={false} tickLine={false} tick={{ fill: '#6B6B76' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B6B76' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E6E7EB' }}
                    cursor={{ fill: '#F7F8FA' }}
                  />
                  <Legend />
                  <Bar name="Bookings" dataKey="bookings" fill="#20A464" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
