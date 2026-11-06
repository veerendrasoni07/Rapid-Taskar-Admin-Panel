import React, { useState, useEffect } from 'react';
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
  ChevronDown 
} from 'lucide-react';

interface PresetTheme {
  name: string;
  start: string;
  end: string;
  previewClass: string;
}

const PRESET_THEMES: PresetTheme[] = [
  { name: 'Festive Gold', start: '#8B6418', end: '#67440B', previewClass: 'from-[#8B6418] to-[#67440B]' },
  { name: 'Royal Crimson', start: '#991B1B', end: '#7F1D1D', previewClass: 'from-[#991B1B] to-[#7F1D1D]' },
  { name: 'Rapid Indigo', start: '#4F46E5', end: '#312E81', previewClass: 'from-[#4F46E5] to-[#312E81]' },
  { name: 'Fresh Emerald', start: '#059669', end: '#064E3B', previewClass: 'from-[#059669] to-[#064E3B]' },
  { name: 'Deep Ocean', start: '#0284C7', end: '#0F172A', previewClass: 'from-[#0284C7] to-[#0F172A]' },
  { name: 'Sunset Amber', start: '#EA580C', end: '#9A3412', previewClass: 'from-[#EA580C] to-[#9A3412]' },
  { name: 'Midnight Sleek', start: '#1F2937', end: '#111827', previewClass: 'from-[#1F2937] to-[#111827]' },
];

