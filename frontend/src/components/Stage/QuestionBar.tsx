import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Loader2 } from 'lucide-react';
import { CameraControls } from './CameraControls';

const QUICK_INQUIRIES = [
  {
    label: 'BrightMart $20,000 Credit',
    question: 'Should I approve a $20,000 order for BrightMart on 30-day credit?',
    customer: 'BrightMart Hardware Ltd',
    amount: 20000,
  },
  {
    label: 'Highest Risk Accounts',
    question: 'Which customers are highest credit risk this week?',
  },
  {
    label: 'Invoices to Chase',
    question: 'Which overdue invoices should I chase today?',
  },
  {
    label: 'BrightMart Prior Memory',
    question: 'What did we decide about BrightMart last time?',
    customer: 'BrightMart Hardware Ltd',
  },
  {
    label: 'Syndicate & Contact Collusion',
    question: 'Which customers are connected to delinquent customers through shared contacts?',
  },
];

export const QuestionBar: React.FC = () => {
  const { askAgent, isAgentWorking, agentStatusText, selectedCustomerName } = useStore();
  const [question, setQuestion] = useState('');
  const [orderAmount, setOrderAmount] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isAgentWorking) return;
    askAgent(question.trim(), selectedCustomerName || undefined, Number(orderAmount) || 0);
    setQuestion('');
  };

  const handleQuickInquiry = (inquiry: (typeof QUICK_INQUIRIES)[0]) => {
    if (isAgentWorking) return;
    askAgent(inquiry.question, inquiry.customer, inquiry.amount || 0);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-2xl z-40 flex flex-col items-center space-y-2 select-none">
      {/* Floating Camera & View Mode Instrument */}
      <CameraControls />

      {/* Quick Inquiry Lozenges */}
      <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none px-2">
        {QUICK_INQUIRIES.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleQuickInquiry(item)}
            disabled={isAgentWorking}
            className="flex-shrink-0 px-2.5 py-1 rounded-full glass-pill hover:bg-white/10 text-[11px] font-mono text-chalk/80 hover:text-chalk transition-all border border-white/5 hover:border-white/20 disabled:opacity-40"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Ruled Glass Input Instrument */}
      <div className="w-full rounded-2xl glass-panel-elevated p-2 shadow-glass-lg border border-white/10">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="flex-1 flex items-center space-x-2 px-3 py-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAgentWorking}
              placeholder={
                selectedCustomerName
                  ? `Ask the agent about ${selectedCustomerName} credit, history, or cash flow...`
                  : 'Ask the agent about SME credit, overdue exposure, or payment chasing...'
              }
              className="flex-1 bg-transparent text-chalk placeholder:text-muted/60 text-sm font-sans focus:outline-none"
            />

            {/* Optional order amount input */}
            <div className="hidden sm:flex items-center space-x-1 border-l border-white/10 pl-3">
              <span className="text-xs font-mono text-muted">Amount</span>
              <input
                type="number"
                placeholder="Optional"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value ? Number(e.target.value) : '')}
                className="w-20 bg-black/20 text-chalk text-xs font-mono rounded px-1.5 py-1 focus:outline-none border border-white/5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!question.trim() || isAgentWorking}
            aria-label="Send inquiry to agent"
            className="p-2.5 rounded-xl bg-dollar-green hover:bg-dollar-green-light text-chalk transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 shadow-sm"
          >
            {isAgentWorking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>

        {/* Honest Agent Status Bar */}
        {isAgentWorking && (
          <div className="mt-2 px-3 py-1.5 rounded-lg bg-black/40 border border-brass/20 flex items-center space-x-2 font-mono text-xs text-brass">
            <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            <span className="truncate">{agentStatusText || 'The agent is reasoning over the graph...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
