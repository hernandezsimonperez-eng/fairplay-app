import { Match, SportType, Team, TeamStanding, Tournament, ScorerLeader, VallaItem, SanctionItem } from '../types';

export function calculateStandings(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): TeamStanding[] {
  const standingsMap: Record<string, {
    pj: number;
    pg: number;
    pe: number;
    pp: number;
    gf: number; // In table tennis, total game points won
    gc: number; // In table tennis, total game points conceded
    setsWon: number;
    setsLost: number;
    pts: number;
    group?: string;
    form: ('W' | 'D' | 'L')[];
  }> = {};

  // Initialize for all teams in tournament
  teams.forEach(team => {
    standingsMap[team.id] = {
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      setsWon: 0,
      setsLost: 0,
      pts: 0,
      group: team.group,
      form: [],
    };
  });

  // Only consider finished matches for standings
  const finishedMatches = matches.filter(
    m => m.tournamentId === tournament.id && m.status === 'finished'
  );

  finishedMatches.forEach(match => {
    const home = standingsMap[match.homeTeamId];
    const away = standingsMap[match.awayTeamId];

    if (!home || !away) return;

    home.pj += 1;
    away.pj += 1;

    // Handle Sets & Points for Ping Pong (Tenis de Mesa) & Volleyball
    if (tournament.sport === 'tenis_mesa' || tournament.sport === 'tenis' || tournament.sport === 'voleibol') {
      let homeSets = 0;
      let awaySets = 0;
      let homeTotalGamePoints = 0;
      let awayTotalGamePoints = 0;

      if (match.sets && match.sets.length > 0) {
        match.sets.forEach(s => {
          homeTotalGamePoints += s.homeScore || 0;
          awayTotalGamePoints += s.awayScore || 0;
          if (s.homeScore > s.awayScore) {
            homeSets++;
          } else if (s.awayScore > s.homeScore) {
            awaySets++;
          }
        });
      } else {
        homeSets = match.homeScore || 0;
        awaySets = match.awayScore || 0;
      }

      home.setsWon += homeSets;
      home.setsLost += awaySets;
      away.setsWon += awaySets;
      away.setsLost += homeSets;

      home.gf += homeTotalGamePoints > 0 ? homeTotalGamePoints : match.homeScore;
      home.gc += awayTotalGamePoints > 0 ? awayTotalGamePoints : match.awayScore;
      away.gf += awayTotalGamePoints > 0 ? awayTotalGamePoints : match.awayScore;
      away.gc += homeTotalGamePoints > 0 ? homeTotalGamePoints : match.homeScore;

      // Table Tennis & Racket rules: Winner gets 3 points, Loser gets 0 points
      if (homeSets > awaySets) {
        home.pg += 1;
        away.pp += 1;
        home.pts += tournament.rules.pointsForWin || 3;
        away.pts += tournament.rules.pointsForLoss || 0;
        home.form.push('W');
        away.form.push('L');
      } else if (awaySets > homeSets) {
        away.pg += 1;
        home.pp += 1;
        away.pts += tournament.rules.pointsForWin || 3;
        home.pts += tournament.rules.pointsForLoss || 0;
        away.form.push('W');
        home.form.push('L');
      } else {
        // Tie in sets (if applicable in group format)
        home.pe += 1;
        away.pe += 1;
        home.pts += tournament.rules.pointsForDraw || 1;
        away.pts += tournament.rules.pointsForDraw || 1;
        home.form.push('D');
        away.form.push('D');
      }
      return;
    }

    // Standard Football / Futsal evaluation
    home.gf += match.homeScore;
    home.gc += match.awayScore;
    away.gf += match.awayScore;
    away.gc += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.pg += 1;
      away.pp += 1;
      home.pts += tournament.rules.pointsForWin;
      away.pts += tournament.rules.pointsForLoss;
      home.form.push('W');
      away.form.push('L');
    } else if (match.homeScore < match.awayScore) {
      away.pg += 1;
      home.pp += 1;
      away.pts += tournament.rules.pointsForWin;
      home.pts += tournament.rules.pointsForLoss;
      away.form.push('W');
      home.form.push('L');
    } else {
      home.pe += 1;
      away.pe += 1;
      home.pts += tournament.rules.pointsForDraw;
      away.pts += tournament.rules.pointsForDraw;
      home.form.push('D');
      away.form.push('D');
    }
  });

  // Convert to array and calculate DG
  const result: TeamStanding[] = teams.map(team => {
    const stats = standingsMap[team.id] || {
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      setsWon: 0,
      setsLost: 0,
      pts: 0,
      group: team.group,
      form: [],
    };

    const dg = stats.gf - stats.gc;
    const setDiff = stats.setsWon - stats.setsLost;

    return {
      teamId: team.id,
      teamName: team.name,
      grade: team.grade,
      group: team.group,
      color: team.color,
      paymentStatus: team.paymentStatus || 'pending',
      pj: stats.pj,
      pg: stats.pg,
      pe: stats.pe,
      pp: stats.pp,
      gf: stats.gf,
      gc: stats.gc,
      dg,
      setsWon: stats.setsWon,
      setsLost: stats.setsLost,
      setDiff,
      pts: stats.pts,
      position: 1,
      formGuide: stats.form.slice(-5), // Last 5 results
    };
  });

  // Sort by:
  // 1. PTS (descending)
  // 2. Set difference (for racket/pingpong)
  // 3. DG (Game Points / Goals difference)
  // 4. GF (Points / Goals for)
  // 5. PG (Matches won)
  result.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (tournament.sport === 'voleibol' || tournament.sport === 'tenis_mesa' || tournament.sport === 'tenis') {
      if ((b.setDiff ?? 0) !== (a.setDiff ?? 0)) return (b.setDiff ?? 0) - (a.setDiff ?? 0);
    }
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return b.pg - a.pg;
  });

  // Assign 1-indexed position
  return result.map((item, index) => ({
    ...item,
    position: index + 1,
  }));
}

