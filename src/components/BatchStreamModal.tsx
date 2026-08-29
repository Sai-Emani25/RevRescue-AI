import React from 'react';
import { RevRescueOutput } from '../types';
import { X, ArrowRight, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  results: RevRescueOutput[];
  isLoading: boolean;
  onSelectResult: (output: RevRescueOutput) => void;
}

export const BatchStreamModal: React.FC<Props> = ({
  isOpen,
  onClose,
  results,
  isLoading,
  onSelectResult,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-sm w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-sm bg-slate-900 border border-slate-800 text-teal-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                Batch Stream Recovery Telemetry
              </h3>
              <p className="text-[11px] text-slate-400">
                0{results.length} Automated incidents triaged through RevRescue AI
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

        {/* Results Stream */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Activity className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
                Running Autonomous RevRescue AI Engine across multi-incident batch...
              </p>
              <p className="text-xs text-slate-500">
                Evaluating gateway codes, cart urgency, subscription grace periods &amp; stop rules
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              NO BATCH INCIDENTS FOUND.
            </div>
          ) : (
            results.map((item, idx) => {
              const isHalted = item.compliance_and_guardrails.stop_rule_triggered;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectResult(item);
                    onClose();
                  }}
                  className={`p-3.5 rounded-sm border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isHalted
                      ? 'bg-rose-950/30 border-rose-800/60 hover:border-rose-500'
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-200">
                        {item.event_id}
                      </span>
                      <span className="text-slate-600">/</span>
                      <span className="font-mono text-xs text-slate-400">
                        {item.customer_id}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                          isHalted
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {isHalted ? 'Stop Rule Halted' : 'Action Scheduled'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium line-clamp-1">
                      {item.diagnosis.root_cause}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2 font-mono">
                      <span>CHANNEL: <strong className="text-slate-200 uppercase">{item.recovery_action.action_payload.channel}</strong></span>
                      <span>•</span>
                      <span>ATTEMPT: <strong>0{item.compliance_and_guardrails.current_attempt_count}/03</strong></span>
                      <span>•</span>
                      <span>CONFIDENCE: <strong>{Math.round(item.diagnosis.confidence_score * 100)}%</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1 transition">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Select any incident to inspect compliance audit log</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-200 text-[10px] font-bold uppercase tracking-widest border border-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
