'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'accent';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
}

interface SkeletonProps {
  height?: number;
  width?: string;
  className?: string;
}

export function Skeleton({ height = 16, width = '100%', className }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ height, width }}
    />
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>}
      <span>{message}</span>
    </div>
  );
}
