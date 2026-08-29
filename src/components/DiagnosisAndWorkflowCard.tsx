import React from 'react';
import { RevRescueOutput } from '../types';
import { Stethoscope, Workflow, CheckCircle, AlertTriangle, ShieldX } from 'lucide-react';

interface Props {
  output: RevRescueOutput;
  isLoading: boolean;
  onReAnalyze: () => void;
}

export const DiagnosisAndWorkflowCard: React.FC<Props> = ({
  output,
  isLoading,
  onReAnalyze,
}) => {
  const confidencePercent = Math.round((output.diagnosis.confidence_score || 0.95) * 100);
  const isHalted = output.compliance_and_guardrails.stop_rule_triggered;

  const getRiskCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'payment_failure':
        return 'Payment Failure';
      case 'checkout_abandonment':
        return 'Checkout Drop-Off';
      case 'failed_subscription':
        return 'Subscription Renewal';
      case 'overdue_receivable':
        return 'B2B Overdue Receivable';
      default:
        return cat;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-sm space-y-6">
      {/* Top Bar matching Geometric Balance header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold tracking-widest uppercase rounded-sm mb-2 border border-amber-500/20">
            {isHalted ? 'Stop Rule Tripped' : 'Active Intervention'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            Recovery Analysis &amp; Workflow
          </h1>
          <p className="text-slate-400 mt-1 font-mono text-xs">
            EVENT_ID: <span className="text-slate-200">{output.event_id}</span> | CUSTOMER: <span className="text-slate-200">{output.customer_id}</span> | CATEGORY: <span className="text-emerald-400 uppercase font-semibold">{getRiskCategoryLabel(output.risk_category)}</span>
          </p>
        </div>

        <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3">
          <div className="text-left sm:text-right">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Diagnosis Confidence
            </div>
            <div className="text-2xl sm:text-3xl font-mono text-emerald-400 font-light">
              {confidencePercent}.0%
            </div>
          </div>

          <button
            onClick={onReAnalyze}
            disabled={isLoading}
            className="px-3 py-1.5 border border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-widest rounded-sm transition"
          >
            {isLoading ? 'Diagnosing...' : 'Re-Run Agent'}
          </button>
        </div>
      </div>

      {/* 2-Column Split matching Geometric Balance layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Root Cause Diagnosis */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Root Cause Diagnosis
            </h3>
            <div className="p-4 bg-slate-950 rounded-sm border border-slate-800 leading-relaxed text-xs italic text-slate-300">
              "{output.diagnosis.root_cause}"
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Selected Workflow
            </h3>
            <div
              className={`p-4 rounded-sm border ${
                isHalted
                  ? 'bg-rose-950/20 border-rose-800/40'
                  : 'bg-emerald-500/5 border-emerald-500/20'
              }`}
            >
              <div className="font-bold text-emerald-400 text-sm">
                {output.recovery_action.selected_workflow}
              </div>
              <div className="text-xs text-slate-400 mt-1.5 font-mono">
                Channel: <strong className="text-slate-200 uppercase">{output.recovery_action.action_payload.channel}</strong>
              </div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono">
                Delay: <strong className="text-slate-200">{output.recovery_action.action_payload.scheduled_delay_hours} hours</strong> (Optimal Window)
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compliance Status & Proposed Command Preview */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Compliance Status
            </h3>
            <div className="p-4 bg-slate-950 rounded-sm border border-slate-800 space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Attempt Count
                </span>
                <span className="text-base font-mono text-white">
                  0{output.compliance_and_guardrails.current_attempt_count} <span className="text-slate-600">/ 0{output.compliance_and_guardrails.max_allowed_attempts || 3}</span>
                </span>
              </div>

              <div className="w-full bg-slate-800 h-1.5 rounded-sm overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHalted ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${((output.compliance_and_guardrails.current_attempt_count || 1) / (output.compliance_and_guardrails.max_allowed_attempts || 3)) * 100}%`,
                  }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] uppercase font-mono">
                <span
                  className={`font-bold tracking-wider ${
                    isHalted ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isHalted ? 'Stop Rule Triggered' : 'Stop Rules Inactive'}
                </span>
                <span className="text-slate-500">Max Grace: 45 Days</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
              Proposed Command Payload
            </h3>
            <code className="block p-3 bg-slate-950 rounded-sm border border-slate-800 font-mono text-[11px] text-emerald-300 leading-tight">
              execute_recovery({'{'}<br />
              &nbsp;&nbsp;event_id: '{output.event_id}',<br />
              &nbsp;&nbsp;channel: '{output.recovery_action.action_payload.channel}',<br />
              &nbsp;&nbsp;delay_hours: {output.recovery_action.action_payload.scheduled_delay_hours}<br />
              {'}'})
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
