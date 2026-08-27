import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PromptModal from '../components/common/PromptModal';
import { Search } from 'lucide-react';

export default function Bookings() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignPromptItem, setAssignPromptItem] = useState<any>(null);
  const [cancelPromptItem, setCancelPromptItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, searchTerm, statusFilter],
    queryFn: () => adminService.getBookings({ page, status: statusFilter })
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => adminService.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  const columns: Column<any>[] = [
    { header: 'Booking ID', accessorKey: '_id' },
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Professional', 
      cell: (item) => item.professional ? item.professional.name || `${item.professional.firstName || ''} ${item.professional.lastName || ''}`.trim() : 'Unassigned' 
    },
    { 
      header: 'Service', 
      cell: (item) => item.service?.name || 'Unknown' 
    },
    { 
      header: 'Date & Time', 
      cell: (item) => item.bookingDate ? new Date(item.bookingDate).toLocaleString() : 'N/A' 
    },
    { 
      header: 'Amount', 
      cell: (item) => `$${item.price?.toFixed(2) || '0.00'}` 
    },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'PENDING'} /> 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex gap-3">
          <button 
            className="text-primary hover:text-primary/80 font-medium text-sm"
            onClick={() => setAssignPromptItem(item)}
            disabled={item.status !== 'PENDING' && item.status !== 'CONFIRMED'}
          >
            Assign
          </button>
          <button 
            className="text-error hover:text-error/80 font-medium text-sm disabled:opacity-50"
            disabled={item.status === 'CANCELLED' || item.status === 'COMPLETED'}
            onClick={() => setCancelPromptItem(item)}
          >
            Cancel
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Bookings</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder="Search by ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="block w-full sm:w-48 rounded-md border-0 py-2 pl-3 pr-10 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="ON_THE_WAY">On the Way</option>
          <option value="STARTED">Started</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data?.bookings || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <PromptModal
        isOpen={!!assignPromptItem}
        onClose={() => setAssignPromptItem(null)}
        onSubmit={(val) => {
          if (assignPromptItem) {
            adminService.assignBooking(assignPromptItem._id, val)
              .then(() => queryClient.invalidateQueries({ queryKey: ['bookings'] }))
              .catch(e => alert(e.response?.data?.message || 'Failed to assign professional'));
          }
        }}
        title="Assign Professional"
        message="Enter the ID of the professional you want to assign to this booking:"
        placeholder="Professional ID"
        submitText="Assign"
      />

      <PromptModal
        isOpen={!!cancelPromptItem}
        onClose={() => setCancelPromptItem(null)}
        onSubmit={(val) => {
          if (cancelPromptItem) {
            cancelMutation.mutate({ id: cancelPromptItem._id, reason: val });
          }
        }}
        title="Cancel Booking"
        message="Please provide a reason for cancelling this booking:"
        placeholder="e.g. Customer requested cancellation"
        submitText="Cancel Booking"
      />
    </div>
  );
}
