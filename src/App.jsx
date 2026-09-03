import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { DraftView } from './components/DraftView';
import { BracketView } from './components/BracketView';
import { MatchDashboard } from './components/MatchDashboard';
import { DreambreakerSetupView } from './components/DreambreakerSetupView';
import { DreambreakerPlayView } from './components/DreambreakerPlayView';
import { LeaderboardView } from './components/LeaderboardView';
import { ConfirmModal } from './components/ConfirmModal';
import { ShareModal } from './components/ShareModal';
import { CloudConfigModal } from './components/CloudConfigModal';

import {
  generateGames,
  initializeDraftState,
  generateBracket,
  advanceWinner,
  computeAllStats,
} from './utils/tournament';

import {
  isCloudEnabled,
  subscribeToActiveTournament,
  subscribeToStats,
  subscribeToKnownPlayers,
  saveTournamentToCloud,
  saveStatsToCloud,
  saveKnownPlayersToCloud,
} from './services/firebase';

const STORAGE_KEY_STATS = 'neep-pickleball-global-stats-v1';
const STORAGE_KEY_TOURNAMENT = 'neep-pickleball-tournament-state-v1';
const STORAGE_KEY_PARTNERSHIPS = 'neep-pickleball-partnerships-v1';
const STORAGE_KEY_KNOWN_PLAYERS = 'neep-pickleball-known-players-v1';
const DEFAULT_ADMIN_PIN = '1234';

