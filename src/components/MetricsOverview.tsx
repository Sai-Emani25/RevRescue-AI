import React from 'react';
import { DollarSign, CheckCircle2, AlertOctagon, RefreshCw, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface MetricsProps {
  totalRiskAmount: number;
  totalRecoveredAmount: number;
  totalEventsProcessed: number;
  stopRulesTriggeredCount: number;
  recoveryRatePercent: number;
  activeWorkflowsCount: number;
}

export const MetricsOverview: React.FC<MetricsProps> = ({
  totalRiskAmount,
  totalRecoveredAmount,
  totalEventsProcessed,
  stopRulesTriggeredCount,
  recoveryRatePercent,
  activeWorkflowsCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-800 border border-slate-800 rounded-sm overflow-hidden">
      {/* 1. Revenue At Risk */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Revenue At Risk</span>
          <DollarSign className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div>
          <div className="text-2xl font-light text-white font-mono tracking-tight">
            ${totalRiskAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-amber-400/90 font-mono mt-1 uppercase tracking-wider">
            Active Alerts
          </div>
        </div>
      </div>

      {/* 2. Recovered Revenue */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Recovered</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl font-light text-emerald-400 font-mono tracking-tight">
            ${totalRecoveredAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 uppercase tracking-wider font-mono">
            <ArrowUpRight className="w-3 h-3" />
            <span>Closed Loop</span>
          </div>
        </div>
      </div>

      {/* 3. Recovery Rate */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Recovery Rate</span>
          <RefreshCw className="w-3.5 h-3.5 text-teal-400" />
        </div>
        <div>
          <div className="text-2xl font-light text-teal-300 font-mono tracking-tight">
            {recoveryRatePercent}%
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-sm mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, recoveryRatePercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4. Active Workflows */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Workflows</span>
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div>
          <div className="text-2xl font-light text-indigo-300 font-mono tracking-tight">
            0{activeWorkflowsCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
            Bounded Retries
          </div>
        </div>
      </div>

      {/* 5. Guardrail Halts / Stop Rules */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Stop Rules</span>
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div>
          <div className="text-2xl font-light text-rose-400 font-mono tracking-tight">
            0{stopRulesTriggeredCount}
          </div>
          <div className="text-[10px] text-rose-400/90 mt-1 uppercase tracking-wider font-mono">
            Escalated
          </div>
        </div>
      </div>

      {/* 6. Total Audited Events */}
      <div className="bg-slate-950 p-4 flex flex-col justify-between hover:bg-slate-900/80 transition">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Audited Events</span>
          <AlertOctagon className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <div className="text-2xl font-light text-blue-300 font-mono tracking-tight">
            {totalEventsProcessed}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">
            Compliant Logs
          </div>
        </div>
      </div>
    </div>
  );
};
