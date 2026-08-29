import React from 'react';
import { ComplianceAndGuardrails } from '../types';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock, Percent, MessageSquare } from 'lucide-react';

interface Props {
  compliance: ComplianceAndGuardrails;
}

export const ComplianceGuardrailShield: React.FC<Props> = ({ compliance }) => {
  const currentAttempts = compliance.current_attempt_count;
  const maxAttempts = compliance.max_allowed_attempts || 3;
  const isStopRuleTriggered = compliance.stop_rule_triggered;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-sm border ${
              isStopRuleTriggered
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {isStopRuleTriggered ? (
              <ShieldAlert className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Mandatory Compliance &amp; Guardrails Engine</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border font-bold uppercase tracking-wider ${
                  isStopRuleTriggered
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isStopRuleTriggered ? 'STOP RULE ACTIVE' : 'GUARDRAILS SECURE'}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Autonomous policy enforcement: strict retry bounds, stop rules, &amp; discount caps
            </p>
          </div>
        </div>
      </div>

      {/* 4 Guardrails Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Bounded Retries (Max 3 Attempts) */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                Bounded Retries
              </span>
              <span className="font-mono text-slate-400">MAX 3</span>
            </div>
            <div className="flex items-center justify-between my-2">
              <span className="text-base font-mono text-white">
                Attempt 0{currentAttempts} / 0{maxAttempts}
              </span>
              {currentAttempts >= maxAttempts ? (
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-rose-500/20 text-rose-300 uppercase">
                  Cap Hit
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 uppercase">
                  Compliant
                </span>
              )}
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-sm overflow-hidden mt-1 flex gap-0.5 p-0">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-full flex-1 rounded-none transition-all ${
                  step <= currentAttempts
                    ? step === 3
                      ? 'bg-rose-500'
                      : 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 2. Stop Rules Status */}
        <div
          className={`border rounded-sm p-4 flex flex-col justify-between ${
            isStopRuleTriggered
              ? 'bg-rose-950/20 border-rose-800/60'
              : 'bg-slate-950 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Stop Rules
              </span>
              {isStopRuleTriggered ? (
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </div>
            <div className="text-xs font-bold mt-1">
              {isStopRuleTriggered ? (
                <span className="text-rose-300 font-mono uppercase">Halted / Escalated</span>
              ) : (
                <span className="text-emerald-400 font-mono uppercase">Clear • Safe to Run</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              {isStopRuleTriggered
                ? compliance.stop_reason || 'Stop rule active.'
                : 'No hostility, dispute, opt-out, or >45d aging detected.'}
            </p>
          </div>
        </div>

        {/* 3. Discount Policy Enforcement */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Percent className="w-3.5 h-3.5 text-amber-400" />
                Discount Policy
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-emerald-400 mt-1 font-mono uppercase">
              Bounds Enforced (≤ 10%)
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Zero unauthorized write-offs. Incentives capped to pre-approved parameters.
            </p>
          </div>
        </div>

        {/* 4. Tone & Persona Verification */}
        <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Tone &amp; Persona
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xs font-bold text-indigo-300 mt-1 font-mono uppercase">
              Polite &amp; Empathetic
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Multilingual &amp; Hinglish flows tested for professional brand protection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
