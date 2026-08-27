import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';

export default function Commissions() {
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['commissions', page],
    queryFn: () => adminService.getCommissions({ page }),
  });

  const columns: Column<any>[] = [
    { header: 'Commission ID', accessorKey: '_id' },
    { 
      header: 'Booking', 
      cell: (item) => item.booking?._id || 'N/A' 
    },
    { 
      header: 'Professional', 
      cell: (item) => item.professional ? item.professional.name || `${item.professional.firstName || ''} ${item.professional.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Booking Amount', 
      cell: (item) => `$${item.bookingAmount?.toFixed(2) || '0.00'}` 
    },
    { 
      header: 'Commission Amount', 
      cell: (item) => <span className="text-success font-medium">+${item.commissionAmount?.toFixed(2) || '0.00'}</span>
    },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'COLLECTED'} /> 
    },
    { 
      header: 'Date', 
      cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Commissions</h1>
      </div>

      <DataTable 
        columns={columns}
        data={data?.commissions || data?.data?.commissions || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />
    </div>
  );
}
