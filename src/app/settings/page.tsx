'use client';

import { useBusinessInfo, useUpdateBusinessInfo } from '@/hooks/useQueries';
import { useNotificationStore } from '@/stores';
import { Header } from '@/components/layout/Header';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { businessInfoSchema, type BusinessInfoFormData } from '@/lib/schemas';
import { Building2, Save, Globe, Info, Briefcase, DollarSign } from 'lucide-react';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { data: info, isLoading } = useBusinessInfo();
  const update = useUpdateBusinessInfo();
  const { push } = useNotificationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BusinessInfoFormData>({
    resolver: zodResolver(businessInfoSchema) as any,
    defaultValues: {
      name: '',
      industry: '',
      description: '',
      website: '',
      currency: 'USD',
    }
  });

  useEffect(() => {
    if (info) {
      reset({
        name: info.name,
        industry: info.industry,
        description: info.description || '',
        website: info.website || '',
        currency: info.currency,
      });
    }
  }, [info, reset]);

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      await update.mutateAsync(data);
      push({
        type: 'success',
        title: 'Settings Saved',
        message: 'Your business settings have been successfully updated.',
      });
    } catch (err) {
      push({
        type: 'error',
        title: 'Error',
        message: 'Failed to update settings. Please try again.',
      });
    }
  };

  return (
    <div className="page-enter">
      <Header title="Business Settings">
        <button 
          className="btn btn-primary btn-sm" 
          onClick={handleSubmit(onSubmit)}
          disabled={update.isPending}
        >
          <Save size={13} /> {update.isPending ? 'Saving...' : 'Save Settings'}
        </button>
      </Header>

      <div className="page-body">
        <div className="grid-2">
          {/* Business Profile */}
          <div className="card ai-card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <div className="ai-icon bg-primary-soft">
                  <Building2 size={16} className="text-primary" />
                </div>
                <span className="card-title">Business Profile</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="form-group">
                <label className="form-label">Store/Business Name</label>
                <div className="search-wrap">
                   <div className="search-icon" style={{ left: 12 }}>
                      <Briefcase size={14} />
                   </div>
                   <input 
                    className="form-input" 
                    style={{ paddingLeft: 36 }}
                    {...register('name')} 
                    placeholder="e.g. Chrome Clothing, Sticker Lab" 
                   />
                </div>
                {errors.name && <span className="form-error">{errors.name.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Industry Type</label>
                <div className="search-wrap">
                   <div className="search-icon" style={{ left: 12 }}>
                      <Globe size={14} />
                   </div>
                   <input 
                    className="form-input" 
                    style={{ paddingLeft: 36 }}
                    {...register('industry')} 
                    placeholder="e.g. Apparel, Digital Art, Wellness" 
                   />
                </div>
                {errors.industry && <span className="form-error">{errors.industry.message}</span>}
                <p className="text-muted mt-1" style={{ fontSize: 11 }}>
                  This helps the AI tailor its insights to your specific market.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Website (Optional)</label>
                <input className="form-input" {...register('website')} placeholder="https://example.com" />
                {errors.website && <span className="form-error">{errors.website.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Base Currency</label>
                <div className="search-wrap">
                   <div className="search-icon" style={{ left: 12 }}>
                      <DollarSign size={14} />
                   </div>
                   <select className="form-input" style={{ paddingLeft: 36 }} {...register('currency')}>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="AUD">AUD ($)</option>
                    <option value="INR">INR (₹)</option>
                   </select>
                </div>
              </div>
            </div>
          </div>

          {/* AI Context / Description */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <div className="ai-icon bg-red-soft">
                  <Info size={16} className="text-red" />
                </div>
                <span className="card-title">Business Description</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <div className="form-group">
                <label className="form-label">What do you sell and who are your customers?</label>
                <textarea 
                  className="form-input" 
                  rows={8} 
                  style={{ resize: 'none' }}
                  {...register('description')}
                  placeholder="Tell us about your brand. E.g., 'We sell high-quality organic cotton streetwear for eco-conscious Gen Z customers.'"
                />
                <p className="text-muted mt-2" style={{ fontSize: 11 }}>
                  The AI uses this description to generate more relevant marketing campaigns and inventory tips.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
