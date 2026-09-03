import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, ChevronDown, ChevronUp, Shuffle, Trophy, Zap, Pencil, ShieldAlert } from 'lucide-react';

function TeamDot({ color, className = '' }) {
  return <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${className}`} style={{ backgroundColor: color?.accent || '#64748b' }} />;
}

function GameRow({ game, index, teamA, teamB, playersById, expanded, onToggle, onSave, isAdmin }) {
  const [scoreA, setScoreA] = useState(game.scoreA);
  const [scoreB, setScoreB] = useState(game.scoreB);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setScoreA(game.scoreA);
    setScoreB(game.scoreB);
  }, [game.scoreA, game.scoreB]);

  const label = (ids) => ids.map((id) => playersById[id]).join(' & ');
  const aWon = game.saved && game.scoreA > game.scoreB;
  const bWon = game.saved && game.scoreB > game.scoreA;

  function handleSaveClick() {
    onSave(scoreA, scoreB);
    setIsEditing(false);
  }

  function handleCancelClick() {
    setScoreA(game.scoreA);
    setScoreB(game.scoreB);
    setIsEditing(false);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl mb-3 overflow-hidden shadow-lg transition">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Game {index + 1}</p>
            {game.isExtra && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Shuffle size={10} /> Extra &bull; Randomized
              </span>
            )}
          </div>
          <p className="text-white text-sm font-semibold">
            <span className={aWon ? 'text-[#d7f24c] font-bold' : ''}>{label(game.pairA)}</span>
            <span className="text-slate-500 font-normal"> vs </span>
            <span className={bWon ? 'text-[#d7f24c] font-bold' : ''}>{label(game.pairB)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {game.saved && (
            <span className="font-mono text-slate-200 font-bold text-sm bg-slate-800 px-2.5 py-1 rounded-lg">
              {game.scoreA} - {game.scoreB}
            </span>
          )}
          {game.saved ? <Check size={18} className="text-[#d7f24c]" /> : <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />}
          {expanded ? <ChevronUp size={18} className="text-slate-500" /> : <ChevronDown size={18} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-3.5 bg-slate-950/40">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1 truncate">{teamA.name}</label>
              <input
                type="number"
                min={0}
                disabled={(!isEditing && game.saved) || !isAdmin}
                value={scoreA}
                onChange={(e) => setScoreA(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xl font-bold text-center disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#d7f24c]"
              />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold block mb-1 truncate">{teamB.name}</label>
              <input
                type="number"
                min={0}
                disabled={(!isEditing && game.saved) || !isAdmin}
                value={scoreB}
                onChange={(e) => setScoreB(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xl font-bold text-center disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#d7f24c]"
              />
            </div>
          </div>

          {isAdmin && (
            <>
              {!game.saved && (
                <button
                  onClick={handleSaveClick}
                  className="w-full py-3 rounded-xl bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 font-bold active:scale-95 transition shadow-lg shadow-[#d7f24c]/20"
                >
                  Save Game
                </button>
              )}
              {game.saved && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold flex items-center justify-center gap-2 active:scale-95 transition border border-slate-700 hover:border-slate-600"
                >
                  <Pencil size={14} className="text-[#d7f24c]" /> Edit Game Score
                </button>
              )}
              {game.saved && isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelClick}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold active:scale-95 transition border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    className="flex-1 py-2.5 rounded-xl bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 font-bold active:scale-95 transition shadow-lg shadow-[#d7f24c]/20"
                  >
                    Update Score
                  </button>
                </div>
              )}
            </>
          )}

          {!isAdmin && (
            <p className="text-center text-xs text-slate-500 italic mt-1">
              Spectator view &bull; Scores are recorded by scorekeeper.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function MatchDashboard({
  match,
  teamA,
  teamB,
  playersById,
  onSaveGame,
  onBack,
  onGoToDreambreaker,
  onGoToBracket,
  onReRandomizeExtra,
  isAdmin,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (!match.games) return null;
  const isTie = match.status === 'tied';
  const isDone = match.status === 'complete';
  const hasUnsavedExtra = match.games.some((g) => g.isExtra && !g.saved);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm font-semibold transition">
          <ArrowLeft size={16} /> Back to Bracket
        </button>
        {isAdmin && hasUnsavedExtra && (
          <button
            onClick={onReRandomizeExtra}
            title="Re-randomize player pairings for unsaved extra games"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold border border-amber-500/30 active:scale-95 transition"
          >
            <Shuffle size={13} /> Re-randomize Extra Games
          </button>
        )}
      </div>

      {/* Main Match Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 mb-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-2 font-bold text-white text-base truncate max-w-[40%]">
            <TeamDot color={teamA.color} />
            <span className="truncate">{teamA.name}</span>
          </span>
          <div className="text-center px-3 py-1 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-3xl sm:text-4xl font-display font-black text-white tabular-nums tracking-wider">
              {match.gamesWonA} - {match.gamesWonB}
            </span>
          </div>
          <span className="flex items-center gap-2 font-bold text-white text-base truncate max-w-[40%] justify-end">
            <span className="truncate">{teamB.name}</span>
            <TeamDot color={teamB.color} />
          </span>
        </div>
        <p className="text-slate-500 text-xs text-center">
          Regulation &mdash; first to win the most of {match.games.length} games
        </p>
      </div>

      {/* Match Tied Banner */}
      {isTie && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-3xl p-5 mb-5 text-center shadow-xl">
          <p className="text-amber-400 font-extrabold text-base flex items-center justify-center gap-2 mb-1">
            <Zap size={20} /> Match Tied! Dreambreaker Required.
          </p>
          <p className="text-slate-400 text-xs mb-3">
            Regulation finished in a tie ({match.gamesWonA}-{match.gamesWonB}). The match will be decided by singles rotation.
          </p>
          <button
            onClick={onGoToDreambreaker}
            className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-base active:scale-95 transition shadow-lg shadow-amber-500/20"
          >
            {isAdmin ? 'Set Up Dreambreaker' : 'View Dreambreaker'}
          </button>
        </div>
      )}

      {/* Match Won Banner */}
      {isDone && !isTie && (
        <div className="bg-[#d7f24c]/10 border border-[#d7f24c]/40 rounded-3xl p-5 mb-5 text-center shadow-xl">
          <p className="text-[#d7f24c] font-extrabold text-lg flex items-center justify-center gap-2 mb-1">
            <Trophy size={22} /> {match.winnerId === teamA.id ? teamA.name : teamB.name} wins the match!
          </p>
          <button
            onClick={onGoToBracket}
            className="mt-2 w-full py-3.5 rounded-2xl bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 font-black text-base active:scale-95 transition shadow-lg shadow-[#d7f24c]/20"
          >
            Back to Bracket
          </button>
        </div>
      )}

      {/* Regulation Games List */}
      {match.games.map((g, i) => (
        <GameRow
          key={g.id}
          game={g}
          index={i}
          teamA={teamA}
          teamB={teamB}
          playersById={playersById}
          expanded={expandedId === g.id}
          onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
          onSave={(a, b) => onSaveGame(g.id, a, b)}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
