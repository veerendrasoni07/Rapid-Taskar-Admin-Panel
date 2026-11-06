import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminServices';
import { 
  X, Search, Star, MapPin, CheckCircle, Copy, Check, 
  AlertCircle, UserCheck, Briefcase 
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

interface AssignProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onAssignSuccess: () => void;
}

export default function AssignProfessionalModal({
  isOpen,
  onClose,
  booking,
  onAssignSuccess,
}: AssignProfessionalModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pincodeFilter, setPincodeFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('rating_desc');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [manualId, setManualId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const bookingPincode = booking?.address?.pincode || '';

  // Auto-set or reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setPincodeFilter('');
      setMinRating('');
      setSortBy('rating_desc');
      setStatusFilter('ACTIVE');
      setManualId('');
      setErrorMsg(null);
    }
  }, [isOpen, booking]);

  const { data, isLoading } = useQuery({
    queryKey: ['professionals-for-assign', searchTerm, pincodeFilter, minRating, sortBy, statusFilter],
    queryFn: () =>
      adminService.getProfessionals({
        search: searchTerm,
        pincode: pincodeFilter,
        minRating: minRating || undefined,
        sortBy: sortBy || undefined,
        status: statusFilter || undefined,
        limit: 50,
      }),
    enabled: isOpen && !!booking,
  });

  if (!isOpen || !booking) return null;

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAssign = async (professionalId: string) => {
    if (!booking) return;
    setErrorMsg(null);
    setIsAssigning(true);
    try {
      await adminService.assignBooking(booking._id, professionalId);
      onAssignSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to assign professional');
    } finally {
      setIsAssigning(false);
    }
  };

  const professionals = data?.data?.professionals || data?.professionals || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-border bg-surface sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-text flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Assign Professional
            </h2>
            <p className="text-xs text-secondary mt-0.5">
              Select or search a qualified professional based on rating, ID, and pincode.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-text hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Context Banner */}
        <div className="bg-primary/5 border-b border-border p-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-secondary font-medium block">Booking ID & Service</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                  {booking.bookingId || booking._id}
                </span>
                <span className="font-semibold text-text truncate">
                  {booking.service?.name || 'Service'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-secondary font-medium block">Customer</span>
              <span className="font-medium text-text mt-0.5 block truncate">
                {booking.customer?.name || `${booking.customer?.firstName || ''} ${booking.customer?.lastName || ''}`.trim() || 'Customer'}
                {booking.customer?.phone && ` (${booking.customer.phone})`}
              </span>
            </div>

            <div>
              <span className="text-xs text-secondary font-medium block">Location & Pincode</span>
              <div className="flex items-center gap-2 mt-0.5">
                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                <span className="text-text font-medium truncate text-xs">
                  {booking.address?.city || ''} 
                  {bookingPincode ? ` - Pincode: ` : ''}
                </span>
                {bookingPincode && (
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                    {bookingPincode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Filters Toolbar */}
        <div className="p-4 sm:px-6 border-b border-border bg-surface/50 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            
            {/* Search by ID / Name / Phone */}
            <div className="sm:col-span-5 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, name, phone, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-9 pr-3 text-text text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary bg-surface"
              />
            </div>

            {/* Pincode Filter */}
            <div className="sm:col-span-3 relative flex gap-1">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <MapPin className="h-3.5 w-3.5 text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Filter pincode..."
                  value={pincodeFilter}
                  onChange={(e) => setPincodeFilter(e.target.value)}
                  className="block w-full rounded-lg border-0 py-2 pl-8 pr-2 text-text text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary bg-surface"
                />
              </div>
              {bookingPincode && (
                <button
                  type="button"
                  onClick={() => setPincodeFilter(pincodeFilter === bookingPincode ? '' : bookingPincode)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors whitespace-nowrap ${
                    pincodeFilter === bookingPincode
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  }`}
                  title="Match booking pincode"
                >
                  🎯 {bookingPincode}
                </button>
              )}
            </div>

            {/* Rating Filter */}
            <div className="sm:col-span-2">
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-8 text-text text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="">All Ratings</option>
                <option value="4.5">⭐ 4.5 & up</option>
                <option value="4.0">⭐ 4.0 & up</option>
                <option value="3.5">⭐ 3.5 & up</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="sm:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full rounded-lg border-0 py-2 pl-3 pr-8 text-text text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="rating_desc">Highest Rated</option>
                <option value="jobs_desc">Most Jobs</option>
                <option value="rating_asc">Lowest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-secondary font-medium">Filter by Status:</span>
            <button
              type="button"
              onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? '' : 'ACTIVE')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-secondary hover:text-text'
              }`}
            >
              Active Only
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('')}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                statusFilter === ''
                  ? 'bg-primary text-white'
                  : 'bg-surface border border-border text-secondary hover:text-text'
              }`}
            >
              All Statuses
            </button>

            {(searchTerm || pincodeFilter || minRating || statusFilter !== 'ACTIVE') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPincodeFilter('');
                  setMinRating('');
                  setStatusFilter('ACTIVE');
                  setSortBy('rating_desc');
                }}
                className="ml-auto text-primary hover:underline text-xs font-medium"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Professionals List */}
        <div className="flex-1 overflow-y-auto p-4 sm:px-6 divide-y divide-border">
          {isLoading ? (
            <div className="py-12 text-center text-secondary">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-2" />
              <p className="text-sm">Loading eligible professionals...</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="w-10 h-10 text-secondary/50 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-text">No professionals found</h3>
              <p className="text-xs text-secondary mt-1 max-w-sm mx-auto">
                No professionals match your current filters for rating, ID, or pincode. Try clearing filters or entering a professional ID directly below.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {professionals.map((pro: any) => {
                const proPincode = pro.pincode || pro.serviceArea?.pincode || '';
                const matchesPincode =
                  bookingPincode &&
                  (proPincode === bookingPincode ||
                    (pro.serviceArea?.pincodes && pro.serviceArea.pincodes.includes(bookingPincode)));
                const matchesCity =
                  booking.address?.city &&
                  pro.serviceArea?.city &&
                  booking.address.city.toLowerCase() === pro.serviceArea.city.toLowerCase();

                const isCurrentAssigned =
                  booking.professional &&
                  (booking.professional._id === pro.user?._id || booking.professional._id === pro._id);

                return (
                  <div
                    key={pro._id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      matchesPincode
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10'
                        : 'border-border bg-surface hover:border-primary/50'
                    }`}
                  >
                    {/* Professional Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                        {pro.user?.name ? pro.user.name.charAt(0).toUpperCase() : 'P'}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-text text-sm truncate">
                            {pro.user?.name || 'Professional'}
                          </h4>

                          {/* Rating Badge */}
                          <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 dark:border-amber-800">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{(pro.rating || 5.0).toFixed(1)}</span>
                            {pro.ratingsCount !== undefined && (
                              <span className="text-secondary font-normal text-[11px]">
                                ({pro.ratingsCount})
                              </span>
                            )}
                          </div>

                          {/* Pincode Match Badge */}
                          {matchesPincode && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-semibold border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Pincode Match ({bookingPincode})
                            </span>
                          )}

                          {/* City Match Badge */}
                          {!matchesPincode && matchesCity && (
                            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium border border-blue-200 dark:border-blue-800">
                              City Match
                            </span>
                          )}

                          {isCurrentAssigned && (
                            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold">
                              Currently Assigned
                            </span>
                          )}
                        </div>

                        {/* ID & Contact info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
                          <div className="flex items-center gap-1 font-mono">
                            <span className="font-sans text-secondary">ID:</span>
                            <span className="text-text font-medium">{pro._id}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(pro._id, e)}
                              className="text-secondary hover:text-text p-0.5"
                              title="Copy ID"
                            >
                              {copiedId === pro._id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          {pro.user?.phone && (
                            <span>📞 {pro.user.phone}</span>
                          )}

                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{pro.completedJobsCount || pro.completedJobs || 0} jobs completed</span>
                          </div>
                        </div>

                        {/* Location Details */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-secondary pt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-secondary" />
                            {pro.serviceArea?.city || 'City N/A'}, {pro.serviceArea?.state || 'State N/A'}
                          </span>
                          {proPincode && (
                            <span className="font-mono bg-surface border border-border px-1.5 py-0.2 rounded text-[11px]">
                              Pin: {proPincode}
                            </span>
                          )}
                          <StatusBadge status={pro.status || 'ACTIVE'} />
                          <StatusBadge status={pro.kycStatus || 'NOT_SUBMITTED'} />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="shrink-0 flex items-center justify-end">
                      <button
                        type="button"
                        disabled={isAssigning || isCurrentAssigned || pro.status !== 'ACTIVE' || pro.kycStatus !== 'APPROVED'}
                        onClick={() => handleAssign(pro._id)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm ${
                          isCurrentAssigned
                            ? 'bg-muted text-secondary cursor-not-allowed'
                            : pro.status !== 'ACTIVE' || pro.kycStatus !== 'APPROVED'
                            ? 'bg-surface border border-border text-secondary/60 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                      >
                        {isAssigning ? 'Assigning...' : isCurrentAssigned ? 'Assigned' : 'Assign to Booking'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Direct Manual ID Assignment Footer */}
        <div className="p-4 sm:px-6 border-t border-border bg-surface sticky bottom-0 z-20">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs text-secondary sm:w-1/3">
              <span className="font-semibold text-text block">Direct Assignment by ID</span>
              Enter or paste a Professional ID or User ID directly:
            </div>
            <div className="flex-1 flex gap-2 w-full">
              <input
                type="text"
                placeholder="Enter Professional or User ID (e.g. 6a91c3330a34aea5a7e00986)"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="block flex-1 rounded-lg border-0 py-2 px-3 text-text text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary bg-surface font-mono"
              />
              <button
                type="button"
                disabled={!manualId.trim() || isAssigning}
                onClick={() => handleAssign(manualId.trim())}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
              >
                Assign by ID
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
