import React, { useState } from 'react';
import { UserPlus, Users, X, Shuffle, Zap, ShieldAlert } from 'lucide-react';

export function SetupView({
  playerPool,
  addPlayer,
  removePlayer,
  savedPlayers = [],
  onAddSavedPlayer,
  onAddAllSavedPlayers,
  onRemoveSavedPlayer,
  numTeams,
  setNumTeams,
  goalScore,
  setGoalScore,
  dreambreakerScore,
  setDreambreakerScore,
  allowUneven,
  setAllowUneven,
  onInitializeDraft,
  isAdmin,
}) {
  const [nameInput, setNameInput] = useState('');

  const baseTeamSize = numTeams ? Math.floor(playerPool.length / numTeams) : 0;
  const extraPlayers = numTeams ? playerPool.length % numTeams : 0;
  const meetsMinimum = playerPool.length >= numTeams * 2;
  const canInitialize = meetsMinimum && baseTeamSize >= 2;

  const availableSaved = (savedPlayers || []).filter(
    (name) => !playerPool.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase())
  );

  function handleAdd() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    addPlayer(trimmed);
    setNameInput('');
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 animate-in fade-in duration-200">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white text-3xl font-display uppercase tracking-wide font-semibold">Tournament Setup</h2>
        {!isAdmin && (
          <span className="text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShieldAlert size={12} /> Spectator Mode
          </span>
        )}
      </div>
      <p className="text-slate-400 text-sm mb-6 text-balance">
        {isAdmin
          ? 'Add your player pool, pick team count, set score limits, and draft.'
          : 'Viewing tournament setup. Unlock Scorekeeper mode with PIN to make changes.'}
      </p>

      {/* Player Pool Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <label className="text-slate-300 text-sm font-semibold mb-2 block">
          Player Pool ({playerPool.length})
        </label>
        {isAdmin && (
          <div className="flex gap-2 mb-3">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Player name"
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-[#d7f24c]"
            />
            <button
              onClick={handleAdd}
              className="bg-[#d7f24c] hover:bg-[#c6e140] text-slate-950 rounded-xl px-4 py-3 font-bold active:scale-95 transition flex items-center gap-1 shadow-lg shadow-[#d7f24c]/10"
            >
              <UserPlus size={20} />
            </button>
          </div>
        )}

        {playerPool.length === 0 ? (
          <p className="text-slate-600 text-sm italic py-2">
            No players yet. Add at least {numTeams * 2} to start a draft.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {playerPool.map((p) => (
              <span key={p.id} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-full pl-3 pr-1.5 py-1.5 text-slate-200 text-sm font-medium">
                {p.name}
                {isAdmin && (
                  <button onClick={() => removePlayer(p.id)} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-red-400 transition">
                    <X size={14} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Saved Players Tray */}
        {isAdmin && availableSaved.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users size={13} className="text-[#d7f24c]" /> Saved Players ({availableSaved.length})
              </span>
              <button
                onClick={onAddAllSavedPlayers}
                className="text-xs font-bold text-[#d7f24c] hover:underline flex items-center gap-1 active:scale-95 transition"
              >
                <UserPlus size={13} /> + Add All ({availableSaved.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSaved.map((name) => (
                <span
                  key={name}
                  className="group inline-flex items-center gap-1.5 bg-slate-800/70 hover:bg-slate-750 border border-slate-700/60 rounded-full pl-2.5 pr-1 py-0.5 text-slate-300 text-xs transition"
                >
                  <button
                    onClick={() => onAddSavedPlayer(name)}
                    className="font-medium hover:text-white flex items-center gap-1"
                    title={`Add ${name} to tournament`}
                  >
                    <span>{name}</span>
                    <span className="text-emerald-400 font-bold text-sm leading-none">+</span>
                  </button>
                  <button
                    onClick={() => onRemoveSavedPlayer(name)}
                    className="text-slate-600 hover:text-red-400 p-0.5 rounded-full transition"
                    title={`Remove ${name} from saved list`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Number of Teams */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <label className="text-slate-300 text-sm font-semibold mb-2 block">Number of Teams</label>
        <select
          disabled={!isAdmin}
          value={numTeams}
          onChange={(e) => setNumTeams(Number(e.target.value))}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-[#d7f24c] disabled:opacity-60"
        >
          <option value={2}>2 Teams (Final only)</option>
          <option value={3}>3 Teams (Semis + Final, with Bye)</option>
          <option value={4}>4 Teams (Semis + Final)</option>
          <option value={5}>5 Teams (Quarters, Semis, Final, with Byes)</option>
          <option value={6}>6 Teams (Quarters, Semis, Final, with Byes)</option>
          <option value={7}>7 Teams (Quarters, Semis, Final, with Byes)</option>
          <option value={8}>8 Teams (Quarters, Semis, Final)</option>
        </select>
      </div>

      {/* Goal Score Limit */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <label className="text-slate-300 text-sm font-semibold mb-2 block">Regulation Goal Score Limit</label>
        <div className="flex gap-2 mb-2">
          {[11, 15, 21].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!isAdmin}
              onClick={() => setGoalScore(preset)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                goalScore === preset
                  ? 'bg-[#d7f24c] text-slate-950 shadow-md shadow-[#d7f24c]/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {preset} pts
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          disabled={!isAdmin}
          value={goalScore}
          onChange={(e) => setGoalScore(Math.max(1, Number(e.target.value)))}
          placeholder="Custom score limit"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#d7f24c] disabled:opacity-60"
        />
      </div>

      {/* Dreambreaker Score Limit */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <label className="text-slate-300 text-sm font-semibold mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-400" /> Dreambreaker Score Limit</span>
          <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Tiebreaker</span>
        </label>
        <p className="text-slate-500 text-xs mb-3">Singles rotation target when regulation match ties.</p>
        <div className="flex gap-2 mb-2">
          {[11, 15, 21].map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={!isAdmin}
              onClick={() => setDreambreakerScore(preset)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${
                dreambreakerScore === preset
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {preset} pts
            </button>
          ))}
        </div>
        <input
          type="number"
          min={1}
          disabled={!isAdmin}
          value={dreambreakerScore}
          onChange={(e) => setDreambreakerScore(Math.max(1, Number(e.target.value)))}
          placeholder="Custom Dreambreaker limit"
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60"
        />
      </div>

      {/* Uneven Teams Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-xl">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            disabled={!isAdmin}
            checked={allowUneven}
            onChange={(e) => setAllowUneven(e.target.checked)}
            className="mt-1 w-4 h-4 rounded text-[#d7f24c] bg-slate-800 border-slate-700 focus:ring-[#d7f24c]"
          />
          <div>
            <span className="text-slate-200 text-sm font-bold block flex items-center gap-1.5">
              <Shuffle size={14} className="text-[#d7f24c]" /> Allow Uneven Teams
            </span>
            <span className="text-slate-400 text-xs">
              Draft all players without forcing anyone to sit out. Extra regulation games are automatically scheduled with randomized matchups.
            </span>
          </div>
        </label>
      </div>

      {/* Dynamic Sizing Summary Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl text-sm text-slate-400">
        <p className="font-semibold text-slate-300 mb-1">
          Roster Split: {numTeams} teams with{' '}
          <span className="text-white font-bold">
            {allowUneven && extraPlayers > 0 ? `${baseTeamSize}–${baseTeamSize + 1}` : baseTeamSize}
          </span>{' '}
          player{baseTeamSize === 1 ? '' : 's'} each.
        </p>
        {allowUneven && extraPlayers > 0 && (
          <p className="text-xs text-amber-400/90 mt-1">
            &bull; {extraPlayers} team{extraPlayers === 1 ? '' : 's'} will have {baseTeamSize + 1} players. Additional games will be automatically scheduled with randomized matchups so everyone plays!
          </p>
        )}
        {!allowUneven && extraPlayers > 0 && (
          <p className="text-xs text-amber-400/90 mt-1">
            &bull; {extraPlayers} player{extraPlayers === 1 ? '' : 's'} will sit out (uneven split).
          </p>
        )}
      </div>

      {/* Initialize Draft Button */}
      {isAdmin && (
        <button
          onClick={onInitializeDraft}
          disabled={!canInitialize}
          className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition active:scale-95 ${
            canInitialize
              ? 'bg-[#d7f24c] text-slate-950 shadow-xl shadow-[#d7f24c]/20 hover:bg-[#c6e140]'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          Initialize Draft
        </button>
      )}
    </div>
  );
}
