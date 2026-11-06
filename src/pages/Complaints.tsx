import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import PromptModal from '../components/common/PromptModal';
import { 
  Search, 
  Send, 
  User, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Wrench, 
  CheckCircle, 
  X, 
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  PROFESSIONAL_NOT_ARRIVED: 'Pro Did Not Arrive',
  PROFESSIONAL_ARRIVED_LATE: 'Pro Arrived Late',
  POOR_SERVICE_QUALITY: 'Poor Service Quality',
  SERVICE_NOT_COMPLETED: 'Service Incomplete',
  PAYMENT_REFUND_ISSUE: 'Payment / Refund Issue',
  PROFESSIONAL_BEHAVIOUR: 'Pro Behaviour Concern',
  CANCELLATION_ISSUE: 'Cancellation Issue',
  OTHER: 'General Support',
};

export default function Complaints() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected complaint for deep view & chat
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Modals
  const [confirmStatusUpdate, setConfirmStatusUpdate] = useState<{ id: string; status: string } | null>(null);
  const [resolvePromptItem, setResolvePromptItem] = useState<{ id: string } | null>(null);

  // Query: complaints list
  const { data, isLoading } = useQuery({
    queryKey: ['complaints', page, statusFilter, categoryFilter, searchTerm],
    queryFn: () =>
      adminService.getComplaints({
        page,
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
      }),
  });

  // Query: single complaint details for Drawer
  const {
    data: detailData,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['complaintDetail', selectedComplaintId],
    queryFn: () => adminService.getComplaintById(selectedComplaintId!),
    enabled: !!selectedComplaintId,
  });

  const activeComplaint = detailData?.complaint || detailData?.data?.complaint;

  // Mutation: Status update
  const statusMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution?: string }) =>
      adminService.updateComplaint(id, { status, resolution }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      if (selectedComplaintId) {
        refetchDetail();
      }
    },
  });

  // Mutation: Send reply message
  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      adminService.sendComplaintReply(id, message),
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      refetchDetail();
    },
  });

  const handleSendReply = () => {
    if (!selectedComplaintId || !replyMessage.trim() || replyMutation.isPending) return;
    replyMutation.mutate({ id: selectedComplaintId, message: replyMessage.trim() });
  };

  const complaintsList = data?.complaints || data?.data?.complaints || [];
  const pagination = data?.pagination || data?.data?.pagination || { page: 1, totalPages: 1 };

  const columns: Column<any>[] = [
    {
      header: 'Ticket #',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded inline-block">
          {item.ticketNumber || (item._id ? `#${item._id.slice(-6).toUpperCase()}` : 'TCK')}
        </span>
      ),
    },
    {
      header: 'Booking Code',
      cell: (item) => (
        <span className="font-mono text-xs font-semibold text-text bg-background border border-border px-2 py-0.5 rounded">
          {item.bookingCode || item.booking?.bookingId || (item.booking?._id ? item.booking._id.slice(-8).toUpperCase() : 'N/A')}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (item) => (
        <div>
          <div className="font-medium text-text text-sm">
            {item.customer?.name || 'Customer'}
          </div>
          <div className="text-xs text-secondary">{item.customer?.phone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Professional',
      cell: (item) => (
        <div>
          <div className="font-medium text-text text-sm">
            {item.professional?.name || 'Unassigned'}
          </div>
          {item.professional?.phone && (
            <div className="text-xs text-secondary">{item.professional.phone}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Category / Subject',
      cell: (item) => (
        <div className="max-w-xs">
          <span className="inline-block px-2 py-0.5 text-xs font-medium bg-secondary/10 text-secondary rounded-full mb-1">
            {CATEGORY_LABELS[item.category] || item.category || 'General'}
          </span>
          <div className="text-xs text-text font-medium truncate" title={item.subject || item.description}>
            {item.subject || item.description || 'Support Request'}
          </div>
        </div>
      ),
    },
    {
      header: 'Ticket Status',
      cell: (item) => <StatusBadge status={item.status || 'OPEN'} />,
    },
    {
      header: 'Updated At',
      cell: (item) => (
        <span className="text-xs text-secondary">
          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedComplaintId(item._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Help & Support Complaints</h1>
          <p className="text-sm text-secondary mt-1">
            Review customer complaints, inspect complete booking context, and communicate with customers.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search by ticket #, booking code, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full py-2 px-3 bg-background border border-border rounded-lg text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <DataTable
        columns={columns}
        data={complaintsList}
        isLoading={isLoading}
        keyExtractor={(item) => item._id || Math.random().toString()}
      />

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-surface border border-border rounded-lg p-3">
          <span className="text-xs text-secondary">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total || complaintsList.length} tickets)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 text-xs border border-border rounded disabled:opacity-50 text-text hover:bg-background"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 text-xs border border-border rounded disabled:opacity-50 text-text hover:bg-background"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FULL SUPPORT TICKET DETAIL & CONVERSATION DRAWER / MODAL */}
      {/* ======================================================== */}
      {selectedComplaintId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-text/30 backdrop-blur-sm">
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-border">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  {activeComplaint?.ticketNumber || 'SUPPORT TICKET'}
                </span>
                <StatusBadge status={activeComplaint?.status || 'OPEN'} />
                {activeComplaint?.category && (
                  <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold bg-background border border-border rounded-full text-secondary">
                    {CATEGORY_LABELS[activeComplaint.category] || activeComplaint.category}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchDetail()}
                  title="Refresh"
                  className="p-1.5 text-secondary hover:text-text hover:bg-background rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedComplaintId(null)}
                  className="p-1.5 text-secondary hover:text-text hover:bg-background rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content area: Split into Context (Left) and Conversation (Right) */}
            {isDetailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : !activeComplaint ? (
              <div className="flex-1 flex items-center justify-center text-secondary">
                Complaint record not found.
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* LEFT COLUMN: Complete Booking & Complaint Context (5 cols) */}
                <div className="lg:col-span-5 border-r border-border p-5 overflow-y-auto space-y-4 bg-background/50">
                  {/* Status & Quick Action Bar */}
                  <div className="bg-surface border border-border rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Manage Status</span>
                      <select
                        value={activeComplaint.status || 'OPEN'}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus === 'RESOLVED') {
                            setResolvePromptItem({ id: activeComplaint._id });
                          } else {
                            setConfirmStatusUpdate({ id: activeComplaint._id, status: newStatus });
                          }
                        }}
                        className="text-xs font-semibold bg-primary/10 text-primary border-none rounded-md px-2 py-1 cursor-pointer focus:ring-0"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
                        <option value="RESOLVED">Resolve Ticket</option>
                        <option value="CLOSED">Close Ticket</option>
                      </select>
                    </div>
                  </div>

                  {/* Customer Details Card */}
                  <div className="bg-surface border border-border rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Customer Details
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-semibold text-text text-sm">
                        {activeComplaint.customer?.name || 'Customer'}
                      </div>
                      <div className="text-secondary">Phone: {activeComplaint.customer?.phone || 'Not available'}</div>
                      <div className="text-secondary">Email: {activeComplaint.customer?.email || 'Not available'}</div>
                      <div className="text-secondary font-mono text-[11px]">ID: {activeComplaint.customer?._id || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Booking Details Card */}
                  <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        Booking Snapshot
                      </div>
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {activeComplaint.bookingCode || activeComplaint.booking?.bookingId || 'N/A'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="text-secondary font-medium">Service</div>
                        <div className="text-text font-semibold text-sm">
                          {activeComplaint.booking?.service?.name || 'Service'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-secondary">Scheduled Date</div>
                          <div className="text-text font-medium">
                            {activeComplaint.booking?.bookingDate
                              ? new Date(activeComplaint.booking.bookingDate).toLocaleString()
                              : 'Not available'}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary">Booking Status</div>
                          <div className="mt-0.5">
                            <StatusBadge status={activeComplaint.booking?.status || 'N/A'} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-secondary">Amount</div>
                          <div className="text-text font-semibold flex items-center">
                            <DollarSign className="w-3 h-3 text-secondary" />
                            ₹{activeComplaint.booking?.price || 0}
                          </div>
                        </div>
                        <div>
                          <div className="text-secondary">Payment Method</div>
                          <div className="text-text font-medium uppercase">
                            {activeComplaint.booking?.paymentMethod || 'COD / Offline'}
                          </div>
                        </div>
                      </div>

                      {activeComplaint.booking?.address && (
                        <div>
                          <div className="text-secondary flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Service Address
                          </div>
                          <div className="text-text mt-0.5">
                            {activeComplaint.booking.address.fullAddress || ''},{' '}
                            {activeComplaint.booking.address.city || ''} - {activeComplaint.booking.address.pincode || ''}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Professional Details Card */}
                  <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                      <Wrench className="w-3.5 h-3.5 text-primary" />
                      Assigned Professional
                    </div>
                    {activeComplaint.professional ? (
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-text text-sm">
                          {activeComplaint.professional.name}
                        </div>
                        <div className="text-secondary">Phone: {activeComplaint.professional.phone || 'N/A'}</div>
                        <div className="text-secondary font-mono text-[11px]">ID: {activeComplaint.professional._id}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-secondary italic">
                        No professional was assigned to this booking when the complaint was filed.
                      </div>
                    )}
                  </div>

                  {/* Original Complaint Card */}
                  <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary uppercase tracking-wider">
                      <Info className="w-3.5 h-3.5 text-primary" />
                      Customer's Original Complaint
                    </div>
                    <div className="text-xs font-semibold text-text">
                      {activeComplaint.subject}
                    </div>
                    <div className="text-xs text-text/90 bg-background border border-border p-3 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {activeComplaint.description}
                    </div>
                  </div>

                  {/* Resolution Card if resolved */}
                  {activeComplaint.resolution && (
                    <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-success">
                        <CheckCircle className="w-4 h-4" /> Resolution Note
                      </div>
                      <div className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                        {activeComplaint.resolution}
                      </div>
                      {activeComplaint.resolvedAt && (
                        <div className="text-[11px] text-secondary">
                          Resolved on: {new Date(activeComplaint.resolvedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* RIGHT COLUMN: Conversation Thread & Reply Composer (7 cols) */}
                <div className="lg:col-span-7 flex flex-col h-full bg-surface">
                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4">
                    <div className="text-center">
                      <span className="text-[11px] font-medium text-secondary bg-background px-3 py-1 rounded-full border border-border">
                        Ticket opened on {new Date(activeComplaint.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {activeComplaint.messages && activeComplaint.messages.length > 0 ? (
                      activeComplaint.messages.map((msg: any, idx: number) => {
                        const isAdmin = msg.senderRole === 'ADMIN';
                        const isSystem = msg.senderRole === 'SYSTEM';

                        if (isSystem) {
                          return (
                            <div key={idx} className="text-center my-2">
                              <span className="text-xs text-secondary bg-background/80 px-3 py-1 rounded-md border border-border/50 inline-block">
                                {msg.message}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={idx}
                            className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-xs font-semibold text-text">
                                {isAdmin ? 'Support Team (Admin)' : msg.senderName || 'Customer'}
                              </span>
                              <span className="text-[10px] text-secondary">
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                                isAdmin
                                  ? 'bg-primary text-white rounded-tr-none shadow-sm'
                                  : 'bg-background border border-border text-text rounded-tl-none'
                              }`}
                            >
                              {msg.message}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-secondary text-xs py-8">
                        No additional conversation messages yet.
                      </div>
                    )}
                  </div>

                  {/* Reply Composer Box */}
                  <div className="p-4 border-t border-border bg-surface">
                    <div className="flex items-end gap-2 bg-background border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                      <textarea
                        rows={2}
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        placeholder="Type a response to the customer (press Enter to send)..."
                        className="flex-1 bg-transparent border-none text-xs text-text placeholder-secondary focus:outline-none resize-none px-2 py-1"
                      />
                      <button
                        onClick={handleSendReply}
                        disabled={!replyMessage.trim() || replyMutation.isPending}
                        className="px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        {replyMutation.isPending ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Reply</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-secondary">
                      <span>Customer will receive an immediate in-app notification when you reply.</span>
                      <span className="font-mono">{replyMessage.length}/2500</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Status Update */}
      <ConfirmModal
        isOpen={!!confirmStatusUpdate}
        onClose={() => setConfirmStatusUpdate(null)}
        onConfirm={() => {
          if (confirmStatusUpdate) {
            statusMutation.mutate({
              id: confirmStatusUpdate.id,
              status: confirmStatusUpdate.status,
            });
            setConfirmStatusUpdate(null);
          }
        }}
        title="Update Ticket Status"
        message={`Are you sure you want to change this ticket's status to ${confirmStatusUpdate?.status}?`}
        confirmText="Confirm Status Change"
      />

      {/* Resolution Note Prompt Modal */}
      <PromptModal
        isOpen={!!resolvePromptItem}
        onClose={() => setResolvePromptItem(null)}
        onSubmit={(val) => {
          if (resolvePromptItem) {
            statusMutation.mutate({
              id: resolvePromptItem.id,
              status: 'RESOLVED',
              resolution: val,
            });
            setResolvePromptItem(null);
          }
        }}
        title="Resolve Support Ticket"
        message="Please provide an official resolution note explaining how the issue was resolved:"
        placeholder="e.g. Refund issued of ₹300, and technician re-dispatched for complete re-service."
        submitText="Mark as Resolved"
      />
    </div>
  );
}
