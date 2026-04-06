'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDashboardMetrics, useAIInsights } from '@/hooks/useQueries';
import { useThemeStore } from '@/stores/theme';
import { Header } from '@/components/layout/Header';
import { formatCurrency, getGrowthArrow } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Badge';
import { Badge } from '@/components/ui/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Package, Sparkles, RefreshCw, Zap } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function CustomTooltip({ active, payload, label }: any) {
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
    </div>
  );
}

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const workspaceId = params.id as string | undefined;
  const { data: metrics, isLoading } = useDashboardMetrics(workspaceId);
  const { data: insights, isLoading: insightsLoading } = useAIInsights(workspaceId);
  const { theme } = useThemeStore();

  const [quickTip, setQuickTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [isFlashSaleActive, setIsFlashSaleActive] = useState(false);

  const urgencyBadge = (u: string) =>
    u === 'high' ? 'red' : u === 'medium' ? 'yellow' : 'gray';

  const insightIcon = (type: string) => {
    if (type === 'restock') return '📦';
    if (type === 'pricing') return '💰';
    if (type === 'trend') return '📈';
    if (type === 'churn') return '⚠️';
    return '✨';
  };

  const chartData = metrics?.weeklyRevenue.map((d: any) => ({
    ...d,
    date: format(new Date(d.date), 'EEE'),
  }));

  const handleGenerateTip = async () => {
    setTipLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const tips = [
      "Viral TikTok trend: 'Chia Pudding Hacks' is peaking. Bundle organic white seeds with a recipe PDF for 15% off to capture 2x conversion.",
      "Customer churn risk detected for 5 VIPs. Auto-send a 'We Miss You' 10% coupon to prevent $500/mo revenue loss.",
      "Organic blend demand is outpacing supply by 22%. Consider raising price by $1.50 — elasticity analysis shows low resistance.",
    ];
    setQuickTip(tips[Math.floor(Math.random() * tips.length)]);
    setTipLoading(false);
  };

  const toggleFlashSale = () => {
    setIsFlashSaleActive(!isFlashSaleActive);
  };

  const invHref = workspaceId ? `/workspaces/${workspaceId}/inventory` : '/workspaces';

  return (
    <div className="page-enter">
      <Header title="Dashboard">
        <div className="flex gap-2">
          <Link href={invHref} className="btn btn-secondary btn-sm">
            <Package size={13} /> Inventory
          </Link>
          <button
            className={`btn btn-sm ${isFlashSaleActive ? 'btn-danger' : 'btn-primary'}`}
            onClick={toggleFlashSale}
          >
            <Zap size={13} /> {isFlashSaleActive ? 'End Flash Sale' : 'Flash Sale'}
          </button>
        </div>
      </Header>

      <div className="page-body">
        {isFlashSaleActive && (
          <div className="ai-card mb-5" style={{ background: 'rgba(212, 163, 115, 0.05)', borderColor: 'var(--accent)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Flash Sale Live!</span>
                <span className="text-sm text-muted">15% discount applied across store</span>
              </div>
              <Badge variant="accent">Expires in 23:59:59</Badge>
            </div>
          </div>
        )}

        <div className="stat-grid mb-5">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <div className="stat-tile" key={i}>
                <Skeleton height={12} width="60%" className="mb-2" />
                <Skeleton height={28} width="80%" className="mb-2" />
                <Skeleton height={10} width="40%" />
              </div>
            ))
          ) : (
            <>
              <div className="stat-tile">
                <div className="stat-label">Today's Revenue</div>
                <div className="stat-value">{formatCurrency(metrics?.todayRevenue ?? 0)}</div>
                <div className={`stat-badge ${(metrics?.revenueGrowth ?? 0) >= 0 ? 'up' : 'down'}`}>
                  {getGrowthArrow(metrics?.revenueGrowth ?? 0)} {Math.abs(metrics?.revenueGrowth ?? 0)}% vs last week
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Today's Orders</div>
                <div className="stat-value">{metrics?.todayOrders ?? 0}</div>
                <div className={`stat-badge ${(metrics?.ordersGrowth ?? 0) >= 0 ? 'up' : 'down'}`}>
                  {getGrowthArrow(metrics?.ordersGrowth ?? 0)} {Math.abs(metrics?.ordersGrowth ?? 0)}% vs last week
                </div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Inventory Value</div>
                <div className="stat-value">{formatCurrency(metrics?.totalInventoryValue ?? 0)}</div>
                <div className="stat-badge" style={{ color: 'var(--text-3)' }}>Dashboard Total</div>
              </div>
              <div className="stat-tile">
                <div className="stat-label">Low Stock Items</div>
                <div className="stat-value" style={{ color: (metrics?.lowStockCount ?? 0) > 0 ? 'var(--red)' : 'var(--text)' }}>
                  {metrics?.lowStockCount ?? 0}
                </div>
                <div className="stat-badge" style={{ color: (metrics?.lowStockCount ?? 0) > 0 ? 'var(--red)' : 'var(--text-3)' }}>
                  {(metrics?.lowStockCount ?? 0) > 0 ? 'Action Needed' : 'Fully Stocked'}
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Weekly Sales Volume</div>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Rolling 7 days</span>
            </div>
            {isLoading ? (
              <Skeleton height={220} />
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray={theme === 'void' ? '0' : '3 3'} stroke="var(--border-2)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type={theme === 'void' ? 'step' : theme === 'forest' ? 'linear' : 'monotone'}
                      dataKey="revenue"
                      stroke="var(--primary)"
                      strokeWidth={theme === 'rose' ? 4 : theme === 'void' ? 1 : 2}
                      fill="url(#rev-grad)"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Sales by Category</div>
            </div>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={36} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {(metrics?.topProducts ?? []).map((p: any) => (
                  <div key={p.productId}>
                    <div className="flex justify-between mb-1">
                      <span style={{ fontSize: 12, color: 'var(--text)' }}>{p.productName}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.percentage}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 'var(--radius)' }}>
                      <div style={{
                        height: '100%',
                        width: `${p.percentage}%`,
                        background: 'var(--primary)',
                        borderRadius: 'var(--radius)',
                        transition: 'width 600ms ease',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: 'var(--primary)' }} />
                <div className="card-title">Viral Trend Correlation</div>
              </div>
              <Badge variant="blue">AI Predicted</Badge>
            </div>
            <div className="flex flex-col gap-3" style={{ marginTop: 8 }}>
              <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 12, fontWeight: 500 }}>"Chia Pudding" (TikTok)</span>
                  <Badge variant="green">+420%</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Predicting 2.5x demand spike for Organic White seeds next week. Recommendation: Order surplus inventory.</div>
              </div>
              <div style={{ padding: '10px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ fontSize: 12, fontWeight: 500 }}>"Smoothie Boost" (Instagram)</span>
                  <Badge variant="yellow">+45%</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Steady growth in Roasted Black seeds. Recommendation: Promote via Newsletter.</div>
              </div>
            </div>
          </div>

          <div className="ai-card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: 'var(--primary)' }} />
                <div className="card-title">AI Quick Insights</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleGenerateTip}
                disabled={tipLoading}
              >
                <RefreshCw size={12} className={tipLoading ? 'animate-spin' : ''} />
                Generate Tip
              </button>
            </div>

            {quickTip && (
              <div style={{
                background: 'var(--primary-dim)',
                border: '1px solid rgba(91, 106, 74, 0.1)',
                borderRadius: 'var(--radius)',
                padding: '10px',
                fontSize: 12.5,
                color: 'var(--primary)',
                marginBottom: 12,
                marginTop: 8
              }}>
                <div className="flex gap-2">
                  <Sparkles size={14} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{quickTip}</span>
                </div>
              </div>
            )}

            {insightsLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} height={50} />)}
              </div>
            ) : (
              <div className="flex flex-col">
                {(insights ?? []).map((insight: any) => (
                  <div key={insight.id} className="ai-insight-row">
                    <div className="ai-icon">
                      <span>{insightIcon(insight.type)}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{insight.title}</span>
                        <Badge variant={urgencyBadge(insight.urgency) as any}>{insight.urgency}</Badge>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{insight.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
