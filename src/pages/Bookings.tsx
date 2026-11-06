import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PromptModal from '../components/common/PromptModal';
import AssignProfessionalModal from '../components/bookings/AssignProfessionalModal';
import { Search, MapPin, Copy, Check } from 'lucide-react';

export default function Bookings() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [assignModalBooking, setAssignModalBooking] = useState<any>(null);
  const [cancelPromptItem, setCancelPromptItem] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['bookings', page, searchTerm, statusFilter],
    queryFn: () => adminService.getBookings({ page, status: statusFilter, search: searchTerm })
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => adminService.cancelBooking(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns: Column<any>[] = [
    { 
      header: 'Booking ID', 
      cell: (item) => {
        const idToDisplay = item.bookingId || item._id;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {idToDisplay}
            </span>
            <button
              type="button"
              onClick={(e) => handleCopy(idToDisplay, e)}
              className="text-secondary hover:text-text p-0.5"
              title="Copy Booking ID"
            >
              {copiedId === idToDisplay ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        );
      }
    },
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Professional', 
      cell: (item) => item.professional ? item.professional.name || `${item.professional.firstName || ''} ${item.professional.lastName || ''}`.trim() : <span className="text-secondary italic">Unassigned</span>
    },
    { 
      header: 'Service', 
      cell: (item) => item.service?.name || 'Unknown' 
    },
    { 
      header: 'Pincode', 
      cell: (item) => (
        item.address?.pincode ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
            <MapPin className="w-3 h-3 text-emerald-600" />
            {item.address.pincode}
          </span>
        ) : (
          <span className="text-secondary text-xs">N/A</span>
        )
      )
    },
    { 
      header: 'Date & Time', 
      cell: (item) => item.bookingDate ? new Date(item.bookingDate).toLocaleString() : 'N/A' 
    },
    { 
      header: 'Amount', 
      cell: (item) => `₹${item.price?.toFixed(2) || '0.00'}` 
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
            className="text-primary hover:text-primary/80 font-medium text-sm disabled:opacity-40"
            onClick={() => setAssignModalBooking(item)}
            disabled={item.status !== 'PENDING' && item.status !== 'CONFIRMED'}
          >
            Assign
          </button>
          <button 
            className="text-error hover:text-error/80 font-medium text-sm disabled:opacity-40"
            disabled={item.status === 'CANCELLED' || item.status === 'COMPLETED'}
            onClick={() => setCancelPromptItem(item)}
          >
            Cancel
          </button>
        </div>
      )
    }
  ];

  // Client-side search filtering fallback for instant response
  const rawBookings = data?.data?.bookings || data?.bookings || [];
  const filteredBookings = searchTerm.trim()
    ? rawBookings.filter((b: any) => {
        const query = searchTerm.toLowerCase();
        return (
          b.bookingId?.toLowerCase().includes(query) ||
          b._id?.toLowerCase().includes(query) ||
          b.customer?.name?.toLowerCase().includes(query) ||
          b.customer?.phone?.includes(query) ||
          b.address?.pincode?.includes(query) ||
          b.service?.name?.toLowerCase().includes(query)
        );
      })
    : rawBookings;

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
            placeholder="Search by Booking ID, customer, or pincode..."
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
        data={filteredBookings}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      {/* Advanced Professional Assignment Modal */}
      <AssignProfessionalModal
        isOpen={!!assignModalBooking}
        onClose={() => setAssignModalBooking(null)}
        booking={assignModalBooking}
        onAssignSuccess={() => queryClient.invalidateQueries({ queryKey: ['bookings'] })}
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