export default function AppBanner() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    image: '',
    titlePrefix: 'WISHING YOU A HAPPY',
    title: 'Dussehra',
    subtitle: '',
    primaryColor: '#8B6418',
    gradientStart: '#8B6418',
    gradientEnd: '#67440B',
    textColor: '#FFFFFF',
    isActive: true,
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['heroBanner'],
    queryFn: () => adminService.getBanner(),
  });

  useEffect(() => {
    if (data?.data) {
      setFormData({
        image: data.data.image || '',
        titlePrefix: data.data.titlePrefix ?? 'WISHING YOU A HAPPY',
        title: data.data.title ?? 'Dussehra',
        subtitle: data.data.subtitle || '',
        primaryColor: data.data.primaryColor || '#8B6418',
        gradientStart: data.data.gradientStart || '#8B6418',
        gradientEnd: data.data.gradientEnd || '#67440B',
        textColor: data.data.textColor || '#FFFFFF',
        isActive: data.data.isActive ?? true,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updatedData: typeof formData) => adminService.updateBanner(updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroBanner'] });
      setSaveSuccess(true);
      setErrorMessage('');
      setTimeout(() => setSaveSuccess(false), 3500);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to save banner settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const applyPreset = (preset: PresetTheme) => {
    setFormData((prev) => ({
      ...prev,
      primaryColor: preset.start,
      gradientStart: preset.start,
      gradientEnd: preset.end,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Home Screen Hero Banner & App Bar
          </h1>
          <p className="text-sm text-secondary mt-1">
            Customize the background hero banner image, festive greeting typography, and app bar gradient colors for the mobile app in real-time.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={updateMutation.isPending || isLoading}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 mr-2 text-white" />
              Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-success/10 border border-success/30 rounded-xl text-success text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Banner and app bar styling saved! The mobile app will now display these colors and image.
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-xl text-error text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Controls & Configuration */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Hero Image Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              Hero Banner Image
            </h2>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              folder="banners"
              label="Banner Artwork Image"
              helperText="Upload any festive, promotional or branding banner (16:9 or panoramic ratio recommended)"
            />
          </div>

          {/* 2. Color Scheme & App Bar Gradient */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-text flex items-center gap-2 border-b border-border pb-3">
              <Palette className="w-4 h-4 text-primary" />
              App Bar & Header Gradient Colors
            </h2>

            {/* Presets */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-2">
                Quick Theme Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_THEMES.map((preset) => {
                  const isSelected =
                    formData.gradientStart.toLowerCase() === preset.start.toLowerCase() &&
                    formData.gradientEnd.toLowerCase() === preset.end.toLowerCase();
                  return (
                    <button
                      type="button"
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                          : 'border-border hover:border-primary/40 bg-background'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-md shadow-sm shrink-0 border border-black/10"
                        style={{
                          background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                        }}
                      />
                      <span className="text-xs font-medium text-text truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Gradient Start (App Bar Top)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradientStart}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientStart: e.target.value,
                        primaryColor: e.target.value,
                      }))
                    }
                    className="w-10 h-10 p-0.5 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.gradientStart}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gradientStart: e.target.value,
                        primaryColor: e.target.value,
                      }))
                    }
                    placeholder="#8B6418"
                    className="flex-1 rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Gradient End (Banner Bottom)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.gradientEnd}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, gradientEnd: e.target.value }))
                    }
                    className="w-10 h-10 p-0.5 rounded-lg border border-border cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={formData.gradientEnd}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, gradientEnd: e.target.value }))
                    }
                    placeholder="#67440B"
                    className="flex-1 rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Typography Card */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-text border-b border-border pb-3">
              Banner Greeting Typography
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Prefix Tagline
                </label>
                <input
                  type="text"
                  value={formData.titlePrefix}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, titlePrefix: e.target.value }))
                  }
                  placeholder="e.g. WISHING YOU A HAPPY"
                  className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Main Headline / Festival
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Dussehra or Diwali"
                  className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm bg-background"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Live Mobile App Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h2 className="text-sm font-semibold text-text flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                Live Mobile Header Preview
              </h2>
              <span className="text-xs text-secondary bg-background px-2 py-0.5 rounded-full border border-border">
                Realtime
              </span>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="mx-auto w-[290px] rounded-[32px] overflow-hidden border-[6px] border-[#1E1E24] shadow-2xl bg-white select-none">
              {/* Dynamic Gradient Top Header */}
              <div
                className="p-3 text-white transition-colors duration-300"
                style={{
                  background: `linear-gradient(to bottom, ${formData.gradientStart}, ${formData.gradientEnd})`,
                }}
              >
                {/* Location row */}
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-4 h-4 text-white shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold leading-tight">In 44 minutes</p>
                      <p className="text-[9px] text-white/80 truncate flex items-center gap-0.5">
                        14/453 Kanchan Vihar... <ChevronDown className="w-2.5 h-2.5 shrink-0" />
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
                    Search for 'AC serv
                  </span>
                </div>

                {/* Hero Artwork Banner */}
                <div className="mt-2.5 relative h-28 rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
                  {formData.image ? (
                    <img
                      src={resolveImageUrl(formData.image)}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-[10px] text-white/60">No image chosen</div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

                  {/* Dynamic Typography */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <p className="text-[7.5px] font-semibold text-[#FBF1D5] tracking-widest uppercase">
                      {formData.titlePrefix || 'WISHING YOU A HAPPY'}
                    </p>
                    <h3 className="text-xl font-bold font-serif text-[#FFF9E6] tracking-wide drop-shadow-sm leading-tight">
                      {formData.title || 'Dussehra'}
                    </h3>
                  </div>
                </div>

                {/* Sample horizontal cards row */}
                <div className="mt-2 flex gap-1.5 overflow-hidden pb-1">
                  <div className="w-16 h-20 rounded-md bg-[#FFF7EA] p-1 flex flex-col shrink-0 shadow-sm">
                    <div className="flex-1 bg-amber-100 rounded relative overflow-hidden">
                      <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[6px] font-bold px-1 rounded">
                        20% off
                      </span>
                    </div>
                    <span className="text-[7px] text-gray-800 font-semibold text-center mt-1 truncate">
                      Grooming
                    </span>
                  </div>
                  <div className="w-16 h-20 rounded-md bg-[#FFF7EA] p-1 flex flex-col shrink-0 shadow-sm">
                    <div className="flex-1 bg-amber-100 rounded relative overflow-hidden">
                      <span className="absolute top-0.5 left-0.5 bg-red-600 text-white text-[6px] font-bold px-1 rounded">
                        20% off
                      </span>
                    </div>
                    <span className="text-[7px] text-gray-800 font-semibold text-center mt-1 truncate">
                      Cleaning
                    </span>
                  </div>
                  <div className="w-16 h-20 rounded-md bg-[#FFF7EA] p-1 flex flex-col shrink-0 shadow-sm">
                    <div className="flex-1 bg-amber-100 rounded relative overflow-hidden" />
                    <span className="text-[7px] text-gray-800 font-semibold text-center mt-1 truncate">
                      Wall panel
                    </span>
                  </div>
                  <div className="w-16 h-20 rounded-md bg-[#FFF7EA] p-1 flex flex-col shrink-0 shadow-sm">
                    <div className="flex-1 bg-amber-100 rounded relative overflow-hidden" />
                    <span className="text-[7px] text-gray-800 font-semibold text-center mt-1 truncate">
                      Spa
                    </span>
                  </div>
                </div>
              </div>

              {/* White body mockup */}
              <div className="p-3 bg-white space-y-2">
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-gray-100 h-10 rounded-lg" />
                  <div className="bg-gray-100 h-10 rounded-lg" />
                  <div className="bg-gray-100 h-10 rounded-lg" />
                  <div className="bg-gray-100 h-10 rounded-lg" />
                </div>
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-8 bg-gray-100 rounded-lg" />
              </div>
            </div>

            <p className="text-[11px] text-secondary text-center">
              Changes reflect instantly in the mobile app upon saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