export function determineQualificationStatus(
  groupTeams: Team[],
  groupMatches: Match[],
  currentStandings: TeamStanding[]
): Record<string, 'guaranteed' | 'in_contention' | 'eliminated'> {
  const statusMap: Record<string, 'guaranteed' | 'in_contention' | 'eliminated'> = {};
  
  // Unplayed matches in group
  const unplayedMatches = groupMatches.filter(m => m.status !== 'finished');
  const teamIds = groupTeams.map(t => t.id);

  // If no matches are played yet at all, all are in contention
  const hasAnyPlayed = groupMatches.some(m => m.status === 'finished');
  if (!hasAnyPlayed) {
    teamIds.forEach(id => {
      statusMap[id] = 'in_contention';
    });
    return statusMap;
  }

  // If all matches in the group are finished
  if (unplayedMatches.length === 0) {
    currentStandings.forEach((st, idx) => {
      statusMap[st.teamId] = idx < 2 ? 'guaranteed' : 'eliminated';
    });
    return statusMap;
  }

  // Exact scenario simulation:
  // Since unplayed matches <= 10, total combinations = 2^(unplayedMatches.length)
  const numUnplayed = unplayedMatches.length;
  const totalCombinations = 1 << Math.min(numUnplayed, 12); // Safe cap

  // Track scenario outcomes for each team
  const teamOutcomes: Record<string, { canBeTop2: boolean; canBeOutsideTop2: boolean }> = {};
  teamIds.forEach(id => {
    teamOutcomes[id] = { canBeTop2: false, canBeOutsideTop2: false };
  });

  // Base points from finished matches
  const basePoints: Record<string, number> = {};
  const baseSetsDiff: Record<string, number> = {};
  const baseDG: Record<string, number> = {};
  teamIds.forEach(id => {
    const st = currentStandings.find(s => s.teamId === id);
    basePoints[id] = st ? st.pts : 0;
    baseSetsDiff[id] = st ? (st.setDiff ?? 0) : 0;
    baseDG[id] = st ? st.dg : 0;
  });

  for (let c = 0; c < totalCombinations; c++) {
    const scenarioPts = { ...basePoints };
    const scenarioSetsDiff = { ...baseSetsDiff };

    for (let i = 0; i < numUnplayed; i++) {
      const match = unplayedMatches[i];
      const homeWins = (c & (1 << i)) !== 0;

      if (homeWins) {
        if (scenarioPts[match.homeTeamId] !== undefined) scenarioPts[match.homeTeamId] += 3;
        if (scenarioSetsDiff[match.homeTeamId] !== undefined) scenarioSetsDiff[match.homeTeamId] += 2;
        if (scenarioSetsDiff[match.awayTeamId] !== undefined) scenarioSetsDiff[match.awayTeamId] -= 2;
      } else {
        if (scenarioPts[match.awayTeamId] !== undefined) scenarioPts[match.awayTeamId] += 3;
        if (scenarioSetsDiff[match.awayTeamId] !== undefined) scenarioSetsDiff[match.awayTeamId] += 2;
        if (scenarioSetsDiff[match.homeTeamId] !== undefined) scenarioSetsDiff[match.homeTeamId] -= 2;
      }
    }

    // Rank teams for this scenario
    const ranked = [...teamIds].sort((a, b) => {
      if (scenarioPts[b] !== scenarioPts[a]) return scenarioPts[b] - scenarioPts[a];
      if (scenarioSetsDiff[b] !== scenarioSetsDiff[a]) return scenarioSetsDiff[b] - scenarioSetsDiff[a];
      return (baseDG[b] || 0) - (baseDG[a] || 0);
    });

    // Check rankings
    teamIds.forEach(id => {
      const rank = ranked.indexOf(id);
      const teamPts = scenarioPts[id];
      const teamsStrictlyAhead = teamIds.filter(otherId => otherId !== id && scenarioPts[otherId] > teamPts).length;
      const teamsTiedOrAhead = teamIds.filter(otherId => otherId !== id && scenarioPts[otherId] >= teamPts).length;

      if (teamsStrictlyAhead < 2 && rank < 2) {
        teamOutcomes[id].canBeTop2 = true;
      } else if (teamsStrictlyAhead < 2) {
        teamOutcomes[id].canBeTop2 = true;
      }

      if (rank >= 2 || teamsTiedOrAhead >= 2) {
        teamOutcomes[id].canBeOutsideTop2 = true;
      }
    });
  }

  // Classify each team
  teamIds.forEach(id => {
    const outcome = teamOutcomes[id];
    if (outcome.canBeTop2 && !outcome.canBeOutsideTop2) {
      statusMap[id] = 'guaranteed'; // 🟢 Clasificado Asegurado
    } else if (!outcome.canBeTop2) {
      statusMap[id] = 'eliminated'; // ⚪ Eliminado Matemático
    } else {
      statusMap[id] = 'in_contention'; // 🟠 En Disputa
    }
  });

  return statusMap;
}

