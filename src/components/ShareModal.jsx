import React, { useState } from 'react';
import { X, Copy, Check, Share2, Eye, ShieldCheck } from 'lucide-react';

export function ShareModal({ isOpen, onClose, isAdmin, adminPin }) {
  const [copiedSpectator, setCopiedSpectator] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin + window.location.pathname;
  const spectatorUrl = `${baseUrl}?mode=spectator`;
  const adminUrl = `${baseUrl}?mode=admin&pin=${adminPin || '1234'}`;

  function copyToClipboard(text, isSpectator) {
    navigator.clipboard.writeText(text).then(() => {
      if (isSpectator) {
        setCopiedSpectator(true);
        setTimeout(() => setCopiedSpectator(false), 2000);
      } else {
        setCopiedAdmin(true);
        setTimeout(() => setCopiedAdmin(false), 2000);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#d7f24c]/10 text-[#d7f24c]">
              <Share2 size={20} />
            </div>
            <h3 className="text-white text-lg font-bold">Share Tournament</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-5 leading-relaxed">
          Share live links with other players. Anyone on mobile or desktop will see scores and bracket updates in real time!
        </p>

        {/* Spectator Link */}
        <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Eye size={14} className="text-cyan-400" /> Spectator Link (Read-Only)
            </span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
              For Players & Fans
            </span>
          </div>
          <p className="text-slate-400 text-xs mb-3">
            Players can watch live match scores, court rotations, and all-time leaderboards without accidental score changes.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={spectatorUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(spectatorUrl, true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
            >
              {copiedSpectator ? <Check size={14} /> : <Copy size={14} />}
              {copiedSpectator ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Scorekeeper / Admin Link */}
        {isAdmin && (
          <div className="bg-slate-850 border border-slate-750 rounded-2xl p-4 mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#d7f24c]" /> Scorekeeper Admin Link
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                Full Access
              </span>
            </div>
            <p className="text-slate-400 text-xs mb-3">
              Only share with co-organizers who are managing the draft, scoring games, and running Dreambreakers.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={adminUrl}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(adminUrl, false)}
                className="px-3.5 py-2 rounded-xl bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
              >
                {copiedAdmin ? <Check size={14} /> : <Copy size={14} />}
                {copiedAdmin ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
