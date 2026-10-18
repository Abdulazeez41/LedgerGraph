import React from 'react';
import { motion } from 'framer-motion';
import { Verdict } from '@/api/types';
import { verdictStampVariants } from '@/lib/motionTokens';
import { formatPercent } from '@/lib/format';

interface VerdictStampProps {
  verdict: Verdict | string;
  confidence?: number;
  riskScore?: number;
}

export const VerdictStamp: React.FC<VerdictStampProps> = ({
  verdict,
  confidence = 0.9,
  riskScore,
}) => {
  const verdictUpper = (verdict || 'EVALUATING').toUpperCase();

  const getTheme = () => {
    switch (verdictUpper) {
      case 'APPROVE':
        return {
          textColor: 'text-naira-green',
          borderColor: 'border-naira-green',
          subColor: 'text-naira-green-light',
        };
      case 'APPROVE WITH CONDITIONS':
      case 'HOLD':
        return {
          textColor: 'text-brass',
          borderColor: 'border-brass',
          subColor: 'text-brass-light',
        };
      case 'ESCALATE':
      case 'CHASE PAYMENT':
      default:
        return {
          textColor: 'text-vermilion',
          borderColor: 'border-vermilion',
          subColor: 'text-vermilion-light',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-black/[0.03] border-b border-black/10 select-none">
      <div className="flex items-center space-x-3">
        <motion.div
          variants={verdictStampVariants}
          initial="initial"
          animate="animate"
          className={`verdict-stamp ${theme.textColor} ${theme.borderColor}`}
        >
          {verdictUpper}
        </motion.div>

        <div className="flex flex-col font-mono text-xs">
          <span className="text-ink font-semibold">{formatPercent(confidence)} Confidence</span>
          <span className="text-ink-muted text-[10px]">Graph Topologic Proof</span>
        </div>
      </div>

      {riskScore !== undefined && (
        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="text-ink-muted uppercase text-[10px]">Customer Risk Score:</span>
          <span className="font-bold text-ink px-2 py-0.5 rounded bg-black/5 border border-black/10">
            {riskScore}/100
          </span>
        </div>
      )}
    </div>
  );
};
