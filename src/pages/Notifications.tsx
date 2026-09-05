import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminServices';
import { 
  Bell, 
  Send, 
  Users, 
  UserCheck, 
  Briefcase, 
  User, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Smartphone,
  RefreshCw
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    label: '🎉 Special Promotion',
    title: 'Special Offer Just for You!',
    body: 'Enjoy up to 20% off on your next booking. Use code RAPID20 at checkout!',
    type: 'INFO',
    targetRole: 'CUSTOMER',
  },
  {
    label: '⚠️ System Maintenance',
    title: 'Scheduled System Maintenance',
    body: 'RapidTaskar will undergo scheduled maintenance tonight from 2 AM to 4 AM.',
    type: 'SYSTEM',
    targetRole: 'ALL',
  },
  {
    label: '📢 Partner Update',
    title: 'Important Update for Professionals',
    body: 'Please review the updated service guidelines in your profile section.',
    type: 'INFO',
    targetRole: 'PROFESSIONAL',
  },
  {
    label: '⚡ Urgent Alert',
    title: 'Important Account Notification',
    body: 'Please check your recent activity and verify your account details.',
    type: 'SYSTEM',
    targetRole: 'ALL',
  },
];

export default function Notifications() {
  const queryClient = useQueryClient();

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<'ALL' | 'CUSTOMER' | 'PROFESSIONAL' | 'SPECIFIC'>('ALL');
  const [userId, setUserId] = useState('');
  const [type, setType] = useState<'INFO' | 'SYSTEM' | 'BOOKING' | 'PAYMENT'>('INFO');

  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch notification history
  const { data: historyData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminNotificationsHistory'],
    queryFn: () => adminService.getNotificationsHistory(),
  });

  // Mutation to send push notification
  const sendMutation = useMutation({
    mutationFn: (data: { title: string; body: string; targetRole: string; userId?: string; type: string }) =>
      adminService.sendNotification(data),
    onSuccess: (res) => {
      setFeedback({
        success: true,
        message: res.message || 'Push notification sent successfully!',
      });
      setTitle('');
      setBody('');
      setUserId('');
      queryClient.invalidateQueries({ queryKey: ['adminNotificationsHistory'] });
    },
    onError: (err: any) => {
      setFeedback({
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to send push notification',
      });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!title.trim()) {
      setFeedback({ success: false, message: 'Please enter a notification title' });
      return;
    }
    if (!body.trim()) {
      setFeedback({ success: false, message: 'Please enter notification content' });
      return;
    }
    if (targetRole === 'SPECIFIC' && !userId.trim()) {
      setFeedback({ success: false, message: 'Please enter a valid User ID' });
      return;
    }

    sendMutation.mutate({
      title: title.trim(),
      body: body.trim(),
      targetRole,
      userId: targetRole === 'SPECIFIC' ? userId.trim() : undefined,
      type,
    });
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setTitle(template.title);
    setBody(template.body);
    setType(template.type as any);
    setTargetRole(template.targetRole as any);
    setFeedback(null);
  };

  const notificationsList = historyData?.data?.notifications || [];
  const totalCount = historyData?.data?.pagination?.total || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Push Notifications Center
          </h1>
          <p className="text-sm text-secondary mt-1">
            Send real-time FCM push notifications directly to users, customers, and professionals.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-surface text-sm font-medium text-text hover:bg-background transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 text-secondary ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh History
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Total Sent Logs</p>
            <h3 className="text-2xl font-bold text-text mt-1">{totalCount}</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Target Audience</p>
            <h3 className="text-sm font-semibold text-text mt-1">All / Custom Roles</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Push Provider</p>
            <h3 className="text-sm font-semibold text-text mt-1">Firebase Cloud Messaging</h3>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Templates</p>
            <h3 className="text-sm font-semibold text-text mt-1">4 Presets Ready</h3>
          </div>
        </div>
      </div>

      {/* Main Grid: Form & Preview (Left) vs History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Create Notification Form + Live Preview */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Compose Push Notification
              </h2>
              <span className="text-xs text-secondary bg-background px-2.5 py-1 rounded-full border border-border">
                FCM Broadcast
              </span>
            </div>

            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`mb-5 p-4 rounded-xl flex items-start gap-3 border ${
                  feedback.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-error/10 border-error/20 text-error'
                }`}
              >
                {feedback.success ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm font-medium">{feedback.message}</div>
              </div>
            )}

            {/* Quick Templates Bar */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-secondary mb-2 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Quick Templates
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => applyTemplate(tmpl)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary/10 hover:border-primary/30 hover:text-primary text-secondary transition-all font-medium"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSend} className="space-y-5">
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetRole('ALL')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      targetRole === 'ALL'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-secondary hover:border-text/30'
                    }`}
                  >
                    <Users className="h-5 w-5 mb-1" />
                    All Users
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('CUSTOMER')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      targetRole === 'CUSTOMER'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-secondary hover:border-text/30'
                    }`}
                  >
                    <UserCheck className="h-5 w-5 mb-1" />
                    Customers
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('PROFESSIONAL')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      targetRole === 'PROFESSIONAL'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-secondary hover:border-text/30'
                    }`}
                  >
                    <Briefcase className="h-5 w-5 mb-1" />
                    Professionals
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetRole('SPECIFIC')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      targetRole === 'SPECIFIC'
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                        : 'border-border bg-surface text-secondary hover:border-text/30'
                    }`}
                  >
                    <User className="h-5 w-5 mb-1" />
                    Single User
                  </button>
                </div>
              </div>

              {/* Specific User ID Input */}
              {targetRole === 'SPECIFIC' && (
                <div>
                  <label className="block text-sm font-medium text-text mb-1">
                    User MongoDB ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 24-character User ID..."
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full rounded-lg border border-border px-3.5 py-2 text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                  />
                </div>
              )}

              {/* Category / Type */}
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Notification Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full rounded-lg border border-border px-3.5 py-2 text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INFO">General Information (INFO)</option>
                  <option value="SYSTEM">System Announcement (SYSTEM)</option>
                  <option value="BOOKING">Booking Update (BOOKING)</option>
                  <option value="PAYMENT">Payment Alert (PAYMENT)</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-text">Title</label>
                  <span className="text-xs text-secondary">{title.length} / 65</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={65}
                  placeholder="e.g. Exclusive Discount Offer!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border px-3.5 py-2 text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-text">Message Content</label>
                  <span className="text-xs text-secondary">{body.length} / 200</span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  placeholder="Write message details for push notification..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-lg border border-border px-3.5 py-2 text-sm bg-background text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sendMutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
              >
                {sendMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending Push Notification...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Push Notification Now
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Live Mobile Lockscreen Preview */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" />
              Live Mobile Notification Preview
            </h3>
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                    RT
                  </div>
                  <span className="text-xs font-semibold text-slate-200">RapidTaskar</span>
                  <span className="text-[10px] text-slate-400">• now</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {targetRole}
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-100">
                {title || 'Notification Title'}
              </div>
              <div className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {body || 'Notification body content will render here on user lockscreen/banner...'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sent History Logs */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-5">
              <div>
                <h2 className="text-lg font-semibold text-text flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Sent History & Logs
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Recent push notifications logged in system
                </p>
              </div>
              <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                {totalCount} total
              </span>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-secondary space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Loading notification history...</p>
              </div>
            ) : notificationsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-xl p-8">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center mb-3 text-secondary">
                  <Bell className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-text">No notifications sent yet</h3>
                <p className="text-xs text-secondary mt-1 max-w-xs">
                  Use the compose form on the left to send your first broadcast push notification.
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[680px] pr-1">
                {notificationsList.map((item: any) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl border border-border bg-background/50 hover:bg-background transition-colors space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text">
                          {item.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          item.type === 'SYSTEM'
                            ? 'bg-amber-500/10 text-amber-600'
                            : item.type === 'BOOKING'
                            ? 'bg-blue-500/10 text-blue-600'
                            : item.type === 'PAYMENT'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.type || 'INFO'}
                      </span>
                    </div>

                    <p className="text-xs text-secondary leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-secondary border-t border-border/50 pt-2 mt-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-secondary" />
                        <span>
                          Target:{' '}
                          <strong className="text-text">
                            {item.user?.name || item.user?.email || item.user?.phone || 'All / User'}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-secondary">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
