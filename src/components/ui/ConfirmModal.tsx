'use client';

import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({ 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false
}: ConfirmModalProps) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="modal animate-in fade-in zoom-in duration-200" 
        style={{ maxWidth: 360, padding: 0 }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-full ${variant === 'danger' ? 'bg-red-soft text-red' : 'bg-primary-soft text-primary'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <p className="text-sm text-text-3 leading-relaxed">
            {message}
          </p>
        </div>
        <div className="bg-surface-2 p-3 flex justify-end gap-2 border-t border-border">
          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button 
            type="button" 
            className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
            autoFocus
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
