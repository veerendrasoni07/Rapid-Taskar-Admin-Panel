import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';

export default function Payments() {
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => adminService.getPayments({ page }),
  });

  const columns: Column<any>[] = [
    { header: 'Payment ID', accessorKey: '_id' },
    { 
      header: 'Booking', 
      cell: (item) => item.booking?._id || 'N/A' 
    },
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Amount', 
      cell: (item) => `$${item.amount?.toFixed(2) || '0.00'}` 
    },
    { header: 'Method', accessorKey: 'paymentMethod' },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'COMPLETED'} /> 
    },
    { 
      header: 'Date', 
      cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A' 
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Payment Records</h1>
      </div>

      <DataTable 
        columns={columns}
        data={data?.payments || data?.data?.payments || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />
    </div>
  );
}
