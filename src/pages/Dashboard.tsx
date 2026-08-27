import { Users, Briefcase, Calendar, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import KPICard from '../components/common/KPICard';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';

export default function Dashboard() {
  const { data: dashboardData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: () => adminService.getDashboard(),
  });

  const { data: bookingsData, isLoading: isLoadingBookings } = useQuery({
    queryKey: ['recent_bookings'],
    queryFn: () => adminService.getBookings({ limit: 5 }),
  });

  const stats = dashboardData?.data?.stats || {};
  const recentBookings = bookingsData?.data?.bookings || bookingsData?.data?.data || []; 
  // Depending on how backend paginates, it might be in .data or .bookings

  const columns: Column<any>[] = [
    { header: 'Booking ID', accessorKey: '_id' },
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Service', 
      cell: (item) => item.service?.name || 'Unknown' 
    },
    { 
      header: 'Date', 
      cell: (item) => item.bookingDate ? new Date(item.bookingDate).toLocaleDateString() : 'N/A' 
    },
    { 
      header: 'Amount', 
      cell: (item) => `$${item.price?.toFixed(2) || '0.00'}` 
    },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'PENDING'} /> 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text">Dashboard Overview</h1>
        <div className="text-sm text-secondary">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard 
          title="Total Customers" 
          value={isLoadingStats ? '...' : (stats.customers || 0)} 
          icon={Users} 
        />
        <KPICard 
          title="Active Professionals" 
          value={isLoadingStats ? '...' : (stats.professionals || 0)} 
          icon={Briefcase} 
        />
        <KPICard 
          title="Total Bookings" 
          value={isLoadingStats ? '...' : (stats.bookings || 0)} 
          icon={Calendar} 
        />
        <KPICard 
          title="Completed Bookings" 
          value={isLoadingStats ? '...' : (stats.completedBookings || 0)} 
          icon={Activity} 
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Bookings Table */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-text">Recent Bookings</h2>
          <DataTable 
            data={recentBookings} 
            columns={columns} 
            isLoading={isLoadingBookings}
            keyExtractor={(item) => item._id || Math.random().toString()} 
          />
        </div>
      </div>
    </div>
  );
}
