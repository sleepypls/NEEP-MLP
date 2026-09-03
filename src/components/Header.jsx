import React, { useState } from 'react';
import { Trophy, Swords, Share2, Cloud, RotateCcw, Trash2, ShieldCheck, Eye, KeyRound } from 'lucide-react';
import { isCloudEnabled } from '../services/firebase';

export function Header({
  hasTournament,
  view,
  setView,
  onBracketTab,
  onClear,
  onWipeStats,
  onOpenShare,
  onOpenCloudConfig,
  isAdmin,
  onUnlockAdmin,
}) {
  const cloudActive = isCloudEnabled();
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');

  function submitPin(e) {
    e.preventDefault();
    if (onUnlockAdmin(enteredPin)) {
      setShowPinPrompt(false);
      setEnteredPin('');
    } else {
      alert('Incorrect Admin PIN. Please try again.');
    }
  }

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <button onClick={() => setView('setup')} className="text-left flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center overflow-hidden shadow-lg shadow-black/40 group-hover:scale-105 group-hover:border-[#d7f24c]/40 transition duration-150">
              <img
                src="/logo.png"
                alt="NLP - NEEP Score Tracker Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black tracking-wider text-white text-base leading-none">
                  NLP
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">NEEP Score Tracker</p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Tabs */}
        {hasTournament && (
          <nav className="hidden sm:flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
            <button
              onClick={onBracketTab}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'bracket' || view === 'match' || view === 'dreambreakerSetup' || view === 'dreambreakerPlay' || view === 'draft'
                  ? 'bg-[#d7f24c] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords size={13} /> Bracket
            </button>
            <button
              onClick={() => setView('leaderboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                view === 'leaderboard'
                  ? 'bg-[#d7f24c] text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy size={13} /> Leaderboard
            </button>
          </nav>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Cloud Status Pill */}
          <button
            onClick={onOpenCloudConfig}
            title={cloudActive ? 'Connected to Firebase Firestore' : 'Running in Local Mode. Click to connect cloud!'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium transition"
          >
            <span className={`w-2 h-2 rounded-full ${cloudActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden md:inline text-slate-300 text-[11px] font-mono">
              {cloudActive ? 'Cloud Live' : 'Local'}
            </span>
          </button>

          {/* Admin vs Spectator Role */}
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d7f24c]/15 border border-[#d7f24c]/30 text-[#d7f24c] text-[11px] font-bold">
              <ShieldCheck size={12} /> Scorekeeper
            </span>
          ) : (
            <button
              onClick={() => setShowPinPrompt(!showPinPrompt)}
              title="Click to enter Scorekeeper Admin PIN"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold transition"
            >
              <Eye size={12} /> Spectator
            </button>
          )}

          {/* Share Tournament */}
          <button
            onClick={onOpenShare}
            title="Share Tournament Link"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-[#d7f24c] border border-slate-800 transition active:scale-95"
          >
            <Share2 size={16} />
          </button>

          {/* Reset / New Tournament (Admin only) */}
          {isAdmin && hasTournament && (
            <button
              onClick={onClear}
              title="Reset or Start New Tournament"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white border border-slate-800 transition active:scale-95"
            >
              <RotateCcw size={16} />
            </button>
          )}

          {/* Wipe All Stats (Admin only) */}
          {isAdmin && (
            <button
              onClick={onWipeStats}
              title="Wipe Global Leaderboard"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-red-400 border border-slate-800 transition active:scale-95"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Admin PIN Unlock Prompt */}
      {showPinPrompt && !isAdmin && (
        <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-2.5">
          <form onSubmit={submitPin} className="max-w-md mx-auto flex items-center gap-2">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-1 whitespace-nowrap">
              <KeyRound size={13} className="text-[#d7f24c]" /> Scorekeeper PIN:
            </span>
            <input
              type="password"
              autoFocus
              value={enteredPin}
              onChange={(e) => setEnteredPin(e.target.value)}
              placeholder="Enter PIN (default 1234)"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#d7f24c]"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-[#d7f24c] text-slate-950 font-bold text-xs active:scale-95 transition"
            >
              Unlock
            </button>
            <button
              type="button"
              onClick={() => setShowPinPrompt(false)}
              className="px-2 py-1 text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Mobile Navigation Tabs */}
      {hasTournament && (
        <div className="sm:hidden flex border-t border-slate-800/80 bg-slate-950/90">
          <button
            onClick={onBracketTab}
            className={`flex-1 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              view === 'bracket' || view === 'match' || view === 'dreambreakerSetup' || view === 'dreambreakerPlay' || view === 'draft'
                ? 'text-[#d7f24c] border-b-2 border-[#d7f24c] bg-[#d7f24c]/5'
                : 'text-slate-500'
            }`}
          >
            <Swords size={13} /> Bracket
          </button>
          <button
            onClick={() => setView('leaderboard')}
            className={`flex-1 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              view === 'leaderboard'
                ? 'text-[#d7f24c] border-b-2 border-[#d7f24c] bg-[#d7f24c]/5'
                : 'text-slate-500'
            }`}
          >
            <Trophy size={13} /> Leaderboard
          </button>
        </div>
      )}
    </header>
  );
}