export function calculateGroupStandings(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): Record<string, TeamStanding[]> {
  const groups = tournament.groups && tournament.groups.length > 0 
    ? tournament.groups 
    : (Array.from(new Set(teams.map(t => t.group).filter(Boolean))) as string[]);

  const defaultGroups = groups.length > 0 ? groups : ['A', 'B', 'C', 'D'];
  const groupStandings: Record<string, TeamStanding[]> = {};

  defaultGroups.forEach(grp => {
    const grpTeams = teams.filter(t => (t.group || 'U') === grp);
    const grpMatches = matches.filter(m => (m.group || 'U') === grp);
    const stds = calculateStandings(tournament, grpTeams, grpMatches);
    const qualificationMap = determineQualificationStatus(grpTeams, grpMatches, stds);

    groupStandings[grp] = stds.map(st => ({
      ...st,
      qualificationStatus: qualificationMap[st.teamId] || 'in_contention',
    }));
  });

  return groupStandings;
}

export function syncPlayoffParticipants(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): Match[] {
  const updatedMatches = [...matches];

  // Volleyball Pre-Juvenil playoff sync (Top 1 vs Top 2 of Grupo U)
  if (tournament.id === 'tourn-volley-prejuvenil') {
    const groupStandings = calculateGroupStandings(tournament, teams, matches);
    const uStandings = groupStandings['U'] || [];
    const hasUPlayed = uStandings.some(s => s.pj > 0);
    if (hasUPlayed && uStandings.length >= 2) {
      const finalIdx = updatedMatches.findIndex(m => m.id === 'm-vpj-final');
      if (finalIdx !== -1 && updatedMatches[finalIdx].status === 'scheduled') {
        updatedMatches[finalIdx] = {
          ...updatedMatches[finalIdx],
          homeTeamId: uStandings[0].teamId,
          awayTeamId: uStandings[1].teamId,
        };
      }
    }
    return updatedMatches;
  }

  // Volleyball Juvenil Mixto playoff sync (1A vs 2B, 1B vs 2A -> Final)
  if (tournament.id === 'tourn-volley-juvenil-mixto') {
    const groupStandings = calculateGroupStandings(tournament, teams, matches);
    const aStandings = groupStandings['A'] || [];
    const bStandings = groupStandings['B'] || [];
    const hasAPlayed = aStandings.some(s => s.pj > 0);
    const hasBPlayed = bStandings.some(s => s.pj > 0);

    const semi1Idx = updatedMatches.findIndex(m => m.id === 'm-vjm-semi1');
    const semi2Idx = updatedMatches.findIndex(m => m.id === 'm-vjm-semi2');
    const finalIdx = updatedMatches.findIndex(m => m.id === 'm-vjm-final');

    if (semi1Idx !== -1 && updatedMatches[semi1Idx].status === 'scheduled') {
      if (hasAPlayed && aStandings[0] && hasBPlayed && bStandings[1]) {
        updatedMatches[semi1Idx] = {
          ...updatedMatches[semi1Idx],
          homeTeamId: aStandings[0].teamId,
          awayTeamId: bStandings[1].teamId,
        };
      }
    }

    if (semi2Idx !== -1 && updatedMatches[semi2Idx].status === 'scheduled') {
      if (hasBPlayed && bStandings[0] && hasAPlayed && aStandings[1]) {
        updatedMatches[semi2Idx] = {
          ...updatedMatches[semi2Idx],
          homeTeamId: bStandings[0].teamId,
          awayTeamId: aStandings[1].teamId,
        };
      }
    }

    // If both semis finished, propagate winners to Final
    const semi1 = updatedMatches.find(m => m.id === 'm-vjm-semi1');
    const semi2 = updatedMatches.find(m => m.id === 'm-vjm-semi2');
    if (semi1?.status === 'finished' && semi2?.status === 'finished' && finalIdx !== -1 && updatedMatches[finalIdx].status === 'scheduled') {
      const winner1 = semi1.winnerTeamId || (semi1.homeScore > semi1.awayScore ? semi1.homeTeamId : semi1.awayTeamId);
      const winner2 = semi2.winnerTeamId || (semi2.homeScore > semi2.awayScore ? semi2.homeTeamId : semi2.awayTeamId);
      if (winner1 && winner2) {
        updatedMatches[finalIdx] = {
          ...updatedMatches[finalIdx],
          homeTeamId: winner1,
          awayTeamId: winner2,
        };
      }
    }

    return updatedMatches;
  }

  if (tournament.sport !== 'tenis_mesa') return matches;

  const groupStandings = calculateGroupStandings(tournament, teams, matches);

  // Only consider group leaders/runners-up if they have actually played matches
  const hasGroupPlayed = (grp: 'A' | 'B' | 'C' | 'D') => {
    return (groupStandings[grp] || []).some(s => s.pj > 0);
  };

  const top1_A = hasGroupPlayed('A') ? groupStandings.A[0]?.teamId : undefined;
  const top2_A = hasGroupPlayed('A') ? groupStandings.A[1]?.teamId : undefined;
  const top1_B = hasGroupPlayed('B') ? groupStandings.B[0]?.teamId : undefined;
  const top2_B = hasGroupPlayed('B') ? groupStandings.B[1]?.teamId : undefined;
  const top1_C = hasGroupPlayed('C') ? groupStandings.C[0]?.teamId : undefined;
  const top2_C = hasGroupPlayed('C') ? groupStandings.C[1]?.teamId : undefined;
  const top1_D = hasGroupPlayed('D') ? groupStandings.D[0]?.teamId : undefined;
  const top2_D = hasGroupPlayed('D') ? groupStandings.D[1]?.teamId : undefined;

  // Helper to update match if not finished/locked
  const updateMatchTeams = (matchId: string, homeId?: string, awayId?: string) => {
    const idx = updatedMatches.findIndex(m => m.id === matchId && m.tournamentId === tournament.id);
    if (idx !== -1) {
      const match = updatedMatches[idx];
      if (match.status === 'scheduled') {
        updatedMatches[idx] = {
          ...match,
          homeTeamId: homeId !== undefined ? homeId : match.homeTeamId,
          awayTeamId: awayId !== undefined ? awayId : match.awayTeamId,
        };
      }
    }
  };

  // Cuartos Cruzados:
  // Llave 1: 1º A vs 2º C
  // Llave 2: 1º B vs 2º D
  // Llave 3: 1º C vs 2º A
  // Llave 4: 1º D vs 2º B
  updateMatchTeams('m-tt-cruz-1', top1_A || 'tt-a1', top2_C || 'tt-c2');
  updateMatchTeams('m-tt-cruz-2', top1_B || 'tt-b1', top2_D || 'tt-d2');
  updateMatchTeams('m-tt-cruz-3', top1_C || 'tt-c1', top2_A || 'tt-a2');
  updateMatchTeams('m-tt-cruz-4', top1_D || 'tt-d1', top2_B || 'tt-b2');

  // Semifinales winners:
  // Semi 1: Ganador Llave 1 vs Ganador Llave 3
  // Semi 2: Ganador Llave 2 vs Ganador Llave 4
  const getWinner = (matchId: string): string | undefined => {
    const match = updatedMatches.find(m => m.id === matchId);
    if (match && match.status === 'finished') {
      return match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    }
    return undefined;
  };

  const winCruz1 = getWinner('m-tt-cruz-1');
  const winCruz2 = getWinner('m-tt-cruz-2');
  const winCruz3 = getWinner('m-tt-cruz-3');
  const winCruz4 = getWinner('m-tt-cruz-4');

  updateMatchTeams('m-tt-semi-1', winCruz1 || 'placeholder-semi1-h', winCruz3 || 'placeholder-semi1-a');
  updateMatchTeams('m-tt-semi-2', winCruz2 || 'placeholder-semi2-h', winCruz4 || 'placeholder-semi2-a');

  // Finalists:
  // Final: Ganador Semifinal 1 vs Ganador Semifinal 2
  const winSemi1 = getWinner('m-tt-semi-1');
  const winSemi2 = getWinner('m-tt-semi-2');

  updateMatchTeams('m-tt-final', winSemi1 || 'placeholder-final-h', winSemi2 || 'placeholder-final-a');

  // 3er Puesto: Perdedor Semifinal 1 vs Perdedor Semifinal 2
  const getLoser = (matchId: string): string | undefined => {
    const match = updatedMatches.find(m => m.id === matchId);
    if (match && match.status === 'finished') {
      return match.homeScore > match.awayScore ? match.awayTeamId : match.homeTeamId;
    }
    return undefined;
  };

  const loserSemi1 = getLoser('m-tt-semi-1');
  const loserSemi2 = getLoser('m-tt-semi-2');

  updateMatchTeams('m-tt-3rd-place', loserSemi1 || 'tt-c1', loserSemi2 || 'tt-d1');

  return updatedMatches;
}

