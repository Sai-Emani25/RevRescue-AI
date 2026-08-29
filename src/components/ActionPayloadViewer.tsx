import React, { useState } from 'react';
import { ActionPayload, CommunicationChannel } from '../types';
import { Mail, MessageSquare, Volume2, Play, Square, Terminal, Copy, Check, ShieldCheck } from 'lucide-react';

interface Props {
  payload: ActionPayload;
  customerName?: string;
  amount?: number;
  currency?: string;
  eventId?: string;
}

export const ActionPayloadViewer: React.FC<Props> = ({
  payload,
  customerName = 'Customer',
  amount = 0,
  currency = 'USD',
  eventId = 'EVT-000',
}) => {
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(payload.message_or_command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(payload.message_or_command);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (payload.channel === 'voice_hinglish') {
        const indVoice = voices.find(
          (v) => v.lang.includes('IN') || v.lang.includes('hi') || v.name.toLowerCase().includes('india')
        );
        if (indVoice) utterance.voice = indVoice;
      }

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  const getChannelBadge = (ch: CommunicationChannel) => {
    switch (ch) {
      case 'email':
        return { label: 'Formal Email Channel', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
      case 'sms':
        return { label: 'Direct SMS / WhatsApp Nudge', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'voice_hinglish':
        return { label: 'Hinglish AI Voice / Chat', icon: Volume2, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' };
      case 'gateway_retry':
        return { label: 'Gateway Retry Sequencer', icon: Terminal, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
    }
  };

  const badge = getChannelBadge(payload.channel);
  const Icon = badge.icon;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-sm bg-slate-950 border border-slate-800 text-emerald-400">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <span>Action Payload &amp; Channel Dispatch</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border uppercase font-semibold ${badge.color}`}>
                {badge.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bounded intervention ready for execution • Delay: <span className="font-mono text-slate-200">{payload.scheduled_delay_hours} hrs</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Payload'}</span>
        </button>
      </div>

      {/* Interactive Channel Specific Visualizer */}
      <div className="bg-slate-950 border border-slate-800 rounded-sm overflow-hidden">
        {/* EMAIL PREVIEW */}
        {payload.channel === 'email' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
              <div className="space-y-1">
                <div><span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">To:</span> <span className="text-slate-200 font-mono">{customerName} &lt;billing@{customerName.toLowerCase().replace(/\s+/g, '')}.com&gt;</span></div>
                <div><span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Subject:</span> <span className="text-slate-200 font-medium">Important: Regarding your payment of {currency} {amount.toLocaleString()}</span></div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Verified Dunning
              </span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line bg-slate-900 p-4 rounded-sm border border-slate-800">
              {payload.message_or_command}
            </div>
            <div className="flex items-center justify-between pt-2 text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                PCI-DSS Compliant • Anti-Phishing Authenticated
              </span>
              <span className="text-slate-500">ID: tk_{eventId}</span>
            </div>
          </div>
        )}

        {/* SMS / WHATSAPP PREVIEW */}
        {payload.channel === 'sms' && (
          <div className="p-4 flex flex-col items-center">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-sm p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2 uppercase tracking-wider font-bold">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  RevRescue Verified SMS Nudge
                </span>
                <span className="font-mono text-slate-500">Carrier Routed</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 text-emerald-300 p-3.5 rounded-sm text-xs leading-relaxed font-sans">
                {payload.message_or_command}
                <div className="mt-2 flex items-center justify-end text-[10px] text-slate-500 font-mono">
                  <span>Delivered • 12:08 PM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VOICE HINGLISH SIMULATOR */}
        {payload.channel === 'voice_hinglish' && (
          <div className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-sm">
              <div className="flex items-center gap-3">
                <button
                  id="play-voice-btn"
                  onClick={handlePlayVoice}
                  className={`w-9 h-9 rounded-sm flex items-center justify-center transition ${
                    isPlayingAudio
                      ? 'bg-purple-500 text-white animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                  }`}
                >
                  {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>Hinglish AI Voice Recovery Call</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      Localized Agent
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isPlayingAudio ? 'Speaking Hinglish Voice Call...' : 'Click Play to test live conversational synthesis'}
                  </p>
                </div>
              </div>

              {/* Waveform Animation */}
              <div className="flex items-center gap-1 h-6">
                {[10, 20, 14, 24, 12, 18, 8, 22, 16, 10].map((height, idx) => (
                  <div
                    key={idx}
                    className={`w-1 bg-emerald-400 rounded-sm transition-all duration-300 ${
                      isPlayingAudio ? 'animate-bounce' : 'opacity-30'
                    }`}
                    style={{
                      height: isPlayingAudio ? `${height}px` : '4px',
                      animationDelay: `${idx * 80}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Transcript */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Call Script &amp; Promise-to-Pay Transcript:
              </span>
              <div className="p-3.5 rounded-sm bg-slate-900 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                "{payload.message_or_command}"
              </div>
            </div>
          </div>
        )}

        {/* GATEWAY RETRY SEQUENCER */}
        {payload.channel === 'gateway_retry' && (
          <div className="p-4 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-4 h-4" />
                GATEWAY_RETRY_SEQUENCER
              </span>
              <span className="text-slate-500 text-[10px] uppercase">Optimal Salary Window: +{payload.scheduled_delay_hours} hrs</span>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-sm border border-slate-800 text-slate-300 space-y-1 overflow-x-auto">
              <div className="text-slate-500">// Command payload:</div>
              <div className="text-emerald-300">{payload.message_or_command}</div>
              <div className="pt-2 text-slate-500">// Routing configuration:</div>
              <div className="text-slate-400 font-mono">
                {`{
  "routing": "primary_vault",
  "idempotency_key": "idem_${eventId}",
  "fallback_gateway": "ADYEN_MULTI_ACQUIRER",
  "circuit_breaker": "ENFORCE_MAX_3_ATTEMPTS"
}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
