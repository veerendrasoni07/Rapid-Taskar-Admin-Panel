import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Eye,
  SlidersHorizontal,
  X
} from 'lucide-react';

export default function Payouts() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'WITHDRAWALS' | 'WALLETS'>('WITHDRAWALS');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [page] = useState(1);

  // Modals state
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [adjustModal, setAdjustModal] = useState<any | null>(null);
  const [historyModal, setHistoryModal] = useState<any | null>(null);

  // Form inputs
  const [transactionRef, setTransactionRef] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // 1. Payout stats query
  const { data: statsData } = useQuery({
    queryKey: ['payoutStats'],
    queryFn: () => adminService.getPayoutStats(),
  });

  const stats = statsData?.data || {
    totalEarned: 0,
    totalWithdrawn: 0,
    totalCommissionPaid: 0,
    totalCommissionDue: 0,
    totalAvailableBalance: 0,
    totalReservedBalance: 0,
    walletsCount: 0,
    withdrawals: { pending: { count: 0, amount: 0 }, approved: { count: 0, amount: 0 } },
    commissionPercentage: 10,
  };

  // 2. Withdrawals query
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['adminWithdrawals', page, statusFilter, searchTerm],
    queryFn: () => adminService.getWithdrawals({ page, status: statusFilter, search: searchTerm }),
    enabled: activeTab === 'WITHDRAWALS',
  });

  // 3. Wallets query
  const { data: walletsData, isLoading: walletsLoading } = useQuery({
    queryKey: ['adminWallets', page, searchTerm],
    queryFn: () => adminService.getWallets({ page, search: searchTerm }),
    enabled: activeTab === 'WALLETS',
  });

  // 4. Wallet details query for history modal
  const { data: walletDetailsData, isLoading: walletDetailsLoading } = useQuery({
    queryKey: ['walletDetails', historyModal?.professional?._id || historyModal?._id],
    queryFn: () => adminService.getWalletDetails(historyModal?.professional?._id || historyModal?._id),
    enabled: !!historyModal,
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.approveWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminWallets'] });
      queryClient.invalidateQueries({ queryKey: ['payoutStats'] });
      setApproveModal(null);
      setTransactionRef('');
      setApproveNotes('');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminService.rejectWithdrawal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['adminWallets'] });
      queryClient.invalidateQueries({ queryKey: ['payoutStats'] });
      setRejectModal(null);
      setRejectionReason('');
      setRejectNotes('');
    },
  });

  // Adjust Mutation
  const adjustMutation = useMutation({
    mutationFn: ({ proId, data }: { proId: string; data: any }) => adminService.adjustWalletBalance(proId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWallets'] });
      queryClient.invalidateQueries({ queryKey: ['payoutStats'] });
      setAdjustModal(null);
      setAdjustAmount('');
      setAdjustReason('');
    },
  });

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModal) return;
    approveMutation.mutate({
      id: approveModal._id,
      data: {
        transactionReference: transactionRef,
        notes: approveNotes,
      },
    });
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal || !rejectionReason.trim()) return;
    rejectMutation.mutate({
      id: rejectModal._id,
      data: {
        rejectionReason,
        notes: rejectNotes,
      },
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModal || !adjustAmount || !adjustReason.trim()) return;
    const proId = adjustModal.professional?._id || adjustModal.professional || adjustModal._id;
    adjustMutation.mutate({
      proId,
      data: {
        type: adjustType,
        amount: parseFloat(adjustAmount),
        reason: adjustReason,
      },
    });
  };

  // Withdrawals table columns
  const withdrawalColumns: Column<any>[] = [
    {
      header: 'ID',
      cell: (item) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {item.withdrawalId || item._id?.substring(0, 8)}
        </span>
      ),
    },
    {
      header: 'Professional',
      cell: (item) => (
        <div>
          <div className="font-medium text-text">{item.user?.name || 'N/A'}</div>
          <div className="text-xs text-secondary">{item.user?.phone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (item) => (
        <span className="font-bold text-base text-text">
          ₹{item.amount?.toFixed(2) || '0.00'}
        </span>
      ),
    },
    {
      header: 'Method',
      cell: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-background border border-border">
          {item.payoutMethod === 'UPI' ? 'UPI' : 'Bank Transfer'}
        </span>
      ),
    },
    {
      header: 'Payout Details',
      cell: (item) => {
        const details = item.payoutDetails || {};
        if (item.payoutMethod === 'UPI') {
          return <span className="text-xs font-mono">{details.upiId || 'N/A'}</span>;
        }
        return (
          <div className="text-xs">
            <div className="font-medium">{details.accountHolderName || 'N/A'}</div>
            <div className="text-secondary font-mono">
              A/C: {details.accountNumber ? `••••${details.accountNumber.slice(-4)}` : 'N/A'} | IFSC: {details.ifscCode || ''}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status || 'PENDING'} />,
    },
    {
      header: 'Requested At',
      cell: (item) => (
        <span className="text-xs text-secondary">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (item) => {
        if (item.status === 'PENDING') {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setApproveModal(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-success rounded hover:opacity-90 transition-opacity"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => setRejectModal(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-error rounded hover:opacity-90 transition-opacity"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          );
        }
        if (item.status === 'APPROVED' && item.transactionReference) {
          return <span className="text-xs text-secondary font-mono">Ref: {item.transactionReference}</span>;
        }
        if (item.status === 'REJECTED' && item.rejectionReason) {
          return <span className="text-xs text-error truncate max-w-[120px]" title={item.rejectionReason}>{item.rejectionReason}</span>;
        }
        return <span className="text-xs text-secondary">-</span>;
      },
    },
  ];

  // Wallets table columns
  const walletColumns: Column<any>[] = [
    {
      header: 'Professional',
      cell: (item) => (
        <div>
          <div className="font-medium text-text">{item.user?.name || 'N/A'}</div>
          <div className="text-xs text-secondary">{item.user?.phone || ''}</div>
        </div>
      ),
    },
    {
      header: 'Available',
      cell: (item) => (
        <span className="font-semibold text-success">
          ₹{(item.availableBalance || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Reserved (Locked)',
      cell: (item) => (
        <span className="font-medium text-warning">
          ₹{(item.reservedBalance || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Pending Settlement',
      cell: (item) => (
        <span className="font-medium text-secondary">
          ₹{(item.pendingBalance || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Commission Due',
      cell: (item) => (
        item.commissionDue > 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-error/10 text-error">
            <AlertCircle className="w-3 h-3" /> ₹{item.commissionDue.toFixed(2)}
          </span>
        ) : (
          <span className="text-xs text-secondary">₹0.00</span>
        )
      ),
    },
    {
      header: 'Total Earned',
      cell: (item) => `₹${(item.totalEarned || 0).toFixed(2)}`,
    },
    {
      header: 'Total Withdrawn',
      cell: (item) => `₹${(item.totalWithdrawn || 0).toFixed(2)}`,
    },
    {
      header: 'Actions',
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdjustModal(item)}
            className="p-1.5 text-secondary hover:text-primary rounded hover:bg-background transition-colors"
            title="Manual Balance Adjustment"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => setHistoryModal(item)}
            className="p-1.5 text-secondary hover:text-primary rounded hover:bg-background transition-colors"
            title="View Ledger & History"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text">Professional Wallets & Payouts</h1>
          <p className="text-sm text-secondary">
            Manage professional balances, commission settlements, and review withdrawal requests.
          </p>
        </div>
      </div>

      {/* Financial Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Payouts</span>
            <Clock className="w-5 h-5 text-warning" />
          </div>
          <div className="text-2xl font-bold text-text">
            ₹{(stats.withdrawals?.pending?.amount || 0).toFixed(2)}
          </div>
          <div className="text-xs text-warning mt-1">
            {stats.withdrawals?.pending?.count || 0} requests awaiting transfer
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Commission Collected</span>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="text-2xl font-bold text-success">
            ₹{(stats.totalCommissionPaid || 0).toFixed(2)}
          </div>
          <div className="text-xs text-secondary mt-1">
            Platform rate: {stats.commissionPercentage}%
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commission Due (Unpaid)</span>
            <AlertCircle className="w-5 h-5 text-error" />
          </div>
          <div className="text-2xl font-bold text-error">
            ₹{(stats.totalCommissionDue || 0).toFixed(2)}
          </div>
          <div className="text-xs text-secondary mt-1">
            From cash on delivery bookings
          </div>
        </div>

        <div className="p-5 bg-surface border border-border rounded-xl">
          <div className="flex items-center justify-between text-secondary mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Disbursed Payouts</span>
            <ArrowUpRight className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-text">
            ₹{(stats.totalWithdrawn || 0).toFixed(2)}
          </div>
          <div className="text-xs text-secondary mt-1">
            Across {stats.walletsCount || 0} professional wallets
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('WITHDRAWALS')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'WITHDRAWALS'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-text'
            }`}
          >
            <Clock className="w-4 h-4" /> Withdrawal Requests
            {(stats.withdrawals?.pending?.count || 0) > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-warning text-white">
                {stats.withdrawals.pending.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('WALLETS')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'WALLETS'
                ? 'border-primary text-primary'
                : 'border-transparent text-secondary hover:text-text'
            }`}
          >
            <Wallet className="w-4 h-4" /> Professional Wallets
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary" />
          <input
            type="text"
            placeholder={activeTab === 'WITHDRAWALS' ? 'Search by ID, name, phone...' : 'Search professional name, phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {activeTab === 'WITHDRAWALS' && (
          <div className="flex items-center gap-2">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-primary text-white'
                    : 'bg-surface text-secondary hover:text-text border border-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Withdrawal Requests Table */}
      {activeTab === 'WITHDRAWALS' && (
        <DataTable
          columns={withdrawalColumns}
          data={withdrawalsData?.data?.requests || withdrawalsData?.requests || []}
          isLoading={withdrawalsLoading}
          keyExtractor={(item) => item._id}
        />
      )}

      {/* Tab 2: Professional Wallets Table */}
      {activeTab === 'WALLETS' && (
        <DataTable
          columns={walletColumns}
          data={walletsData?.data?.wallets || walletsData?.wallets || []}
          isLoading={walletsLoading}
          keyExtractor={(item) => item._id}
        />
      )}

      {/* Approve Withdrawal Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-text">Approve Withdrawal</h3>
              <button onClick={() => setApproveModal(null)} className="text-secondary hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              <div className="p-3 bg-background rounded-lg border border-border text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-secondary">Professional:</span>
                  <span className="font-semibold text-text">{approveModal.user?.name}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondary">Amount:</span>
                  <span className="font-bold text-success">₹{approveModal.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondary">Method:</span>
                  <span>{approveModal.payoutMethod}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-secondary">Account / UPI:</span>
                  <span className="font-mono text-xs">
                    {approveModal.payoutDetails?.upiId || approveModal.payoutDetails?.accountNumber}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1234567890"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Bank transfer completed on..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModal(null)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approveMutation.isPending}
                  className="px-4 py-2 text-sm font-medium bg-success text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {approveMutation.isPending ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Withdrawal Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-text">Reject Withdrawal</h3>
              <button onClick={() => setRejectModal(null)} className="text-secondary hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <p className="text-sm text-secondary">
                Rejecting will unlock and return <span className="font-bold text-text">₹{rejectModal.amount?.toFixed(2)}</span> back to the professional's available balance.
              </p>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Rejection Reason <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Invalid bank account details or KYC update required"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectMutation.isPending || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium bg-error text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {rejectMutation.isPending ? 'Rejecting...' : 'Reject & Restore Funds'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {adjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold text-text">Adjust Professional Balance</h3>
              <button onClick={() => setAdjustModal(null)} className="text-secondary hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="text-sm text-secondary">
                Professional: <span className="font-semibold text-text">{adjustModal.user?.name}</span>
                <br />
                Available Balance: <span className="font-bold text-success">₹{(adjustModal.availableBalance || 0).toFixed(2)}</span>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="adjustType"
                    checked={adjustType === 'CREDIT'}
                    onChange={() => setAdjustType('CREDIT')}
                  />
                  <span className="text-success font-medium">Credit (+)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="adjustType"
                    checked={adjustType === 'DEBIT'}
                    onChange={() => setAdjustType('DEBIT')}
                  />
                  <span className="text-error font-medium">Debit (-)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Amount (₹) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Reason <span className="text-error">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Bonus incentive or dispute resolution adjustment"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModal(null)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-secondary hover:bg-background"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustMutation.isPending || !adjustAmount || !adjustReason.trim()}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {adjustMutation.isPending ? 'Saving...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History & Ledger Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-surface border border-border rounded-xl p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-semibold text-text">Wallet Ledger & History</h3>
                <p className="text-xs text-secondary">{historyModal.user?.name} ({historyModal.user?.phone})</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="text-secondary hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {walletDetailsLoading ? (
                <div className="text-center py-8 text-secondary">Loading transactions...</div>
              ) : (walletDetailsData?.data?.transactions || []).length === 0 ? (
                <div className="text-center py-8 text-secondary">No ledger transactions found yet.</div>
              ) : (
                (walletDetailsData?.data?.transactions || []).map((t: any) => (
                  <div key={t._id} className="p-3 bg-background border border-border rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text">{t.type}</span>
                      <span className={`font-bold ${t.flow === 'CREDIT' ? 'text-success' : t.flow === 'DEBIT' ? 'text-error' : 'text-warning'}`}>
                        {t.flow === 'CREDIT' ? '+' : t.flow === 'DEBIT' ? '-' : ''}₹{t.amount?.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-secondary">{t.description}</div>
                    <div className="text-secondary font-mono">
                      Balance after: ₹{(t.balanceAfter?.availableBalance || 0).toFixed(2)} | {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setHistoryModal(null)}
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg text-secondary hover:bg-background"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
