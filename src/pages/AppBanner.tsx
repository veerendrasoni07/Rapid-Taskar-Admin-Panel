import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import ImageUpload from '../components/common/ImageUpload';
import { resolveImageUrl } from '../utils/image';
import {
  Sparkles,
  Palette,
  Smartphone,
  Save,
  RefreshCw,
  Check,
  MapPin,
  Search,
  User,
  ChevronDown,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  Sliders,
  Layers,
  AlertCircle
} from 'lucide-react';

interface PresetTheme {
  name: string;
  start: string;
  end: string;
  previewClass: string;
}

const PRESET_THEMES: PresetTheme[] = [
  { name: 'Warm Bronze', start: '#221607', end: '#422C12', previewClass: 'from-[#221607] to-[#422C12]' },
  { name: 'Festive Gold', start: '#8B6418', end: '#67440B', previewClass: 'from-[#8B6418] to-[#67440B]' },
  { name: 'Royal Crimson', start: '#991B1B', end: '#7F1D1D', previewClass: 'from-[#991B1B] to-[#7F1D1D]' },
  { name: 'Rapid Indigo', start: '#4F46E5', end: '#312E81', previewClass: 'from-[#4F46E5] to-[#312E81]' },
  { name: 'Fresh Emerald', start: '#059669', end: '#064E3B', previewClass: 'from-[#059669] to-[#064E3B]' },
  { name: 'Sunset Amber', start: '#EA580C', end: '#9A3412', previewClass: 'from-[#EA580C] to-[#9A3412]' },
  { name: 'Midnight Sleek', start: '#1F2937', end: '#111827', previewClass: 'from-[#1F2937] to-[#111827]' },
];

