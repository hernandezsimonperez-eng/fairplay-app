import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  AlertTriangle, 
  DollarSign, 
  CheckCircle, 
  Flame, 
  Shield, 
  Trophy, 
  Clock, 
  Undo2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Match, MatchEvent, Team } from '../types';
import { formatTime } from '../utils/calculator';
import { FootballGoalModal } from './FootballGoalModal';
import { FootballCardModal } from './FootballCardModal';
import { FootballArbitrationModal } from './FootballArbitrationModal';

interface FootballPitchScoreboardProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onUpdateMatch: (updated: Match) => void;
  onFinishMatch: (matchId: string) => void;
  toggleTimer: () => void;
  resetTimer: () => void;
}

export function FootballPitchScoreboard({
  match,
  homeTeam,
  awayTeam,
  onUpdateMatch,
  onFinishMatch,
  toggleTimer,
  resetTimer,
}: FootballPitchScoreboardProps) {
  const [goalModalState, setGoalModalState] = useState<{
    isOpen: boolean;
    isHome: boolean;
  }>({ isOpen: false, isHome: true });

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isArbitrationModalOpen, setIsArbitrationModalOpen] = useState(false);
  const [isFinishConfirmOpen, setIsFinishConfirmOpen] = useState(false);

  // Match half: 1 or 2
  const currentHalf = match.half || (match.timerSeconds >= 720 ? 2 : 1);

  // 2x12 regulation math:
  // Half 1: 0 to 720 seconds (00:00 to 12:00)
  // Half 2: 720 to 1440 seconds (12:00 to 24:00)
  const isOvertimeHalf1 = currentHalf === 1 && match.timerSeconds > 720;
  const isOvertimeHalf2 = currentHalf === 2 && match.timerSeconds > 1440;
  const isOvertime = isOvertimeHalf1 || isOvertimeHalf2;

  // Format current minute string
  const currentMinuteNum = Math.floor((match.timerSeconds || 0) / 60) + 1;
  const currentMinuteStr = `${currentMinuteNum < 10 ? '0' : ''}${currentMinuteNum}'`;

  // Foul counters PER PERIOD (Microfútbol official rule: fouls reset per period)
  const homeFoulsPeriod = match.events?.filter(e => e.teamId === match.homeTeamId && e.type === 'foul' && (e.half === currentHalf || (!e.half && currentHalf === 1))).length || 0;
  const awayFoulsPeriod = match.events?.filter(e => e.teamId === match.awayTeamId && e.type === 'foul' && (e.half === currentHalf || (!e.half && currentHalf === 1))).length || 0;

  const totalHomeFouls = match.events?.filter(e => e.teamId === match.homeTeamId && e.type === 'foul').length || 0;
  const totalAwayFouls = match.events?.filter(e => e.teamId === match.awayTeamId && e.type === 'foul').length || 0;

  // Open Goal Modal
  const handleOpenGoalModal = (isHome: boolean) => {
    setGoalModalState({ isOpen: true, isHome });
  };

  // Confirm Goal from Modal
  const handleConfirmGoal = (data: {
    playerId?: string;
    playerName: string;
    playerNumber?: number;
    minute: string;
    isOwnGoal?: boolean;
    extraNote?: string;
  }) => {
    const isHome = goalModalState.isHome;
    const scoringTeamId = isHome ? match.homeTeamId : match.awayTeamId;
    const newHomeScore = isHome ? match.homeScore + 1 : match.homeScore;
    const newAwayScore = !isHome ? match.awayScore + 1 : match.awayScore;

    const newEvent: MatchEvent = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'goal',
      teamId: scoringTeamId,
      playerId: data.playerId,
      playerName: data.playerName,
      playerNumber: data.playerNumber,
      minuteOrTime: data.minute,
      pointsHome: newHomeScore,
      pointsAway: newAwayScore,
      description: data.isOwnGoal 
        ? `Autogol a favor de ${isHome ? homeTeam.name : awayTeam.name}` 
        : `Gol de ${data.playerName}${data.playerNumber ? ` (#${data.playerNumber})` : ''}${data.extraNote ? ` - ${data.extraNote}` : ''}`,
    };

    onUpdateMatch({
      ...match,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      status: match.status === 'scheduled' ? 'in_progress' : match.status,
      events: [newEvent, ...(match.events || [])],
    });
  };

  // Adjust/Subtract Goal
  const handleSubtractGoal = (isHome: boolean) => {
    if (isHome && match.homeScore <= 0) return;
    if (!isHome && match.awayScore <= 0) return;

    const newHomeScore = isHome ? match.homeScore - 1 : match.homeScore;
    const newAwayScore = !isHome ? match.awayScore - 1 : match.awayScore;

    // Remove last goal event of that team if available
    const teamId = isHome ? match.homeTeamId : match.awayTeamId;
    const remainingEvents = [...(match.events || [])];
    const lastGoalIdx = remainingEvents.findIndex(e => e.teamId === teamId && e.type === 'goal');
    if (lastGoalIdx !== -1) {
      remainingEvents.splice(lastGoalIdx, 1);
    }

    onUpdateMatch({
      ...match,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      events: remainingEvents,
    });
  };

  // Confirm Card Sancion
  const handleConfirmCard = (data: {
    teamId: string;
    playerId: string;
    playerName: string;
    playerNumber?: number;
    cardType: 'card_yellow' | 'card_blue' | 'card_red';
    minute: string;
    reason: string;
    fineAmount: number;
  }) => {
    const isHome = data.teamId === match.homeTeamId;
    const teamName = isHome ? homeTeam.name : awayTeam.name;

    const newEvent: MatchEvent = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: data.cardType,
      teamId: data.teamId,
      playerId: data.playerId,
      playerName: data.playerName,
      playerNumber: data.playerNumber,
      minuteOrTime: data.minute,
      fineAmount: data.fineAmount,
      finePaid: false,
      description: `${data.cardType === 'card_yellow' ? '🟨 Amarilla' : data.cardType === 'card_blue' ? '🟦 Azul' : '🟥 Roja'} a ${data.playerName} (${teamName}) - ${data.reason}`,
    };

    onUpdateMatch({
      ...match,
      events: [newEvent, ...(match.events || [])],
    });
  };

  // Add accumulated foul for current period
  const handleAddFoul = (isHome: boolean) => {
    const teamId = isHome ? match.homeTeamId : match.awayTeamId;
    const teamName = isHome ? homeTeam.name : awayTeam.name;

    const newEvent: MatchEvent = {
      id: `foul-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now(),
      type: 'foul',
      teamId,
      half: currentHalf,
      minuteOrTime: currentMinuteStr,
      description: `Falta colectiva de ${teamName} (${currentHalf}°T - ${currentMinuteStr})`,
    };

    onUpdateMatch({
      ...match,
      events: [newEvent, ...(match.events || [])],
    });
  };

  // Subtract / Undo last foul of current period
  const handleSubtractFoul = (isHome: boolean) => {
    const teamId = isHome ? match.homeTeamId : match.awayTeamId;
    const remainingEvents = [...(match.events || [])];
    const foulIdx = remainingEvents.findIndex(
      e => e.teamId === teamId && e.type === 'foul' && (e.half === currentHalf || (!e.half && currentHalf === 1))
    );
    if (foulIdx !== -1) {
      remainingEvents.splice(foulIdx, 1);
      onUpdateMatch({
        ...match,
        events: remainingEvents,
      });
    }
  };

  // Toggle or switch half (1st half <-> 2nd half)
  const handleSwitchHalf = (halfNumber: 1 | 2) => {
    let newSeconds = match.timerSeconds;
    if (halfNumber === 2 && match.timerSeconds < 720) {
      newSeconds = 720; // jump to 12:00
    } else if (halfNumber === 1 && match.timerSeconds >= 720) {
      newSeconds = 0; // jump back to 00:00
    }

    onUpdateMatch({
      ...match,
      half: halfNumber,
      timerSeconds: newSeconds,
      timerRunning: false,
    });
  };

  // Save Arbitration Updates
  const handleUpdateArbitration = (data: {
    arbitrationPaidHome: boolean;
    arbitrationPaidAway: boolean;
    arbitrationFee: number;
    events: Match['events'];
  }) => {
    onUpdateMatch({
      ...match,
      arbitrationPaidHome: data.arbitrationPaidHome,
      arbitrationPaidAway: data.arbitrationPaidAway,
      arbitrationFee: data.arbitrationFee,
      events: data.events,
    });
  };

  return (
    <div className="space-y-4">
      
      {/* VERIFICACIÓN OBLIGATORIA DE ARBITRAJE ($5.000 COP POR EQUIPO) */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="font-black text-white uppercase tracking-wider block">
              Planilla Arbitral Obligatoria ($5.000 COP por equipo)
            </span>
            <span className="text-[11px] text-slate-400">
              Confirmación de pago de planilla antes del inicio del juego • Total: $10.000 COP
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border transition ${
            match.arbitrationPaidHome
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={match.arbitrationPaidHome ?? false}
              onChange={(e) => {
                onUpdateMatch({
                  ...match,
                  arbitrationPaidHome: e.target.checked,
                  arbitrationFee: match.arbitrationFee || 5000,
                });
              }}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <span>{homeTeam.name} ($5.000)</span>
            {match.arbitrationPaidHome && <span>✓</span>}
          </label>

          <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-xl border transition ${
            match.arbitrationPaidAway
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
          }`}>
            <input
              type="checkbox"
              checked={match.arbitrationPaidAway ?? false}
              onChange={(e) => {
                onUpdateMatch({
                  ...match,
                  arbitrationPaidAway: e.target.checked,
                  arbitrationFee: match.arbitrationFee || 5000,
                });
              }}
              className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 cursor-pointer"
            />
            <span>{awayTeam.name} ($5.000)</span>
            {match.arbitrationPaidAway && <span>✓</span>}
          </label>

          {(match.arbitrationPaidHome && match.arbitrationPaidAway) ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 text-[11px] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Planilla Liquidada ✓</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[11px] flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendiente de Confirmar</span>
            </span>
          )}
        </div>
      </div>

      {/* 5TH ACCUMULATED FOUL ALERT BANNER */}
      {(homeFoulsPeriod >= 5 || awayFoulsPeriod >= 5) && (
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white font-black text-xs sm:text-sm uppercase tracking-wide py-2.5 px-4 rounded-2xl shadow-xl shadow-rose-600/40 border-2 border-rose-400 text-center animate-bounce flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
          <span>
            ¡TIRO LIBRE SIN BARRERA / ACUMULADA! (5ª Falta en el {currentHalf}° Tiempo: {
              homeFoulsPeriod >= 5 && awayFoulsPeriod >= 5 
                ? 'Ambos Equipos' 
                : homeFoulsPeriod >= 5 ? homeTeam.name : awayTeam.name
            })
          </span>
        </div>
      )}

      {/* PITCH CONTAINER */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-800/60 shadow-2xl bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 p-4 sm:p-6 text-white select-none">
        
        {/* Grass Stripes Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0, 0, 0, 0.15) 40px, rgba(0, 0, 0, 0.15) 80px)'
          }}
        />

        {/* Tactical Pitch Lines */}
        <div className="absolute inset-3 sm:inset-5 border-2 border-white/40 rounded-2xl pointer-events-none">
          {/* Half-way line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/40" />
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-white/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
          </div>

          {/* Left Goal Area */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-14 sm:w-20 h-28 sm:h-36 border-2 border-l-0 border-white/40 rounded-r-xl" />
          {/* Right Goal Area */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-14 sm:w-20 h-28 sm:h-36 border-2 border-r-0 border-white/40 rounded-l-xl" />
        </div>

        {/* Pitch Content Overlay */}
        <div className="relative z-10 space-y-4">
          
          {/* Top Bar: Official 2x12 Timer & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
            
            {/* Halves Selector */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchHalf(1)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                  currentHalf === 1
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-black/60 text-slate-300 hover:text-white border border-white/20'
                }`}
              >
                <span>1° Tiempo (12')</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchHalf(2)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1 ${
                  currentHalf === 2
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-black/60 text-slate-300 hover:text-white border border-white/20'
                }`}
              >
                <span>2° Tiempo (12')</span>
              </button>
            </div>

            {/* Central Clock */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="font-scoreboard text-3xl sm:text-4xl font-black tracking-widest text-emerald-300 font-mono drop-shadow">
                  {formatTime(match.timerSeconds)}
                </div>
                {isOvertime && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse">
                    + Tiempo Adicional
                  </span>
                )}
              </div>

              {/* Timer Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleTimer}
                  className={`p-2.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg active:scale-95 ${
                    match.timerRunning
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
                  }`}
                  title={match.timerRunning ? 'Pausar Reloj' : 'Iniciar Reloj'}
                >
                  {match.timerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
                <button
                  type="button"
                  onClick={resetTimer}
                  className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white border border-white/20 transition active:scale-95"
                  title="Reiniciar Cronómetro a 00:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions: Cards, Arbitration & Finalize */}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button
                type="button"
                onClick={() => setIsCardModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
              >
                <span>🟨 Tarjeta / Sanción</span>
              </button>

              <button
                type="button"
                onClick={() => setIsArbitrationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-blue-200 border border-blue-400/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Arbitraje ($5.000)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFinishConfirmOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-400/40 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow"
                title="Finalizar el partido oficialmente"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Finalizar Partido</span>
              </button>
            </div>

          </div>

          {/* Main Pitch Field: Home vs Away Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 py-4 sm:py-6">
            
            {/* HOME SIDE (LEFT) */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md"
                    style={{ backgroundColor: homeTeam.color || '#10b981' }}
                  >
                    {homeTeam.avatarBadge || '⚽'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                      Local
                    </span>
                    <h3 className="text-xl font-black text-white">{homeTeam.name}</h3>
                    <span className="text-xs text-slate-300">{homeTeam.grade} {homeTeam.group ? `• Gr. ${homeTeam.group}` : ''}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="font-scoreboard text-6xl sm:text-7xl font-black text-white tracking-tight drop-shadow-lg">
                  {match.homeScore}
                </div>
              </div>

              {/* 5th foul specific alert for Home */}
              {homeFoulsPeriod >= 5 && (
                <div className="py-1.5 px-3 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider text-center border border-rose-400 shadow-md shadow-rose-600/40 animate-pulse flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>¡TIRO LIBRE SIN BARRERA / ACUMULADA!</span>
                </div>
              )}

              {/* Faltas colectivas & Goal Controls */}
              <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-300 font-semibold">Faltas {currentHalf}°T:</span>
                  <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs border ${
                    homeFoulsPeriod >= 5 
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                      : 'bg-black/60 text-amber-300 border-white/20'
                  }`}>
                    {homeFoulsPeriod} / 5
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddFoul(true)}
                      className="px-2 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-amber-300 hover:text-amber-200 border border-white/20 text-xs font-bold transition active:scale-95"
                      title="+1 Falta Colectiva para este tiempo"
                    >
                      + Falta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubtractFoul(true)}
                      disabled={homeFoulsPeriod <= 0}
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 text-slate-400 hover:text-slate-200 border border-white/20 text-xs font-bold transition active:scale-95"
                      title="Deshacer Falta de este tiempo"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubtractGoal(true)}
                    disabled={match.homeScore <= 0}
                    className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 disabled:opacity-40 text-slate-300 hover:text-white border border-white/20 text-xs font-bold transition active:scale-95"
                    title="Restar Gol"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenGoalModal(true)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-emerald-500/30"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ GOL LOCAL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* AWAY SIDE (RIGHT) */}
            <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md"
                    style={{ backgroundColor: awayTeam.color || '#3b82f6' }}
                  >
                    {awayTeam.avatarBadge || '⚽'}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 block">
                      Visitante
                    </span>
                    <h3 className="text-xl font-black text-white">{awayTeam.name}</h3>
                    <span className="text-xs text-slate-300">{awayTeam.grade} {awayTeam.group ? `• Gr. ${awayTeam.group}` : ''}</span>
                  </div>
                </div>

                {/* Score */}
                <div className="font-scoreboard text-6xl sm:text-7xl font-black text-white tracking-tight drop-shadow-lg">
                  {match.awayScore}
                </div>
              </div>

              {/* 5th foul specific alert for Away */}
              {awayFoulsPeriod >= 5 && (
                <div className="py-1.5 px-3 rounded-xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-wider text-center border border-rose-400 shadow-md shadow-rose-600/40 animate-pulse flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                  <span>¡TIRO LIBRE SIN BARRERA / ACUMULADA!</span>
                </div>
              )}

              {/* Faltas colectivas & Goal Controls */}
              <div className="pt-2 border-t border-white/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-300 font-semibold">Faltas {currentHalf}°T:</span>
                  <span className={`px-2 py-0.5 rounded-lg font-mono font-bold text-xs border ${
                    awayFoulsPeriod >= 5 
                      ? 'bg-rose-600 text-white border-rose-400 animate-pulse' 
                      : 'bg-black/60 text-amber-300 border-white/20'
                  }`}>
                    {awayFoulsPeriod} / 5
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAddFoul(false)}
                      className="px-2 py-1 rounded-lg bg-black/60 hover:bg-black/90 text-amber-300 hover:text-amber-200 border border-white/20 text-xs font-bold transition active:scale-95"
                      title="+1 Falta Colectiva para este tiempo"
                    >
                      + Falta
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubtractFoul(false)}
                      disabled={awayFoulsPeriod <= 0}
                      className="p-1 rounded-lg bg-black/60 hover:bg-black/90 disabled:opacity-30 text-slate-400 hover:text-slate-200 border border-white/20 text-xs font-bold transition active:scale-95"
                      title="Deshacer Falta de este tiempo"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSubtractGoal(false)}
                    disabled={match.awayScore <= 0}
                    className="px-3 py-2 rounded-xl bg-black/60 hover:bg-black/80 disabled:opacity-40 text-slate-300 hover:text-white border border-white/20 text-xs font-bold transition active:scale-95"
                    title="Restar Gol"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenGoalModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-blue-500/30"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ GOL VISITANTE</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Timeline & Status Overview */}
          <div className="bg-black/50 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>⏱️</span>
                <span>Incidencias del Partido ({match.events?.length || 0})</span>
              </span>
              <div className="flex items-center gap-2">
                {match.arbitrationPaidHome && match.arbitrationPaidAway ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Arbitraje Liquidado ✓
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Arbitraje Pendiente
                  </span>
                )}
              </div>
            </div>

            {(!match.events || match.events.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-2">
                Aún no hay goles ni tarjetas registradas en este encuentro.
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                {match.events.map(ev => {
                  const isGoal = ev.type === 'goal';
                  const isYellow = ev.type === 'card_yellow';
                  const isBlue = ev.type === 'card_blue';
                  const isRed = ev.type === 'card_red';
                  const isHome = ev.teamId === match.homeTeamId;

                  return (
                    <div
                      key={ev.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs shrink-0 flex items-center gap-2 bg-black/60 ${
                        isHome ? 'border-emerald-500/40' : 'border-blue-500/40'
                      }`}
                    >
                      <span className="font-mono text-emerald-300 font-bold">{ev.minuteOrTime}</span>
                      <span>
                        {isGoal ? '⚽' : isYellow ? '🟨' : isBlue ? '🟦' : isRed ? '🟥' : '📋'}
                      </span>
                      <span className="font-semibold text-white">{ev.playerName || ev.description}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Goal Modal */}
      <FootballGoalModal
        isOpen={goalModalState.isOpen}
        team={goalModalState.isHome ? homeTeam : awayTeam}
        currentMatchMinute={currentMinuteStr}
        isHome={goalModalState.isHome}
        onClose={() => setGoalModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirmGoal={handleConfirmGoal}
      />

      {/* Card Sanctions Modal */}
      <FootballCardModal
        isOpen={isCardModalOpen}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        currentMatchMinute={currentMinuteStr}
        onClose={() => setIsCardModalOpen(false)}
        onConfirmCard={handleConfirmCard}
      />

      {/* Arbitration Modal */}
      <FootballArbitrationModal
        isOpen={isArbitrationModalOpen}
        match={match}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        onClose={() => setIsArbitrationModalOpen(false)}
        onUpdateArbitration={handleUpdateArbitration}
      />

      {/* Finish Match Confirmation Modal */}
      {isFinishConfirmOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsFinishConfirmOpen(false); }}
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Acta Oficial de Juego
                </span>
                <h3 className="text-lg font-black text-white">¿Finalizar Partido?</h3>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-center">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Marcador Registrado
              </div>
              <div className="flex items-center justify-center gap-4">
                <div className="text-right flex-1">
                  <span className="font-bold text-white block text-sm">{homeTeam.name}</span>
                  <span className="text-xs text-slate-400">Faltas {currentHalf}°T: {homeFoulsPeriod}</span>
                </div>
                <div className="font-scoreboard text-3xl font-black text-emerald-400 bg-slate-900 px-4 py-1 rounded-xl border border-slate-700">
                  {match.homeScore} - {match.awayScore}
                </div>
                <div className="text-left flex-1">
                  <span className="font-bold text-white block text-sm">{awayTeam.name}</span>
                  <span className="text-xs text-slate-400">Faltas {currentHalf}°T: {awayFoulsPeriod}</span>
                </div>
              </div>
              <div className="pt-2 text-xs text-slate-300 border-t border-slate-850">
                Arbitraje: {match.arbitrationPaidHome && match.arbitrationPaidAway 
                  ? <span className="text-emerald-400 font-bold">Planilla Pagada ($10.000 COP) ✓</span> 
                  : <span className="text-amber-400 font-bold">⚠️ Planilla pendiente de liquidar</span>
                }
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Al confirmar, el cronómetro se detendrá y el partido pasará a estado oficial finalizado. Podrás revisar o ajustar incidencias en cualquier momento.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Volver / Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFinishConfirmOpen(false);
                  onFinishMatch(match.id);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold transition shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar y Finalizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
