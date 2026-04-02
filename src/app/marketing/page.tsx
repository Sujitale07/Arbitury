'use client';

import { useState } from 'react';
import { useCampaigns, useCreateCampaign, useGenerateCampaign, useSendCampaign } from '@/hooks/useQueries';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import { formatDate, formatRelative } from '@/lib/utils';
import { useNotificationStore } from '@/stores';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { campaignSchema, type CampaignFormData } from '@/lib/schemas';
import { Plus, X, Sparkles, Send, Mail, RotateCcw, TrendingUp } from 'lucide-react';

const STATUS_COLOR: Record<string, 'green' | 'blue' | 'gray' | 'yellow'> = {
  sent: 'green',
  scheduled: 'blue',
  active: 'yellow',
  draft: 'gray',
};

function CampaignModal({ onClose }: { onClose: () => void }) {
  const { mutateAsync: generate } = useGenerateCampaign();
  const { mutateAsync: save } = useCreateCampaign();
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: { targetSegment: 'all' },
  });

  const campaignName = watch('name');
  const targetSegment = watch('targetSegment');

  const generateContent = async () => {
    setAiLoading(true);
    try {
      const prompt = `Generate a high-conversion marketing email for ${targetSegment} customers. ${campaignName ? `The theme is: ${campaignName}.` : "Focus on our best-selling seeds and general wellness benefits."}`;
      const result = await generate(prompt);
      if (result) {
        setValue('subject', result.subject || '');
        setValue('content', result.body || '');
      }
    } catch (e) {
      console.error(e);
    }
    setAiLoading(false);
  };

  const pushNotification = useNotificationStore((s) => s.push);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const res = await save({ ...data });
      if (res.success) {
        if (res.warning) {
          pushNotification({
            type: 'warning',
            title: 'Campaign Saved',
            message: `Campaign saved as draft, but email sending failed: ${res.warning}`,
          });
        } else if (data.sendNow) {
          pushNotification({
            type: 'success',
            title: 'Campaign Sent!',
            message: `Emails are being delivered to the selected segment.`,
          });
        } else {
          pushNotification({
            type: 'success',
            title: 'Campaign Created',
            message: 'Draft campaign has been saved.',
          });
        }
        onClose();
      } else {
        pushNotification({
          type: 'error',
          title: 'Operation Failed',
          message: res.error || 'Check fields and try again',
        });
      }
    } catch (e: any) {
       pushNotification({
          type: 'error',
          title: 'Error',
          message: e.message || 'Server error',
        });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">New Campaign</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Campaign Name</label>
              <input className="form-input" {...register('name')} placeholder="Keto January Push" />
              {errors.name && <span className="form-error">{errors.name.message}</span>}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Target Segment</label>
                <select className="form-input" {...register('targetSegment')}>
                  <option value="all">All customers</option>
                  <option value="new">New</option>
                  <option value="repeat">Repeat</option>
                  <option value="vip">VIP</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Schedule (optional)</label>
                <input className="form-input" type="datetime-local" {...register('scheduledAt')} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email Subject</label>
              <input className="form-input" {...register('subject')} placeholder="Start 2026 right — organic chia for your keto goals 🌱" />
              {errors.subject && <span className="form-error">{errors.subject.message}</span>}
            </div>
            <div className="form-group">
              <div className="flex justify-between items-center mb-1">
                <label className="form-label">Email Content</label>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={generateContent}
                  disabled={aiLoading}
                >
                  <Sparkles size={12} />
                  {aiLoading ? 'Generating…' : 'AI Generate'}
                </button>
              </div>
              <textarea
                className="form-input"
                style={{ minHeight: 120, resize: 'vertical' }}
                {...register('content')}
                placeholder="Hi {name}, …"
              />
              {errors.content && <span className="form-error">{errors.content.message}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn btn-secondary" 
              onClick={() => setValue('sendNow', false)}
              disabled={isSubmitting}
            >
              Save Draft
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              onClick={() => setValue('sendNow', true)}
              disabled={isSubmitting}
            >
              <Send size={13} /> {isSubmitting ? 'Sending…' : 'Send Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const { mutateAsync: resend } = useSendCampaign();
  const pushNotification = useNotificationStore((s) => s.push);
  const [modalOpen, setModalOpen] = useState(false);

  const handleResend = async (id: string) => {
    try {
      const res = await resend(id);
      if (res.success) {
        pushNotification({ type: 'success', title: 'Campaign Resent', message: 'Emails delivered successfully.' });
      } else {
        pushNotification({ type: 'error', title: 'Resend Failed', message: res.error });
      }
    } catch (e: any) {
      pushNotification({ type: 'error', title: 'Error', message: e.message });
    }
  };

  return (
    <div className="page-enter">
      <div className="page-header">
        <span className="page-title">Marketing</span>
        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={13} /> New Campaign
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="grid-3 mb-5">
          <div className="stat-tile">
            <div className="stat-label flex items-center justify-between">
               <span>Total Campaigns</span>
               <Mail size={12} className="text-text-3" />
            </div>
            <div className="stat-value mt-1">{campaigns?.length ?? '—'}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label flex items-center justify-between">
               <span>Avg Open Rate</span>
               <div className="p-1 rounded-full bg-green-soft"><TrendingUp size={10} className="text-green" /></div>
            </div>
            <div className="stat-value mt-1" style={{ color: 'var(--green)' }}>
              {campaigns && campaigns.some(c => c.openRate != null)
                ? `${Math.round(
                    campaigns.filter((c) => c.openRate != null).reduce((s, c) => s + (c.openRate ?? 0), 0) /
                      Math.max(campaigns.filter((c) => c.openRate != null).length, 1)
                  )}%`
                : 'Pending'}
            </div>
          </div>
          <div className="stat-tile">
            <div className="stat-label flex items-center justify-between">
               <span>Avg Click Rate</span>
               <div className="p-1 rounded-full bg-primary-soft"><Sparkles size={10} className="text-primary" /></div>
            </div>
            <div className="stat-value mt-1" style={{ color: 'var(--primary)' }}>
              {campaigns && campaigns.some(c => c.clickRate != null)
                ? `${Math.round(
                    campaigns.filter((c) => c.clickRate != null).reduce((s, c) => s + (c.clickRate ?? 0), 0) /
                      Math.max(campaigns.filter((c) => c.clickRate != null).length, 1)
                  )}%`
                : 'Pending'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Subject</th>
                  <th>Segment</th>
                  <th>Status</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j}><Skeleton height={14} /></td>
                      ))}
                    </tr>
                  ))
                ) : !campaigns?.length ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState message="No campaigns yet" icon="📣" />
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 500 }}>{c.name}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 240 }} className="truncate">{c.subject}</td>
                      <td><Badge variant="blue">{c.targetSegment}</Badge></td>
                      <td><Badge variant={STATUS_COLOR[c.status]}>{c.status}</Badge></td>
                      <td>{c.openRate != null ? `${c.openRate}%` : '—'}</td>
                      <td>{c.clickRate != null ? `${c.clickRate}%` : '—'}</td>
                      <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{formatDate(c.createdAt)}</td>
                      <td>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => handleResend(c.id)}
                          title="Resend campaign"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && <CampaignModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
