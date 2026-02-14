import React, { useState } from 'react';
import { Trophy, Zap, Share2, X, Loader2, ArrowRight } from 'lucide-react';
import { generateGamification } from '../services/geminiService';
import { GamificationResult } from '../types';

interface GamificationPanelProps {
  driverAskPrice?: string;
  fairPriceEstimate?: string;
  onClose: () => void;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ driverAskPrice, fairPriceEstimate, onClose }) => {
  const [askPrice, setAskPrice] = useState(driverAskPrice?.replace(/[^0-9]/g, '') || '');
  const [dealPrice, setDealPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GamificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    const ask = parseInt(askPrice);
    const deal = parseInt(dealPrice);
    if (isNaN(ask) || isNaN(deal) || ask <= 0 || deal <= 0) {
      setError("Please enter valid prices.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await generateGamification(ask, deal);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate results.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sauda-Sahayak Win!',
          text: result.share_text,
        });
      } catch {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.share_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-yellow-500/30 p-6 shadow-2xl shadow-yellow-500/5 animate-fade-in space-y-6">
        {/* Close */}
        <div className="flex justify-end">
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Badge */}
        <div className="text-center space-y-3">
          <div className="text-6xl">{result.badge_emoji}</div>
          <div className="text-sm text-yellow-400 font-bold uppercase tracking-widest">{result.badge}</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">{result.headline}</h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">₹{result.savings_amount}</div>
            <div className="text-xs text-slate-400 mt-1">Saved</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
              <Zap size={18} className="fill-current" />
              {result.xp_earned}
            </div>
            <div className="text-xs text-slate-400 mt-1">XP Earned</div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
            <div className="text-lg font-bold text-purple-400">{result.savings_equivalent}</div>
            <div className="text-xs text-slate-400 mt-1">That's like...</div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 text-center">
          <p className="text-slate-300 text-sm">{result.encouragement}</p>
        </div>

        {/* Share Button */}
        <div className="flex justify-center">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black rounded-xl font-bold transition-all shadow-lg shadow-yellow-500/20"
          >
            <Share2 size={20} />
            {copied ? "Copied!" : "Share Your Win"}
          </button>
        </div>

        {/* Share Preview */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 mb-2">Share Preview:</div>
          <p className="text-sm text-slate-300 italic">"{result.share_text}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-yellow-500/30 p-6 shadow-2xl shadow-yellow-500/5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Trophy size={20} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Deal Accepted?</h3>
            <p className="text-xs text-slate-400">Enter the final numbers to see your score!</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Price Inputs */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">Driver Asked (₹)</label>
            <input
              type="number"
              value={askPrice}
              onChange={(e) => setAskPrice(e.target.value)}
              placeholder="e.g., 350"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
            />
          </div>
          <ArrowRight size={24} className="text-slate-600 mt-6 shrink-0" />
          <div className="flex-1">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1 block">You Paid (₹)</label>
            <input
              type="number"
              value={dealPrice}
              onChange={(e) => setDealPrice(e.target.value)}
              placeholder="e.g., 150"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-mono focus:ring-2 focus:ring-yellow-500/50 outline-none transition-all"
            />
          </div>
        </div>

        {fairPriceEstimate && (
          <p className="text-xs text-slate-500 text-center">
            Fair price estimate: <span className="text-emerald-400 font-semibold">{fairPriceEstimate}</span>
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading || !askPrice || !dealPrice}
          className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
            isLoading || !askPrice || !dealPrice
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-500/20'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <Trophy size={20} />
              Show My Score!
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GamificationPanel;
