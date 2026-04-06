'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCustomers, useUpdateCustomer, useDeleteCustomer } from '@/hooks/useQueries';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatRelative, truncate } from '@/lib/utils';
import { useNotificationStore } from '@/stores';
import { Header } from '@/components/layout/Header';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema, type CustomerFormData } from '@/lib/schemas';
import { Search, Users, TrendingUp, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const SEGMENT_COLORS: Record<string, 'green' | 'blue' | 'accent' | 'gray'> = {
  vip: 'accent',
  repeat: 'blue',
  new: 'green',
  churned: 'gray',
};

function CustomerModal({
  workspaceId,
  customer,
  onClose,
}: {
  workspaceId: string | undefined;
  customer: any;
  onClose: () => void;
}) {
  const { mutateAsync: update } = useUpdateCustomer(workspaceId);
  const pushNotification = useNotificationStore((s) => s.push);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });

  const onSubmit = async (data: CustomerFormData) => {
    try {
      const res = await update({ id: customer.id, data });
      if (res.success) {
        pushNotification({ type: 'success', title: 'Customer Updated', message: 'Details saved successfully.' });
        onClose();
      } else {
        pushNotification({ type: 'error', title: 'Update Failed', message: res.error || 'Failed' });
      }
    } catch (e: any) {
      pushNotification({ type: 'error', title: 'Error', message: e.message });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Edit Customer</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" {...register('name')} />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" {...register('email')} />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number (optional)</label>
              <input className="form-input" {...register('phone')} />
              {errors.phone && <span className="form-error">{errors.phone.message}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={13} /> {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { data: customers, isLoading } = useCustomers(workspaceId);
  const { mutateAsync: remove } = useDeleteCustomer(workspaceId);
  const pushNotification = useNotificationStore((s) => s.push);

  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);
    try {
      const res = await remove(deletingCustomer.id);
      if (res.success) {
        pushNotification({ type: 'success', title: 'Customer Deleted', message: 'User and linked orders removed.' });
        setDeletingCustomer(null);
      } else {
        pushNotification({ type: 'error', title: 'Delete Failed', message: res.error });
      }
    } catch (e: any) {
      pushNotification({ type: 'error', title: 'Error', message: e.message });
    }
    setIsDeleting(false);
  };

  const filtered = useMemo(() => {
    if (!customers) return [];
    return customers.filter((c: any) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchSeg = segmentFilter === 'all' || c.segment === segmentFilter;
      return matchSearch && matchSeg;
    });
  }, [customers, search, segmentFilter]);

  const stats = useMemo(() => {
    if (!customers) return null;
    const vip = (customers as any[]).filter((c) => c.segment === 'vip').length;
    const churned = (customers as any[]).filter((c) => c.segment === 'churned').length;
    const totalRevenue = (customers as any[]).reduce((s, c) => s + c.totalSpent, 0);
    return { vip, churned, totalRevenue };
  }, [customers]);

  return (
    <div className="page-enter">
      <Header title="Customers" />

      <div className="page-body">
        {/* Summary tiles */}
        <div className="stat-grid mb-5">
          <div className="stat-tile">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{customers?.length ?? '—'}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">VIP</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats?.vip ?? '—'}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Churned</div>
            <div className="stat-value" style={{ color: 'var(--text-3)' }}>{stats?.churned ?? '—'}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">Total Lifetime Revenue</div>
            <div className="stat-value">{stats ? formatCurrency(stats.totalRevenue) : '—'}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="search-wrap">
            <Search size={13} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 140 }}
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
          >
            <option value="all">All segments</option>
            <option value="new">New</option>
            <option value="repeat">Repeat</option>
            <option value="vip">VIP</option>
            <option value="churned">Churned</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
            {filtered.length} customers
          </span>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Segment</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Last Order</th>
                  <th>Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><Skeleton height={14} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="No customers found" icon="👥" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{c.email}</td>
                      <td><Badge variant={SEGMENT_COLORS[c.segment]}>{c.segment}</Badge></td>
                      <td>{c.totalOrders}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(c.totalSpent)}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{formatRelative(c.lastOrderDate)}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-ghost btn-sm btn-icon"
                            onClick={() => setEditingCustomer(c)}
                            title="Edit customer"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button 
                            className="btn btn-ghost btn-sm btn-icon text-red"
                            onClick={() => setDeletingCustomer(c)}
                            title="Delete customer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingCustomer && (
        <CustomerModal
          workspaceId={workspaceId}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {deletingCustomer && (
        <ConfirmModal
          title="Delete Customer"
          message={`Are you sure you want to delete ${deletingCustomer.name}? This will also remove all their associated orders and statistics. This action cannot be undone.`}
          confirmLabel="Delete User"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingCustomer(null)}
        />
      )}
    </div>
  );
}
