export const TEAM_COLORS = [
  { accent: '#22d3ee', chip: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', ring: 'ring-cyan-400', soft: 'bg-cyan-500/10' },
  { accent: '#fb923c', chip: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', ring: 'ring-orange-400', soft: 'bg-orange-500/10' },
  { accent: '#f472b6', chip: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500', ring: 'ring-pink-400', soft: 'bg-pink-500/10' },
  { accent: '#a3e635', chip: 'bg-lime-500', text: 'text-lime-400', border: 'border-lime-500', ring: 'ring-lime-400', soft: 'bg-lime-500/10' },
  { accent: '#c084fc', chip: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', ring: 'ring-purple-400', soft: 'bg-purple-500/10' },
  { accent: '#f87171', chip: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', ring: 'ring-red-400', soft: 'bg-red-500/10' },
  { accent: '#facc15', chip: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500', ring: 'ring-yellow-400', soft: 'bg-yellow-500/10' },
  { accent: '#60a5fa', chip: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', ring: 'ring-blue-400', soft: 'bg-blue-500/10' },
];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generatePairs(draftOrder) {
  const pairs = [];
  const n = draftOrder.length;
  for (let i = 0; i < Math.floor(n / 2); i++) {
    pairs.push([draftOrder[i], draftOrder[n - 1 - i]]);
  }
  return pairs;
}

export function generateTeamPairsForGames(draftOrder, totalGames) {
  const n = draftOrder.length;
  if (n < 2) return [];
  const playCounts = {};
  draftOrder.forEach((id) => { playCounts[id] = 0; });
  const pairHistory = new Map();

  const pairs = [];
  for (let g = 0; g < totalGames; g++) {
    const candidates = shuffle([...draftOrder]).sort((a, b) => playCounts[a] - playCounts[b]);
    const p1 = candidates[0];
    let bestP2 = candidates[1];
    let bestScore = Infinity;
    for (let i = 1; i < candidates.length; i++) {
      const p2 = candidates[i];
      const key = p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
      const timesTogether = pairHistory.get(key) || 0;
      const score = timesTogether * 10 + playCounts[p2];
      if (score < bestScore) {
        bestScore = score;
        bestP2 = p2;
      }
    }

    pairs.push([p1, bestP2]);
    playCounts[p1] += 1;
    playCounts[bestP2] += 1;

    const chosenKey = p1 < bestP2 ? `${p1}-${bestP2}` : `${bestP2}-${p1}`;
    pairHistory.set(chosenKey, (pairHistory.get(chosenKey) || 0) + 1);
  }
  return pairs;
}

export function generateGames(teamA, teamB, goalScore) {
  const nA = teamA.draftOrder.length;
  const nB = teamB.draftOrder.length;

  if (nA === 4 && nB === 4) {
    const pairsA = generatePairs(teamA.draftOrder);
    const pairsB = generatePairs(teamB.draftOrder);
    const games = [];
    let id = 0;
    for (let a = 0; a < 2; a++) {
      for (let b = 0; b < 2; b++) {
        games.push({
          id: id++,
          pairA: pairsA[a],
          pairB: pairsB[b],
          scoreA: 0,
          scoreB: 0,
          saved: false,
          goalScore,
          isExtra: false,
          randomized: false,
        });
      }
    }
    return games;
  }

  const minGamesToCoverA = Math.ceil(nA / 2) * 2;
  const minGamesToCoverB = Math.ceil(nB / 2) * 2;
  let totalGames = Math.max(minGamesToCoverA, minGamesToCoverB, 4);
  if (totalGames % 2 !== 0) totalGames += 1;

  const baseGamesCount = 4;
  const teamPairsA = generateTeamPairsForGames(teamA.draftOrder, totalGames);
  const teamPairsB = generateTeamPairsForGames(teamB.draftOrder, totalGames);

  const games = [];
  for (let idx = 0; idx < totalGames; idx++) {
    const isExtra = idx >= baseGamesCount;
    games.push({
      id: idx,
      pairA: teamPairsA[idx],
      pairB: teamPairsB[idx],
      scoreA: 0,
      scoreB: 0,
      saved: false,
      goalScore,
      isExtra,
      randomized: isExtra || (nA !== nB),
    });
  }
  return games;
}

export function initializeDraftState(playerPool, numTeams, allowUneven = true, selectedCaptainIds = []) {
  const teams = [];
  const draftPlayers = [...playerPool];
  const sittingOut = [];

  const baseTeamSize = Math.floor(draftPlayers.length / numTeams);
  const remainder = draftPlayers.length % numTeams;

  if (!allowUneven && remainder > 0) {
    const captainSet = new Set(selectedCaptainIds);
    const nonCaptains = draftPlayers.filter((p) => !captainSet.has(p.id));
    const shuffledNonCaptains = shuffle(nonCaptains);
    const toSitOut = shuffledNonCaptains.slice(0, remainder);
    const sitOutSet = new Set(toSitOut.map((p) => p.id));
    toSitOut.forEach((p) => sittingOut.push(p.id));

    const toDraft = draftPlayers.filter((p) => !sitOutSet.has(p.id));
    draftPlayers.length = 0;
    draftPlayers.push(...toDraft);
  }

  for (let i = 0; i < numTeams; i++) {
    teams.push({
      id: i,
      name: `Team ${i + 1}`,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      captainId: null,
      draftOrder: [],
    });
  }

  // Determine captains:
  const captains = [];
  const captainIdSet = new Set();
  if (Array.isArray(selectedCaptainIds)) {
    for (const cid of selectedCaptainIds) {
      const found = draftPlayers.find((p) => p.id === cid);
      if (found && !captainIdSet.has(found.id) && captains.length < numTeams) {
        captains.push(found);
        captainIdSet.add(found.id);
      }
    }
  }

  // Fill any remaining captain slots randomly
  const poolForRandomCaptains = shuffle(draftPlayers.filter((p) => !captainIdSet.has(p.id)));
  while (captains.length < numTeams && poolForRandomCaptains.length > 0) {
    const nextCaptain = poolForRandomCaptains.pop();
    captains.push(nextCaptain);
    captainIdSet.add(nextCaptain.id);
  }

  for (let i = 0; i < numTeams; i++) {
    const player = captains[i];
    teams[i].captainId = player.id;
    teams[i].name = `Team ${player.name}`;
    teams[i].draftOrder.push(player.id);
  }

  const remainingPool = shuffle(draftPlayers.filter((p) => !captainIdSet.has(p.id)));

  const pickSequence = [];
  let draftedCount = numTeams;
  const totalPlayersToDraft = draftPlayers.length;
  let round = 1;

  while (draftedCount < totalPlayersToDraft) {
    const isEvenRound = round % 2 === 0;
    const order = isEvenRound
      ? Array.from({ length: numTeams }, (_, i) => numTeams - 1 - i)
      : Array.from({ length: numTeams }, (_, i) => i);

    for (const teamIdx of order) {
      if (draftedCount < totalPlayersToDraft) {
        pickSequence.push(teamIdx);
        draftedCount++;
      }
    }
    round++;
  }

  const playersById = {};
  playerPool.forEach((p) => { playersById[p.id] = p.name; });

  return { teams, remainingPool, pickSequence, playersById, sittingOut, teamSize: baseTeamSize };
}

export function generateBracket(teamsInput) {
  const order = shuffle(teamsInput);
  const numTeams = order.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, numTeams))));
  const numRounds = Math.log2(bracketSize);
  const rounds = [];

  const slots = new Array(bracketSize).fill(null);
  for (let i = 0; i < numTeams; i++) {
    slots[i] = order[i].id;
  }

  const round0 = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const teamAId = slots[i];
    const teamBId = slots[i + 1];
    const isBye = teamAId !== null && teamBId === null;
    round0.push({
      id: `r0-m${i / 2}`,
      teamAId,
      teamBId,
      winnerId: isBye ? teamAId : null,
      isBye,
      status: isBye ? 'complete' : teamAId !== null && teamBId !== null ? 'ready' : 'pending',
      games: null,
      gamesWonA: 0,
      gamesWonB: 0,
      dreambreaker: null,
    });
  }
  rounds.push(round0);

  for (let r = 1; r < numRounds; r++) {
    const prevMatches = rounds[r - 1].length;
    const matches = [];
    for (let m = 0; m < prevMatches / 2; m++) {
      matches.push({
        id: `r${r}-m${m}`,
        teamAId: null,
        teamBId: null,
        winnerId: null,
        isBye: false,
        status: 'pending',
        games: null,
        gamesWonA: 0,
        gamesWonB: 0,
        dreambreaker: null,
      });
    }
    rounds.push(matches);
  }

  for (let mi = 0; mi < round0.length; mi++) {
    if (round0[mi].isBye && rounds.length > 1) {
      const nextIdx = Math.floor(mi / 2);
      const slot = mi % 2 === 0 ? 'teamAId' : 'teamBId';
      rounds[1][nextIdx][slot] = round0[mi].winnerId;
    }
  }
  if (rounds.length > 1) {
    rounds[1].forEach((m) => {
      if (m.teamAId !== null && m.teamBId !== null) m.status = 'ready';
    });
  }

  return { rounds, championId: null };
}

export function advanceWinner(bracket, roundIdx, matchIdx, winnerId) {
  const nb = JSON.parse(JSON.stringify(bracket));
  const m = nb.rounds[roundIdx][matchIdx];
  m.winnerId = winnerId;
  m.status = 'complete';
  if (roundIdx + 1 < nb.rounds.length) {
    const nextIdx = Math.floor(matchIdx / 2);
    const slot = matchIdx % 2 === 0 ? 'teamAId' : 'teamBId';
    const nextMatch = nb.rounds[roundIdx + 1][nextIdx];
    nextMatch[slot] = winnerId;
    if (nextMatch.teamAId !== null && nextMatch.teamBId !== null) nextMatch.status = 'ready';
  } else {
    nb.championId = winnerId;
  }
  return nb;
}

export function roundName(totalRounds, roundIdx) {
  const remaining = totalRounds - roundIdx;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semifinals';
  if (remaining === 3) return 'Quarterfinals';
  return `Round ${roundIdx + 1}`;
}

export function getPartnershipKey(nameA, nameB) {
  const normA = String(nameA).trim();
  const normB = String(nameB).trim();
  return [normA, normB].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })).join(' & ');
}

