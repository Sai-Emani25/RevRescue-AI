import React, { useState } from 'react';
import { RevRescueOutput } from '../types';
import { Copy, Check, CheckCircle2, Download, FileJson } from 'lucide-react';

interface Props {
  output: RevRescueOutput;
}

export const JsonOutputViewer: React.FC<Props> = ({ output }) => {
  const [copied, setCopied] = useState(false);
  const jsonString = JSON.stringify(output, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonString);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `revrescue_response_${output.event_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-slate-950 border border-slate-800 text-emerald-400">
            <FileJson className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                RevRescue Output Schema (Compliant JSON)
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" />
                Validated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct structured output matching the Required Output Structure schema specification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopy}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="relative">
        <pre className="bg-slate-950 p-4 rounded-sm border border-slate-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-[360px] selection:bg-emerald-800/40">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
};
