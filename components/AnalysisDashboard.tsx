import React from 'react';
import { NegotiationAnalysis } from '../types';
import { Shield, AlertTriangle, Zap, MessageSquare, Scale, BrainCircuit, IndianRupee } from 'lucide-react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import MetricCard from './MetricCard';

interface AnalysisDashboardProps {
  data: NegotiationAnalysis;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ data }) => {

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High": return "text-red-500";
      case "Medium": return "text-orange-400";
      case "Low": return "text-emerald-400";
      default: return "text-slate-200";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level) {
      case "High": return "bg-red-500/10 border-red-500/50";
      case "Medium": return "bg-orange-500/10 border-orange-500/50";
      case "Low": return "bg-emerald-500/10 border-emerald-500/50";
      default: return "bg-slate-800 border-slate-700";
    }
  };

  const chartData = [
    { name: 'Pressure', value: data.pressure_index, fill: '#f97316' },
    { name: 'Asymmetry', value: data.information_asymmetry_score, fill: '#8b5cf6' },
    { name: 'Unfairness', value: 100 - data.fairness_index, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Top Status Bar */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between ${getRiskBg(data.risk_level)}`}>
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <div className={`p-3 rounded-full border-2 ${getRiskColor(data.risk_level).replace('text-', 'border-')}`}>
            <Shield className={`w-8 h-8 ${getRiskColor(data.risk_level)}`} />
          </div>
          <div>
            <h2 className="text-sm text-slate-400 font-semibold uppercase tracking-widest">Risk Assessment</h2>
            <div className="flex items-center gap-3">
                <span className={`text-3xl font-bold ${getRiskColor(data.risk_level)}`}>{data.risk_level} Risk</span>
                <span className="text-xs px-2 py-1 bg-slate-900 rounded text-slate-400 border border-slate-700">
                    Confidence: {(data.confidence_score * 100).toFixed(0)}%
                </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
             <div className="text-xs text-slate-400 mb-1">Scam Detected</div>
             <div className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-lg font-mono text-white shadow-inner">
                {data.detected_tactic}
             </div>
             {data.secondary_tactic && (
                 <div className="text-xs text-slate-500 mt-1">
                     + {data.secondary_tactic}
                 </div>
             )}
        </div>
      </div>

      {/* Price Comparison Bar */}
      {(data.driver_ask_price || data.fair_price_estimate) && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-around gap-4">
          {data.driver_ask_price && (
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Driver Asking</div>
              <div className="text-2xl font-bold text-red-400 flex items-center gap-1">
                <IndianRupee size={20} />
                {data.driver_ask_price.replace(/[^0-9-]/g, '') || data.driver_ask_price}
              </div>
            </div>
          )}
          <div className="text-slate-600 text-2xl hidden sm:block">&rarr;</div>
          {data.fair_price_estimate && (
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Fair Price</div>
              <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
                <IndianRupee size={20} />
                {data.fair_price_estimate.replace(/[^0-9₹-]/g, '') || data.fair_price_estimate}
              </div>
            </div>
          )}
          {data.scam_type && (
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Scam Type</div>
              <div className="text-sm font-semibold text-orange-400 px-3 py-1 bg-orange-500/10 rounded-full border border-orange-500/30">
                {data.scam_type}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
            label="Pressure Index"
            value={data.pressure_index}
            color="text-orange-500"
            icon={<Zap size={18} className="text-orange-500" />}
        />
        <MetricCard
            label="Fairness Score"
            value={data.fairness_index}
            color="text-emerald-500"
            icon={<Scale size={18} className="text-emerald-500" />}
        />
        <MetricCard
            label="Info Asymmetry"
            value={data.information_asymmetry_score}
            color="text-purple-500"
            icon={<AlertTriangle size={18} className="text-purple-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insight & Strategy - 2/3 Width */}
        <div className="lg:col-span-2 space-y-6">

            {/* Reasoning */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <BrainCircuit className="text-blue-400" size={20} />
                    Tactical Insight
                </h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base border-l-4 border-blue-500 pl-4 bg-slate-900/50 py-3 rounded-r-md">
                    {data.insight}
                </p>
                {data.cultural_context_note && (
                     <div className="mt-4 text-xs text-slate-400 italic">
                        <span className="font-semibold text-slate-300 not-italic">Bangalore Context: </span>
                        {data.cultural_context_note}
                    </div>
                )}
            </div>

             {/* Action Plan */}
             <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <Shield className="text-emerald-400" size={20} />
                    Counter-Move Strategy
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">The Strategy</div>
                        <p className="text-slate-200 text-sm mb-4">{data.leverage_shift_strategy}</p>

                        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Recommended Approach</div>
                         <p className="text-slate-200 text-sm">{data.recommended_counter}</p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 text-emerald-400 text-sm font-semibold">
                            <MessageSquare size={16} />
                            Say This:
                        </div>
                        <p className="font-mono text-lg text-white">
                            "{data.short_response_script}"
                        </p>
                    </div>
                </div>
            </div>

        </div>

        {/* Visualizer - 1/3 Width */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 flex flex-col justify-center items-center">
             <h3 className="text-sm font-semibold text-slate-400 mb-6 w-full text-left uppercase">Threat Vector</h3>
             <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={15} data={chartData}>
                    <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={10}
                    />
                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, top: 0, fontSize: '12px' }} />
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    </RadialBarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-xs text-center text-slate-500 mt-4">
                 High asymmetry + pressure = likely scam.
             </p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-slate-600 mt-8">{data.disclaimer}</p>
      </div>

    </div>
  );
};

export default AnalysisDashboard;
