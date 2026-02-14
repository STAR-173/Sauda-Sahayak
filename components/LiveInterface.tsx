import React from 'react';
import { Mic, Activity, X } from 'lucide-react';

interface Props {
  isConnected: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  volume: number;
  onDisconnect: () => void;
}

const LiveInterface: React.FC<Props> = ({ isConnected, isSpeaking, isListening, volume, onDisconnect }) => {
  const scale = 1 + (volume / 25);
  const ringColor = isSpeaking ? 'var(--green)' : 'var(--yellow)';

  return (
    <div className="card flex flex-col items-center justify-center py-16 relative overflow-hidden anim-scale" style={{ minHeight: '420px' }}>

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.12 }}>
        <div
          className="rounded-full transition-transform duration-100 ease-linear"
          style={{
            width: '280px',
            height: '280px',
            background: `radial-gradient(circle, ${ringColor} 0%, transparent 70%)`,
            transform: `scale(${scale})`,
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="z-10 flex flex-col items-center gap-10">

        {/* Status */}
        <div className="text-center anim-in">
          <h2 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text)' }}>
            {isSpeaking ? "Speaking..." : isConnected ? "Listening..." : "Connecting..."}
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>Real-time Negotiation Coach</p>
        </div>

        {/* Visualizer */}
        <div className="relative anim-scale delay-2" style={{ width: '128px', height: '128px' }}>
          {/* Outer rings */}
          <div
            className="live-ring"
            style={{
              borderColor: `${ringColor}25`,
              transform: `scale(${1 + (volume / 40)})`,
              opacity: 0.5,
            }}
          />
          <div
            className="live-ring"
            style={{
              borderColor: `${ringColor}15`,
              transform: `scale(${1 + (volume / 25)})`,
              opacity: 0.3,
            }}
          />

          {/* Core */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center transition-all duration-500"
            style={{
              background: isSpeaking ? 'var(--green)' : 'var(--yellow)',
              boxShadow: `0 0 40px ${isSpeaking ? 'rgba(34,197,94,0.3)' : 'rgba(245,197,24,0.25)'}`,
            }}
          >
            {isSpeaking ? (
              <Activity size={44} style={{ color: '#0a0a0a' }} className="anim-breathe" />
            ) : (
              <Mic size={44} style={{ color: '#0a0a0a' }} />
            )}
          </div>
        </div>

        {/* Live indicator */}
        <div className="anim-in delay-3">
          <span className="tag" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full anim-breathe" style={{ background: 'var(--red)' }} />
            Live Session
          </span>
        </div>

        {/* Disconnect */}
        <button
          onClick={onDisconnect}
          className="btn-ghost flex items-center gap-2 px-5 py-2.5 text-sm anim-in delay-4"
          style={{ borderColor: 'rgba(239,68,68,0.15)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
            e.currentTarget.style.color = 'var(--red)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
            e.currentTarget.style.color = 'var(--text-2)';
          }}
        >
          <X size={16} />
          End Session
        </button>
      </div>
    </div>
  );
};

export default LiveInterface;
