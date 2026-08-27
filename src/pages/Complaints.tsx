import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import PromptModal from '../components/common/PromptModal';

export default function Complaints() {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmStatusUpdate, setConfirmStatusUpdate] = useState<{item: any, newStatus: string} | null>(null);
  const [resolvePromptItem, setResolvePromptItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['complaints', page, statusFilter],
    queryFn: () => adminService.getComplaints({ page, status: statusFilter }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string, status: string, resolution?: string }) => 
      adminService.updateComplaint(id, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
    }
  });

  const columns: Column<any>[] = [
    { 
      header: 'Customer', 
      cell: (item) => item.customer ? item.customer.name || `${item.customer.firstName || ''} ${item.customer.lastName || ''}`.trim() : 'Unknown' 
    },
    { 
      header: 'Professional', 
      cell: (item) => item.professional ? item.professional.name || `${item.professional.firstName || ''} ${item.professional.lastName || ''}`.trim() : 'N/A' 
    },
    { 
      header: 'Booking Date', 
      cell: (item) => item.booking?.bookingDate ? new Date(item.booking.bookingDate).toLocaleDateString() : 'N/A' 
    },
    { header: 'Subject/Reason', cell: (item) => item.subject || item.reason || 'Complaint' },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'OPEN'} /> 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <select 
          className="bg-transparent text-primary font-medium text-sm border-none cursor-pointer focus:ring-0 p-0"
          value={item.status || 'OPEN'}
          onChange={(e) => {
            const newStatus = e.target.value;
            if (newStatus === item.status) return;
            
            if (newStatus === 'RESOLVED') {
              setResolvePromptItem(item);
            } else {
              setConfirmStatusUpdate({ item, newStatus });
            }
          }}
        >
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolve</option>
          <option value="CLOSED">Close</option>
        </select>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Complaints</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <select 
          className="block w-full sm:w-48 rounded-md border-0 py-2 pl-3 pr-10 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={data?.complaints || data?.data?.complaints || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <ConfirmModal
        isOpen={!!confirmStatusUpdate}
        onClose={() => setConfirmStatusUpdate(null)}
        onConfirm={() => {
          if (confirmStatusUpdate) {
            statusMutation.mutate({ id: confirmStatusUpdate.item._id, status: confirmStatusUpdate.newStatus });
          }
        }}
        title="Update Complaint Status"
        message={`Are you sure you want to change this complaint's status to ${confirmStatusUpdate?.newStatus}?`}
        confirmText="Update Status"
      />

      <PromptModal
        isOpen={!!resolvePromptItem}
        onClose={() => setResolvePromptItem(null)}
        onSubmit={(val) => {
          if (resolvePromptItem) {
            statusMutation.mutate({ id: resolvePromptItem._id, status: 'RESOLVED', resolution: val });
          }
        }}
        title="Resolve Complaint"
        message="Please enter a resolution note for this complaint:"
        placeholder="e.g. Refunded customer and warned professional."
        submitText="Mark as Resolved"
      />
    </div>
  );
}
