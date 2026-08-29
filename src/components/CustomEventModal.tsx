import React, { useState } from 'react';
import { RevenueRiskInputEvent, RiskCategory } from '../types';
import { X, Sparkles, AlertTriangle, Play } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: RevenueRiskInputEvent) => void;
}

export const CustomEventModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [formData, setFormData] = useState<RevenueRiskInputEvent>({
    event_id: `EVT-${Date.now().toString().slice(-5)}`,
    customer_id: 'CUST-ENTERPRISE-01',
    customer_name: 'Vikram Malhotra',
    customer_email: 'vikram.m@zenithcorp.in',
    customer_phone: '+91 98765 43210',
    customer_language: 'hinglish',
    risk_category: 'overdue_receivable',
    amount_at_risk: 75000,
    currency: 'INR',
    current_attempt_count: 1,
    invoice_id: 'INV-2026-9901',
    days_overdue: 14,
    customer_sentiment: 'neutral',
    dispute_filed: false,
    gateway_name: 'Razorpay',
    gateway_error_code: 'INSUFFICIENT_FUNDS_SOFT_DECLINE',
    notes: 'Quarterly payment cycle delay.',
  });

  const [rawJson, setRawJson] = useState<string>(JSON.stringify(formData, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFormChange = (field: keyof RevenueRiskInputEvent, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const handleJsonChange = (text: string) => {
    setRawJson(text);
    try {
      const parsed = JSON.parse(text);
      setFormData(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'json' && jsonError) return;
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-sm bg-slate-900 border border-slate-800 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Custom Revenue-at-Risk Event Ingestion
              </h3>
              <p className="text-[11px] text-slate-400">
                Simulate webhook payloads, payment failures, or B2B receivables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-sm hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 text-[10px] font-bold uppercase tracking-widest">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2 px-3 transition border-b-2 ${
              activeTab === 'form'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Guided Form Builder
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`pb-2 px-3 transition border-b-2 ${
              activeTab === 'json'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw JSON Webhook
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeTab === 'form' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Event ID */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Event ID</label>
                  <input
                    type="text"
                    value={formData.event_id}
                    onChange={(e) => handleFormChange('event_id', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Customer ID */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Customer ID</label>
                  <input
                    type="text"
                    value={formData.customer_id}
                    onChange={(e) => handleFormChange('customer_id', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Risk Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Risk Category</label>
                  <select
                    value={formData.risk_category}
                    onChange={(e) => handleFormChange('risk_category', e.target.value as RiskCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="payment_failure">1. Payment Failure (Retry Sequencer)</option>
                    <option value="checkout_abandonment">2. Checkout Drop-Off (Cart Nudge)</option>
                    <option value="failed_subscription">3. Failed Subscription (Grace Period)</option>
                    <option value="overdue_receivable">4. Overdue B2B Receivable (Chaser)</option>
                  </select>
                </div>

                {/* Amount & Currency */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Amount</label>
                    <input
                      type="number"
                      value={formData.amount_at_risk}
                      onChange={(e) => handleFormChange('amount_at_risk', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleFormChange('currency', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="INR">INR (₹)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name || ''}
                    onChange={(e) => handleFormChange('customer_name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Customer Language */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Language / Market</label>
                  <select
                    value={formData.customer_language || 'en'}
                    onChange={(e) => handleFormChange('customer_language', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="en">English (Global)</option>
                    <option value="hinglish">Hinglish (India Localized Voice/Chat)</option>
                    <option value="es">Spanish</option>
                    <option value="de">German</option>
                  </select>
                </div>

                {/* Current Attempt Count (Guardrail tester) */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center justify-between">
                    <span>Attempt Count (Max 3)</span>
                    <span className="text-emerald-400 font-mono">0{formData.current_attempt_count}/03</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={4}
                    value={formData.current_attempt_count}
                    onChange={(e) => handleFormChange('current_attempt_count', Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Customer Sentiment / Stop Rule tester */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Customer Sentiment / Signal</label>
                  <select
                    value={formData.customer_sentiment || 'neutral'}
                    onChange={(e) => handleFormChange('customer_sentiment', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="neutral">Neutral / Responsive</option>
                    <option value="apologetic">Apologetic (Promise to Pay)</option>
                    <option value="hostile">Hostile / Threat of Lawsuit (Triggers Stop Rule)</option>
                    <option value="opt_out">Opt-out / Unsubscribe (Triggers Stop Rule)</option>
                    <option value="disputed">Disputed / Chargeback (Triggers Stop Rule)</option>
                  </select>
                </div>
              </div>

              {/* Specific details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Days Overdue (Invoice)</label>
                  <input
                    type="number"
                    value={formData.days_overdue || 0}
                    onChange={(e) => handleFormChange('days_overdue', Number(e.target.value))}
                    placeholder="e.g. 15 (if >45 triggers stop rule)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Gateway Error Code</label>
                  <input
                    type="text"
                    value={formData.gateway_error_code || ''}
                    onChange={(e) => handleFormChange('gateway_error_code', e.target.value)}
                    placeholder="e.g. INSUFFICIENT_FUNDS_SOFT_DECLINE"
                    className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Context Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  placeholder="Additional context from customer CRM or billing logs..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-sm px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">JSON Webhook Ingestion Payload:</label>
              <textarea
                rows={14}
                value={rawJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="w-full bg-slate-950 font-mono text-emerald-300 border border-slate-800 rounded-sm p-3.5 focus:border-emerald-500 focus:outline-none leading-relaxed text-xs"
              />
              {jsonError && (
                <div className="p-2 rounded-sm bg-rose-950/40 border border-rose-800 text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Invalid JSON: {jsonError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={activeTab === 'json' && !!jsonError}
            className="px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute Agent Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
};
