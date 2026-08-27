import { clsx } from 'clsx';

type StatusType = 'success' | 'warning' | 'error' | 'default' | 'info';

interface StatusBadgeProps {
  status: string;
  type?: StatusType;
}

const statusStyles: Record<StatusType, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  default: 'bg-secondary/10 text-secondary',
};

// Helper to map string to StatusType
export const mapStatusToType = (status: string): StatusType => {
  const normalized = status.toLowerCase();
  if (['completed', 'active', 'verified', 'paid', 'enabled'].includes(normalized)) return 'success';
  if (['pending', 'in-progress', 'in_progress', 'processing'].includes(normalized)) return 'warning';
  if (['cancelled', 'failed', 'rejected', 'disabled', 'inactive'].includes(normalized)) return 'error';
  return 'default';
};

export default function StatusBadge({ status, type }: StatusBadgeProps) {
  const badgeType = type || mapStatusToType(status);
  
  return (
    <span className={clsx(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
      statusStyles[badgeType]
    )}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