export function calculateTreasury(
  tournament: Tournament,
  teams: Team[]
) {
  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);
  const fee = tournament.rules.registrationFee || 5000;
  const totalPlayersOrTeams = tournamentTeams.length;
  const totalExpected = totalPlayersOrTeams * fee;

  const paidCount = tournamentTeams.filter(t => t.paymentStatus === 'paid').length;
  const pendingCount = totalPlayersOrTeams - paidCount;
  const totalCollected = paidCount * fee;
  const totalPending = pendingCount * fee;
  const collectionPercentage = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  return {
    fee,
    totalPlayersOrTeams,
    totalExpected,
    paidCount,
    pendingCount,
    totalCollected,
    totalPending,
    collectionPercentage,
  };
}

export function calculateScorers(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): ScorerLeader[] {
  const playerMap: Record<string, {
    playerId: string;
    playerName: string;
    playerNumber?: number;
    teamId: string;
    teamName: string;
    teamColor: string;
    grade: string;
    scoreCount: number;
    yellowCards: number;
    redCards: number;
    matchesPlayed: Set<string>;
  }> = {};

  // Pre-seed with all registered players so everyone is available
  teams.forEach(team => {
    team.players.forEach(p => {
      playerMap[p.id] = {
        playerId: p.id,
        playerName: p.name,
        playerNumber: p.number,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        grade: team.grade,
        scoreCount: p.stats.goalsOrPoints || 0,
        yellowCards: p.stats.yellowCards || 0,
        redCards: p.stats.redCards || 0,
        matchesPlayed: new Set<string>(),
      };
    });
  });

  // Count events from matches
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);

  tournamentMatches.forEach(match => {
    if (match.status === 'finished' || match.status === 'in_progress') {
      // Find events with player attribution
      match.events.forEach(event => {
        if (event.playerId && playerMap[event.playerId]) {
          playerMap[event.playerId].matchesPlayed.add(match.id);
          if (event.type === 'goal' || event.type === 'point') {
            // Only add if not already pre-counted in initial stats, or count real match events
            // We count match events dynamically:
          }
          if (event.type === 'card_yellow') {
            playerMap[event.playerId].yellowCards += 1;
          }
          if (event.type === 'card_red') {
            playerMap[event.playerId].redCards += 1;
          }
        }
      });
    }
  });

  // Recalculate pure goals/points from match events if available
  const matchEventScores: Record<string, number> = {};
  tournamentMatches.forEach(match => {
    match.events.forEach(e => {
      if (e.playerId && (e.type === 'goal' || e.type === 'point')) {
        matchEventScores[e.playerId] = (matchEventScores[e.playerId] || 0) + 1;
      }
    });
  });

  // Blend match events count (prioritize recorded events or base player roster stats)
  Object.keys(playerMap).forEach(pId => {
    const fromEvents = matchEventScores[pId];
    if (fromEvents !== undefined && fromEvents > 0) {
      playerMap[pId].scoreCount = fromEvents;
    }
  });

  const leaders = Object.values(playerMap)
    .filter(p => p.scoreCount > 0)
    .map(p => ({
      playerId: p.playerId,
      playerName: p.playerName,
      playerNumber: p.playerNumber,
      teamId: p.teamId,
      teamName: p.teamName,
      teamColor: p.teamColor,
      grade: p.grade,
      scoreCount: p.scoreCount,
      yellowCards: p.yellowCards,
      redCards: p.redCards,
      matchesPlayed: Math.max(1, p.matchesPlayed.size),
      sport: tournament.sport,
    }));

  leaders.sort((a, b) => {
    if (b.scoreCount !== a.scoreCount) return b.scoreCount - a.scoreCount;
    return a.playerName.localeCompare(b.playerName);
  });

  return leaders;
}

