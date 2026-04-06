'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useProducts, useCheckoutManualOrder } from '@/hooks/useQueries';
import { Header } from '@/components/layout/Header';
import { useCartStore } from '@/stores';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';
import { ShoppingCart, Plus, Minus, X, Check, Search, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, type CheckoutFormData } from '@/lib/schemas';

function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const variantEmoji: Record<string, string> = {
    white: '⚪',
    black: '⚫',
    organic: '🌿',
    mixed: '🎨',
  };

  const handleAdd = () => {
    addItem({
      productId: product.id,
      productName: product.name,
      variant: product.variant,
      quantity: 1,
      unitPrice: product.salePrice,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card">
      <div className="product-card-img">
        {product.variant ? (variantEmoji[product.variant.toLowerCase()] ?? '📦') : '📦'}
      </div>
      <div className="product-card-body">
        <div className="flex justify-between items-center mb-1">
          {product.variant && <Badge variant="blue">{product.variant}</Badge>}
          {product.quantity <= 0 ? (
            <Badge variant="red">OOS</Badge>
          ) : product.quantity <= product.lowStockThreshold ? (
            <Badge variant="yellow">Low</Badge>
          ) : null}
        </div>
        <div className="product-card-name mt-1">{product.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>{product.sku}</div>
        <div className="flex justify-between items-center">
          <div className="product-card-price">{formatCurrency(product.salePrice)}</div>
          <button
            className={`btn btn-sm ${added ? 'btn-primary' : 'btn-secondary'}`}
            disabled={product.quantity <= 0}
            onClick={handleAdd}
          >
            {added ? <Check size={13} /> : <Plus size={13} />}
            {added ? 'Added' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}


function CheckoutModal({
  workspaceId,
  onClose,
  total,
}: {
  workspaceId: string | undefined;
  onClose: () => void;
  total: number;
}) {
  const { mutateAsync: checkout } = useCheckoutManualOrder(workspaceId);
  const { items, clearCart } = useCartStore();
  const [complete, setComplete] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
    defaultValues: { country: 'US' } as any,
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const result = await checkout({ checkoutData: data, cartItems: items });
      if (result.success) {
        setComplete(true);
        setTimeout(() => {
          clearCart();
          onClose();
        }, 2000);
      }
    } catch (e) {
      console.error('Checkout error:', e);
    }
  };

  if (complete) {
    return (
      <div className="modal-overlay">
        <div className="modal" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <div className="modal-title" style={{ marginBottom: 8 }}>Order Confirmed!</div>
          <div className="text-muted">Your order has been placed successfully.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Checkout — {formatCurrency(total)}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" {...register('firstName')} />
                {errors.firstName && <span className="form-error">{errors.firstName.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" {...register('lastName')} />
                {errors.lastName && <span className="form-error">{errors.lastName.message}</span>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" {...register('email')} />
              {errors.email && <span className="form-error">{errors.email.message}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" {...register('address')} />
              {errors.address && <span className="form-error">{errors.address.message}</span>}
            </div>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" {...register('city')} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" {...register('state')} />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP</label>
                <input className="form-input" {...register('zip')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Order Notes (Optional)</label>
              <textarea className="form-input" {...register('notes')} style={{ minHeight: 60 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Back to Cart</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CartDrawer({
  workspaceId,
  onClose,
}: {
  workspaceId: string | undefined;
  onClose: () => void;
}) {
  const { items, removeItem, updateQty, totalPrice } = useCartStore();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (checkoutOpen) {
    return (
      <CheckoutModal
        workspaceId={workspaceId}
        onClose={() => setCheckoutOpen(false)}
        total={totalPrice()}
      />
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: 360,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 200,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">Cart ({items.length})</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {items.length === 0 ? (
            <EmptyState message="Your cart is empty" icon="🛒" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: 12,
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.productName}</span>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => removeItem(item.productId)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: 13, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                  {/* Suggested cross-sell */}
                  {item.unitPrice > 50 && (
                    <div style={{
                      marginTop: 8,
                      padding: '6px 8px',
                      background: 'rgba(88,166,255,0.08)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 11,
                      color: 'var(--primary)',
                    }}>
                      ✨ Check out our premium accessories for this item.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
            <div className="flex justify-between mb-3" style={{ fontSize: 14, fontWeight: 600 }}>
              <span>Total</span>
              <span>{formatCurrency(totalPrice())}</span>
            </div>
            <button
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorePage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { data: products, isLoading } = useProducts(workspaceId);
  const totalItems = useCartStore((s) => s.totalItems);
  const [search, setSearch] = useState('');
  const [variantFilter, setVariantFilter] = useState('all');
  const [cartOpen, setCartOpen] = useState(false);

  const filtered = products?.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = variantFilter === 'all' || p.category === variantFilter;
    return matchSearch && matchCategory;
  }) ?? [];

  return (
    <div className="page-enter">
      <Header title="Store">
        <button className="btn btn-secondary btn-sm" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={13} />
          Cart {totalItems() > 0 && `(${totalItems()})`}
        </button>
      </Header>

      <div className="page-body">
        <div className="flex gap-2 mb-5">
          <div className="search-wrap">
            <Search size={13} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: 150 }}
            value={variantFilter}
            onChange={(e) => setVariantFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {[...new Set(products?.map(p => p.category))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 0 }}>
                <Skeleton height={160} />
                <div style={{ padding: 12 }}>
                  <Skeleton height={12} className="mb-2" />
                  <Skeleton height={16} width="60%" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="No products available" icon="🌱" />
        ) : (
          <div className="product-grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        )}
      </div>

      {cartOpen && <CartDrawer workspaceId={workspaceId} onClose={() => setCartOpen(false)} />}
    </div>
  );
}

