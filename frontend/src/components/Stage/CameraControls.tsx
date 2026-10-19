import React from 'react';
import { useStore } from '@/store/useStore';
import { Maximize2, Target, ZoomIn, ZoomOut, Compass } from 'lucide-react';

export const CameraControls: React.FC = () => {
  const {
    viewMode,
    triggerCameraCommand,
    selectedCustomerName,
    focusedNodeId,
    profile,
  } = useStore();

  const activeTargetName = selectedCustomerName || profile?.name || 'Evaluated Node';
  const activeTargetId = profile?.customer_id || profile?.id || focusedNodeId || '';

  return (
    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full glass-panel border border-white/10 shadow-glass text-xs font-mono select-none">
      {/* Holistic Overview Button */}
      <button
        type="button"
        onClick={() => triggerCameraCommand('holistic')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full transition-all ${
          viewMode === 'holistic'
            ? 'bg-brass text-ink font-bold shadow-sm'
            : 'text-chalk/80 hover:text-chalk hover:bg-white/10'
        }`}
        title="View holistic graph constellation (all nodes & links)"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="text-[11px]">Holistic View</span>
      </button>

      {/* Focus Prompted Entity Button */}
      <button
        type="button"
        onClick={() => triggerCameraCommand('focus')}
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full transition-all ${
          viewMode === 'focused'
            ? 'bg-dollar-green text-chalk font-semibold shadow-sm'
            : 'text-chalk/80 hover:text-chalk hover:bg-white/10'
        }`}
        title="Center camera on prompted / evaluated customer"
      >
        <Target className="w-3.5 h-3.5 text-brass" />
        <span className="text-[11px] truncate max-w-[160px]">
          Target: {activeTargetName}
        </span>
      </button>

      {/* Divider */}
      <div className="h-3 w-px bg-white/15" />

      {/* Zoom In / Zoom Out Controls */}
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => triggerCameraCommand('zoom_in')}
          className="p-1 rounded-full text-chalk/70 hover:text-chalk hover:bg-white/10 transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => triggerCameraCommand('zoom_out')}
          className="p-1 rounded-full text-chalk/70 hover:text-chalk hover:bg-white/10 transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mode Status Pill */}
      <div className="hidden md:flex items-center space-x-1 pl-1 border-l border-white/15 text-[10px] text-muted">
        <Compass className="w-3 h-3 text-brass/70" />
        <span>
          {viewMode === 'holistic'
            ? 'Holistic Constellation'
            : `Tracking ${activeTargetId ? `[${activeTargetId}]` : ''}`}
        </span>
      </div>
    </div>
  );
};
