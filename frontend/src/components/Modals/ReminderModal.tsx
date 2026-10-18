import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { apiClient } from '@/api/client';
import { formatMoney } from '@/lib/format';
import { X, Copy, Check, MessageSquare, Send, Loader2 } from 'lucide-react';

export const ReminderModal: React.FC = () => {
  const { activeModal, modalData, closeModal, selectCustomer } = useStore();
  const [customNote, setCustomNote] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== 'reminder') return null;

  const customerName = modalData?.customerName || '';
  const overdueBalance = modalData?.overdueBalance || 0;
  const phone = modalData?.phone || '';

  const previewMessage = `Hello ${customerName},

This is Commercial Accounts Desk reaching out regarding your account${
    invoiceNumber ? ` and invoice ${invoiceNumber}` : ''
  }. Our records show an outstanding overdue balance of ${formatMoney(overdueBalance, true)}.

${
  customNote ||
  'Kindly arrange wire settlement or forward your payment advice to our commercial credit desk.'
}

Settlement Desk: Commercial Accounts Division
Reference Account: 409-2810-771 (Regional Trade Hub)

Thank you for your ongoing partnership.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(previewMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRecordDispatch = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.generateReminder({
        customer_name: customerName,
        invoice_number: invoiceNumber || undefined,
        custom_note: customNote || undefined,
      });
      alert('Remittance dispatch saved to FalkorDB memory and follow-up task.');
      await selectCustomer(customerName, true);
      closeModal();
    } catch (err: any) {
      alert(`Failed to record reminder: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl rounded-xl glass-panel-elevated bg-paper text-ink p-6 border border-white/20 shadow-glass-lg space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              Remittance Notice Desk
            </span>
            <h3 className="font-display text-lg font-bold text-ink">
              Draft Payment Reminder: {customerName}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg hover:bg-black/10 text-ink-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <div>
            <label className="text-[10px] uppercase text-ink-muted block mb-1">Customer Phone</label>
            <input
              type="text"
              readOnly
              value={phone || 'No phone recorded'}
              className="w-full bg-black/5 text-ink border border-black/10 rounded-lg p-2 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-ink-muted block mb-1">Invoice Ref (Optional)</label>
            <input
              type="text"
              placeholder="e.g. INV-1002"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-white text-ink border border-black/15 rounded-lg p-2 font-mono text-xs focus:outline-none focus:border-brass"
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase text-ink-muted block mb-1">
            Custom Settlement Note / Terms
          </label>
          <input
            type="text"
            placeholder="e.g. Kindly verify dispatch receipt or furnish bank transfer slip by Friday 4 PM."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full bg-white text-ink border border-black/15 rounded-lg p-2 font-sans text-xs focus:outline-none focus:border-brass"
          />
        </div>

        {/* Message Preview */}
        <div>
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-ink-muted mb-1">
            <span>Notice Draft Preview (WhatsApp / SMS / Mail)</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1 text-brass hover:text-brass-light font-bold"
            >
              {copied ? <Check className="w-3 h-3 text-naira-green" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <pre className="p-3 rounded-lg bg-white border border-black/10 text-[11px] font-sans text-ink leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto select-text">
            {previewMessage}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/10">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-lg hover:bg-black/5 font-mono text-xs text-ink-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg bg-white border border-black/15 text-ink font-mono text-xs font-semibold hover:bg-black/5 transition-colors flex items-center space-x-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-ink-muted" />
            <span>Copy Text</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleRecordDispatch}
            className="px-4 py-2 rounded-lg bg-naira-green text-white font-mono text-xs font-semibold hover:bg-naira-green-light transition-colors disabled:opacity-50 flex items-center space-x-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Record in Ledger Memory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
