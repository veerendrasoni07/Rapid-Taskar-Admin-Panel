import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  submitText?: string;
  cancelText?: string;
  inputType?: 'text' | 'number';
}

export default function PromptModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  message, 
  placeholder = "", 
  defaultValue = "",
  submitText = "Submit", 
  cancelText = "Cancel",
  inputType = 'text'
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) setValue(defaultValue);
  }, [isOpen, defaultValue]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="fixed inset-0 bg-text/20 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="p-1 text-secondary hover:text-text hover:bg-background rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            <p className="text-secondary text-sm">{message}</p>
            <input
              type={inputType}
              required
              step={inputType === 'number' ? "0.01" : undefined}
              className="w-full rounded-md border-0 py-2 px-3 text-text ring-1 ring-inset ring-border focus:ring-2 focus:ring-primary sm:text-sm"
              placeholder={placeholder}
              value={value}
              onChange={e => setValue(e.target.value)}
              autoFocus
            />
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
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
