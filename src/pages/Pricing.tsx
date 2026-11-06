import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import DataTable, { Column } from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import PromptModal from '../components/common/PromptModal';

export default function Pricing() {
  const queryClient = useQueryClient();
  const [page] = useState(1);
  const [promptItem, setPromptItem] = useState<any>(null);

  // Offer Form State
  const [isOfferActive, setIsOfferActive] = useState<boolean>(true);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(150);
  const [minBookingAmount, setMinBookingAmount] = useState<number>(199);
  const [reservationTtlMinutes, setReservationTtlMinutes] = useState<number>(15);
  const [title, setTitle] = useState<string>('First Booking Special Discount');
  const [description, setDescription] = useState<string>('Special discount on your first home service booking!');
  const [showAuditTrail, setShowAuditTrail] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 1. Fetch Services for Base Pricing Table
  const { data, isLoading } = useQuery({
    queryKey: ['services_pricing', page],
    queryFn: () => adminService.getServices({ page }),
  });

  // 2. Fetch First-Booking Offer Config & Stats
  const { data: offerData } = useQuery({
    queryKey: ['admin_first_booking_offer'],
    queryFn: () => adminService.getFirstBookingOffer(),
  });

  useEffect(() => {
    if (offerData?.data?.offer) {
      const o = offerData.data.offer;
      setIsOfferActive(o.isActive ?? true);
      setDiscountType(o.discountType || 'PERCENTAGE');
      setDiscountValue(o.discountValue ?? 20);
      setMaxDiscountAmount(o.maxDiscountAmount ?? 150);
      setMinBookingAmount(o.minBookingAmount ?? 199);
      setReservationTtlMinutes(o.reservationTtlMinutes ?? 15);
      setTitle(o.title || 'First Booking Special Discount');
      setDescription(o.description || 'Special discount on your first home service booking!');
    }
  }, [offerData]);

  const priceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      adminService.updateService(id, { price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services_pricing'] });
    },
  });

  const offerMutation = useMutation({
    mutationFn: (payload: any) => adminService.updateFirstBookingOffer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_first_booking_offer'] });
      setSaveSuccessMsg('First-booking offer settings saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update offer settings');
    },
  });

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    offerMutation.mutate({
      title,
      description,
      isActive: isOfferActive,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountAmount: Number(maxDiscountAmount),
      minBookingAmount: Number(minBookingAmount),
      reservationTtlMinutes: Number(reservationTtlMinutes),
    });
  };

  const handleUpdatePrice = (item: any) => {
    setPromptItem(item);
  };

  const columns: Column<any>[] = [
    { header: 'Service', accessorKey: 'name' },
    {
      header: 'Category',
      cell: (item) => item.category?.name || item.category || 'Uncategorized',
    },
    {
      header: 'Base Price',
      cell: (item) => (
        <span className="font-semibold text-text">₹{item.price?.toFixed(2) || '0.00'}</span>
      ),
    },
    { header: 'Duration', cell: (item) => `${item.duration} mins` },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      header: 'Actions',
      cell: (item) => (
        <button
          className="text-primary hover:text-primary/80 font-medium text-sm transition"
          onClick={() => handleUpdatePrice(item)}
        >
          Update Price
        </button>
      ),
    },
  ];

  const stats = offerData?.data?.stats;
  const auditLogs = offerData?.data?.offer?.auditLog || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Pricing & Offers Management</h1>
          <p className="text-sm text-secondary mt-1">
            Configure dynamic first-booking promotional discounts and service catalog base rates.
          </p>
        </div>
      </div>

      {/* FIRST-BOOKING PROMOTIONAL OFFER PANEL */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              🎁
            </div>
            <div>
              <h2 className="text-lg font-bold text-text">First-Booking Offer Configuration</h2>
              <p className="text-xs text-secondary">
                Server-enforced, atomic first-order discount automatically applied to verified new customers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isOfferActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {isOfferActive ? '● Offer Active' : '○ Offer Disabled'}
            </span>
            <button
              type="button"
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="text-xs text-secondary hover:text-text border border-border px-3 py-1.5 rounded-lg hover:bg-surface-hover transition"
            >
              {showAuditTrail ? 'Hide Audit Trail' : `Audit Trail (${auditLogs.length})`}
            </button>
          </div>
        </div>

        {/* Realtime KPI Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div className="bg-background/50 border border-border rounded-lg p-4">
              <span className="text-xs text-secondary uppercase font-semibold">Total Redemptions</span>
              <p className="text-2xl font-bold text-text mt-1">{stats.totalRedeemed || 0}</p>
              <span className="text-[11px] text-emerald-600">Successfully confirmed</span>
            </div>
            <div className="bg-background/50 border border-border rounded-lg p-4">
              <span className="text-xs text-secondary uppercase font-semibold">Active In-Flight Checkouts</span>
              <p className="text-2xl font-bold text-text mt-1">{stats.totalReserved || 0}</p>
              <span className="text-[11px] text-amber-600">Reserved hold TTL</span>
            </div>
            <div className="bg-background/50 border border-border rounded-lg p-4">
              <span className="text-xs text-secondary uppercase font-semibold">Total Customer Savings</span>
              <p className="text-2xl font-bold text-primary mt-1">₹{(stats.totalDiscountGranted || 0).toFixed(2)}</p>
              <span className="text-[11px] text-secondary">Authoritative discount total</span>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveOffer} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Activation Switch */}
            <div className="flex flex-col justify-center bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase mb-2">Offer Activation</label>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="offerActiveToggle"
                  checked={isOfferActive}
                  onChange={(e) => setIsOfferActive(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer rounded"
                />
                <label htmlFor="offerActiveToggle" className="text-sm font-medium text-text cursor-pointer">
                  Enable First-Booking Offer
                </label>
              </div>
              <span className="text-[11px] text-secondary mt-1">
                When disabled, new customers pay regular base service catalog prices.
              </span>
            </div>

            {/* Discount Type */}
            <div className="bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase block mb-1.5">
                Discount Calculation Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
              >
                <option value="PERCENTAGE">Percentage (%) Discount</option>
                <option value="FIXED">Flat Fixed Amount (₹) Discount</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase block mb-1.5">
                {discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
              </label>
              <input
                type="number"
                min="0"
                max={discountType === 'PERCENTAGE' ? '100' : '10000'}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                required
              />
            </div>

            {/* Max Discount (Cap) */}
            <div className="bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase block mb-1.5">
                Maximum Discount Cap (₹)
              </label>
              <input
                type="number"
                min="0"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                disabled={discountType === 'FIXED'}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <span className="text-[11px] text-secondary mt-1 block">
                {discountType === 'PERCENTAGE' ? 'Caps maximum savings on high-value services' : 'Not applicable for flat discount'}
              </span>
            </div>

            {/* Minimum Booking Amount */}
            <div className="bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase block mb-1.5">
                Minimum Booking Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={minBookingAmount}
                onChange={(e) => setMinBookingAmount(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                required
              />
              <span className="text-[11px] text-secondary mt-1 block">
                Orders below this value are not eligible
              </span>
            </div>

            {/* Reservation TTL */}
            <div className="bg-background/30 p-4 rounded-lg border border-border">
              <label className="text-xs font-semibold text-secondary uppercase block mb-1.5">
                Checkout Reservation TTL (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={reservationTtlMinutes}
                onChange={(e) => setReservationTtlMinutes(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-primary"
                required
              />
              <span className="text-[11px] text-secondary mt-1 block">
                Time held during active customer checkout
              </span>
            </div>
          </div>

          {/* Customer Facing Banner Preview */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <p className="text-sm font-bold text-text">
                  Customer Offer Rule: Get {discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : `₹${discountValue} OFF`}
                  {discountType === 'PERCENTAGE' && maxDiscountAmount > 0 ? ` up to ₹${maxDiscountAmount}` : ''}
                  {minBookingAmount > 0 ? ` on bookings above ₹${minBookingAmount}` : ''}!
                </p>
                <p className="text-xs text-secondary mt-0.5">
                  Calculated dynamically server-side in minor paise units with atomic concurrency protection.
                </p>
              </div>
            </div>
          </div>

          {/* Actions & Feedback */}
          <div className="flex items-center justify-between pt-2">
            {saveSuccessMsg && (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                ✓ {saveSuccessMsg}
              </span>
            )}
            {!saveSuccessMsg && <div />}

            <button
              type="submit"
              disabled={offerMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-white font-medium text-sm px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {offerMutation.isPending ? 'Saving Settings...' : 'Save Offer Configuration'}
            </button>
          </div>
        </form>

        {/* Collapsible Audit Trail */}
        {showAuditTrail && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-bold text-text mb-3">Audit Trail / Revision History</h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs text-secondary">No recorded changes yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {auditLogs.slice().reverse().map((log: any, idx: number) => (
                  <div key={idx} className="bg-background/40 border border-border/80 p-3 rounded-lg text-xs flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-text">{log.changeSummary || 'Configuration modified'}</span>
                      <p className="text-[11px] text-secondary mt-0.5">
                        Changed by: {log.changedBy ? (typeof log.changedBy === 'object' ? log.changedBy.name || log.changedBy.email || 'Admin' : 'Admin User') : 'System'}
                      </p>
                    </div>
                    <span className="text-[11px] text-secondary whitespace-nowrap">
                      {new Date(log.changedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SERVICE CATALOG BASE PRICING TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-text">Service Catalog Base Prices</h2>
            <p className="text-sm text-secondary">
              Default baseline rates applied to service items before promotional discounts are calculated.
            </p>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.services || data?.data?.services || []}
          isLoading={isLoading}
          keyExtractor={(item) => item._id || Math.random().toString()}
        />
      </div>

      {/* Update Base Price Modal */}
      <PromptModal
        isOpen={!!promptItem}
        onClose={() => setPromptItem(null)}
        onSubmit={(val) => {
          const newPrice = parseFloat(val);
          if (!isNaN(newPrice) && newPrice >= 0 && promptItem) {
            priceMutation.mutate({ id: promptItem._id, price: newPrice });
          } else {
            alert('Invalid price entered');
          }
        }}
        title="Update Base Price"
        message={`Enter new price for ${promptItem?.name} (₹):`}
        defaultValue={promptItem?.price?.toString()}
        inputType="number"
        submitText="Update Price"
      />
    </div>
  );
}