export function calculateVallaMenosVencida(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): VallaItem[] {
  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);
  const finishedMatches = matches.filter(
    m => m.tournamentId === tournament.id && (m.status === 'finished' || m.status === 'in_progress')
  );

  const statsMap: Record<string, {
    matchesPlayed: number;
    goalsAgainst: number;
    cleanSheets: number;
  }> = {};

  tournamentTeams.forEach(t => {
    statsMap[t.id] = {
      matchesPlayed: 0,
      goalsAgainst: 0,
      cleanSheets: 0,
    };
  });

  finishedMatches.forEach(m => {
    const homeStats = statsMap[m.homeTeamId];
    const awayStats = statsMap[m.awayTeamId];

    if (homeStats) {
      homeStats.matchesPlayed += 1;
      homeStats.goalsAgainst += m.awayScore;
      if (m.awayScore === 0) homeStats.cleanSheets += 1;
    }

    if (awayStats) {
      awayStats.matchesPlayed += 1;
      awayStats.goalsAgainst += m.homeScore;
      if (m.homeScore === 0) awayStats.cleanSheets += 1;
    }
  });

  const vallaList: VallaItem[] = tournamentTeams.map(team => {
    const stats = statsMap[team.id] || { matchesPlayed: 0, goalsAgainst: 0, cleanSheets: 0 };
    const goalkeeper = team.players.find(
      p => p.positionOrRole?.toLowerCase().includes('porter') || 
           p.positionOrRole?.toLowerCase().includes('arquer') || 
           p.number === 1
    ) || team.players[0];

    const averageAgainst = stats.matchesPlayed > 0 
      ? Number((stats.goalsAgainst / stats.matchesPlayed).toFixed(2)) 
      : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      grade: team.grade,
      color: team.color,
      avatarBadge: team.avatarBadge,
      goalkeeperName: goalkeeper ? `${goalkeeper.name} (N° ${goalkeeper.number ?? 1})` : 'Arquero Titular',
      matchesPlayed: stats.matchesPlayed,
      goalsAgainst: stats.goalsAgainst,
      averageAgainst,
      cleanSheets: stats.cleanSheets,
    };
  });

  vallaList.sort((a, b) => {
    if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
    if (a.averageAgainst !== b.averageAgainst) return a.averageAgainst - b.averageAgainst;
    return b.cleanSheets - a.cleanSheets;
  });

  return vallaList;
}