export default function App() {
  const [view, setView] = useState('setup');
  const [playerPool, setPlayerPool] = useState([]);
  const [nextPlayerId, setNextPlayerId] = useState(1);
  const [numTeams, setNumTeams] = useState(4);
  const [goalScore, setGoalScore] = useState(11);
  const [dreambreakerScore, setDreambreakerScore] = useState(21);
  const [allowUneven, setAllowUneven] = useState(true);

  const [teams, setTeams] = useState([]);
  const [playersById, setPlayersById] = useState({});
  const [remainingPool, setRemainingPool] = useState([]);
  const [pickSequence, setPickSequence] = useState([]);
  const [pickPointer, setPickPointer] = useState(0);
  const [sittingOut, setSittingOut] = useState([]);
  const [captainMode, setCaptainMode] = useState('random');
  const [selectedCaptainIds, setSelectedCaptainIds] = useState([]);

  const [bracket, setBracket] = useState(null);
  const [activePath, setActivePath] = useState(null);

  const [globalStats, setGlobalStats] = useState({});
  const [partnershipStats, setPartnershipStats] = useState({});
  const [priorStats, setPriorStats] = useState({});
  const [priorPartnershipStats, setPriorPartnershipStats] = useState({});
  const [savedPlayers, setSavedPlayers] = useState([]);

  // Role: Admin vs Spectator
  const [isAdmin, setIsAdmin] = useState(true);
  const [adminPin, setAdminPin] = useState(DEFAULT_ADMIN_PIN);

  // Modals
  const [modal, setModal] = useState(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);
  const [showRotateBanner, setShowRotateBanner] = useState(false);
  const rotateTimeoutRef = useRef(null);
  const hydrated = useRef(false);

  // 1. Parse URL for mode & PIN on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const pin = params.get('pin');

    if (mode === 'spectator') {
      setIsAdmin(false);
    } else if (mode === 'admin') {
      if (pin === adminPin || !pin) {
        setIsAdmin(true);
      }
    }
  }, [adminPin]);

  // 2. Load LocalStorage & Setup Listeners
  useEffect(() => {
    // Load local storage initial snapshot
    try {
      const rawStats = localStorage.getItem(STORAGE_KEY_STATS);
      const pStats = rawStats ? JSON.parse(rawStats) : {};
      const rawPairs = localStorage.getItem(STORAGE_KEY_PARTNERSHIPS);
      const pairStats = rawPairs ? JSON.parse(rawPairs) : {};
      setGlobalStats(pStats);
      setPartnershipStats(pairStats);
      setPriorStats(pStats);
      setPriorPartnershipStats(pairStats);

      const rawKnown = localStorage.getItem(STORAGE_KEY_KNOWN_PLAYERS);
      const savedKnown = rawKnown ? JSON.parse(rawKnown) : [];
      const knownFromStats = Object.values(pStats).map((p) => p.name);
      const combinedKnown = Array.from(new Set([...savedKnown, ...knownFromStats].filter(Boolean)));
      setSavedPlayers(combinedKnown);

      const rawTourn = localStorage.getItem(STORAGE_KEY_TOURNAMENT);
      if (rawTourn) {
        const saved = JSON.parse(rawTourn);
        setView(saved.view || 'setup');
        setPlayerPool(saved.playerPool || []);
        setNextPlayerId(saved.nextPlayerId || 1);
        setNumTeams(saved.numTeams || 4);
        setGoalScore(saved.goalScore || 11);
        setDreambreakerScore(saved.dreambreakerScore || 21);
        setAllowUneven(saved.allowUneven !== undefined ? saved.allowUneven : true);
        setCaptainMode(saved.captainMode || 'random');
        setSelectedCaptainIds(saved.selectedCaptainIds || []);
        setTeams(saved.teams || []);
        setPlayersById(saved.playersById || {});
        setRemainingPool(saved.remainingPool || []);
        setPickSequence(saved.pickSequence || []);
        setPickPointer(saved.pickPointer || 0);
        setSittingOut(saved.sittingOut || []);
        setBracket(saved.bracket || null);
        setActivePath(saved.activePath || null);
      }
    } catch (e) {
      console.warn('Error loading local state:', e);
    }

    // Connect Firebase Realtime listeners if cloud enabled
    let unsubTourn = () => {};
    let unsubStats = () => {};
    let unsubPlayers = () => {};

    if (isCloudEnabled()) {
      unsubTourn = subscribeToActiveTournament('neep-pickleball', (cloudTourn) => {
        if (cloudTourn) {
          if (cloudTourn.view) setView(cloudTourn.view);
          if (cloudTourn.playerPool) setPlayerPool(cloudTourn.playerPool);
          if (cloudTourn.nextPlayerId) setNextPlayerId(cloudTourn.nextPlayerId);
          if (cloudTourn.numTeams) setNumTeams(cloudTourn.numTeams);
          if (cloudTourn.goalScore) setGoalScore(cloudTourn.goalScore);
          if (cloudTourn.dreambreakerScore) setDreambreakerScore(cloudTourn.dreambreakerScore);
          if (cloudTourn.allowUneven !== undefined) setAllowUneven(cloudTourn.allowUneven);
          if (cloudTourn.captainMode !== undefined) setCaptainMode(cloudTourn.captainMode);
          if (cloudTourn.selectedCaptainIds !== undefined) setSelectedCaptainIds(cloudTourn.selectedCaptainIds);
          if (cloudTourn.teams) setTeams(cloudTourn.teams);
          if (cloudTourn.playersById) setPlayersById(cloudTourn.playersById);
          if (cloudTourn.remainingPool) setRemainingPool(cloudTourn.remainingPool);
          if (cloudTourn.pickSequence) setPickSequence(cloudTourn.pickSequence);
          if (cloudTourn.pickPointer !== undefined) setPickPointer(cloudTourn.pickPointer);
          if (cloudTourn.sittingOut) setSittingOut(cloudTourn.sittingOut);
          if (cloudTourn.bracket) setBracket(cloudTourn.bracket);
          if (cloudTourn.activePath !== undefined) setActivePath(cloudTourn.activePath);
        }
      });

      unsubStats = subscribeToStats('neep-pickleball', ({ playerStats, partnershipStats }) => {
        if (playerStats) setGlobalStats(playerStats);
        if (partnershipStats) setPartnershipStats(partnershipStats);
      });

      unsubPlayers = subscribeToKnownPlayers('neep-pickleball', (roster) => {
        if (roster && Array.isArray(roster)) {
          setSavedPlayers(roster);
        }
      });
    }

    hydrated.current = true;
    return () => {
      unsubTourn();
      unsubStats();
      unsubPlayers();
      if (rotateTimeoutRef.current) clearTimeout(rotateTimeoutRef.current);
    };
  }, []);

  // 3. LocalStorage persistence on change
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY_TOURNAMENT,
        JSON.stringify({
          view, playerPool, nextPlayerId, numTeams, goalScore, dreambreakerScore, allowUneven,
          captainMode, selectedCaptainIds,
          teams, playersById, remainingPool, pickSequence, pickPointer, sittingOut, bracket, activePath,
        })
      );
    } catch (e) {
      // ignore
    }
  }, [view, playerPool, nextPlayerId, numTeams, goalScore, dreambreakerScore, allowUneven, captainMode, selectedCaptainIds, teams, playersById, remainingPool, pickSequence, pickPointer, sittingOut, bracket, activePath]);

  function syncTournamentStats(currentBracket, currentTeams, currentPlayers) {
    const computed = computeAllStats(priorStats, priorPartnershipStats, currentBracket, currentTeams, currentPlayers);
    setGlobalStats(computed.playerStats);
    setPartnershipStats(computed.partnershipStats);

    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(computed.playerStats));
      localStorage.setItem(STORAGE_KEY_PARTNERSHIPS, JSON.stringify(computed.partnershipStats));
    } catch (e) {
      // ignore
    }

    if (isCloudEnabled()) {
      saveStatsToCloud('neep-pickleball', computed.playerStats, computed.partnershipStats);
    }
  }

  function broadcastTournamentChange(updates) {
    if (isCloudEnabled()) {
      saveTournamentToCloud('neep-pickleball', {
        view, playerPool, nextPlayerId, numTeams, goalScore, dreambreakerScore, allowUneven,
        captainMode, selectedCaptainIds,
        teams, playersById, remainingPool, pickSequence, pickPointer, sittingOut, bracket, activePath,
        ...updates,
      });
    }
  }

  function addPlayer(name) {
    const trimmed = String(name).trim();
    if (!trimmed) return;
    const updatedPool = [...playerPool, { id: nextPlayerId, name: trimmed }];
    setPlayerPool(updatedPool);
    setNextPlayerId((n) => n + 1);

    if (!savedPlayers.some((n) => n.trim().toLowerCase() === trimmed.toLowerCase())) {
      const updatedKnown = [...savedPlayers, trimmed];
      setSavedPlayers(updatedKnown);
      try {
        localStorage.setItem(STORAGE_KEY_KNOWN_PLAYERS, JSON.stringify(updatedKnown));
      } catch (e) {}
      if (isCloudEnabled()) {
        saveKnownPlayersToCloud('neep-pickleball', updatedKnown);
      }
    }
    broadcastTournamentChange({ playerPool: updatedPool, nextPlayerId: nextPlayerId + 1 });
  }

  function removePlayer(id) {
    const updatedPool = playerPool.filter((p) => p.id !== id);
    const updatedCaptains = selectedCaptainIds.filter((cid) => cid !== id);
    setPlayerPool(updatedPool);
    setSelectedCaptainIds(updatedCaptains);
    broadcastTournamentChange({ playerPool: updatedPool, selectedCaptainIds: updatedCaptains });
  }

  function handleAddSavedPlayer(name) {
    addPlayer(name);
  }

  function handleAddAllSavedPlayers() {
    const existingNames = new Set(playerPool.map((p) => p.name.trim().toLowerCase()));
    const toAdd = savedPlayers.filter((n) => !existingNames.has(n.trim().toLowerCase()));
    if (toAdd.length === 0) return;
    let nextId = nextPlayerId;
    const newItems = toAdd.map((name) => ({ id: nextId++, name }));
    const updatedPool = [...playerPool, ...newItems];
    setPlayerPool(updatedPool);
    setNextPlayerId(nextId);
    broadcastTournamentChange({ playerPool: updatedPool, nextPlayerId: nextId });
  }

  function handleRemoveSavedPlayer(name) {
    const updated = savedPlayers.filter((n) => n.trim().toLowerCase() !== name.trim().toLowerCase());
    setSavedPlayers(updated);
    try {
      localStorage.setItem(STORAGE_KEY_KNOWN_PLAYERS, JSON.stringify(updated));
    } catch (e) {}
    if (isCloudEnabled()) {
      saveKnownPlayersToCloud('neep-pickleball', updated);
    }
  }

  function handleInitializeDraft() {
    const captainsToUse = captainMode === 'manual' ? selectedCaptainIds : [];
    const result = initializeDraftState(playerPool, numTeams, allowUneven, captainsToUse);
    setTeams(result.teams);
    setRemainingPool(result.remainingPool);
    setPickSequence(result.pickSequence);
    setPickPointer(0);
    setPlayersById(result.playersById);
    setSittingOut(result.sittingOut);
    setView('draft');

    broadcastTournamentChange({
      teams: result.teams,
      remainingPool: result.remainingPool,
      pickSequence: result.pickSequence,
      pickPointer: 0,
      playersById: result.playersById,
      sittingOut: result.sittingOut,
      view: 'draft',
    });
  }

  function draftPlayer(playerId) {
    if (pickPointer >= pickSequence.length) return;
    const teamIdx = pickSequence[pickPointer];
    const updatedTeams = teams.map((t, i) =>
      i === teamIdx ? { ...t, draftOrder: [...t.draftOrder, playerId] } : t
    );
    const updatedPool = remainingPool.filter((p) => p.id !== playerId);
    const nextPointer = pickPointer + 1;

    setTeams(updatedTeams);
    setRemainingPool(updatedPool);
    setPickPointer(nextPointer);

    broadcastTournamentChange({
      teams: updatedTeams,
      remainingPool: updatedPool,
      pickPointer: nextPointer,
    });
  }

  function handleGenerateBracket() {
    const newBracket = generateBracket(teams);
    setBracket(newBracket);
    setView('bracket');
    broadcastTournamentChange({ bracket: newBracket, view: 'bracket' });
  }

  function getActiveMatch() {
    if (!activePath || !bracket) return null;
    return bracket.rounds[activePath.round][activePath.idx];
  }

  function openMatch(roundIdx, matchIdx) {
    const match = bracket.rounds[roundIdx][matchIdx];
    if (match.teamAId === null || match.teamBId === null) return;
    setActivePath({ round: roundIdx, idx: matchIdx });

    let workingBracket = bracket;
    if (!match.games) {
      const teamA = teams.find((t) => t.id === match.teamAId);
      const teamB = teams.find((t) => t.id === match.teamBId);
      const games = generateGames(teamA, teamB, goalScore);
      const nb = JSON.parse(JSON.stringify(bracket));
      nb.rounds[roundIdx][matchIdx].games = games;
      nb.rounds[roundIdx][matchIdx].status = 'in_progress';
      workingBracket = nb;
      setBracket(nb);
      broadcastTournamentChange({ bracket: nb, activePath: { round: roundIdx, idx: matchIdx } });
    }

    const current = workingBracket.rounds[roundIdx][matchIdx];
    if (current.status === 'complete') { setView('match'); return; }
    if (current.status === 'tied') {
      setView(current.dreambreaker && current.dreambreaker.started ? 'dreambreakerPlay' : 'dreambreakerSetup');
      return;
    }
    setView('match');
  }

  function handleSaveGame(gameId, scoreA, scoreB) {
    const { round, idx } = activePath;
    const match = bracket.rounds[round][idx];
    const teamA = teams.find((t) => t.id === match.teamAId);
    const teamB = teams.find((t) => t.id === match.teamBId);
    const updatedGames = match.games.map((g) =>
      g.id === gameId ? { ...g, scoreA: Number(scoreA), scoreB: Number(scoreB), saved: true } : g
    );
    const gamesWonA = updatedGames.filter((g) => g.saved && g.scoreA > g.scoreB).length;
    const gamesWonB = updatedGames.filter((g) => g.saved && g.scoreB > g.scoreA).length;
    const allSaved = updatedGames.every((g) => g.saved);

    let nb = JSON.parse(JSON.stringify(bracket));
    const m = nb.rounds[round][idx];
    m.games = updatedGames;
    m.gamesWonA = gamesWonA;
    m.gamesWonB = gamesWonB;

    if (allSaved) {
      if (gamesWonA === gamesWonB) {
        m.status = 'tied';
        if (!m.dreambreaker || m.winnerId !== null) {
          m.dreambreaker = {
            lineupA: [...teamA.draftOrder],
            lineupB: [...teamB.draftOrder],
            lockedA: false,
            lockedB: false,
            started: false,
            scoreA: 0,
            scoreB: 0,
            goalScore: dreambreakerScore,
            rotationIndex: 0,
            lastRotationTrigger: 0,
            playerStats: {},
            completed: false,
            winnerId: null,
          };
        }
        m.winnerId = null;
        if (round + 1 < nb.rounds.length) {
          const nextIdx = Math.floor(idx / 2);
          const slot = idx % 2 === 0 ? 'teamAId' : 'teamBId';
          nb.rounds[round + 1][nextIdx][slot] = null;
          nb.rounds[round + 1][nextIdx].status = 'pending';
        }
      } else {
        const winnerId = gamesWonA > gamesWonB ? match.teamAId : match.teamBId;
        m.status = 'complete';
        m.winnerId = winnerId;
        nb = advanceWinner(nb, round, idx, winnerId);
      }
    } else {
      m.status = 'in_progress';
      m.winnerId = null;
      if (round + 1 < nb.rounds.length) {
        const nextIdx = Math.floor(idx / 2);
        const slot = idx % 2 === 0 ? 'teamAId' : 'teamBId';
        nb.rounds[round + 1][nextIdx][slot] = null;
        nb.rounds[round + 1][nextIdx].status = 'pending';
      }
    }
    setBracket(nb);
    syncTournamentStats(nb, teams, playersById);
    broadcastTournamentChange({ bracket: nb });
  }

  function handleReRandomizeExtraGames() {
    if (!activePath || !bracket) return;
    const { round, idx } = activePath;
    const match = bracket.rounds[round][idx];
    if (!match.games || match.status === 'complete') return;
    const teamA = teams.find((t) => t.id === match.teamAId);
    const teamB = teams.find((t) => t.id === match.teamBId);
    const newGames = generateGames(teamA, teamB, goalScore);
    const merged = newGames.map((g, i) => {
      const existing = match.games[i];
      if (existing && existing.saved) return existing;
      return g;
    });
    const nb = JSON.parse(JSON.stringify(bracket));
    nb.rounds[round][idx].games = merged;
    setBracket(nb);
    broadcastTournamentChange({ bracket: nb });
  }

  function handleUpdateDreambreakerScore(newScore) {
    if (!activePath || !bracket) return;
    const { round, idx } = activePath;
    const nb = JSON.parse(JSON.stringify(bracket));
    if (nb.rounds[round][idx].dreambreaker) {
      nb.rounds[round][idx].dreambreaker.goalScore = newScore;
      setBracket(nb);
      broadcastTournamentChange({ bracket: nb });
    }
    setDreambreakerScore(newScore);
  }

  function moveLineup(team, index, dir) {
    const { round, idx } = activePath;
    const nb = JSON.parse(JSON.stringify(bracket));
    const arr = nb.rounds[round][idx].dreambreaker[team === 'A' ? 'lineupA' : 'lineupB'];
    const to = index + dir;
    if (to < 0 || to >= arr.length) return;
    [arr[index], arr[to]] = [arr[to], arr[index]];
    setBracket(nb);
    broadcastTournamentChange({ bracket: nb });
  }

  function lockLineup(team) {
    const { round, idx } = activePath;
    const nb = JSON.parse(JSON.stringify(bracket));
    nb.rounds[round][idx].dreambreaker[team === 'A' ? 'lockedA' : 'lockedB'] = true;
    setBracket(nb);
    broadcastTournamentChange({ bracket: nb });
  }

  function startDreambreaker() {
    const { round, idx } = activePath;
    const nb = JSON.parse(JSON.stringify(bracket));
    nb.rounds[round][idx].dreambreaker.started = true;
    setBracket(nb);
    setView('dreambreakerPlay');
    broadcastTournamentChange({ bracket: nb, view: 'dreambreakerPlay' });
  }

  function triggerRotateBanner() {
    setShowRotateBanner(true);
    if (rotateTimeoutRef.current) clearTimeout(rotateTimeoutRef.current);
    rotateTimeoutRef.current = setTimeout(() => setShowRotateBanner(false), 2500);
  }

  function scoreDreambreakerPoint(scoringTeam) {
    const { round, idx } = activePath;
    const match = bracket.rounds[round][idx];
    const teamA = teams.find((t) => t.id === match.teamAId);
    const teamB = teams.find((t) => t.id === match.teamBId);
    const db = match.dreambreaker;
    const lenA = db.lineupA.length;
    const lenB = db.lineupB.length;
    const activeAId = db.lineupA[db.rotationIndex % lenA];
    const activeBId = db.lineupB[db.rotationIndex % lenB];
    const newScoreA = db.scoreA + (scoringTeam === 'A' ? 1 : 0);
    const newScoreB = db.scoreB + (scoringTeam === 'B' ? 1 : 0);
    const combined = newScoreA + newScoreB;
    const willRotate = combined > 0 && combined % 4 === 0 && combined !== db.lastRotationTrigger;
    const newRotationIndex = willRotate ? db.rotationIndex + 1 : db.rotationIndex;

    let nb = JSON.parse(JSON.stringify(bracket));
    const m = nb.rounds[round][idx];
    const ps = m.dreambreaker.playerStats;
    function bump(id, field) {
      const key = String(id);
      if (!ps[key]) ps[key] = { pointsWon: 0, pointsLost: 0 };
      ps[key][field] += 1;
    }
    if (scoringTeam === 'A') { bump(activeAId, 'pointsWon'); bump(activeBId, 'pointsLost'); }
    else { bump(activeBId, 'pointsWon'); bump(activeAId, 'pointsLost'); }

    m.dreambreaker.scoreA = newScoreA;
    m.dreambreaker.scoreB = newScoreB;
    m.dreambreaker.rotationIndex = newRotationIndex;
    if (willRotate) m.dreambreaker.lastRotationTrigger = combined;

    const targetScore = m.dreambreaker.goalScore || dreambreakerScore || 21;
    const isWin = (newScoreA >= targetScore || newScoreB >= targetScore) && Math.abs(newScoreA - newScoreB) >= 2;

    if (isWin) {
      const winnerId = newScoreA > newScoreB ? match.teamAId : match.teamBId;
      m.dreambreaker.completed = true;
      m.dreambreaker.winnerId = winnerId;
      nb = advanceWinner(nb, round, idx, winnerId);
    }

    setBracket(nb);
    syncTournamentStats(nb, teams, playersById);
    broadcastTournamentChange({ bracket: nb });
    if (willRotate && !isWin) triggerRotateBanner();
  }

  function handleUnlockAdmin(pin) {
    if (pin === adminPin) {
      setIsAdmin(true);
      return true;
    }
    return false;
  }

  function requestClearTournament() {
    setModal({
      title: 'New Tournament or Reset?',
      message: 'Choose whether to start a new tournament keeping your current player pool, or clear the active pool. All stats remain permanently saved in the leaderboard.',
      secondaryConfirm: {
        label: 'Start New (Keep Same Players)',
        onAction: () => {
          setPriorStats(globalStats);
          setPriorPartnershipStats(partnershipStats);
          setTeams([]);
          setPlayersById({});
          setRemainingPool([]);
          setPickSequence([]);
          setPickPointer(0);
          setSittingOut([]);
          setBracket(null);
          setActivePath(null);
          setView('setup');
          try {
            localStorage.removeItem(STORAGE_KEY_TOURNAMENT);
          } catch (e) {}
          broadcastTournamentChange({
            teams: [],
            playersById: {},
            remainingPool: [],
            pickSequence: [],
            pickPointer: 0,
            sittingOut: [],
            bracket: null,
            activePath: null,
            view: 'setup',
          });
          setModal(null);
        },
      },
      confirmLabel: 'Clear All',
      onConfirm: () => {
        setPriorStats(globalStats);
        setPriorPartnershipStats(partnershipStats);
        setPlayerPool([]);
        setNextPlayerId(1);
        setNumTeams(4);
        setGoalScore(11);
        setDreambreakerScore(21);
        setAllowUneven(true);
        setTeams([]);
        setPlayersById({});
        setRemainingPool([]);
        setPickSequence([]);
        setPickPointer(0);
        setSittingOut([]);
        setBracket(null);
        setActivePath(null);
        setView('setup');
        try {
          localStorage.removeItem(STORAGE_KEY_TOURNAMENT);
        } catch (e) {}
        broadcastTournamentChange({
          playerPool: [],
          nextPlayerId: 1,
          teams: [],
          playersById: {},
          remainingPool: [],
          pickSequence: [],
          pickPointer: 0,
          sittingOut: [],
          bracket: null,
          activePath: null,
          view: 'setup',
        });
        setModal(null);
      },
    });
  }

  function requestWipeStats() {
    setModal({
      title: 'Wipe All Stats?',
      message: 'This permanently deletes the all-time leaderboard and all partnership records. This cannot be undone.',
      confirmLabel: 'Wipe Stats',
      onConfirm: () => {
        try {
          localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({}));
          localStorage.setItem(STORAGE_KEY_PARTNERSHIPS, JSON.stringify({}));
        } catch (e) {}
        setGlobalStats({});
        setPartnershipStats({});
        setPriorStats({});
        setPriorPartnershipStats({});
        if (isCloudEnabled()) {
          saveStatsToCloud('neep-pickleball', {}, {});
        }
        setModal(null);
      },
    });
  }

  const activeMatch = getActiveMatch();
  const activeTeamA = activeMatch ? teams.find((t) => t.id === activeMatch.teamAId) : null;
  const activeTeamB = activeMatch ? teams.find((t) => t.id === activeMatch.teamBId) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header
        hasTournament={teams.length > 0}
        view={view}
        setView={setView}
        onBracketTab={() => setView(bracket ? 'bracket' : 'draft')}
        onClear={requestClearTournament}
        onWipeStats={requestWipeStats}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenCloudConfig={() => setIsCloudConfigOpen(true)}
        isAdmin={isAdmin}
        onUnlockAdmin={handleUnlockAdmin}
      />

      <main className="flex-1">
        {view === 'setup' && (
          <SetupView
            playerPool={playerPool}
            addPlayer={addPlayer}
            removePlayer={removePlayer}
            savedPlayers={savedPlayers}
            onAddSavedPlayer={handleAddSavedPlayer}
            onAddAllSavedPlayers={handleAddAllSavedPlayers}
            onRemoveSavedPlayer={handleRemoveSavedPlayer}
            numTeams={numTeams}
            setNumTeams={setNumTeams}
            goalScore={goalScore}
            setGoalScore={setGoalScore}
            dreambreakerScore={dreambreakerScore}
            setDreambreakerScore={setDreambreakerScore}
            allowUneven={allowUneven}
            setAllowUneven={setAllowUneven}
            captainMode={captainMode}
            setCaptainMode={setCaptainMode}
            selectedCaptainIds={selectedCaptainIds}
            setSelectedCaptainIds={setSelectedCaptainIds}
            onInitializeDraft={handleInitializeDraft}
            isAdmin={isAdmin}
          />
        )}

        {view === 'draft' && (
          <DraftView
            teams={teams}
            remainingPool={remainingPool}
            pickSequence={pickSequence}
            pickPointer={pickPointer}
            playersById={playersById}
            sittingOut={sittingOut}
            onDraftPlayer={draftPlayer}
            onGenerateBracket={handleGenerateBracket}
            isAdmin={isAdmin}
          />
        )}

        {view === 'bracket' && bracket && (
          <BracketView bracket={bracket} teams={teams} onOpenMatch={openMatch} />
        )}

        {view === 'match' && activeMatch && (
          <MatchDashboard
            key={activeMatch.id}
            match={activeMatch}
            teamA={activeTeamA}
            teamB={activeTeamB}
            playersById={playersById}
            onSaveGame={handleSaveGame}
            onBack={() => setView('bracket')}
            onGoToDreambreaker={() => setView('dreambreakerSetup')}
            onGoToBracket={() => setView('bracket')}
            onReRandomizeExtra={handleReRandomizeExtraGames}
            isAdmin={isAdmin}
          />
        )}

        {view === 'dreambreakerSetup' && activeMatch && (
          <DreambreakerSetupView
            match={activeMatch}
            teamA={activeTeamA}
            teamB={activeTeamB}
            playersById={playersById}
            dreambreakerScore={dreambreakerScore}
            onUpdateScoreLimit={handleUpdateDreambreakerScore}
            onMove={moveLineup}
            onLock={lockLineup}
            onStart={startDreambreaker}
            onBack={() => setView('bracket')}
            isAdmin={isAdmin}
          />
        )}

        {view === 'dreambreakerPlay' && activeMatch && (
          <DreambreakerPlayView
            match={activeMatch}
            teamA={activeTeamA}
            teamB={activeTeamB}
            playersById={playersById}
            dreambreakerScore={dreambreakerScore}
            showRotateBanner={showRotateBanner}
            onScore={scoreDreambreakerPoint}
            onBack={() => setView('bracket')}
            isAdmin={isAdmin}
          />
        )}

        {view === 'leaderboard' && (
          <LeaderboardView
            globalStats={globalStats}
            partnershipStats={partnershipStats}
          />
        )}
      </main>

      <ConfirmModal modal={modal} onCancel={() => setModal(null)} />
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        isAdmin={isAdmin}
        adminPin={adminPin}
      />
      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
      />
    </div>
  );
}
