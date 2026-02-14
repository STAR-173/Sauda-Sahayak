import React from 'react';
import { NegotiationAnalysis } from '../types';
import { Shield, AlertTriangle, Zap, MessageSquare, Scale, BrainCircuit, ArrowRight } from 'lucide-react';
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import MetricCard from './MetricCard';

interface Props { data: NegotiationAnalysis; }

const AnalysisDashboard: React.FC<Props> = ({ data }) => {

  const riskStyles: Record<string, { color: string; bg: string; border: string }> = {
    High:   { color: '#ef4444', bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.18)' },
    Medium: { color: '#f97316', bg: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.18)' },
    Low:    { color: '#22c55e', bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.18)' },
  };
  const rs = riskStyles[data.risk_level] || riskStyles.Low;

  const chartData = [
    { name: 'Pressure', value: data.pressure_index, fill: '#f97316' },
    { name: 'Asymmetry', value: data.information_asymmetry_score, fill: '#a78bfa' },
    { name: 'Unfairness', value: 100 - data.fairness_index, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-5">

      {/* ── Risk Banner ── */}
      <div
        className="rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 anim-in"
        style={{ background: rs.bg, border: `1px solid ${rs.border}` }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${rs.color}15`, border: `2px solid ${rs.color}30` }}>
            <Shield size={22} style={{ color: rs.color }} />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Risk Assessment</div>
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-2xl" style={{ color: rs.color }}>{data.risk_level} Risk</span>
              <span className="tag" style={{ background: 'var(--surface)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                {(data.confidence_score * 100).toFixed(0)}% confidence
              </span>
            </div>
          </div>
        </div>

        <div className="md:text-right">
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>Scam Detected</div>
          <div className="font-mono font-bold text-base px-3 py-1.5 rounded-lg" style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}>
            {data.detected_tactic}
          </div>
          {data.secondary_tactic && (
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>+ {data.secondary_tactic}</div>
          )}
        </div>
      </div>

      {/* ── Price Comparison ── */}
      {(data.driver_ask_price || data.fair_price_estimate) && (
        <div className="card p-5 flex flex-col sm:flex-row items-center justify-around gap-5 anim-in delay-1">
          {data.driver_ask_price && (
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Driver Asking</div>
              <div className="font-mono font-bold text-3xl" style={{ color: 'var(--red)' }}>
                {data.driver_ask_price}
              </div>
            </div>
          )}
          <ArrowRight size={20} className="hidden sm:block" style={{ color: 'var(--border-2)' }} />
          {data.fair_price_estimate && (
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Fair Price</div>
              <div className="font-mono font-bold text-3xl" style={{ color: 'var(--green)' }}>
                {data.fair_price_estimate}
              </div>
            </div>
          )}
          {data.scam_type && (
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Scam Type</div>
              <span className="tag" style={{ background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid rgba(249,115,22,0.2)' }}>
                {data.scam_type}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Pressure Index" value={data.pressure_index} accentColor="#f97316" icon={<Zap size={15} />} delay={0.12} />
        <MetricCard label="Fairness Score" value={data.fairness_index} accentColor="#22c55e" icon={<Scale size={15} />} delay={0.18} />
        <MetricCard label="Info Asymmetry" value={data.information_asymmetry_score} accentColor="#a78bfa" icon={<AlertTriangle size={15} />} delay={0.24} />
      </div>

      {/* ── Insight + Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Tactical Insight */}
          <div className="card p-6 anim-in delay-4">
            <h3 className="flex items-center gap-2 font-display font-bold text-base mb-4" style={{ color: 'var(--text)' }}>
              <BrainCircuit size={18} style={{ color: 'var(--yellow)' }} />
              Tactical Insight
            </h3>
            <p className="text-sm leading-relaxed pl-4" style={{ color: 'var(--text-2)', borderLeft: '3px solid var(--yellow)' }}>
              {data.insight}
            </p>
            {data.cultural_context_note && (
              <div className="mt-4 text-xs italic" style={{ color: 'var(--text-3)' }}>
                <span className="not-italic font-semibold" style={{ color: 'var(--text-2)' }}>Bangalore Context: </span>
                {data.cultural_context_note}
              </div>
            )}
          </div>

          {/* Counter Strategy */}
          <div className="card p-6 anim-in delay-5">
            <h3 className="flex items-center gap-2 font-display font-bold text-base mb-5" style={{ color: 'var(--text)' }}>
              <Shield size={18} style={{ color: 'var(--green)' }} />
              Counter-Move
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Strategy</div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>{data.leverage_shift_strategy}</p>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>Approach</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{data.recommended_counter}</p>
              </div>

              {/* The key takeaway */}
              <div className="rounded-lg p-5 anim-shimmer" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} style={{ color: 'var(--yellow)' }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--yellow)' }}>Say This</span>
                </div>
                <p className="font-mono text-base leading-relaxed" style={{ color: 'var(--text)' }}>
                  "{data.short_response_script}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="card p-5 flex flex-col items-center anim-in delay-6">
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-4 w-full" style={{ color: 'var(--text-3)' }}>
            Threat Vector
          </h3>
          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" barSize={12} data={chartData}>
                <RadialBar background={{ fill: 'var(--border)' }} dataKey="value" cornerRadius={8} />
                <Legend iconSize={8} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0, top: 0, fontSize: '11px', fontFamily: 'Outfit', color: 'var(--text-2)' }} />
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-center mt-3" style={{ color: 'var(--text-3)' }}>
            High asymmetry + pressure = likely scam.
          </p>
        </div>
      </div>

      <div className="text-center pt-4">
        <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>{data.disclaimer}</p>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
