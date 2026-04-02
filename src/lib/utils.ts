import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateStr: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), fmt);
}

export function formatRelative(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return 'Never';
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val);
}

export function calcStockPercentage(qty: number, threshold: number): number {
  if (threshold === 0) return 100;
  return Math.min(100, Math.round((qty / (threshold * 5)) * 100));
}

export function getStockStatus(qty: number, threshold: number): 'ok' | 'low' | 'critical' {
  if (qty <= 0) return 'critical';
  if (qty <= threshold) return 'low';
  return 'ok';
}

export function daysUntilExpiry(expiryDate: string | Date | null | undefined): number {
  if (!expiryDate) return 0;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateSKU(name: string, variant: string): string {
  const prefix = (name.slice(0, 3) + variant.slice(0, 2)).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CHIA-${prefix}-${suffix}`;
}

export function truncate(str: string, length = 40): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}

export function getGrowthArrow(growth: number): string {
  return growth >= 0 ? '↑' : '↓';
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
