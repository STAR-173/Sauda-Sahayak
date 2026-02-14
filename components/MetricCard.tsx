import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  accentColor: string;
  icon: React.ReactNode;
  delay?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, accentColor, icon, delay = 0 }) => {
  const pct = `${Math.min(Math.max(value, 0), 100)}%`;

  return (
    <div
      className="card p-5 hover-lift anim-in"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          {label}
        </span>
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${accentColor}12`, color: accentColor }}>
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="font-mono font-bold text-3xl" style={{ color: accentColor }}>
          {value}
        </span>
        <span className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>/100</span>
      </div>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct, background: accentColor }} />
      </div>
    </div>
  );
};

export default MetricCard;
