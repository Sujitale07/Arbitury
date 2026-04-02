'use client';

import { useState, useMemo, useEffect } from 'react';
import { useOrders, useUpdateOrderStatus, useProducts, useRecordManualSale } from '@/hooks/useQueries';
import { Header } from '@/components/layout/Header';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatRelative, truncate } from '@/lib/utils';
import { useNotificationStore } from '@/stores';
import type { Order } from '@/types';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { manualSaleSchema, type ManualSaleFormData } from '@/lib/schemas';
import { Plus, X, Search, ChevronDown, ShoppingBag } from 'lucide-react';

const STATUS_COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red' | 'gray'> = {
  delivered: 'green',
  shipped: 'blue',
  processing: 'yellow',
  pending: 'gray',
  cancelled: 'red',
};

const ALL_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
function ManualSaleModal({ onClose }: { onClose: () => void }) {
  const { data: products } = useProducts();
  const { mutateAsync: recordSale } = useRecordManualSale();
  const pushNotification = useNotificationStore((s) => s.push);
  const [complete, setComplete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManualSaleFormData>({
    resolver: zodResolver(manualSaleSchema),
    defaultValues: {
      items: [{ productId: '', quantity: 1 }],
      channel: 'market' as 'market' | 'wholesale',
      customerName: '',
      email: '',
      total: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

const selectedItems = watch('items');
  const calculatedTotal = useMemo(() => {
    if (!selectedItems || !Array.isArray(selectedItems)) return 0;
    return selectedItems.reduce((sum: number, item: any) => {
      const p = products?.find((prod: any) => prod.id === item.productId);
      const qty = Number(item.quantity) || 0;
      const price = p?.salePrice || 0;
      return sum + (price * qty);
    }, 0);
  }, [selectedItems, products]);

  useEffect(() => {
    setValue('total', calculatedTotal, { shouldValidate: true });
  }, [calculatedTotal, setValue]);

  const onSubmit = async (data: any) => {
    try {
      const res = await recordSale(data);
      if (res.success) {
        pushNotification({
          type: 'success',
          title: 'Sale Recorded',
          message: `Order ${res.data?.orderNumber || ''} has been created successfully.`,
        });
        setComplete(true);
        setTimeout(onClose, 1500);
      } else {
        pushNotification({
          type: 'error',
          title: 'Sale Failed',
          message: res.error || 'Check inventory levels and try again.',
        });
      }
    } catch (e: any) {
      pushNotification({
        type: 'error',
        title: 'Unexpected Error',
        message: e.message || 'Server error',
      });
    }
  };

  const onInvalid = (errors: any) => {
    console.error('Manual sale form invalid:', errors);
  };

  if (complete) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <div className="modal-title">Sale Recorded Successfully</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Manual Sale</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-input" {...register('customerName')} placeholder="Cash Customer" />
                {errors.customerName && <span className="form-error">{(errors.customerName as any).message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Customer Email (Optional)</label>
                <input className="form-input" {...register('email')} placeholder="customer@example.com" />
                {errors.email && <span className="form-error">{(errors.email as any).message}</span>}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Channel</label>
                <select className="form-input" {...register('channel')}>
                  <option value="market">Market Sale</option>
                  <option value="wholesale">Wholesale</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Calculated Total</label>
                <div className="form-input" style={{ background: 'var(--surface-2)', borderStyle: 'dashed' }}>
                  {formatCurrency(calculatedTotal)}
                </div>
              </div>
            </div>

            <div className="divider mt-2 mb-2" />
            <div className="flex justify-between items-center mb-2">
              <label className="form-label">Items</label>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => append({ productId: '', quantity: 1 })}
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fields.map((field: any, index: number) => (
                <div key={field.id} className="flex gap-2">
                  <select
                    className="form-input"
                    style={{ flex: 1 }}
                    {...register(`items.${index}.productId` as const)}
                  >
                    <option value="">Select product…</option>
                    {products?.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.salePrice)})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: 70 }}
                    {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ color: 'var(--red)' }}
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            {errors.items && <span className="form-error">{errors.items.message}</span>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Recording…' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr onClick={() => setOpen((v) => !v)} style={{ cursor: 'pointer' }}>
        <td className="text-mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{order.orderNumber}</td>
        <td style={{ fontWeight: 500 }}>{order.customerName}</td>
        <td>
          <Badge variant={STATUS_COLORS[order.status]}>{order.status}</Badge>
        </td>
        <td>{order.channel === 'wholesale' || order.channel === 'market' ? <Badge variant="accent">{order.channel}</Badge> : <Badge variant="gray">{order.channel}</Badge>}</td>
        <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{formatRelative(order.createdAt)}</td>
        <td>
          <ChevronDown
            size={14}
            style={{
              color: 'var(--text-3)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 150ms',
            }}
          />
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: 'var(--surface-2)', padding: '12px 16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>ITEMS</div>
                {order.items.map((item) => (
                  <div key={item.productId} className="flex justify-between" style={{ fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-2)' }}>{item.productName} ×{item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="divider mt-2 mb-2" />
                <div className="flex justify-between" style={{ fontSize: 12 }}>
                  <span style={{ color: 'var(--text-3)' }}>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between" style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>SHIPPING</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{order.shippingAddress || 'In-person / Digital'}</div>
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-3)' }}>CUSTOMER</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{order.customerEmail || 'No email registered'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6 }}>UPDATE STATUS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      className={`btn btn-sm ${order.status === s ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ justifyContent: 'flex-start' }}
                      disabled={updateStatus.isPending}
                      onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: order.id, status: s }); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function OrdersPage() {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o: any) => {
      const matchSearch =
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalRevenue = filtered.reduce((sum: number, o: any) => sum + o.total, 0);

  return (
    <div className="page-enter">
      <Header title="Orders">
        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} /> Manual Sale
        </button>
      </Header>

      <div className="page-body">
        <div className="flex gap-2 mb-4 items-center">
          <div className="search-wrap">
            <Search size={13} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
            {filtered.length} orders · {formatCurrency(totalRevenue)}
          </span>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Total</th>
                  <th>Placed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><Skeleton height={14} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="No orders found" icon="🛒" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((o: any) => <OrderRow key={o.id} order={o} />)
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modalOpen && <ManualSaleModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}

