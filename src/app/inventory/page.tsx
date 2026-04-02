'use client';

import { useState, useMemo } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useQueries';
import { Header } from '@/components/layout/Header';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import {
  formatCurrency, formatDate, daysUntilExpiry,
  getStockStatus, truncate,
} from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/schemas';
import type { Product } from '@/types';
import { Plus, Search, Edit2, Trash2, RefreshCw, X, Filter } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

function stockBadge(qty: number, threshold: number) {
  const s = getStockStatus(qty, threshold);
  if (s === 'critical') return <Badge variant="red">Out of stock</Badge>;
  if (s === 'low') return <Badge variant="yellow">Low stock</Badge>;
  return <Badge variant="green">In stock</Badge>;
}

function expiryBadge(date: string) {
  const days = daysUntilExpiry(date);
  if (days < 0) return <Badge variant="red">Expired</Badge>;
  if (days < 90) return <Badge variant="yellow">{days}d left</Badge>;
  return <Badge variant="gray">{formatDate(date)}</Badge>;
}

function ProductModal({
  product,
  onClose,
  onSuccess,
}: {
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku,
          category: product.category,
          variant: product.variant || '',
          quantity: product.quantity,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().slice(0, 10) : '',
          supplier: product.supplier,
          lotNumber: product.lotNumber || '',
          harvestDate: product.harvestDate ? new Date(product.harvestDate).toISOString().slice(0, 10) : '',
          lowStockThreshold: product.lowStockThreshold,
        }
      : { quantity: 0, costPrice: 0, salePrice: 0, lowStockThreshold: 20 },
  });

  const onSubmit = async (data: ProductFormData) => {
    if (product) {
      await update.mutateAsync({ id: product.id, data });
    } else {
      await create.mutateAsync(data);
    }
    onSuccess();
    onClose();
  };

  const pending = create.isPending || update.isPending;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{product ? 'Edit Product' : 'Add Product'}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input className="form-input" {...register('name')} placeholder="Organic White Chia Seeds" />
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-input" {...register('sku')} placeholder="CHIA-OWC-1A2B" />
                {errors.sku && <span className="form-error">{errors.sku.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" {...register('category')} placeholder="Clothing, Sticker, etc." />
                {errors.category && <span className="form-error">{errors.category.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Variant</label>
                <input className="form-input" {...register('variant')} placeholder="Blue, XL, Matte, etc." />
                {errors.variant && <span className="form-error">{errors.variant.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input className="form-input" type="number" {...register('quantity', { valueAsNumber: true })} />
                {errors.quantity && <span className="form-error">{errors.quantity.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Low Stock Threshold</label>
                <input className="form-input" type="number" {...register('lowStockThreshold', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Cost Price ($)</label>
                <input className="form-input" type="number" step="0.01" {...register('costPrice', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Price ($)</label>
                <input className="form-input" type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <input className="form-input" {...register('supplier')} placeholder="AgroPure Ltd." />
              </div>
              <div className="form-group">
                <label className="form-label">Lot Number</label>
                <input className="form-input" {...register('lotNumber')} placeholder="LOT-2025-W01" />
              </div>
              <div className="form-group">
                <label className="form-label">Harvest Date</label>
                <input className="form-input" type="date" {...register('harvestDate')} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input className="form-input" type="date" {...register('expiryDate')} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const stockStatus = getStockStatus(p.quantity, p.lowStockThreshold);
      const matchStock = stockFilter === 'all' || stockStatus === stockFilter;
      return matchSearch && matchCategory && matchStock;
    });
  }, [products, search, categoryFilter, stockFilter]);

  return (
    <div className="page-enter">
      <Header title="Inventory">
        <button className="btn btn-primary btn-sm" onClick={() => { setEditProduct(null); setModalOpen(true); }}>
          <Plus size={13} /> Add Product
        </button>
      </Header>

      <div className="page-body">
        {/* Filters */}
        <div className="flex gap-2 mb-4 items-center">
          <div className="search-wrap">
            <Search size={13} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="form-input" style={{ width: 140 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {[...new Set(products?.map(p => p.category))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select className="form-input" style={{ width: 130 }} value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">All stock</option>
            <option value="ok">In stock</option>
            <option value="low">Low stock</option>
            <option value="critical">Out of stock</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-3)' }}>
            {filtered.length} products
          </span>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Variant</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Sale Price</th>
                  <th>Expiry</th>
                  <th>Supplier</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j}><Skeleton height={14} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState message="No products found" icon="📦" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 500 }}>{truncate(p.name, 30)}</td>
                      <td className="text-mono text-sm" style={{ color: 'var(--text-3)' }}>{p.sku}</td>
                      <td><Badge variant="blue">{p.variant}</Badge></td>
                      <td style={{ fontWeight: 600 }}>{p.quantity}</td>
                      <td>{stockBadge(p.quantity, p.lowStockThreshold)}</td>
                      <td>{formatCurrency(p.salePrice)}</td>
                      <td>{expiryBadge(p.expiryDate)}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.supplier}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => { setEditProduct(p); setModalOpen(true); }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: 'var(--red)' }}
                            onClick={() => setDeletingProduct(p)}
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

      {modalOpen && (
        <ProductModal
          product={editProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {deletingProduct && (
        <ConfirmModal
          title="Delete Product"
          message={`Are you sure you want to delete ${deletingProduct.name}? This will also permanently remove all associated order items and inventory history for this product. This action cannot be undone.`}
          confirmLabel="Delete Forever"
          variant="danger"
          isLoading={deleteProduct.isPending}
          onConfirm={async () => {
             await deleteProduct.mutateAsync(deletingProduct.id);
             setDeletingProduct(null);
          }}
          onCancel={() => setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
