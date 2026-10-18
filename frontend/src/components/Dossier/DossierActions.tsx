import React from 'react';
import { useStore } from '@/store/useStore';
import { CheckCheck, MessageSquare, PlusCircle, Brain, RefreshCw } from 'lucide-react';

export const DossierActions: React.FC = () => {
  const { openModal, profile, lastChatResponse } = useStore();

  if (!profile) return null;

  return (
    <div className="p-3 bg-black/[0.04] border-t border-black/10 flex flex-wrap items-center gap-2 select-none">
      {/* Override button if there is a recent decision */}
      {lastChatResponse && (
        <button
          onClick={() =>
            openModal('override', {
              decision_id: lastChatResponse.decision_id || 'DEC-CURRENT',
              currentRecommendation: lastChatResponse.recommendation,
              customerName: profile.name,
            })
          }
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-ink text-xs font-mono font-medium border border-black/15 shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <CheckCheck className="w-3.5 h-3.5 text-brass" />
          <span>Override Decision</span>
        </button>
      )}

      {/* Reminder button */}
      <button
        onClick={() =>
          openModal('reminder', {
            customerName: profile.name,
            overdueBalance: profile.overdue_balance,
            phone: profile.phone,
          })
        }
        className="px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-ink text-xs font-mono font-medium border border-black/15 shadow-sm transition-colors flex items-center space-x-1.5"
      >
        <MessageSquare className="w-3.5 h-3.5 text-naira-green" />
        <span>Draft Reminder</span>
      </button>

      {/* Task button */}
      <button
        onClick={() =>
          openModal('task', {
            customerName: profile.name,
          })
        }
        className="px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-ink text-xs font-mono font-medium border border-black/15 shadow-sm transition-colors flex items-center space-x-1.5"
      >
        <PlusCircle className="w-3.5 h-3.5 text-ink-muted" />
        <span>Create Task</span>
      </button>

      {/* Memory button */}
      <button
        onClick={() =>
          openModal('memory', {
            customerName: profile.name,
          })
        }
        className="px-3 py-1.5 rounded-lg bg-white hover:bg-white/90 text-ink text-xs font-mono font-medium border border-black/15 shadow-sm transition-colors flex items-center space-x-1.5"
      >
        <Brain className="w-3.5 h-3.5 text-naira-green" />
        <span>Add Memory</span>
      </button>
    </div>
  );
};
