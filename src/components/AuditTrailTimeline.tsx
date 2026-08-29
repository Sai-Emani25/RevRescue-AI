import React from 'react';
import { AuditTrailEntry, AuditStatus } from '../types';
import { History, CheckCircle2, AlertCircle, ArrowUpRight, Clock, Download } from 'lucide-react';

interface Props {
  auditTrail: AuditTrailEntry[];
  eventId: string;
}

export const AuditTrailTimeline: React.FC<Props> = ({ auditTrail, eventId }) => {
  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'success':
        return {
          label: 'SUCCESS',
          icon: CheckCircle2,
          className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dotColor: 'bg-emerald-500',
        };
      case 'halted':
        return {
          label: 'HALTED',
          icon: AlertCircle,
          className: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dotColor: 'bg-rose-500',
        };
      case 'escalated':
        return {
          label: 'ESCALATED',
          icon: ArrowUpRight,
          className: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dotColor: 'bg-purple-500',
        };
    }
  };

  const downloadAuditTrail = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditTrail, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_trail_${eventId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-slate-950 border border-slate-800 text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Full Audit Trail &amp; Lifecycle Telemetry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-slate-950 text-slate-300 border border-slate-800">
                0{auditTrail.length} RECORDED
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable timestamped ledger of every autonomous diagnosis and dispatch
            </p>
          </div>
        </div>

        <button
          onClick={downloadAuditTrail}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Trail</span>
        </button>
      </div>

      {/* Timeline Steps matching Geometric Balance timeline */}
      <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
        {auditTrail.map((entry, index) => {
          const badge = getStatusBadge(entry.status);
          const Icon = badge.icon;

          return (
            <div key={index} className="relative group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-6 top-2 w-2.5 h-2.5 rounded-none ${badge.dotColor} ring-4 ring-slate-950`}
              />

              <div className="bg-slate-950 border border-slate-800 rounded-sm p-3.5 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {entry.action}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{entry.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border uppercase tracking-wider flex items-center gap-1 ${badge.className}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
