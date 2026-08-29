import React from 'react';
import { Zap, Activity, Cpu, Sparkles, Radio } from 'lucide-react';

interface HeaderProps {
  onSimulateBatch: () => void;
  isSimulating: boolean;
  onOpenCustomEvent: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSimulateBatch,
  isSimulating,
  onOpenCustomEvent,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center font-bold text-slate-950 text-base shadow-sm">
            R
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-lg font-semibold tracking-tight uppercase text-white">
              RevRescue <span className="text-emerald-400">AI</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-slate-400 border-l border-slate-800 pl-3">
              Autonomous Recovery Vault
            </span>
          </div>
        </div>

        {/* Operational Status & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-sm bg-slate-950 border border-slate-800 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Live Monitor Active
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-teal-400" />
              Gemini 3.7 Flash
            </span>
          </div>

          <button
            id="custom-event-btn"
            onClick={onOpenCustomEvent}
            className="px-3.5 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Ingest Event</span>
          </button>

          <button
            id="batch-simulate-btn"
            onClick={onSimulateBatch}
            disabled={isSimulating}
            className="px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 transition flex items-center gap-1.5 shadow-sm"
          >
            {isSimulating ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Batch Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
