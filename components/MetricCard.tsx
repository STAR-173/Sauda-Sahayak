import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color, icon }) => {
  // Calculate dynamic width for progress bar
  const widthPercentage = `${Math.min(Math.max(value, 0), 100)}%`;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-md bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <div className="flex justify-between items-end mb-1">
          <span className={`text-2xl font-bold ${color}`}>{value}</span>
          <span className="text-slate-500 text-xs mb-1">/ 100</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ease-out ${color.replace('text-', 'bg-')}`} 
            style={{ width: widthPercentage }}
          />
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