export function calculateSanctionsTable(
  tournament: Tournament,
  teams: Team[],
  matches: Match[]
): SanctionItem[] {
  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);

  const playerSanctions: Record<string, {
    player: Team['players'][0];
    team: Team;
    yellowCards: number;
    blueCards: number;
    redCards: number;
    finesPaidCount: number;
    totalCards: number;
  }> = {};

  tournamentTeams.forEach(team => {
    team.players.forEach(p => {
      playerSanctions[p.id] = {
        player: p,
        team,
        yellowCards: p.stats.yellowCards || 0,
        blueCards: p.stats.blueCards || 0,
        redCards: p.stats.redCards || 0,
        finesPaidCount: (p.stats.finePaid ? 1 : 0),
        totalCards: (p.stats.yellowCards || 0) + (p.stats.blueCards || 0) + (p.stats.redCards || 0),
      };
    });
  });

  // Extract from match events
  tournamentMatches.forEach(m => {
    m.events.forEach(ev => {
      if (ev.playerId && playerSanctions[ev.playerId]) {
        const item = playerSanctions[ev.playerId];
        if (ev.type === 'card_yellow') {
          item.yellowCards += 1;
          item.totalCards += 1;
        } else if (ev.type === 'card_blue') {
          item.blueCards += 1;
          item.totalCards += 1;
        } else if (ev.type === 'card_red') {
          item.redCards += 1;
          item.totalCards += 1;
        }
        if (ev.finePaid) {
          item.finesPaidCount += 1;
        }
      }
    });
  });

  const list: SanctionItem[] = Object.values(playerSanctions)
    .filter(item => item.totalCards > 0 || (item.player.stats.finePaid === false && (item.player.stats.yellowCards || 0) > 0))
    .map(item => {
      const totalFines = (item.yellowCards * 2000) + (item.blueCards * 3000) + (item.redCards * 5000);
      const finesPaid = item.player.stats.finePaid || item.finesPaidCount >= item.totalCards;
      
      let status: 'habilitado' | 'suspendido' | 'multa_pendiente' = 'habilitado';
      if ((item.redCards > 0 || item.blueCards > 0) && !finesPaid) {
        status = 'suspendido';
      } else if (totalFines > 0 && !finesPaid) {
        status = 'multa_pendiente';
      }

      return {
        playerId: item.player.id,
        playerName: item.player.name,
        playerNumber: item.player.number,
        teamId: item.team.id,
        teamName: item.team.name,
        teamColor: item.team.color,
        grade: item.team.grade,
        yellowCards: item.yellowCards,
        blueCards: item.blueCards,
        redCards: item.redCards,
        totalFines,
        finesPaid,
        pendingFines: finesPaid ? 0 : totalFines,
        paidFines: finesPaid ? totalFines : 0,
        status,
      };
    });

  list.sort((a, b) => {
    if (b.redCards !== a.redCards) return b.redCards - a.redCards;
    if (b.blueCards !== a.blueCards) return b.blueCards - a.blueCards;
    if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards;
    return b.totalFines - a.totalFines;
  });

  return list;
}

