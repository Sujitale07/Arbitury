'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDashboardMetrics, useOrders, useProducts } from '@/hooks/useQueries';
import { Header } from '@/components/layout/Header';
import { Skeleton } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Download, BarChart2 } from 'lucide-react';

const PIE_COLORS = ['#58a6ff', '#f78166', '#3fb950', '#d29922', '#a371f7'];

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatCurrency(payload[0].value)}</div>
      <div style={{ color: 'var(--text-3)' }}>{payload[1]?.value} orders</div>
    </div>
  );
}

export default function ReportsPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { data: metrics, isLoading } = useDashboardMetrics(workspaceId);
  const { data: orders } = useOrders(workspaceId);
  const { data: products } = useProducts(workspaceId);
  const [dateRange, setDateRange] = useState('7d');

  const barData = metrics?.weeklyRevenue.map((d) => ({
    date: format(new Date(d.date), 'EEE'),
    revenue: d.revenue,
    orders: d.orders,
  }));

  const pieData = metrics?.topProducts.map((p) => ({
    name: p.productName,
    value: p.revenue,
  }));

  const totalRevenue = metrics?.weeklyRevenue.reduce((s, d) => s + d.revenue, 0) ?? 0;
  const totalOrders = metrics?.weeklyRevenue.reduce((s, d) => s + d.orders, 0) ?? 0;
  const totalUnits = metrics?.weeklyRevenue.reduce((s, d) => s + d.units, 0) ?? 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const exportCSV = () => {
    if (!metrics) return;
    const rows = [
      ['Date', 'Revenue', 'Orders', 'Units'],
      ...metrics.weeklyRevenue.map((d) => [d.date, d.revenue, d.orders, d.units]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'arbitury-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter">
      <Header title="Reports">
        <div className="flex gap-2">
          <select
            className="form-input"
            style={{ width: 120 }}
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </Header>

      <div className="page-body">
        {/* Summary */}
        <div className="stat-grid mb-5">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div className="stat-tile" key={i}>
                <Skeleton height={12} width="60%" className="mb-2" />
                <Skeleton height={28} />
              </div>
            ))
          ) : (
            <>
              <div className="stat-tile">
                <div className="stat-label">Period Revenue</div>
                <div className="stat-value">{formatCurrency(totalRevenue)}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Total Orders</div>
                <div className="stat-value">{formatNumber(totalOrders)}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Units Sold</div>
                <div className="stat-value">{formatNumber(totalUnits)}</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Avg Order Value</div>
                <div className="stat-value">{formatCurrency(avgOrderValue)}</div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          {/* Bar chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Revenue & Orders by Day</div>
            </div>
            {isLoading ? <Skeleton height={220} /> : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Pie chart */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Revenue by Product</div>
            </div>
            {isLoading ? <Skeleton height={220} /> : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData?.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v || 0))} />
                    <Legend
                      iconSize={8}
                      wrapperStyle={{ fontSize: 11, color: 'var(--text-3)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Product performance table */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div className="card-title">Product Performance</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Variant</th>
                  <th>Units Sold</th>
                  <th>Revenue</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4, 5].map((j) => (
                        <td key={j}><Skeleton height={14} /></td>
                      ))}
                    </tr>
                  ))
                ) : (
                  metrics?.topProducts.map((p, i) => (
                    <tr key={p.productId}>
                      <td style={{ fontWeight: 500 }}>{p.productName}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{p.variant}</td>
                      <td>{formatNumber(p.totalSold)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(p.revenue)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div style={{ flex: 1, height: 4, background: 'var(--surface-2)', borderRadius: 2, maxWidth: 80 }}>
                            <div style={{
                              height: '100%',
                              width: `${p.percentage}%`,
                              background: PIE_COLORS[i % PIE_COLORS.length],
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{p.percentage}%</span>
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
    </div>
  );
}
