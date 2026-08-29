import React, { useState } from 'react';
import { PRESET_SCENARIOS } from '../data/presets';
import { PresetScenario, RiskCategory } from '../types';
import { CreditCard, ShoppingCart, RefreshCcw, Building2, ShieldAlert, Sparkles, Filter } from 'lucide-react';

interface EventSelectorProps {
  selectedPresetId: string;
  onSelectPreset: (preset: PresetScenario) => void;
  onAnalyzeCustom: () => void;
}

export const EventSelector: React.FC<EventSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onAnalyzeCustom,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filterCategories = [
    { id: 'all', label: 'All Triggers' },
    { id: 'payment_failure', label: 'Payment Failures', icon: CreditCard },
    { id: 'checkout_abandonment', label: 'Cart Drop-Offs', icon: ShoppingCart },
    { id: 'failed_subscription', label: 'Subscriptions', icon: RefreshCcw },
    { id: 'overdue_receivable', label: 'B2B Receivables', icon: Building2 },
    { id: 'stop_rule', label: 'Stop Rules', icon: ShieldAlert },
  ];

  const filteredPresets = PRESET_SCENARIOS.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'stop_rule') return p.isStopRuleExample === true;
    return p.category === activeFilter;
  });

  const getBorderAccent = (preset: PresetScenario, isSelected: boolean) => {
    if (preset.isStopRuleExample) return 'border-l-4 border-rose-500';
    if (preset.category === 'payment_failure') return 'border-l-4 border-amber-500';
    if (preset.category === 'failed_subscription') return 'border-l-4 border-emerald-500';
    if (preset.category === 'checkout_abandonment') return 'border-l-4 border-cyan-500';
    if (preset.category === 'overdue_receivable') return 'border-l-4 border-purple-500';
    return 'border-l-4 border-slate-700';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>Revenue-at-Risk Trigger Queue</span>
            <span className="text-[10px] px-2 py-0.5 rounded-sm bg-slate-950 text-slate-300 font-mono border border-slate-800">
              0{filteredPresets.length} Incidents
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a live trigger to execute autonomous diagnosis and bounded recovery
          </p>
        </div>

        <button
          id="open-custom-builder-btn"
          onClick={onAnalyzeCustom}
          className="text-xs font-bold uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 px-3 py-1.5 rounded-sm border border-slate-700 hover:border-emerald-500"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Custom Payload</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 text-xs border-b border-slate-800">
        <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 flex-shrink-0" />
        {filterCategories.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1 rounded-sm transition flex items-center gap-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {Icon && <Icon className="w-3 h-3" />}
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
        {filteredPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          const borderClass = getBorderAccent(preset, isSelected);

          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`text-left p-3.5 rounded-sm border transition flex flex-col justify-between relative group ${borderClass} ${
                isSelected
                  ? 'bg-slate-950 border-emerald-500 ring-1 ring-emerald-500/50 shadow-md'
                  : 'bg-slate-950/80 border-slate-800 hover:bg-slate-950 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-slate-400 font-bold">{preset.event.event_id}</span>
                  <span
                    className={`font-bold uppercase tracking-wider ${
                      preset.isStopRuleExample
                        ? 'text-rose-400'
                        : preset.category === 'payment_failure'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {preset.isStopRuleExample ? 'HALTED' : 'PENDING'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-100 line-clamp-1 group-hover:text-emerald-400 transition">
                  {preset.title}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {preset.description}
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 font-mono">
                <span className="text-slate-400 font-semibold">{preset.event.customer_id}</span>
                <span className="font-bold text-slate-200">
                  {preset.event.currency} {preset.event.amount_at_risk.toLocaleString()}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