export function generateRoundRobinFixtures(
  tournamentId: string,
  teamIds: string[],
  startDate: string,
  venue: string
): Omit<Match, 'id'>[] {
  if (teamIds.length < 2) return [];

  const teams = [...teamIds];
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
  }

  const numTeams = teams.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  const fixtures: Omit<Match, 'id'>[] = [];
  const start = new Date(startDate || new Date().toISOString().split('T')[0]);

  for (let round = 0; round < numRounds; round++) {
    const roundName = `Jornada ${round + 1}`;
    const matchDate = new Date(start);
    matchDate.setDate(start.getDate() + round * 2);
    const dateStr = matchDate.toISOString().split('T')[0];

    for (let i = 0; i < half; i++) {
      const home = teams[i];
      const away = teams[numTeams - 1 - i];

      if (home !== 'BYE' && away !== 'BYE') {
        const hour = 14 + (i * 2);
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;

        fixtures.push({
          tournamentId,
          roundName,
          homeTeamId: home,
          awayTeamId: away,
          date: dateStr,
          time: timeStr,
          venue: venue || 'Cancha Principal Escolar',
          status: 'scheduled',
          homeScore: 0,
          awayScore: 0,
          timerSeconds: 0,
          timerRunning: false,
          events: [],
        });
      }
    }

    // Rotate teams keeping first fixed
    const last = teams.pop()!;
    teams.splice(1, 0, last);
  }

  return fixtures;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getSportBadge(sport: SportType): { label: string; icon: string; color: string } {
  switch (sport) {
    case 'futbol':
      return { label: 'Fútbol', icon: '⚽', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    case 'futsal':
      return { label: 'Fútbol de Salón', icon: '⚽', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
    case 'voleibol':
      return { label: 'Voleibol', icon: '🏐', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' };
    case 'tenis_mesa':
      return { label: 'Tenis de Mesa', icon: '🏓', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
    case 'tenis':
      return { label: 'Tenis', icon: '🎾', color: 'bg-lime-500/20 text-lime-400 border-lime-500/40' };
    default:
      return { label: 'Deporte', icon: '🏆', color: 'bg-slate-700 text-slate-200 border-slate-600' };
  }
}
