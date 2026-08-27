import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';

export default function Reviews() {
  const [page] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['reviews', page],
    queryFn: () => adminService.getReviews({ page }),
  });

  const columns: Column<any>[] = [
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Professional', 
      cell: (item) => item.professional ? item.professional.name || `${item.professional.firstName || ''} ${item.professional.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Rating', 
      cell: (item) => (
        <div className="flex items-center text-warning font-semibold">
          ★ {item.rating || 0}
        </div>
      )
    },
    { header: 'Comment', cell: (item) => <span className="text-secondary truncate max-w-[250px] inline-block" title={item.comment}>{item.comment || 'N/A'}</span> },
    { 
      header: 'Date', 
      cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button 
          className="text-error hover:text-error/80 font-medium text-sm"
          onClick={() => console.log('Delete review', item._id)}
        >
          Remove
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Reviews & Ratings</h1>
      </div>

      <DataTable 
        columns={columns}
        data={data?.reviews || data?.data?.reviews || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />
    </div>
  );
}
