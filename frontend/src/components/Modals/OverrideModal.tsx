import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/api/client';
import { Verdict } from '@/api/types';
import { X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export const OverrideModal: React.FC = () => {
  const { activeModal, modalData, closeModal, selectCustomer } = useStore();
  const [overrideVerdict, setOverrideVerdict] = useState<Verdict>('APPROVE WITH CONDITIONS');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'override') return null;

  const decisionId = modalData?.decision_id || 'DEC-CURRENT';
  const customerName = modalData?.customerName || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiClient.overrideDecision({
        decision_id: decisionId,
        override_recommendation: overrideVerdict,
        user_feedback: feedback.trim(),
      });
      alert('Decision override recorded in FalkorDB ledger.');
      if (customerName) {
        await selectCustomer(customerName, true);
      }
      closeModal();
    } catch (err: any) {
      alert(`Override failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg rounded-xl glass-panel-elevated bg-paper text-ink p-6 border border-white/20 shadow-glass-lg space-y-4">
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              Owner Final Authority
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Override Agent Recommendation
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Select Final Commercial Verdict
            </label>
            <select
              value={overrideVerdict}
              onChange={(e) => setOverrideVerdict(e.target.value as Verdict)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2.5 font-mono text-xs focus:outline-none focus:border-brass"
            >
              <option value="APPROVE">APPROVE (Grant Full Credit)</option>
              <option value="APPROVE WITH CONDITIONS">APPROVE WITH CONDITIONS (Collateral / Advance)</option>
              <option value="HOLD">HOLD (Temporarily Pause Order Fulfillment)</option>
              <option value="ESCALATE">ESCALATE (Refer to Credit Committee / Director)</option>
              <option value="CHASE PAYMENT">CHASE PAYMENT (Demand Immediate Settlement)</option>
            </select>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase text-ink-muted block mb-1">
              Owner Override Rationale & Audit Feedback
            </label>
            <textarea
              rows={3}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Spoke directly with managing director; received wire settlement confirmation for $50,000 and verified warehouse inventory."
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2.5 font-sans text-xs focus:outline-none focus:border-brass placeholder:text-ink-muted/60"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/10">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg hover:bg-black/5 font-mono text-xs text-ink-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="px-4 py-2 rounded-lg bg-brass text-white font-mono text-xs font-semibold hover:bg-brass-light transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>Commit Override to Graph</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
