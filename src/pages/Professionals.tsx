import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import KycReviewModal from '../components/professionals/KycReviewModal';
import { Search, ShieldAlert, FileCheck } from 'lucide-react';

export default function Professionals() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmStatusUpdate, setConfirmStatusUpdate] = useState<{ item: any; newStatus: string } | null>(null);
  const [selectedProForKyc, setSelectedProForKyc] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['professionals', page, searchTerm, statusFilter],
    queryFn: () => adminService.getProfessionals({ page, search: searchTerm, status: statusFilter }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminService.updateProfessionalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
  });

  const columns: Column<any>[] = [
    {
      header: 'Name',
      cell: (item) => item.user?.name || 'N/A',
    },
    {
      header: 'Phone',
      cell: (item) => item.user?.phone || 'N/A',
    },
    {
      header: 'KYC Status',
      cell: (item) => (
        <div className="flex items-center gap-2">
          {item.kycStatus === 'PENDING' && <ShieldAlert className="w-4 h-4 text-warning" />}
          <StatusBadge status={item.kycStatus || 'UNVERIFIED'} />
        </div>
      ),
    },
    {
      header: 'Account Status',
      cell: (item) => <StatusBadge status={item.status || 'ACTIVE'} />,
    },
    {
      header: 'Completed Jobs',
      cell: (item) => item.completedJobs || 0,
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedProForKyc(item._id)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
            title="Review KYC Documents"
          >
            <FileCheck className="w-3.5 h-3.5" /> Review KYC
          </button>
          <select
            className="bg-transparent text-primary font-medium text-sm border-none cursor-pointer focus:ring-0 p-0"
            value={item.status || 'ACTIVE'}
            onChange={(e) => {
              const newStatus = e.target.value;
              if (newStatus !== item.status) {
                setConfirmStatusUpdate({ item, newStatus });
              }
            }}
          >
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspend</option>
            <option value="REJECTED">Reject</option>
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text">Professionals & KYC Verification</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-secondary" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
            placeholder="Search professionals by name or phone..."
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
          <option value="SUSPENDED">Suspended</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data?.professionals || []}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      {/* KYC Review Modal */}
      <KycReviewModal
        isOpen={!!selectedProForKyc}
        onClose={() => setSelectedProForKyc(null)}
        professionalId={selectedProForKyc}
      />

      {/* Account Status Confirmation */}
      <ConfirmModal
        isOpen={!!confirmStatusUpdate}
        onClose={() => setConfirmStatusUpdate(null)}
        onConfirm={() => {
          if (confirmStatusUpdate) {
            statusMutation.mutate({ id: confirmStatusUpdate.item._id, status: confirmStatusUpdate.newStatus });
          }
        }}
        title="Update Professional Account Status"
        message={`Are you sure you want to change this professional's account status to ${confirmStatusUpdate?.newStatus}?`}
        confirmText="Update Status"
        isDestructive={confirmStatusUpdate?.newStatus === 'REJECTED' || confirmStatusUpdate?.newStatus === 'SUSPENDED'}
      />
    </div>
  );
}
