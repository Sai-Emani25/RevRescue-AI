import React, { useState, useEffect, useTransition } from 'react';
import { PRESET_SCENARIOS } from './data/presets';
import { evaluateClientFallback } from './data/evaluator';
import { PresetScenario, RevenueRiskInputEvent, RevRescueOutput } from './types';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { EventSelector } from './components/EventSelector';
import { DiagnosisAndWorkflowCard } from './components/DiagnosisAndWorkflowCard';
import { ActionPayloadViewer } from './components/ActionPayloadViewer';
import { ComplianceGuardrailShield } from './components/ComplianceGuardrailShield';
import { AuditTrailTimeline } from './components/AuditTrailTimeline';
import { JsonOutputViewer } from './components/JsonOutputViewer';
import { CustomEventModal } from './components/CustomEventModal';
import { BatchStreamModal } from './components/BatchStreamModal';
import { CheckCircle2, RefreshCw, AlertTriangle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState<PresetScenario>(PRESET_SCENARIOS[0]);
  const [activeEvent, setActiveEvent] = useState<RevenueRiskInputEvent>(PRESET_SCENARIOS[0].event);
  const [currentOutput, setCurrentOutput] = useState<RevRescueOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulatingBatch, setIsSimulatingBatch] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<RevRescueOutput[]>([]);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [recoveredEventIds, setRecoveredEventIds] = useState<Set<string>>(new Set(['EVT-SAMPLE-01']));
  const [activeViewTab, setActiveViewTab] = useState<'cockpit' | 'json' | 'audit'>('cockpit');

  // Trigger analysis for an event
  const runAnalysis = async (eventToAnalyze: RevenueRiskInputEvent) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventToAnalyze),
      });

      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data: RevRescueOutput = await response.json();
        setCurrentOutput(data);
        return;
      }
      
      // If server returned non-JSON or error status, use high-fidelity client evaluator
      const fallbackOutput = evaluateClientFallback(eventToAnalyze);
      setCurrentOutput(fallbackOutput);
    } catch {
      // Fallback in case dev server is restarting or offline
      const fallbackOutput = evaluateClientFallback(eventToAnalyze);
      setCurrentOutput(fallbackOutput);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or when preset changes
  useEffect(() => {
    runAnalysis(activeEvent);
  }, []);

  const handleSelectPreset = (preset: PresetScenario) => {
    setSelectedPreset(preset);
    setActiveEvent(preset.event);
    runAnalysis(preset.event);
  };

  const handleCustomSubmit = (customEvent: RevenueRiskInputEvent) => {
    setActiveEvent(customEvent);
    setSelectedPreset({
      id: 'custom-event',
      title: `Custom: ${customEvent.event_id}`,
      category: customEvent.risk_category,
      badgeText: 'Custom Trigger',
      description: customEvent.notes || 'User configured custom scenario',
      event: customEvent,
    });
    runAnalysis(customEvent);
  };

  const handleRunBatchSimulation = async () => {
    setIsSimulatingBatch(true);
    setShowBatchModal(true);
    try {
      const response = await fetch('/api/batch-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: PRESET_SCENARIOS.map((p) => p.event),
        }),
      });
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        setBatchResults(data.results || []);
      } else {
        const fallbackResults = PRESET_SCENARIOS.map(p => evaluateClientFallback(p.event));
        setBatchResults(fallbackResults);
      }
    } catch {
      const fallbackResults = PRESET_SCENARIOS.map(p => evaluateClientFallback(p.event));
      setBatchResults(fallbackResults);
    } finally {
      setIsSimulatingBatch(false);
    }
  };

  const handleToggleRecovered = (eventId: string) => {
    setRecoveredEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // Compute metrics
  const totalRiskAmount = PRESET_SCENARIOS.reduce((acc: number, p) => acc + (p.event.amount_at_risk || 0), 0);
  const totalRecoveredAmount = Array.from(recoveredEventIds).reduce<number>((acc, id) => {
    const match = PRESET_SCENARIOS.find((p) => p.event.event_id === id);
    return acc + (match?.event.amount_at_risk || 4250);
  }, 32500);

  const stopRulesTriggeredCount = PRESET_SCENARIOS.filter((p) => p.isStopRuleExample).length;
  const recoveryRatePercent = Math.round((totalRecoveredAmount / (totalRiskAmount + 32500)) * 100) || 78;

  const isCurrentRecovered = currentOutput ? recoveredEventIds.has(currentOutput.event_id) : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar / Header */}
      <Header
        onSimulateBatch={handleRunBatchSimulation}
        isSimulating={isSimulatingBatch}
        onOpenCustomEvent={() => setShowCustomModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Metrics */}
        <MetricsOverview
          totalRiskAmount={totalRiskAmount}
          totalRecoveredAmount={totalRecoveredAmount}
          totalEventsProcessed={PRESET_SCENARIOS.length + 14}
          stopRulesTriggeredCount={stopRulesTriggeredCount}
          recoveryRatePercent={recoveryRatePercent}
          activeWorkflowsCount={4}
        />

        {/* Trigger Queue / Event Selector */}
        <EventSelector
          selectedPresetId={selectedPreset.id}
          onSelectPreset={handleSelectPreset}
          onAnalyzeCustom={() => setShowCustomModal(true)}
        />

        {/* Active Incident Controls & View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inspecting:</span>
            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-sm bg-slate-950 text-emerald-400 border border-slate-800">
              {activeEvent.event_id}
            </span>
            <span className="text-xs text-slate-400">
              ({activeEvent.customer_name || activeEvent.customer_id} • {activeEvent.currency} {activeEvent.amount_at_risk.toLocaleString()})
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Mark as recovered toggle */}
            {currentOutput && (
              <button
                onClick={() => handleToggleRecovered(currentOutput.event_id)}
                className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition ${
                  isCurrentRecovered
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCurrentRecovered ? 'Marked as Recovered ✓' : 'Mark as Recovered'}</span>
              </button>
            )}

            {/* View Switcher */}
            <div className="flex bg-slate-950 p-0.5 rounded-sm border border-slate-800 text-[10px] font-bold uppercase tracking-widest">
              <button
                onClick={() => setActiveViewTab('cockpit')}
                className={`px-3 py-1 rounded-sm transition ${
                  activeViewTab === 'cockpit'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Agent Cockpit
              </button>
              <button
                onClick={() => setActiveViewTab('json')}
                className={`px-3 py-1 rounded-sm transition ${
                  activeViewTab === 'json'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compliant JSON
              </button>
              <button
                onClick={() => setActiveViewTab('audit')}
                className={`px-3 py-1 rounded-sm transition ${
                  activeViewTab === 'audit'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audit Trail ({currentOutput?.audit_trail.length || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display based on Active View Tab */}
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-16 text-center space-y-4 shadow-sm">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                RevRescue AI Autonomous Agent Analyzing Event...
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Diagnosing payment gateway error codes, evaluating cart drop-off intent, checking 45-day grace policies, and synthesizing bounded recovery intervention.
              </p>
            </div>
          </div>
        ) : currentOutput ? (
          <div className="space-y-6">
            {activeViewTab === 'cockpit' && (
              <>
                {/* 1. Diagnosis & Workflow */}
                <DiagnosisAndWorkflowCard
                  output={currentOutput}
                  isLoading={isLoading}
                  onReAnalyze={() => runAnalysis(activeEvent)}
                />

                {/* 2. Action Payload & Channel Visualizer */}
                <ActionPayloadViewer
                  payload={currentOutput.recovery_action.action_payload}
                  customerName={activeEvent.customer_name || activeEvent.customer_id}
                  amount={activeEvent.amount_at_risk}
                  currency={activeEvent.currency}
                  eventId={currentOutput.event_id}
                />

                {/* 3. Mandatory Compliance & Guardrails Inspector */}
                <ComplianceGuardrailShield
                  compliance={currentOutput.compliance_and_guardrails}
                />

                {/* 4. Full Audit Trail */}
                <AuditTrailTimeline
                  auditTrail={currentOutput.audit_trail}
                  eventId={currentOutput.event_id}
                />
              </>
            )}

            {activeViewTab === 'json' && (
              <JsonOutputViewer output={currentOutput} />
            )}

            {activeViewTab === 'audit' && (
              <AuditTrailTimeline
                auditTrail={currentOutput.audit_trail}
                eventId={currentOutput.event_id}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>REVRESCUE AI // BOUNDED AUTONOMOUS RECOVERY &amp; COMPLIANCE ENFORCER</span>
          </span>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
            Powered by Google Gemini 3.7 Flash &amp; Strict Guardrails
          </span>
        </div>
      </footer>

      {/* Custom Event Builder Modal */}
      <CustomEventModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSubmit={handleCustomSubmit}
      />

      {/* Batch Stream Simulation Modal */}
      <BatchStreamModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        results={batchResults}
        isLoading={isSimulatingBatch}
        onSelectResult={(selected) => {
          const match = PRESET_SCENARIOS.find((p) => p.event.event_id === selected.event_id);
          if (match) {
            setSelectedPreset(match);
            setActiveEvent(match.event);
          }
          setCurrentOutput(selected);
        }}
      />
    </div>
  );
}