export function computeAllStats(priorPlayerStats = {}, priorPartnershipStats = {}, bracket = null, teams = [], playersById = {}) {
  const playerStats = JSON.parse(JSON.stringify(priorPlayerStats || {}));
  const partnershipStats = JSON.parse(JSON.stringify(priorPartnershipStats || {}));

  function ensurePlayer(id) {
    const name = playersById[id];
    if (!name) return null;
    const key = String(name).trim().toLowerCase();
    if (!playerStats[key]) {
      playerStats[key] = { name: String(name).trim(), matchesPlayed: 0, wins: 0, losses: 0, pointsWon: 0, pointsLost: 0, dreambreakerDiff: 0 };
    }
    return playerStats[key];
  }

  function ensurePair(id1, id2) {
    const name1 = playersById[id1];
    const name2 = playersById[id2];
    if (!name1 || !name2) return null;
    const key = getPartnershipKey(name1, name2);
    if (!partnershipStats[key]) {
      partnershipStats[key] = {
        name: key,
        names: [String(name1).trim(), String(name2).trim()],
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        pointsWon: 0,
        pointsLost: 0,
        pointDiff: 0,
      };
    }
    return partnershipStats[key];
  }

  if (bracket && bracket.rounds) {
    bracket.rounds.forEach((round) => {
      round.forEach((match) => {
        if (!match.games) return;
        const teamA = teams.find((t) => t.id === match.teamAId);
        const teamB = teams.find((t) => t.id === match.teamBId);
        if (!teamA || !teamB) return;

        match.games.forEach((g) => {
          if (!g.saved) return;
          g.pairA.forEach((id) => {
            const p = ensurePlayer(id);
            if (p) { p.pointsWon += g.scoreA; p.pointsLost += g.scoreB; }
          });
          g.pairB.forEach((id) => {
            const p = ensurePlayer(id);
            if (p) { p.pointsWon += g.scoreB; p.pointsLost += g.scoreA; }
          });

          const pairA = ensurePair(g.pairA[0], g.pairA[1]);
          const pairB = ensurePair(g.pairB[0], g.pairB[1]);
          if (pairA) {
            pairA.gamesPlayed += 1;
            if (g.scoreA > g.scoreB) pairA.wins += 1; else if (g.scoreB > g.scoreA) pairA.losses += 1;
            pairA.pointsWon += g.scoreA;
            pairA.pointsLost += g.scoreB;
            pairA.pointDiff += (g.scoreA - g.scoreB);
          }
          if (pairB) {
            pairB.gamesPlayed += 1;
            if (g.scoreB > g.scoreA) pairB.wins += 1; else if (g.scoreA > g.scoreB) pairB.losses += 1;
            pairB.pointsWon += g.scoreB;
            pairB.pointsLost += g.scoreA;
            pairB.pointDiff += (g.scoreB - g.scoreA);
          }
        });

        if (match.status === 'complete' && match.winnerId !== null) {
          teamA.draftOrder.forEach((id) => {
            const p = ensurePlayer(id);
            if (p) {
              p.matchesPlayed += 1;
              if (match.winnerId === teamA.id) p.wins += 1; else p.losses += 1;
            }
          });
          teamB.draftOrder.forEach((id) => {
            const p = ensurePlayer(id);
            if (p) {
              p.matchesPlayed += 1;
              if (match.winnerId === teamB.id) p.wins += 1; else p.losses += 1;
            }
          });
        }

        const db = match.dreambreaker;
        if (db && db.completed && db.playerStats) {
          Object.entries(db.playerStats).forEach(([idStr, ps]) => {
            const p = ensurePlayer(Number(idStr));
            if (p) {
              p.pointsWon += ps.pointsWon;
              p.pointsLost += ps.pointsLost;
              p.dreambreakerDiff += (ps.pointsWon - ps.pointsLost);
            }
          });
        }
      });
    });
  }

  return { playerStats, partnershipStats };
}
