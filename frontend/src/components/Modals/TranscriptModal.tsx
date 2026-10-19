import React from 'react';
import { useStore } from '@/store/useStore';
import { formatDate, formatTime } from '@/lib/format';
import { X, MessageSquare, Copy, Check } from 'lucide-react';

export const TranscriptModal: React.FC = () => {
  const { activeModal, closeModal, chatTranscript } = useStore();
  const [copied, setCopied] = React.useState(false);

  if (activeModal !== 'transcript') return null;

  const handleCopy = () => {
    const text = chatTranscript
      .map(
        (m) =>
          `[${m.role.toUpperCase()} - ${m.timestamp.toISOString()}]\n${m.text}\n${
            m.response ? `Verdict: ${m.response.recommendation} (${m.response.confidence * 100}%)\n` : ''
          }`
      )
      .join('\n---\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl glass-panel-elevated bg-paper text-ink border border-white/20 shadow-glass-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-black/[0.04] border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-brass" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted block">
                Session Audit Trail
              </span>
              <h3 className="font-display text-lg font-bold text-ink">
                Conversation & Reasoning Transcript
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-white border border-black/15 text-xs font-mono text-ink hover:bg-black/5 flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-dollar-green" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Transcript Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatTranscript.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-ink-muted">
              No inquiries logged in current session. Ask the agent a question to record decisions.
            </div>
          ) : (
            chatTranscript.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  item.role === 'user'
                    ? 'bg-white/80 border-black/10 ml-8'
                    : 'bg-[#101915] text-chalk border-white/10 mr-8'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span
                    className={`font-semibold uppercase tracking-wider ${
                      item.role === 'user' ? 'text-ink-muted' : 'text-brass'
                    }`}
                  >
                    {item.role === 'user' ? 'Owner Inquiry' : 'The Agent'}
                  </span>
                  <span className={item.role === 'user' ? 'text-ink-muted' : 'text-muted'}>
                    {formatTime(item.timestamp)}
                  </span>
                </div>

                <p
                  className={`text-xs leading-relaxed ${
                    item.role === 'user' ? 'font-sans text-ink' : 'font-sans text-chalk/90 whitespace-pre-line'
                  }`}
                >
                  {item.text}
                </p>

                {item.response && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-muted">
                    <span className="font-bold text-dollar-green">
                      Verdict: {item.response.recommendation}
                    </span>
                    <span>
                      {item.response.cypher_queries?.length || 0} Cypher queries executed
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
