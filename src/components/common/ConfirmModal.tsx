import { AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDestructive = false
}: ConfirmModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-text/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="w-5 h-5 text-error" />}
            <h3 className="text-lg font-semibold text-text">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-secondary hover:text-text hover:bg-background rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-secondary text-sm">{message}</p>
        </div>
        <div className="p-4 bg-background border-t border-border flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text bg-surface border border-border hover:bg-border/50 rounded-md transition-colors"
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${isDestructive ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary/90'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
