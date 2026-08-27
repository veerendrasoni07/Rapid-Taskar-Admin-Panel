import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import { Search } from 'lucide-react';

export default function Customers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmStatusItem, setConfirmStatusItem] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, searchTerm, statusFilter],
    queryFn: () => adminService.getCustomers({ page, search: searchTerm, status: statusFilter })
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => adminService.updateCustomerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const columns: Column<any>[] = [
    { header: 'Name', cell: (item) => item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'N/A' },
    { header: 'Phone', accessorKey: 'phone' },
    { header: 'Email', accessorKey: 'email' },
    { 
      header: 'Status', 
      cell: (item) => <StatusBadge status={item.status || 'ACTIVE'} /> 
    },
    { 
      header: 'Joined', 
      cell: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A' 
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button 
          className={`${item.status === 'BLOCKED' ? 'text-success hover:text-success/80' : 'text-error hover:text-error/80'} font-medium text-sm`}
          onClick={() => setConfirmStatusItem(item)}
        >
          {item.status === 'BLOCKED' ? 'Unblock' : 'Block'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Customers</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-text ring-1 ring-inset ring-border placeholder:text-secondary focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
            placeholder="Search customers..."
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
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <DataTable 
        columns={columns}
        data={data?.data?.customers || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      <ConfirmModal
        isOpen={!!confirmStatusItem}
        onClose={() => setConfirmStatusItem(null)}
        onConfirm={() => {
          if (confirmStatusItem) {
            const newStatus = confirmStatusItem.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
            statusMutation.mutate({ id: confirmStatusItem._id, status: newStatus });
          }
        }}
        title={`${confirmStatusItem?.status === 'BLOCKED' ? 'Unblock' : 'Block'} Customer`}
        message={`Are you sure you want to ${confirmStatusItem?.status === 'BLOCKED' ? 'unblock' : 'block'} this customer?`}
        confirmText={confirmStatusItem?.status === 'BLOCKED' ? 'Unblock' : 'Block'}
        isDestructive={confirmStatusItem?.status !== 'BLOCKED'}
      />
    </div>
  );
}