export default function AppBanner() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'editor' | 'themes'>('campaigns');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);

  const initialForm = {
    name: 'Summer AC Refresh Deal',
    campaignType: 'PROMOTIONAL',
    badgeLabel: 'LIMITED-TIME OFFER',
    headline: 'Get Your AC Ready for Summer!',
    description: 'Special discounts on AC servicing, filter replacement & deep cleaning.',
    offerHighlight: '20% OFF',
    offer: '',
    service: '',
    category: '',
    ctaText: 'Claim Offer',
    ctaAction: 'CLAIM_OFFER',
    targetAudience: 'ALL',
    priority: 1,
    startDate: '',
    endDate: '',
    image: '/uploads/dussehra_banner.jpg',
    gradientStart: '#221607',
    gradientEnd: '#422C12',
    primaryColor: '#635DA6',
    textColor: '#FFFFFF',
    isActive: true,
  };

  const [formData, setFormData] = useState(initialForm);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch all promotional campaigns
  const { data: campaignsData, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ['admin_promotional_campaigns'],
    queryFn: () => adminService.getCampaigns(),
  });

  // 2. Fetch all backend offers
  const { data: offersData } = useQuery({
    queryKey: ['admin_offers_list'],
    queryFn: () => adminService.getAllOffers(),
  });

  // 3. Fetch categories & services for targeting dropdowns
  const { data: categoriesData } = useQuery({
    queryKey: ['categories_list'],
    queryFn: () => adminService.getCategories(),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['services_list_dropdown'],
    queryFn: () => adminService.getServices({ limit: 100 }),
  });

  const campaigns = campaignsData?.data || [];
  const offers = offersData?.data || [];
  const categories = categoriesData?.data?.categories || [];
  const services = servicesData?.data?.services || [];

  // When offer dropdown changes, auto-fill offerHighlight if empty
  const handleOfferSelect = (offerId: string) => {
    const selectedOffer = offers.find((o: any) => o._id === offerId);
    setFormData((prev) => {
      let highlight = prev.offerHighlight;
      let cta = prev.ctaText;
      let action = prev.ctaAction;

      if (selectedOffer) {
        if (!highlight || highlight === '20% OFF' || highlight === '') {
          highlight = selectedOffer.discountType === 'PERCENTAGE'
            ? `${selectedOffer.discountValue}% OFF`
            : `Save ₹${selectedOffer.discountValue}`;
        }
        cta = 'Claim Offer';
        action = 'CLAIM_OFFER';
      }

      return {
        ...prev,
        offer: offerId,
        offerHighlight: highlight,
        ctaText: cta,
        ctaAction: action,
      };
    });
  };

  // Create or Update Campaign Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) => {
      if (editingCampaignId) {
        return adminService.updateCampaign(editingCampaignId, payload);
      }
      return adminService.createCampaign(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_promotional_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['heroBanner'] });
      setSaveSuccess(true);
      setErrorMessage('');
      setTimeout(() => {
        setSaveSuccess(false);
        setActiveTab('campaigns');
        setEditingCampaignId(null);
      }, 1500);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save campaign');
    },
  });

  // Toggle Active Mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleCampaignStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_promotional_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['heroBanner'] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_promotional_campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['heroBanner'] });
    },
  });

  const handleEdit = (c: any) => {
    setEditingCampaignId(c._id);
    setFormData({
      name: c.name || '',
      campaignType: c.campaignType || 'PROMOTIONAL',
      badgeLabel: c.badgeLabel || 'LIMITED-TIME OFFER',
      headline: c.headline || c.title || '',
      description: c.description || c.subtitle || '',
      offerHighlight: c.offerHighlight || '',
      offer: c.offer?._id || c.offer || '',
      service: c.service?._id || c.service || '',
      category: c.category?._id || c.category || '',
      ctaText: c.ctaText || 'Claim Offer',
      ctaAction: c.ctaAction || 'CLAIM_OFFER',
      targetAudience: c.targetAudience || 'ALL',
      priority: c.priority !== undefined ? c.priority : 1,
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '',
      endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '',
      image: c.image || '/uploads/dussehra_banner.jpg',
      gradientStart: c.gradientStart || '#221607',
      gradientEnd: c.gradientEnd || '#422C12',
      primaryColor: c.primaryColor || '#635DA6',
      textColor: c.textColor || '#FFFFFF',
      isActive: c.isActive ?? true,
    });
    setActiveTab('editor');
  };

  const handleCreateNew = () => {
    setEditingCampaignId(null);
    setFormData(initialForm);
    setActiveTab('editor');
  };

  const applyPreset = (preset: PresetTheme) => {
    setFormData((prev) => ({
      ...prev,
      gradientStart: preset.start,
      gradientEnd: preset.end,
      primaryColor: preset.start,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Home Screen Promotional Campaigns
          </h1>
          <p className="text-sm text-secondary mt-1">
            Complete management of promotional offer banners, seasonal campaigns, and live customer home screen hero displays.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'campaigns' && (
            <button
              type="button"
              onClick={handleCreateNew}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Campaign
            </button>
          )}

          {activeTab === 'editor' && (
            <button
              type="button"
              onClick={() => saveMutation.mutate(formData)}
              disabled={saveMutation.isPending}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving Campaign...
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Saved Successfully!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingCampaignId ? 'Update Campaign' : 'Publish Campaign'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'campaigns'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-text'
          }`}
        >
          <Layers className="w-4 h-4" />
          All Campaigns ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'editor'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          {editingCampaignId ? 'Edit Campaign' : 'Campaign Editor & Live Preview'}
        </button>

        <button
          onClick={() => setActiveTab('themes')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'themes'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-text'
          }`}
        >
          <Palette className="w-4 h-4" />
          Color Theme Presets
        </button>
      </div>

      {/* Feedback Alerts */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          Campaign published! The mobile app hero section will dynamically reflect these changes in real-time.
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          {errorMessage}
        </div>
      )}

      {/* TAB 1: ALL PROMOTIONAL CAMPAIGNS LIST */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {isCampaignsLoading ? (
            <div className="p-12 text-center text-secondary">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
              Loading campaigns from database...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-2xl p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-primary mx-auto opacity-50" />
              <h3 className="text-base font-semibold text-text">No Promotional Campaigns Yet</h3>
              <p className="text-sm text-secondary max-w-md mx-auto">
                Create seasonal deals, promotional discount banners, or festive offers to display on the customer home screen when customers don't have an active booking.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((c: any) => {
                const status = c.computedStatus || (c.isActive ? 'ACTIVE' : 'INACTIVE');

                return (
                  <div
                    key={c._id}
                    className="bg-surface border border-border rounded-xl p-4 shadow-sm hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Thumbnail & Content */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-border relative">
                        {c.image ? (
                          <img
                            src={resolveImageUrl(c.image)}
                            alt={c.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-bold">
                          P:{c.priority || 0}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-primary tracking-wide uppercase px-2 py-0.5 bg-primary/10 rounded">
                            {c.badgeLabel || 'LIMITED-TIME OFFER'}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800'
                                : status === 'EXPIRED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {status}
                          </span>
                          {c.offerHighlight && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                              {c.offerHighlight}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-text truncate">
                          {c.headline || c.name}
                        </h3>

                        <p className="text-xs text-secondary line-clamp-1">
                          {c.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-secondary pt-1 flex-wrap">
                          {c.offer && (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Tag className="w-3.5 h-3.5" />
                              Linked Offer: {c.offer.code || 'Offer'}
                            </span>
                          )}
                          {c.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Starts: {new Date(c.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {c.endDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Ends: {new Date(c.endDate).toLocaleDateString()}
                            </span>
                          )}
                          <span className="text-secondary/70">
                            Audience: <strong className="text-text">{c.targetAudience || 'ALL'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleMutation.mutate(c._id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                          c.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(c)}
                        className="p-2 text-secondary hover:text-primary hover:bg-primary/5 rounded-lg border border-border transition-colors"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete campaign "${c.name}"?`)) {
                            deleteMutation.mutate(c._id);
                          }
                        }}
                        className="p-2 text-secondary hover:text-error hover:bg-error/5 rounded-lg border border-border transition-colors"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMPAIGN EDITOR & LIVE PHONE PREVIEW */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Comprehensive Campaign Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Basic Content */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                Campaign Content & Headlines
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text mb-1">
                    Campaign Name (Admin Reference) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Summer AC Servicing Special 2026"
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Badge Tag Label
                  </label>
                  <input
                    type="text"
                    value={formData.badgeLabel}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badgeLabel: e.target.value }))}
                    placeholder="e.g. LIMITED-TIME OFFER, SEASONAL DEAL"
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Offer Highlight Pill
                  </label>
                  <input
                    type="text"
                    value={formData.offerHighlight}
                    onChange={(e) => setFormData((prev) => ({ ...prev, offerHighlight: e.target.value }))}
                    placeholder="e.g. 20% OFF, Save ₹150, Starting ₹249"
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-bold text-red-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text mb-1">
                    Promotional Headline *
                  </label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, headline: e.target.value }))}
                    placeholder="e.g. Get Your AC Ready for Summer!"
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-semibold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text mb-1">
                    Supporting Subtitle / Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Enjoy expert doorstep AC cleaning, gas check & maintenance."
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  />
                </div>
              </div>
            </div>

            {/* 2. Artwork & Image */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
                <Palette className="w-4 h-4 text-primary" />
                Promotional Image & Colors
              </h2>

              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                folder="banners"
                label="Promotional Artwork"
                helperText="Upload banner artwork or hero illustration (16:9 ratio recommended)"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Gradient Start Color (Top)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.gradientStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gradientStart: e.target.value }))}
                      className="w-9 h-9 p-0.5 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.gradientStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gradientStart: e.target.value }))}
                      className="flex-1 rounded-md border-0 py-1.5 px-3 text-text ring-1 ring-inset ring-border text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Gradient End Color (Bottom)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.gradientEnd}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gradientEnd: e.target.value }))}
                      className="w-9 h-9 p-0.5 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={formData.gradientEnd}
                      onChange={(e) => setFormData((prev) => ({ ...prev, gradientEnd: e.target.value }))}
                      className="flex-1 rounded-md border-0 py-1.5 px-3 text-text ring-1 ring-inset ring-border text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Offer Integration & CTA Configuration */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
                <Tag className="w-4 h-4 text-primary" />
                Backend Offer & Action Setup
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-text mb-1">
                    Link to Existing Backend Offer
                  </label>
                  <select
                    value={formData.offer}
                    onChange={(e) => handleOfferSelect(e.target.value)}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  >
                    <option value="">None (Generic Promotional Campaign)</option>
                    {offers.map((o: any) => (
                      <option key={o._id} value={o._id}>
                        {o.title} — {o.code} ({o.discountValue}{o.discountType === 'PERCENTAGE' ? '%' : '₹'} off)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-secondary mt-1">
                    Connecting to an offer ensures discount validation, first-booking checks, and coupon rules are verified authoritatively by the backend.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="e.g. Claim Offer, Book Now"
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    CTA Action Type
                  </label>
                  <select
                    value={formData.ctaAction}
                    onChange={(e) => setFormData((prev) => ({ ...prev, ctaAction: e.target.value }))}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  >
                    <option value="CLAIM_OFFER">Claim Offer (Validate Eligibility)</option>
                    <option value="EXPLORE_SERVICES">Explore Services Catalog</option>
                    <option value="CATEGORY_SERVICES">Open Specific Category</option>
                    <option value="BOOK_SERVICE">Book Specific Service</option>
                  </select>
                </div>

                {formData.ctaAction === 'CATEGORY_SERVICES' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text mb-1">
                      Target Service Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c: any) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.ctaAction === 'BOOK_SERVICE' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-text mb-1">
                      Target Service
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData((prev) => ({ ...prev, service: e.target.value }))}
                      className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                    >
                      <option value="">Select Service...</option>
                      {services.map((s: any) => (
                        <option key={s._id} value={s._id}>
                          {s.name} (₹{s.price})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Scheduling & Priority */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
                <Calendar className="w-4 h-4 text-primary" />
                Scheduling & Targeting Rules
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="FIRST_TIME">First-Time Customers Only</option>
                    <option value="RETURNING">Returning Customers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Display Priority (Higher = First)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Start Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text mb-1">
                    Expiration Date & Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <span className="text-sm font-medium text-text">Campaign Status</span>
                    <p className="text-xs text-secondary">
                      When deactivated, this campaign will not appear to customers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.isActive ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Mobile App Preview */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  Live Mobile Hero Preview
                </h2>
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="mx-auto w-[290px] rounded-[34px] overflow-hidden border-[6px] border-[#1E1E24] shadow-2xl bg-white select-none">
                {/* Header Container */}
                <div
                  className="p-3 text-white transition-colors duration-300"
                  style={{
                    background: `linear-gradient(to bottom, ${formData.gradientStart}, ${formData.gradientEnd})`,
                  }}
                >
                  {/* Location Row */}
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-4 h-4 text-white shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold leading-tight">Instant service in 45 mins</p>
                        <p className="text-[9px] text-white/80 truncate flex items-center gap-0.5">
                          Add delivery address <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                        </p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-white text-gray-800 flex items-center justify-center shrink-0 shadow-sm">
                      <User className="w-4 h-4 text-gray-800" />
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="mt-2.5 bg-white rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-sm">
                    <Search className="w-3.5 h-3.5 text-gray-700 shrink-0" />
                    <span className="text-[10px] text-gray-500 truncate">
                      Search for 'AC service'
                    </span>
                  </div>

                  {/* HERO BANNER: Dynamic Promotional Offer Presentation */}
                  <div className="mt-3 relative min-h-[160px] rounded-2xl overflow-hidden bg-white/10 border border-white/20 p-3 flex flex-col justify-between shadow-lg">
                    {/* Background Image / Texture if present */}
                    {formData.image && (
                      <img
                        src={resolveImageUrl(formData.image)}
                        alt="Promo Banner"
                        className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent pointer-events-none" />

                    {/* Top Tag & Offer Pill */}
                    <div className="relative z-10 flex items-center justify-between gap-1">
                      <span className="text-[8px] font-bold tracking-wider uppercase px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white border border-white/30">
                        {formData.badgeLabel || 'LIMITED-TIME OFFER'}
                      </span>
                      {formData.offerHighlight && (
                        <span className="text-[9px] font-extrabold text-white bg-red-600 px-2 py-0.5 rounded-full shadow-sm">
                          {formData.offerHighlight}
                        </span>
                      )}
                    </div>

                    {/* Middle Headline & Description */}
                    <div className="relative z-10 my-2 space-y-1">
                      <h4 className="text-sm font-bold text-white leading-tight drop-shadow-sm">
                        {formData.headline || 'Special Promotional Offer'}
                      </h4>
                      <p className="text-[9.5px] text-white/80 line-clamp-2 leading-relaxed">
                        {formData.description || 'Enjoy quality verified home services at exclusive discount rates.'}
                      </p>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="relative z-10 flex items-center justify-between pt-1">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-[#635DA6] text-white text-[10px] font-bold rounded-lg shadow-md">
                        {formData.ctaText || 'Claim Offer'}
                        <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-[8px] text-white/60">
                        Verified Experts
                      </span>
                    </div>
                  </div>
                </div>

                {/* Home Screen Body Mockup */}
                <div className="p-3 bg-white space-y-2">
                  <div className="h-2.5 w-28 bg-gray-200 rounded" />
                  <div className="flex gap-2">
                    <div className="w-16 h-20 rounded-xl bg-[#FFF9F0] border border-[#F3E7D3]" />
                    <div className="w-16 h-20 rounded-xl bg-[#FFF9F0] border border-[#F3E7D3]" />
                    <div className="w-16 h-20 rounded-xl bg-[#FFF9F0] border border-[#F3E7D3]" />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-secondary text-center pt-1">
                This preview shows how customers without active bookings will see this campaign on their home screen.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APP BAR THEMES */}
      {activeTab === 'themes' && (
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
            <Palette className="w-4 h-4 text-primary" />
            Select Preset Theme Colors
          </h2>
          <p className="text-xs text-secondary">
            Quickly set complementary gradient backgrounds for your campaign hero section.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRESET_THEMES.map((preset) => (
              <button
                type="button"
                key={preset.name}
                onClick={() => {
                  applyPreset(preset);
                  setActiveTab('editor');
                }}
                className="p-3 rounded-xl border border-border hover:border-primary text-left bg-background transition-all group"
              >
                <div
                  className="w-full h-12 rounded-lg shadow-sm mb-2 border border-black/10 group-hover:scale-105 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                  }}
                />
                <span className="text-xs font-semibold text-text block">
                  {preset.name}
                </span>
                <span className="text-[10px] text-secondary font-mono">
                  {preset.start}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
