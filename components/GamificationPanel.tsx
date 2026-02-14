import React, { useState } from 'react';
import { Trophy, Zap, Share2, X, Loader2, ArrowRight } from 'lucide-react';
import { generateGamification } from '../services/geminiService';
import { GamificationResult } from '../types';

interface Props {
  driverAskPrice?: string;
  fairPriceEstimate?: string;
  onClose: () => void;
}

const GamificationPanel: React.FC<Props> = ({ driverAskPrice, fairPriceEstimate, onClose }) => {
  const [askPrice, setAskPrice] = useState(driverAskPrice?.replace(/[^0-9]/g, '') || '');
  const [dealPrice, setDealPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GamificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    const ask = parseInt(askPrice), deal = parseInt(dealPrice);
    if (isNaN(ask) || isNaN(deal) || ask <= 0 || deal <= 0) { setError("Enter valid prices."); return; }
    setIsLoading(true); setError(null);
    try { setResult(await generateGamification(ask, deal)); }
    catch (err: any) { setError(err.message || "Failed to generate results."); }
    finally { setIsLoading(false); }
  };

  const handleShare = async () => {
    if (!result) return;
    try { await navigator.share({ title: 'Sauda-Sahayak Win!', text: result.share_text }); }
    catch { navigator.clipboard.writeText(result.share_text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  // ── RESULT VIEW ──
  if (result) {
    return (
      <div className="card p-8 anim-scale" style={{ borderColor: 'rgba(245,197,24,0.15)', background: 'linear-gradient(145deg, var(--card) 0%, var(--surface) 100%)' }}>
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Big emoji + badge */}
        <div className="text-center mb-8 anim-in">
          <div className="text-7xl mb-3 anim-float">{result.badge_emoji}</div>
          <span className="tag" style={{ background: 'var(--yellow-dim)', color: 'var(--yellow)', border: '1px solid rgba(245,197,24,0.2)' }}>
            {result.badge}
          </span>
          <h2 className="font-display font-extrabold text-2xl md:text-3xl mt-4" style={{ color: 'var(--text)' }}>
            {result.headline}
          </h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { value: `₹${result.savings_amount}`, label: 'Saved', color: 'var(--green)' },
            { value: `${result.xp_earned}`, label: 'XP', color: 'var(--yellow)', icon: <Zap size={14} style={{ fill: 'currentColor' }} /> },
            { value: result.savings_equivalent, label: "That's like...", color: 'var(--purple)' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 text-center anim-in" style={{ animationDelay: `${0.1 + i * 0.06}s`, background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="font-mono font-bold text-xl flex items-center justify-center gap-1" style={{ color: stat.color }}>
                {stat.icon}{stat.value}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-3)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Encouragement */}
        <div className="rounded-xl p-4 mb-6 text-center anim-in delay-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{result.encouragement}</p>
        </div>

        {/* Share */}
        <div className="flex justify-center mb-5 anim-in delay-5">
          <button onClick={handleShare} className="btn-primary flex items-center gap-2 px-7 py-3 text-sm">
            <Share2 size={16} />
            {copied ? 'Copied!' : 'Share Your Win'}
          </button>
        </div>

        <div className="rounded-lg p-4 anim-in delay-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-3)' }}>Share Preview</div>
          <p className="text-sm italic" style={{ color: 'var(--text-2)' }}>"{result.share_text}"</p>
        </div>
      </div>
    );
  }

  // ── INPUT VIEW ──
  return (
    <div className="card p-6 anim-scale" style={{ borderColor: 'rgba(245,197,24,0.12)' }}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--yellow-dim)', border: '1px solid rgba(245,197,24,0.15)' }}>
            <Trophy size={18} style={{ color: 'var(--yellow)' }} />
          </div>
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>Deal Closed?</h3>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>Enter the final numbers.</p>
          </div>
        </div>
        <button onClick={onClose} className="transition-colors" style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>Driver Asked (₹)</label>
            <input
              type="number" value={askPrice} onChange={e => setAskPrice(e.target.value)} placeholder="350"
              className="input-field w-full px-4 py-3 font-mono text-lg"
            />
          </div>
          <ArrowRight size={20} className="mt-6 shrink-0" style={{ color: 'var(--border-2)' }} />
          <div className="flex-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 block" style={{ color: 'var(--text-3)' }}>You Paid (₹)</label>
            <input
              type="number" value={dealPrice} onChange={e => setDealPrice(e.target.value)} placeholder="150"
              className="input-field w-full px-4 py-3 font-mono text-lg"
            />
          </div>
        </div>

        {fairPriceEstimate && (
          <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
            Fair estimate: <span className="font-mono font-semibold" style={{ color: 'var(--green)' }}>{fairPriceEstimate}</span>
          </p>
        )}

        {error && <p className="text-xs text-center" style={{ color: 'var(--red)' }}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={isLoading || !askPrice || !dealPrice}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
        >
          {isLoading ? <><Loader2 size={16} className="anim-spin" /> Calculating...</> : <><Trophy size={16} /> Show My Score</>}
        </button>
      </div>
    </div>
  );
};

export default GamificationPanel;
