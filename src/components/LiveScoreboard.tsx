import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Trophy, 
  ChevronRight, 
  Sparkles,
  ArrowRightLeft,
  Flame,
  Undo2,
  Lock,
  Medal,
  Trash2,
  Plus,
  Minus,
  Shield,
  Clock,
  Activity
} from 'lucide-react';
import { Match, MatchEvent, MatchSet, SportType, Team } from '../types';
import { formatTime } from '../utils/calculator';
import { ResetMatchModal } from './ResetMatchModal';
import { FootballPitchScoreboard } from './FootballPitchScoreboard';

interface LiveScoreboardProps {
  match: Match;
  teams: Team[];
  sport: SportType;
  onUpdateMatch: (updated: Match) => void;
  onFinishMatch: (matchId: string) => void;
  onSelectDifferentMatch?: () => void;
}

interface TransitionModalState {
  isOpen: boolean;
  type: 'set1_won' | 'set2_won' | 'match_won';
  winnerName: string;
  winnerTeamId: string;
  scoreSummary: string;
  nextSetNumber?: number;
}

export function LiveScoreboard({
  match,
  teams,
  sport,
  onUpdateMatch,
  onFinishMatch,
  onSelectDifferentMatch,
}: LiveScoreboardProps) {
  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  const isTableTennis = sport === 'tenis_mesa';
  const isVolleyball = sport === 'voleibol';
  const isSetBasedSport = isTableTennis || isVolleyball;

  // Target points per set
  // Table Tennis: 11 points (2 of 3)
  // Volleyball: Official 30 DIRECT POINTS (Set Directo / Partido Único a 30 puntos sin alargue)
  const currentSetNumber = match.currentSet || 1;
  const pointsPerSetTarget = isVolleyball ? 30 : 11;
  const deuceThreshold = isVolleyball ? 29 : 10;

  // Table / Court side orientation toggle (Left / Right)
  const [isFlipped, setIsFlipped] = useState(() => match.courtSwappedAt15 || false);
  const [showCourtSwapAlert, setShowCourtSwapAlert] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [transitionModal, setTransitionModal] = useState<TransitionModalState | null>(null);

  // Synchronize court flip with match.courtSwappedAt15 from remote updates
  useEffect(() => {
    if (isVolleyball && match.courtSwappedAt15 !== undefined) {
      setIsFlipped(match.courtSwappedAt15);
    }
  }, [match.courtSwappedAt15, isVolleyball]);

  const handleExecuteResetMatch = () => {
    const resetMatch: Match = {
      ...match,
      homeScore: 0,
      awayScore: 0,
      currentSet: 1,
      currentSetHomePoints: 0,
      currentSetAwayPoints: 0,
      sets: [],
      events: [],
      status: 'scheduled',
      timerSeconds: 0,
      timerRunning: false,
      courtSwappedAt15: false,
      winnerTeamId: undefined,
      isDraw: false,
    };
    setTransitionModal(null);
    setShowCourtSwapAlert(false);
    setShowFinishConfirm(false);
    setIsFlipped(false);
    onUpdateMatch(resetMatch);
  };

  // Stable ref to always have the latest match state without re-triggering or stale closure
  const matchRef = useRef(match);
  matchRef.current = match;

  // Active Timer Hook - decoupled from match state changes
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (match.timerRunning && match.status !== 'finished') {
      interval = setInterval(() => {
        const current = matchRef.current;
        onUpdateMatch({
          ...current,
          timerSeconds: (current.timerSeconds || 0) + 1,
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [match.timerRunning, match.status]);

  // Current set points for Set-based sports
  const currentSetHomePts = match.currentSetHomePoints ?? (match.sets && match.sets[currentSetNumber - 1] ? match.sets[currentSetNumber - 1].homeScore : 0);
  const currentSetAwayPts = match.currentSetAwayPoints ?? (match.sets && match.sets[currentSetNumber - 1] ? match.sets[currentSetNumber - 1].awayScore : 0);
  
  // Base initial server
  const set1InitialServer = match.initialServerTeamId || match.homeTeamId;
  
  // Set-specific initial server
  const currentSetInitialServer = currentSetNumber === 2 
    ? (set1InitialServer === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
    : set1InitialServer;

  const totalPointsInCurrentSet = currentSetHomePts + currentSetAwayPts;
  const isDeuce = isTableTennis && currentSetHomePts >= deuceThreshold && currentSetAwayPts >= deuceThreshold;
  
  let currentServerTeamId = currentSetInitialServer;
  let serveNumberInTurn = 1;
  let servesRemainingForCurrentServer = 2;

  if (isTableTennis) {
    if (isDeuce) {
      // In deuce, server changes every single point
      const pointsAfterDeuce = (currentSetHomePts - deuceThreshold) + (currentSetAwayPts - deuceThreshold);
      const isInitialAtDeuce = (20 / 2) % 2 === 0;
      const baseAtDeuce = isInitialAtDeuce 
        ? currentSetInitialServer 
        : (currentSetInitialServer === match.homeTeamId ? match.awayTeamId : match.homeTeamId);

      currentServerTeamId = (pointsAfterDeuce % 2 === 0) 
        ? baseAtDeuce 
        : (baseAtDeuce === match.homeTeamId ? match.awayTeamId : match.homeTeamId);
      servesRemainingForCurrentServer = 1;
      serveNumberInTurn = 1;
    } else {
      // Normal rotation: changes every 2 points
      const rotationCount = Math.floor(totalPointsInCurrentSet / 2);
      const isEvenRotation = rotationCount % 2 === 0;
      currentServerTeamId = isEvenRotation 
        ? currentSetInitialServer 
        : (currentSetInitialServer === match.homeTeamId ? match.awayTeamId : match.homeTeamId);
      
      const pointInCurrentBlock = totalPointsInCurrentSet % 2;
      serveNumberInTurn = pointInCurrentBlock === 0 ? 1 : 2;
      servesRemainingForCurrentServer = 2 - pointInCurrentBlock;
    }
  } else if (isVolleyball) {
    // In volleyball rally point scoring:
    // Whichever team scored the last point serves, or uses match.serverTeamId
    currentServerTeamId = match.serverTeamId || currentSetInitialServer;
  }

  // Check Set point or Match point
  const isHomeSetPoint = isVolleyball
    ? currentSetHomePts === 29
    : (isSetBasedSport && (
        (currentSetHomePts >= deuceThreshold && currentSetHomePts - currentSetAwayPts >= 1) ||
        (currentSetHomePts === deuceThreshold && currentSetAwayPts < deuceThreshold)
      ));

  const isAwaySetPoint = isVolleyball
    ? currentSetAwayPts === 29
    : (isSetBasedSport && (
        (currentSetAwayPts >= deuceThreshold && currentSetAwayPts - currentSetHomePts >= 1) ||
        (currentSetAwayPts === deuceThreshold && currentSetHomePts < deuceThreshold)
      ));

  const isHomeMatchPoint = isVolleyball
    ? currentSetHomePts === 29
    : (isHomeSetPoint && match.homeScore === 1);
  const isAwayMatchPoint = isVolleyball
    ? currentSetAwayPts === 29
    : (isAwaySetPoint && match.awayScore === 1);

  // Check if current set has already reached a winner condition
  const isCurrentSetWon = isVolleyball
    ? (currentSetHomePts >= 30 || currentSetAwayPts >= 30)
    : ((currentSetHomePts >= pointsPerSetTarget || currentSetAwayPts >= pointsPerSetTarget) && 
        Math.abs(currentSetHomePts - currentSetAwayPts) >= 2);

  const isMatchFinished = isVolleyball
    ? (match.status === 'finished' || currentSetHomePts >= 30 || currentSetAwayPts >= 30)
    : (match.status === 'finished' || match.homeScore >= 2 || match.awayScore >= 2);
  
  // Points are locked when set is won (waiting for transition) or match is finished
  const arePointsLocked = isCurrentSetWon || isMatchFinished || (transitionModal?.isOpen ?? false);

  // Toggle Timer
  const toggleTimer = () => {
    const isRunning = !match.timerRunning;
    onUpdateMatch({
      ...match,
      timerRunning: isRunning,
      status: isRunning ? 'in_progress' : 'paused',
    });
  };

  const resetTimer = () => {
    if (window.confirm('¿Reiniciar el cronómetro a 00:00?')) {
      onUpdateMatch({
        ...match,
        timerSeconds: 0,
        timerRunning: false,
      });
    }
  };

  // Switch initial server
  const handleSetInitialServer = (teamId: string) => {
    onUpdateMatch({
      ...match,
      initialServerTeamId: teamId,
      serverTeamId: teamId,
    });
  };

  // Switch server manually (override)
  const handleToggleServerManually = () => {
    const otherTeamId = currentServerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
    onUpdateMatch({
      ...match,
      serverTeamId: otherTeamId,
    });
  };

  // Point Scoring & Automatic Set Engine for Set-based sports (Table Tennis & Volleyball)
  const handleAddSetPoint = (isHome: boolean) => {
    if (arePointsLocked) return;

    const newHomePts = currentSetHomePts + (isHome ? 1 : 0);
    const newAwayPts = currentSetAwayPts + (!isHome ? 1 : 0);

    const scoringTeam = isHome ? homeTeam : awayTeam;
    const scoringTeamId = isHome ? match.homeTeamId : match.awayTeamId;

    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'point',
      teamId: scoringTeamId,
      playerId: scoringTeam?.players[0]?.id,
      playerName: scoringTeam?.name,
      minuteOrTime: `Set ${currentSetNumber} (${newHomePts}-${newAwayPts})`,
      extraNote: `Punto en Set ${currentSetNumber}`,
      setIndex: currentSetNumber,
      timestamp: Date.now(),
    };

    // In Volleyball rally scoring, the team that scores the point gets/retains the serve!
    const nextServer = isVolleyball ? scoringTeamId : match.serverTeamId;

    if (isVolleyball) {
      // -------------------------------------------------------------
      // VOLLEYBALL: 30 DIRECT POINTS & COURT CHANGE AT POINT 15
      // -------------------------------------------------------------
      const reached15 = (newHomePts >= 15 || newAwayPts >= 15);
      const isFirstTimeToReach15 = reached15 && !match.courtSwappedAt15;

      // Check if match won at 30 points
      if (newHomePts >= 30 || newAwayPts >= 30) {
        const matchWinnerTeamId = newHomePts >= 30 ? match.homeTeamId : match.awayTeamId;
        const matchWinnerName = newHomePts >= 30 ? (homeTeam?.name || 'Equipo Local') : (awayTeam?.name || 'Equipo Visitante');

        setTransitionModal({
          isOpen: true,
          type: 'match_won',
          winnerName: matchWinnerName,
          winnerTeamId: matchWinnerTeamId,
          scoreSummary: `Marcador Final: ${newHomePts} - ${newAwayPts} Puntos (Set Directo)`,
        });

        onUpdateMatch({
          ...match,
          homeScore: newHomePts,
          awayScore: newAwayPts,
          currentSetHomePoints: newHomePts,
          currentSetAwayPoints: newAwayPts,
          sets: [{ setNumber: 1, homeScore: newHomePts, awayScore: newAwayPts, winnerTeamId: matchWinnerTeamId }],
          status: 'finished',
          timerRunning: false,
          courtSwappedAt15: match.courtSwappedAt15 || reached15,
          winnerTeamId: matchWinnerTeamId,
          serverTeamId: nextServer,
          events: [newEvent, ...match.events],
        });
        return;
      }

      // If reached 15 for the first time, alert court swap and rotate
      if (isFirstTimeToReach15) {
        setShowCourtSwapAlert(true);
        setIsFlipped(prev => !prev);

        onUpdateMatch({
          ...match,
          homeScore: newHomePts,
          awayScore: newAwayPts,
          currentSetHomePoints: newHomePts,
          currentSetAwayPoints: newAwayPts,
          sets: [{ setNumber: 1, homeScore: newHomePts, awayScore: newAwayPts }],
          status: 'paused',
          timerRunning: false,
          courtSwappedAt15: true,
          serverTeamId: nextServer,
          events: [newEvent, ...match.events],
        });
        return;
      }

      // Normal point < 30
      onUpdateMatch({
        ...match,
        homeScore: newHomePts,
        awayScore: newAwayPts,
        currentSetHomePoints: newHomePts,
        currentSetAwayPoints: newAwayPts,
        sets: [{ setNumber: 1, homeScore: newHomePts, awayScore: newAwayPts }],
        serverTeamId: nextServer,
        status: match.status === 'scheduled' ? 'in_progress' : match.status,
        courtSwappedAt15: match.courtSwappedAt15 || false,
        events: [newEvent, ...match.events],
      });
      return;
    }

    // Check if set is won: Reach target points with at least 2 points lead (Table Tennis)
    const isSetWon = (newHomePts >= pointsPerSetTarget || newAwayPts >= pointsPerSetTarget) && 
      Math.abs(newHomePts - newAwayPts) >= 2;

    if (isSetWon) {
      const setWinnerId = newHomePts > newAwayPts ? match.homeTeamId : match.awayTeamId;
      const setWinnerName = newHomePts > newAwayPts ? (homeTeam?.name || 'Equipo Local') : (awayTeam?.name || 'Equipo Visitante');
      
      const finishedSet: MatchSet = {
        setNumber: currentSetNumber,
        homeScore: newHomePts,
        awayScore: newAwayPts,
        winnerTeamId: setWinnerId,
      };

      const existingSets = match.sets ? [...match.sets] : [];
      const updatedSets = [...existingSets];
      updatedSets[currentSetNumber - 1] = finishedSet;

      const newHomeSetsWon = match.homeScore + (newHomePts > newAwayPts ? 1 : 0);
      const newAwaySetsWon = match.awayScore + (newAwayPts > newHomePts ? 1 : 0);

      // Check if match is won (Best of 3: first to 2 sets - Auto-cut 2-0 / 2-1)
      const isMatchWon = newHomeSetsWon >= 2 || newAwaySetsWon >= 2;

      if (isMatchWon) {
        const matchWinnerTeamId = newHomeSetsWon > newAwaySetsWon ? match.homeTeamId : match.awayTeamId;
        const matchWinnerName = newHomeSetsWon > newAwaySetsWon ? (homeTeam?.name || 'Equipo Local') : (awayTeam?.name || 'Equipo Visitante');
        
        // Open match won modal
        setTransitionModal({
          isOpen: true,
          type: 'match_won',
          winnerName: matchWinnerName,
          winnerTeamId: matchWinnerTeamId,
          scoreSummary: `${newHomeSetsWon} - ${newAwaySetsWon} en Sets (${newHomePts}-${newAwayPts} en Set ${currentSetNumber})`,
        });

        onUpdateMatch({
          ...match,
          homeScore: newHomeSetsWon,
          awayScore: newAwaySetsWon,
          currentSetHomePoints: newHomePts,
          currentSetAwayPoints: newAwayPts,
          sets: updatedSets,
          status: 'finished',
          timerRunning: false,
          winnerTeamId: matchWinnerTeamId,
          serverTeamId: nextServer,
          events: [newEvent, ...match.events],
        });
      } else {
        // Set 1 won -> Prompt transition to Set 2 with court swap and serve rotation
        // Or Set 2 won (tied 1-1) -> Prompt transition to Set 3
        const nextSetNum = currentSetNumber + 1;

        setTransitionModal({
          isOpen: true,
          type: currentSetNumber === 1 ? 'set1_won' : 'set2_won',
          winnerName: setWinnerName,
          winnerTeamId: setWinnerId,
          scoreSummary: `Marcador del Set: ${newHomePts} - ${newAwayPts}`,
          nextSetNumber: nextSetNum,
        });

        onUpdateMatch({
          ...match,
          homeScore: newHomeSetsWon,
          awayScore: newAwaySetsWon,
          currentSetHomePoints: newHomePts,
          currentSetAwayPoints: newAwayPts,
          sets: updatedSets,
          status: 'in_progress',
          serverTeamId: nextServer,
          events: [newEvent, ...match.events],
        });
      }
    } else {
      // Normal point increment
      onUpdateMatch({
        ...match,
        currentSetHomePoints: newHomePts,
        currentSetAwayPoints: newAwayPts,
        serverTeamId: nextServer,
        status: match.status === 'scheduled' ? 'in_progress' : match.status,
        events: [newEvent, ...match.events],
      });
    }
  };

  // Continue to Next Set Handler (Court swap + Serve rotation)
  const handleProceedToNextSet = () => {
    if (!transitionModal?.nextSetNumber) return;
    const nextSetNum = transitionModal.nextSetNumber;

    // Automatic serve rotation for Set 2 or Set 3
    const nextInitialServer = nextSetNum === 2
      ? (set1InitialServer === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
      : set1InitialServer;

    // Invert sides physically on screen to reflect court swap
    setIsFlipped(prev => !prev);
    setTransitionModal(null);

    onUpdateMatch({
      ...match,
      currentSet: nextSetNum,
      currentSetHomePoints: 0,
      currentSetAwayPoints: 0,
      initialServerTeamId: nextInitialServer,
      serverTeamId: nextInitialServer,
      status: 'in_progress',
    });
  };

  // Adjust point decrement (Undo point / -1)
  const handleAdjustSetPoint = (isHome: boolean) => {
    const targetHomePts = isHome ? Math.max(0, currentSetHomePts - 1) : currentSetHomePts;
    const targetAwayPts = !isHome ? Math.max(0, currentSetAwayPts - 1) : currentSetAwayPts;

    if (isVolleyball) {
      if ((isHome && currentSetHomePts === 0) || (!isHome && currentSetAwayPts === 0)) {
        return;
      }

      setTransitionModal(null);
      setShowCourtSwapAlert(false);

      // If score dropped below 15 on both teams, reset court switch state
      let updatedCourtSwapped = match.courtSwappedAt15;
      if (match.courtSwappedAt15 && targetHomePts < 15 && targetAwayPts < 15) {
        updatedCourtSwapped = false;
        setIsFlipped(prev => !prev);
      }

      const isStillFinished = targetHomePts >= 30 || targetAwayPts >= 30;
      const winnerId = isStillFinished 
        ? (targetHomePts >= 30 ? match.homeTeamId : match.awayTeamId) 
        : undefined;

      onUpdateMatch({
        ...match,
        homeScore: targetHomePts,
        awayScore: targetAwayPts,
        currentSetHomePoints: targetHomePts,
        currentSetAwayPoints: targetAwayPts,
        sets: [{ setNumber: 1, homeScore: targetHomePts, awayScore: targetAwayPts, winnerTeamId: winnerId }],
        status: isStillFinished ? 'finished' : (targetHomePts === 0 && targetAwayPts === 0 ? 'scheduled' : 'in_progress'),
        winnerTeamId: winnerId,
        courtSwappedAt15: updatedCourtSwapped,
      });
      return;
    }

    // Check if was previously locked by set win (Table Tennis)
    if (isCurrentSetWon || transitionModal?.isOpen) {
      const currentSets = match.sets ? [...match.sets] : [];
      let recalculatedHomeSets = 0;
      let recalculatedAwaySets = 0;

      const filteredSets = currentSets.filter(s => s.setNumber < currentSetNumber);
      filteredSets.forEach(s => {
        if (s.homeScore > s.awayScore) recalculatedHomeSets++;
        else if (s.awayScore > s.homeScore) recalculatedAwaySets++;
      });

      setTransitionModal(null);

      onUpdateMatch({
        ...match,
        homeScore: recalculatedHomeSets,
        awayScore: recalculatedAwaySets,
        currentSetHomePoints: targetHomePts,
        currentSetAwayPoints: targetAwayPts,
        sets: filteredSets,
        status: 'in_progress',
        winnerTeamId: undefined,
      });
      return;
    }

    if ((isHome && currentSetHomePts > 0) || (!isHome && currentSetAwayPts > 0)) {
      onUpdateMatch({
        ...match,
        currentSetHomePoints: targetHomePts,
        currentSetAwayPoints: targetAwayPts,
      });
    }
  };

  // Football (Fútbol / Futsal) scoring handlers
  const handleAddFootballGoal = (isHome: boolean) => {
    const newHomeScore = match.homeScore + (isHome ? 1 : 0);
    const newAwayScore = match.awayScore + (!isHome ? 1 : 0);
    const scoringTeam = isHome ? homeTeam : awayTeam;

    const newEvent: MatchEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'goal',
      teamId: isHome ? match.homeTeamId : match.awayTeamId,
      playerName: scoringTeam?.name,
      minuteOrTime: `${Math.floor(match.timerSeconds / 60)}'`,
      extraNote: `Gol de ${scoringTeam?.name}`,
      timestamp: Date.now(),
    };

    onUpdateMatch({
      ...match,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      status: match.status === 'scheduled' ? 'in_progress' : match.status,
      events: [newEvent, ...match.events],
    });
  };

  const handleAdjustFootballGoal = (isHome: boolean) => {
    const newHomeScore = isHome ? Math.max(0, match.homeScore - 1) : match.homeScore;
    const newAwayScore = !isHome ? Math.max(0, match.awayScore - 1) : match.awayScore;

    onUpdateMatch({
      ...match,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
    });
  };

  // Finish Match Handler
  const handleConfirmFinish = () => {
    let winnerId: string | undefined;
    winnerId = match.homeScore > match.awayScore ? match.homeTeamId : match.awayScore > match.homeScore ? match.awayTeamId : undefined;

    onUpdateMatch({
      ...match,
      status: 'finished',
      timerRunning: false,
      winnerTeamId: winnerId,
      isDraw: match.homeScore === match.awayScore,
    });
    setShowFinishConfirm(false);
    onFinishMatch(match.id);
  };

  // Define Left vs Right Court entities based on isFlipped state
  const leftIsHome = !isFlipped;
  const leftTeam = leftIsHome ? homeTeam : awayTeam;
  const rightTeam = leftIsHome ? awayTeam : homeTeam;
  const leftTeamId = leftIsHome ? match.homeTeamId : match.awayTeamId;
  const rightTeamId = leftIsHome ? match.awayTeamId : match.homeTeamId;
  const leftPts = leftIsHome ? currentSetHomePts : currentSetAwayPts;
  const rightPts = leftIsHome ? currentSetAwayPts : currentSetHomePts;
  const leftSetsWon = leftIsHome ? match.homeScore : match.awayScore;
  const rightSetsWon = leftIsHome ? match.awayScore : match.homeScore;
  const leftIsServing = currentServerTeamId === leftTeamId;
  const rightIsServing = currentServerTeamId === rightTeamId;
  const leftIsSetPoint = leftIsHome ? isHomeSetPoint : isAwaySetPoint;
  const rightIsSetPoint = leftIsHome ? isAwaySetPoint : isHomeSetPoint;
  const leftIsMatchPoint = leftIsHome ? isHomeMatchPoint : isAwayMatchPoint;
  const rightIsMatchPoint = leftIsHome ? isAwayMatchPoint : isHomeMatchPoint;

  return (
    <div className="space-y-5">
      
      {/* Top Banner / Match Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/95 border border-slate-800 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-3.5 w-3.5 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${match.timerRunning ? 'bg-red-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${match.timerRunning ? 'bg-red-500' : 'bg-amber-500'}`}></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                {match.roundName} {match.group ? `• Grupo ${match.group}` : ''}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-300 font-medium">{match.venue || (isVolleyball ? 'Cancha de Voleibol' : isTableTennis ? 'Mesa de Tenis' : 'Cancha de Fútbol')}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {homeTeam?.name} <span className="text-slate-500">vs</span> {awayTeam?.name}
            </h3>
          </div>
        </div>

        {/* Action tags and controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <span>{isVolleyball ? '🏐' : isTableTennis ? '🏓' : '⚽'}</span>
            <span>
              {isVolleyball 
                ? 'Voleibol • Set Directo a 30 Pts • Cambio de Cancha al Pto 15' 
                : isTableTennis 
                ? 'Sets a 11 pts • Ventaja de 2 • Al mejor de 3' 
                : 'Fútbol Sala • 2 Tiempos • Goles Directos'}
            </span>
          </span>

          {isSetBasedSport && (
            <button
              onClick={() => setIsFlipped(prev => !prev)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              title="Invertir visualmente los lados de la cancha / mesa (Rojo / Azul)"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cambio de Cancha</span>
            </button>
          )}

          <button
            id="btn-reset-match-top"
            onClick={() => setShowResetModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/60 transition flex items-center gap-1.5 shadow-sm"
            title="Reiniciar o borrar este partido a 0-0 (Requiere autorización de Juez)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reiniciar / Borrar Partido</span>
          </button>

          {onSelectDifferentMatch && (
            <button
              onClick={onSelectDifferentMatch}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition flex items-center gap-1"
            >
              <span>Otro Partido</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DISCIPLINE 1: VOLLEYBALL INTERACTIVE COURT (VOLEIBOL)    */}
      {/* ======================================================== */}
      {isVolleyball && (
        <div className="space-y-4">
          {/* PERSISTENT COLOR & SERVE BANNER */}
          <div className="bg-gradient-to-r from-red-950/90 via-slate-900 to-blue-950/90 border border-slate-700/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold shadow-md">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm shrink-0"></span>
                <span className="text-red-300 font-extrabold uppercase">LADO ROJO:</span>
                <span className="text-white">{leftIsHome ? homeTeam?.name : awayTeam?.name}</span>
                {leftIsServing && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase shadow">
                    🏐 En Saque
                  </span>
                )}
              </div>

              <span className="hidden sm:inline text-slate-600">|</span>

              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm shrink-0"></span>
                <span className="text-blue-300 font-extrabold uppercase">LADO AZUL:</span>
                <span className="text-white">{leftIsHome ? awayTeam?.name : homeTeam?.name}</span>
                {rightIsServing && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase shadow">
                    🏐 En Saque
                  </span>
                )}
              </div>
            </div>

            <span className="text-amber-300 text-[11px] font-mono bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-lg">
              Regla: Ganador del punto obtiene el saque (Rally Point)
            </span>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Formato Oficial 30 Puntos */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Formato Oficial Voleibol</span>
                <div className="font-mono text-sm font-black text-emerald-400 flex items-center gap-2 mt-0.5">
                  <span>Set Directo a 30 Puntos</span>
                </div>
                <span className={`text-[10px] font-bold block mt-0.5 ${match.courtSwappedAt15 ? 'text-emerald-400' : 'text-amber-300'}`}>
                  {match.courtSwappedAt15 ? '✓ Cambio de cancha realizado (Pto 15)' : '🔄 Cambio de cancha al punto 15'}
                </span>
              </div>
              <span className="px-3 py-1.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-black flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>META: 30 PTS</span>
              </span>
            </div>

            {/* Serve Turn */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Turno de Saque</span>
                <span className="font-black text-amber-300 text-sm block mt-0.5">
                  🏐 {currentServerTeamId === leftTeamId ? leftTeam?.name : rightTeam?.name}
                </span>
              </div>
              <button
                onClick={handleToggleServerManually}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-700 text-slate-300 hover:text-amber-400 text-xs font-bold transition flex items-center gap-1.5"
                title="Alternar turno de saque manualmente"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Alternar</span>
              </button>
            </div>

            {/* Stopwatch */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 block">Tiempo de Juego</span>
                <span className="font-scoreboard text-2xl font-black text-emerald-400 font-mono block mt-0.5">
                  {formatTime(match.timerSeconds)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={toggleTimer}
                  className={`p-2 rounded-xl font-bold transition ${
                    match.timerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                  title={match.timerRunning ? 'Pausar Reloj' : 'Iniciar Reloj'}
                >
                  {match.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                  title="Reiniciar a 00:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* VOLLEYBALL COURT SWAP & POINT 15 NOTICES */}
          {match.courtSwappedAt15 && (
            <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border border-amber-500/50 rounded-2xl text-center text-amber-200 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md">
              <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cancha Invertida por Cambio Reglamentario al Punto 15 (Lado Rojo ⇄ Lado Azul)</span>
            </div>
          )}

          {!match.courtSwappedAt15 && (currentSetHomePts === 14 || currentSetAwayPts === 14) && (
            <div className="p-3.5 bg-gradient-to-r from-amber-950 via-yellow-950 to-amber-950 border-2 border-amber-400 rounded-2xl text-center text-amber-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl animate-pulse">
              <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0" />
              <span>¡PUNTO DE CAMBIO DE CANCHA! El siguiente punto activará la alerta y el cambio reglamentario de lados (Punto 15)</span>
            </div>
          )}

          {(currentSetHomePts === 29 || currentSetAwayPts === 29) && (
            <div className="p-3.5 bg-gradient-to-r from-yellow-950 via-emerald-950 to-yellow-950 border-2 border-yellow-400 rounded-2xl text-center text-yellow-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl animate-pulse">
              <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
              <span>¡MATCH POINT DIRECTO! El primer equipo que alcance los 30 puntos gana automáticamente el partido.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* GRAPHICAL TOP-DOWN VOLLEYBALL COURT                      */}
          {/* ======================================================== */}
          <div className="relative rounded-3xl p-3 sm:p-5 bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden">
            
            {/* Lock Overlay if Points Locked */}
            {arePointsLocked && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-40 flex flex-col items-center justify-center text-center p-4">
                <div className="px-5 py-2.5 rounded-2xl bg-slate-900/95 border border-slate-700 text-white flex items-center gap-2 shadow-2xl mb-2">
                  <Lock className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold">
                    {isMatchFinished ? 'Partido Finalizado • Puntaje Bloqueado' : 'Set Definido • Esperando Confirmación'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Utiliza los botones de <strong className="text-amber-300">Restar (-1)</strong> abajo si requieres corregir algún punto anotado.
                </p>
              </div>
            )}

            {/* VOLLEYBALL COURT SURFACE */}
            <div className="relative rounded-2xl border-4 border-white shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[440px] sm:min-h-[500px]">
              
              {/* EXPLICIT RED CENTRAL / NET (Vertical Divider on md+, horizontal on mobile) */}
              <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 z-30 flex-col items-center justify-between pointer-events-none">
                
                {/* Top Antenna (Red & White Striped pole extending over court) */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
                  <div className="w-2.5 h-8 rounded-t-sm shadow-xl border border-slate-800 bg-[repeating-linear-gradient(180deg,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)]"></div>
                  <span className="text-[9px] font-black text-rose-400 bg-slate-950/90 px-1 py-0.5 rounded border border-rose-500/40 mt-0.5 shadow whitespace-nowrap">
                    ANTENA
                  </span>
                </div>

                {/* Net Structure: White Top Tape Band + Mesh Grid + White Bottom Band */}
                <div className="w-full h-full flex items-center justify-center relative py-6">
                  {/* Top net cable/tape */}
                  <div className="w-3.5 h-full bg-white shadow-2xl border-x border-slate-400 flex flex-col justify-around py-2">
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                    <div className="w-full h-0.5 bg-slate-300"></div>
                  </div>

                  {/* Net mesh grid texture */}
                  <div className="absolute inset-y-6 inset-x-0 bg-slate-900/90 opacity-95 border-x-2 border-slate-300 flex flex-col justify-around py-1 shadow-2xl">
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                    <div className="w-full h-0.5 bg-white/70"></div>
                  </div>

                  {/* Explicit Net Label */}
                  <div className="absolute z-40 rotate-90 bg-slate-950/90 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full border border-white/60 shadow-2xl uppercase whitespace-nowrap">
                    RED CENTRAL • NET
                  </div>
                </div>

                {/* Bottom Antenna */}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
                  <span className="text-[9px] font-black text-rose-400 bg-slate-950/90 px-1 py-0.5 rounded border border-rose-500/40 mb-0.5 shadow whitespace-nowrap">
                    ANTENA
                  </span>
                  <div className="w-2.5 h-8 rounded-b-sm shadow-xl border border-slate-800 bg-[repeating-linear-gradient(180deg,#ef4444,#ef4444_6px,#ffffff_6px,#ffffff_12px)]"></div>
                </div>

              </div>

              {/* LADO ROJO (EQUIPO 1) */}
              <div
                id="volleyball-court-left-red"
                onClick={() => handleAddSetPoint(leftIsHome)}
                className={`relative bg-gradient-to-br from-rose-900 via-red-800 to-rose-950 transition select-none p-5 sm:p-7 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-2 border-white group shadow-inner ${
                  arePointsLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-105 active:brightness-95'
                }`}
              >
                {/* 3-METER ATTACK LINE (LÍNEA DE ATAQUE 3M) */}
                <div className="absolute right-12 md:right-20 top-0 bottom-0 w-1 border-r-2 border-dashed border-white/70 pointer-events-none flex flex-col items-center justify-center">
                  <span className="rotate-90 text-[9px] font-black text-white/80 bg-black/40 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                    Línea de Ataque (3m)
                  </span>
                </div>

                {/* Zona de Ataque (Front) & Zona de Defensa (Back) labels */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px] font-black text-white uppercase tracking-widest -rotate-90">
                  Zona de Defensa / Zaguero
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px] font-black text-white uppercase tracking-widest -rotate-90">
                  Zona de Ataque / Red
                </div>

                {/* Top Header on Left Court: Avatar + Team Name + Badge */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md p-2.5 px-4 rounded-2xl border-2 border-rose-400 shadow-xl">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0 shadow border border-white/40"
                      style={{ backgroundColor: leftTeam?.color || '#ef4444' }}
                    >
                      {leftTeam?.avatarBadge || '🏐'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          LADO ROJO
                        </span>
                        <span className="text-[11px] font-bold text-red-200">
                          {leftTeam?.grade} {leftTeam?.group ? `• Gr. ${leftTeam?.group}` : ''}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                        {leftTeam?.name}
                      </h4>
                    </div>
                  </div>

                  {/* Serve or Set Point Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {leftIsServing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xl ring-2 ring-amber-300 animate-bounce">
                        <span className="text-sm">🏐</span>
                        <span>SAQUE ACTIVO</span>
                      </div>
                    )}
                    {leftIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase shadow-lg animate-pulse">
                        🏆 MATCH POINT
                      </span>
                    )}
                    {leftIsSetPoint && !leftIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-white text-rose-700 font-black text-xs uppercase shadow-lg animate-pulse">
                        ⚡ SET POINT
                      </span>
                    )}
                  </div>
                </div>

                {/* Huge Score in Center */}
                <div className="relative z-10 text-center py-4 sm:py-6">
                  <div className="font-scoreboard text-7xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_12px_12px_rgba(0,0,0,0.7)] group-hover:scale-105 transition transform">
                    {leftPts}
                  </div>
                  <span className="inline-block mt-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30 shadow">
                    {arePointsLocked ? 'PUNTAJE BLOQUEADO' : 'TOCA LA CANCHA ROJA O EL BOTÓN PARA +1'}
                  </span>
                </div>

                {/* Tactile Controls on Left Court */}
                <div className="relative z-10 space-y-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {/* Big +1 Tactile Button */}
                  <button
                    id="btn-volleyball-add-point-red"
                    disabled={arePointsLocked}
                    onClick={() => handleAddSetPoint(leftIsHome)}
                    className={`w-full py-4 sm:py-5 px-4 rounded-2xl font-black text-lg sm:text-xl shadow-2xl flex items-center justify-center gap-2 border-2 transition active:scale-95 cursor-pointer ${
                      arePointsLocked
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white border-rose-400 shadow-rose-950/50'
                    }`}
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                    <span>+1 PUNTO (LADO ROJO)</span>
                  </button>

                  {/* Secondary Controls: -1 Restar and Saque */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAdjustSetPoint(leftIsHome)}
                      className="py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 text-white hover:text-amber-300 border border-white/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                      title="Restar 1 punto por error"
                    >
                      <Undo2 className="w-4 h-4 text-amber-400" />
                      <span>Restar (-1)</span>
                    </button>

                    <button
                      onClick={() => handleSetInitialServer(leftTeamId)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                        leftIsServing 
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300' 
                          : 'bg-black/70 hover:bg-black/90 text-white border border-white/30'
                      }`}
                    >
                      <span className="text-sm">🏐</span>
                      <span>{leftIsServing ? 'Tiene Saque' : 'Asignar Saque'}</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* LADO AZUL (EQUIPO 2) */}
              <div
                id="volleyball-court-right-blue"
                onClick={() => handleAddSetPoint(!leftIsHome)}
                className={`relative bg-gradient-to-br from-blue-900 via-indigo-800 to-blue-950 transition select-none p-5 sm:p-7 flex flex-col justify-between border-t-4 md:border-t-0 md:border-l-2 border-white group shadow-inner ${
                  arePointsLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-105 active:brightness-95'
                }`}
              >
                {/* 3-METER ATTACK LINE (LÍNEA DE ATAQUE 3M) */}
                <div className="absolute left-12 md:left-20 top-0 bottom-0 w-1 border-l-2 border-dashed border-white/70 pointer-events-none flex flex-col items-center justify-center">
                  <span className="-rotate-90 text-[9px] font-black text-white/80 bg-black/40 px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                    Línea de Ataque (3m)
                  </span>
                </div>

                {/* Zona de Ataque (Front) & Zona de Defensa (Back) labels */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px] font-black text-white uppercase tracking-widest rotate-90">
                  Zona de Ataque / Red
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[10px] font-black text-white uppercase tracking-widest rotate-90">
                  Zona de Defensa / Zaguero
                </div>

                {/* Top Header on Right Court: Avatar + Team Name + Badge */}
                <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3 bg-black/70 backdrop-blur-md p-2.5 px-4 rounded-2xl border-2 border-blue-400 shadow-xl">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold text-white shrink-0 shadow border border-white/40"
                      style={{ backgroundColor: rightTeam?.color || '#3b82f6' }}
                    >
                      {rightTeam?.avatarBadge || '🏐'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
                          LADO AZUL
                        </span>
                        <span className="text-[11px] font-bold text-blue-200">
                          {rightTeam?.grade} {rightTeam?.group ? `• Gr. ${rightTeam?.group}` : ''}
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                        {rightTeam?.name}
                      </h4>
                    </div>
                  </div>

                  {/* Serve or Set Point Badge */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {rightIsServing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xl ring-2 ring-amber-300 animate-bounce">
                        <span className="text-sm">🏐</span>
                        <span>SAQUE ACTIVO</span>
                      </div>
                    )}
                    {rightIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase shadow-lg animate-pulse">
                        🏆 MATCH POINT
                      </span>
                    )}
                    {rightIsSetPoint && !rightIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-white text-blue-700 font-black text-xs uppercase shadow-lg animate-pulse">
                        ⚡ SET POINT
                      </span>
                    )}
                  </div>
                </div>

                {/* Huge Score in Center */}
                <div className="relative z-10 text-center py-4 sm:py-6">
                  <div className="font-scoreboard text-7xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_12px_12px_rgba(0,0,0,0.7)] group-hover:scale-105 transition transform">
                    {rightPts}
                  </div>
                  <span className="inline-block mt-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30 shadow">
                    {arePointsLocked ? 'PUNTAJE BLOQUEADO' : 'TOCA LA CANCHA AZUL O EL BOTÓN PARA +1'}
                  </span>
                </div>

                {/* Tactile Controls on Right Court */}
                <div className="relative z-10 space-y-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {/* Big +1 Tactile Button */}
                  <button
                    id="btn-volleyball-add-point-blue"
                    disabled={arePointsLocked}
                    onClick={() => handleAddSetPoint(!leftIsHome)}
                    className={`w-full py-4 sm:py-5 px-4 rounded-2xl font-black text-lg sm:text-xl shadow-2xl flex items-center justify-center gap-2 border-2 transition active:scale-95 cursor-pointer ${
                      arePointsLocked
                        ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white border-blue-400 shadow-blue-950/50'
                    }`}
                  >
                    <Plus className="w-6 h-6 stroke-[3]" />
                    <span>+1 PUNTO (LADO AZUL)</span>
                  </button>

                  {/* Secondary Controls: -1 Restar and Saque */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAdjustSetPoint(!leftIsHome)}
                      className="py-2.5 px-3 rounded-xl bg-black/70 hover:bg-black/90 text-white hover:text-blue-300 border border-white/30 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow"
                      title="Restar 1 punto por error"
                    >
                      <Undo2 className="w-4 h-4 text-blue-400" />
                      <span>Restar (-1)</span>
                    </button>

                    <button
                      onClick={() => handleSetInitialServer(rightTeamId)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                        rightIsServing 
                          ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-300' 
                          : 'bg-black/70 hover:bg-black/90 text-white border border-white/30'
                      }`}
                    >
                      <span className="text-sm">🏐</span>
                      <span>{rightIsServing ? 'Tiene Saque' : 'Asignar Saque'}</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DISCIPLINE 2: TABLE TENNIS PING PONG TABLE               */}
      {/* ======================================================== */}
      {isTableTennis && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-blue-950/80 border border-slate-700/80 rounded-2xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-sm shrink-0"></span>
              <span className="text-red-300 font-extrabold uppercase">LADO ROJO:</span>
              <span className="text-white">{leftIsHome ? homeTeam?.name : awayTeam?.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shadow-sm shrink-0"></span>
              <span className="text-blue-300 font-extrabold uppercase">LADO AZUL:</span>
              <span className="text-white">{leftIsHome ? awayTeam?.name : homeTeam?.name}</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 shadow-inner">
                <span className="text-xs font-bold text-slate-400 uppercase">Sets Ganados:</span>
                <div className="font-scoreboard text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-red-400 font-black">{leftSetsWon}</span>
                  <span className="text-slate-600">-</span>
                  <span className="text-blue-400 font-black">{rightSetsWon}</span>
                </div>
              </div>

              <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                <span>SET #{currentSetNumber} DE 3</span>
              </span>
            </div>

            {/* Serve Indicator */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center gap-2.5 text-xs shadow-inner">
                <div className="relative flex items-center justify-center">
                  <span className="w-4 h-4 rounded-full bg-amber-400 animate-ping absolute opacity-75"></span>
                  <span className="w-4 h-4 rounded-full bg-amber-400 shadow-md flex items-center justify-center text-[10px] font-black text-slate-950">
                    🏓
                  </span>
                </div>

                <span className="text-slate-400 font-semibold">Turno de Saque:</span>
                <span className="font-black text-amber-300 text-sm">
                  {currentServerTeamId === leftTeamId ? leftTeam?.name : rightTeam?.name}
                </span>

                <span className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-600/40 font-bold font-mono">
                  {isDeuce 
                    ? '⚡ ALARGUE: 1 Saque Alternado' 
                    : `Saque ${serveNumberInTurn} de 2 (${servesRemainingForCurrentServer} restante)`}
                </span>
              </div>

              <button
                onClick={handleToggleServerManually}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-amber-400 transition"
                title="Rotar turno de saque manualmente"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Stopwatch */}
            <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-2xl flex items-center gap-3 shadow-inner">
              <span className="font-scoreboard text-2xl font-bold tracking-wider text-emerald-400 font-mono">
                {formatTime(match.timerSeconds)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTimer}
                  className={`p-1.5 rounded-lg font-bold transition flex items-center justify-center ${
                    match.timerRunning
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                  title={match.timerRunning ? 'Pausar Cronómetro' : 'Iniciar Cronómetro'}
                >
                  {match.timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Reiniciar Cronómetro"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* DEUCE / ALARGUE ALERT BANNER */}
          {isDeuce && (
            <div className="p-3.5 bg-gradient-to-r from-rose-950 via-amber-950 to-rose-950 border-2 border-rose-500 rounded-3xl text-center text-rose-200 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl animate-pulse">
              <Flame className="w-5 h-5 text-rose-400 shrink-0" />
              <span>¡ALARGUE! (Ventaja de 2 puntos) • Saque alternado CADA 1 PUNTO</span>
            </div>
          )}

          {/* GRAPHICAL PING PONG TABLE (TOP-DOWN VIEW) */}
          <div className="relative rounded-3xl p-3 sm:p-5 bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden">
            
            {arePointsLocked && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-30 flex flex-col items-center justify-center text-center p-4">
                <div className="px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-700 text-white flex items-center gap-2 shadow-2xl mb-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">
                    {isMatchFinished ? 'Partido Finalizado • Puntaje Bloqueado' : 'Set Definido • Esperando Confirmación'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Utiliza el botón de <strong className="text-amber-300">Deshacer (-1)</strong> abajo si requieres corregir algún punto.
                </p>
              </div>
            )}

            <div className="relative rounded-2xl border-4 border-white shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[380px] sm:min-h-[440px]">
              
              {/* CENTER NET */}
              <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 z-20 flex-col items-center justify-between pointer-events-none">
                <div className="w-5 h-3.5 bg-slate-900 border border-slate-700 rounded-t-sm shadow"></div>
                <div className="w-2.5 h-full bg-slate-900/95 border-x-2 border-white flex flex-col justify-around py-1 shadow-2xl">
                  <div className="w-full h-0.5 bg-white/60"></div>
                  <div className="w-full h-0.5 bg-white/60"></div>
                  <div className="w-full h-0.5 bg-white/60"></div>
                  <div className="w-full h-0.5 bg-white/60"></div>
                  <div className="w-full h-0.5 bg-white/60"></div>
                  <div className="w-full h-0.5 bg-white/60"></div>
                </div>
                <div className="w-5 h-3.5 bg-slate-900 border border-slate-700 rounded-b-sm shadow"></div>
              </div>

              {/* LEFT COURT HALF (RED SIDE) */}
              <div
                id="table-court-left"
                onClick={() => handleAddSetPoint(leftIsHome)}
                className={`relative bg-gradient-to-br from-red-700 via-red-600 to-red-800 transition select-none p-5 sm:p-7 flex flex-col justify-between border-b-2 md:border-b-0 md:border-r-2 border-white group shadow-inner ${
                  arePointsLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-105 active:brightness-95'
                }`}
              >
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/60 pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 px-3.5 rounded-2xl border border-white/30 shadow-lg">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow border border-white/40"
                      style={{ backgroundColor: leftTeam?.color || '#ef4444' }}
                    >
                      {leftTeam?.avatarBadge || '🏓'}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-none">
                        {leftTeam?.name}
                      </h4>
                      <span className="text-[11px] font-bold text-red-200">
                        {leftTeam?.grade} {leftTeam?.group ? `• Grupo ${leftTeam?.group}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {leftIsServing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xl ring-2 ring-amber-300 animate-bounce">
                        <span className="text-sm">🏓</span>
                        <span>SAQUE ({isDeuce ? '1' : `${serveNumberInTurn}/2`})</span>
                      </div>
                    )}
                    {leftIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase shadow-lg animate-pulse">
                        🏆 MATCH POINT
                      </span>
                    )}
                    {leftIsSetPoint && !leftIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-white text-red-700 font-black text-xs uppercase shadow-lg animate-pulse">
                        ⚡ SET POINT
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 text-center py-6">
                  <div className="font-scoreboard text-7xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition transform">
                    {leftPts}
                  </div>
                  <span className="inline-block mt-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30 shadow">
                    {arePointsLocked ? 'PUNTAJE BLOQUEADO' : '+1 PUNTO • TOCA EL LADO ROJO'}
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAdjustSetPoint(leftIsHome)}
                    className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white hover:text-amber-300 border border-white/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span>Deshacer (-1)</span>
                  </button>

                  <button
                    onClick={() => handleSetInitialServer(leftTeamId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                      leftIsServing 
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                        : 'bg-black/60 hover:bg-black/80 text-white border border-white/30'
                    }`}
                  >
                    <span>🏓 Asignar Saque</span>
                  </button>
                </div>
              </div>

              {/* RIGHT COURT HALF (BLUE SIDE) */}
              <div
                id="table-court-right"
                onClick={() => handleAddSetPoint(!leftIsHome)}
                className={`relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 transition select-none p-5 sm:p-7 flex flex-col justify-between border-t-2 md:border-t-0 md:border-l-2 border-white group shadow-inner ${
                  arePointsLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:brightness-105 active:brightness-95'
                }`}
              >
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/60 pointer-events-none"></div>

                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md p-2 px-3.5 rounded-2xl border border-white/30 shadow-lg">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow border border-white/40"
                      style={{ backgroundColor: rightTeam?.color || '#3b82f6' }}
                    >
                      {rightTeam?.avatarBadge || '🏓'}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white leading-none">
                        {rightTeam?.name}
                      </h4>
                      <span className="text-[11px] font-bold text-blue-200">
                        {rightTeam?.grade} {rightTeam?.group ? `• Grupo ${rightTeam?.group}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {rightIsServing && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xl ring-2 ring-amber-300 animate-bounce">
                        <span className="text-sm">🏓</span>
                        <span>SAQUE ({isDeuce ? '1' : `${serveNumberInTurn}/2`})</span>
                      </div>
                    )}
                    {rightIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-yellow-300 text-slate-950 font-black text-xs uppercase shadow-lg animate-pulse">
                        🏆 MATCH POINT
                      </span>
                    )}
                    {rightIsSetPoint && !rightIsMatchPoint && (
                      <span className="px-3 py-1 rounded-full bg-white text-blue-700 font-black text-xs uppercase shadow-lg animate-pulse">
                        ⚡ SET POINT
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 text-center py-6">
                  <div className="font-scoreboard text-7xl sm:text-9xl font-black text-white tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.6)] group-hover:scale-105 transition transform">
                    {rightPts}
                  </div>
                  <span className="inline-block mt-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] sm:text-xs font-black uppercase tracking-wider border border-white/30 shadow">
                    {arePointsLocked ? 'PUNTAJE BLOQUEADO' : '+1 PUNTO • TOCA EL LADO AZUL'}
                  </span>
                </div>

                <div className="relative z-10 flex items-center justify-between gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleAdjustSetPoint(!leftIsHome)}
                    className="px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 text-white hover:text-blue-300 border border-white/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                  >
                    <Undo2 className="w-4 h-4 text-blue-400" />
                    <span>Deshacer (-1)</span>
                  </button>

                  <button
                    onClick={() => handleSetInitialServer(rightTeamId)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                      rightIsServing 
                        ? 'bg-amber-400 text-slate-950 shadow-md font-black' 
                        : 'bg-black/60 hover:bg-black/80 text-white border border-white/30'
                    }`}
                  >
                    <span>🏓 Asignar Saque</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DISCIPLINE 3: FOOTBALL / FUTSAL MODERN PITCH SCOREBOARD  */}
      {/* ======================================================== */}
      {!isSetBasedSport && homeTeam && awayTeam && (
        <FootballPitchScoreboard
          match={match}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          onUpdateMatch={onUpdateMatch}
          onFinishMatch={onFinishMatch}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
        />
      )}

      {/* COMPLETED SETS HISTORY BAR (FOR VOLLEYBALL & TABLE TENNIS) */}
      {isSetBasedSport && match.sets && match.sets.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Historial de Sets Disputados en este Encuentro</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {match.sets.map((set, idx) => {
              const isFinishedSet = (set.homeScore >= pointsPerSetTarget || set.awayScore >= pointsPerSetTarget) && 
                Math.abs(set.homeScore - set.awayScore) >= 2;
              const homeWon = set.homeScore > set.awayScore;

              return (
                <div 
                  key={idx} 
                  className={`bg-slate-950 p-4 rounded-2xl border flex items-center justify-between shadow-inner ${
                    set.setNumber === currentSetNumber 
                      ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' 
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase block">
                      Set #{set.setNumber} {set.setNumber === currentSetNumber ? '(En curso)' : '(Finalizado)'}
                    </span>
                    <div className="font-scoreboard text-2xl font-bold text-white mt-1">
                      <span className={homeWon ? 'text-red-400 font-black' : 'text-slate-300'}>{set.homeScore}</span>
                      <span className="text-slate-600 mx-2">-</span>
                      <span className={!homeWon && isFinishedSet ? 'text-blue-400 font-black' : 'text-slate-300'}>{set.awayScore}</span>
                    </div>
                  </div>

                  {isFinishedSet && (
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      homeWon ? 'bg-red-950 text-red-300 border border-red-800/60' : 'bg-blue-950 text-blue-300 border border-blue-800/60'
                    }`}>
                      Ganó {homeWon ? homeTeam?.name?.split(' ')[0] : awayTeam?.name?.split(' ')[0]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FINALIZATION & SUMMARY ACTIONS */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          {isSetBasedSport && (
            <>
              <button
                onClick={() => handleAdjustSetPoint(leftIsHome)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                title="Deshacer último punto del Lado Rojo"
              >
                <Undo2 className="w-4 h-4 text-amber-400" />
                <span>Deshacer Rojo (-1)</span>
              </button>

              <button
                onClick={() => handleAdjustSetPoint(!leftIsHome)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-blue-300 border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition"
                title="Deshacer último punto del Lado Azul"
              >
                <Undo2 className="w-4 h-4 text-blue-400" />
                <span>Deshacer Azul (-1)</span>
              </button>
            </>
          )}

          <button
            id="btn-reset-match-bottom"
            onClick={() => setShowResetModal(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-rose-100 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            title="Reiniciar o borrar este partido a 0-0 (Requiere autorización de Juez)"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reiniciar / Borrar Partido (0 - 0)</span>
          </button>
        </div>

        <button
          id="btn-finish-match"
          onClick={() => setShowFinishConfirm(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-900/30 transition flex items-center gap-2 text-xs sm:text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Finalizar y Guardar Partido Oficial</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TRANSITION MODAL (SET 1 WON, SET 2 WON, MATCH WON)     */}
      {/* ======================================================== */}
      {transitionModal && transitionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-emerald-500/60 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
            
            {transitionModal.type === 'match_won' ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 mx-auto flex items-center justify-center shadow-xl animate-bounce">
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    ¡PARTIDO OFICIAL FINALIZADO!
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    ¡{transitionModal.winnerName} HA GANADO EL ENCUENTRO!
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 font-medium">
                    Resultado Final: <strong className="text-emerald-400">{transitionModal.scoreSummary}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {isVolleyball 
                      ? 'Victoria definitiva por alcanzar los 30 puntos reglamentarios en Set Directo.' 
                      : 'Definición reglamentaria de victoria al mejor de 3 sets (2-0 / 2-1).'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleAdjustSetPoint(transitionModal.winnerTeamId === match.homeTeamId);
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span>Corregir / Deshacer (-1)</span>
                  </button>

                  <button
                    onClick={() => {
                      setTransitionModal(null);
                      handleConfirmFinish();
                    }}
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Registrar en Tabla</span>
                  </button>

                  <button
                    onClick={() => setShowResetModal(true)}
                    className="col-span-2 py-2.5 px-4 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/40 text-rose-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>Reiniciar o Borrar este Partido a 0-0</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 mx-auto flex items-center justify-center shadow-xl">
                  <Sparkles className="w-8 h-8 text-amber-300 animate-spin" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    {transitionModal.type === 'set1_won' ? '¡FIN DEL 1ER SET!' : '¡FIN DEL 2DO SET!'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                    ¡GANADOR DEL {transitionModal.type === 'set1_won' ? '1ER' : '2DO'} SET: {transitionModal.winnerName}!
                  </h3>
                  <p className="text-sm text-slate-300 mt-2 font-medium">
                    {transitionModal.scoreSummary}
                  </p>
                  
                  <div className="mt-4 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1 text-left">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Protocolo Reglamentario de Transición:</span>
                    </p>
                    <p>• <strong>Cambio de Cancha:</strong> Los equipos intercambian lados de la red.</p>
                    <p>• <strong>Rotación de Saque:</strong> El primer servicio del Set {transitionModal.nextSetNumber} pasa al equipo contrario.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleAdjustSetPoint(transitionModal.winnerTeamId === match.homeTeamId);
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition"
                  >
                    <Undo2 className="w-4 h-4 text-amber-400" />
                    <span>Deshacer Punto (-1)</span>
                  </button>

                  <button
                    onClick={handleProceedToNextSet}
                    className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <span>Comenzar Set {transitionModal.nextSetNumber}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VOLLEYBALL COURT SWAP MODAL (PUNTO 15 ALCANZADO)        */}
      {/* ======================================================== */}
      {showCourtSwapAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 text-amber-400 mx-auto flex items-center justify-center shadow-xl animate-bounce">
              <ArrowRightLeft className="w-8 h-8" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-500/40">
                Reglamento Oficial de Voleibol
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                ¡CAMBIO DE CANCHA!
              </h3>
              <p className="text-amber-400 text-base font-black mt-1">
                (Punto 15 alcanzado)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2 text-xs sm:text-sm text-slate-300">
              <p>
                Un equipo ha alcanzado los <strong className="text-white">15 puntos</strong> reglamentarios.
                Ambos equipos deben <strong className="text-amber-300">intercambiar de lado de cancha físicamente</strong> ahora mismo.
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>La cancha en pantalla ha rotado automáticamente (Lado Rojo ⇄ Lado Azul) para coincidir con la posición física real.</span>
              </div>
            </div>

            <button
              id="btn-dismiss-court-swap"
              onClick={() => {
                setShowCourtSwapAlert(false);
                // Automatically resume match as in_progress
                onUpdateMatch({
                  ...match,
                  status: 'in_progress',
                  timerRunning: true,
                });
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Entendido • Continuar Partido</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation to Finish Match Modal */}
      {showFinishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              ¿Finalizar este partido oficial?
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Marcador Final: <strong className="text-red-400">{homeTeam?.name} ({match.homeScore})</strong> vs <strong className="text-blue-400">({match.awayScore}) {awayTeam?.name}</strong>.
              Al confirmar, la tabla de posiciones del grupo se actualizará automáticamente.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Continuar Jugando
              </button>
              <button
                id="btn-confirm-finish-match"
                onClick={handleConfirmFinish}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30"
              >
                Sí, Finalizar Partido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN-Protected Reset / Clear Match Modal */}
      <ResetMatchModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={handleExecuteResetMatch}
        match={match}
        homeTeamName={homeTeam?.name}
        awayTeamName={awayTeam?.name}
      />

    </div>
  );
}
