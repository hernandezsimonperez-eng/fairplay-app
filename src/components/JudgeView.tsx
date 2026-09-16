import { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Calendar, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Sparkles, 
  UserPlus, 
  CheckCircle,
  Clock,
  MapPin,
  Shield,
  Zap,
  DollarSign,
  Layers,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { Match, Player, SportType, Team, Tournament } from '../types';
import { formatTime, getSportBadge, calculateVallaMenosVencida, calculateSanctionsTable } from '../utils/calculator';
import { LiveScoreboard } from './LiveScoreboard';
import { TournamentModal } from './TournamentModal';
import { TeamModal } from './TeamModal';
import { PlayerModal } from './PlayerModal';
import { ScheduleModal } from './ScheduleModal';
import { TournamentCelebrationModal } from './TournamentCelebrationModal';
import { VallaMenosVencidaTable } from './VallaMenosVencidaTable';
import { SanctionsTable } from './SanctionsTable';
import { PlayoffBracket } from './PlayoffBracket';
import { TreasuryManager } from './TreasuryManager';
import { MatchEditModal } from './MatchEditModal';
import { ResetMatchModal } from './ResetMatchModal';

interface JudgeViewProps {
  tournament: Tournament;
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  onSelectTournament: (id: string) => void;
  onSaveTournament: (tournament: Tournament) => void;
  onDeleteTournament: (id: string) => void;
  onSaveTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
  onSavePlayer: (player: Player) => void;
  onDeletePlayer: (teamId: string, playerId: string) => void;
  onUpdateMatch: (match: Match) => void;
  onAddMatch: (match: Match) => void;
  onAddMultipleMatches: (matches: Match[]) => void;
  onDeleteMatch: (matchId: string) => void;
  onFinishMatch: (matchId: string) => void;
  onTogglePayment?: (teamId: string) => void;
}

export function JudgeView({
  tournament,
  tournaments,
  teams,
  matches,
  onSelectTournament,
  onSaveTournament,
  onDeleteTournament,
  onSaveTeam,
  onDeleteTeam,
  onSavePlayer,
  onDeletePlayer,
  onUpdateMatch,
  onAddMatch,
  onAddMultipleMatches,
  onDeleteMatch,
  onFinishMatch,
  onTogglePayment,
}: JudgeViewProps) {
  const [activeJudgeTab, setActiveJudgeTab] = useState<'live' | 'unrefereed' | 'schedule' | 'playoffs' | 'treasury' | 'teams' | 'tournaments' | 'valla' | 'sanctions'>('live');
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'unrefereed' | 'live' | 'finished'>('all');
  
  // Selected live match to referee
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);
  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);

  const isFootball = tournament.sport === 'futbol' || tournament.sport === 'futsal';
  const vallaRanking = isFootball ? calculateVallaMenosVencida(tournament, tournamentTeams, tournamentMatches) : [];
  const sanctionsRanking = isFootball ? calculateSanctionsTable(tournament, tournamentTeams, tournamentMatches) : [];

  const unrefereedMatches = tournamentMatches.filter(m => m.status === 'scheduled' || (!m.winnerTeamId && m.status !== 'finished' && m.homeScore === 0 && m.awayScore === 0));
  const liveMatches = tournamentMatches.filter(m => m.status === 'in_progress');
  const finishedMatches = tournamentMatches.filter(m => m.status === 'finished');

  const defaultLiveMatch = tournamentMatches.find(m => m.status === 'in_progress') || 
                           unrefereedMatches[0] ||
                           tournamentMatches.find(m => m.status === 'scheduled') || 
                           tournamentMatches[0];

  const [activeRefereeMatchId, setActiveRefereeMatchId] = useState<string | null>(defaultLiveMatch?.id || null);

  // Modals state
  const [isTournamentModalOpen, setIsTournamentModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerModalTeam, setPlayerModalTeam] = useState<{ id: string; name: string } | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isMatchEditModalOpen, setIsMatchEditModalOpen] = useState(false);
  const [matchToReset, setMatchToReset] = useState<Match | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const selectedMatch = tournamentMatches.find(m => m.id === activeRefereeMatchId) || defaultLiveMatch;
  const sportBadge = getSportBadge(tournament.sport);

  const handleSaveEditedMatch = (updated: Match) => {
    onUpdateMatch(updated);
    setFeedbackToast(`Marcador del partido "${updated.roundName}" actualizado correctamente.`);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleConfirmResetMatch = () => {
    if (!matchToReset) return;
    const resetMatch: Match = {
      ...matchToReset,
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
      winnerTeamId: undefined,
      isDraw: false,
    };
    onUpdateMatch(resetMatch);
    setFeedbackToast(`Partido "${resetMatch.roundName}" reiniciado a 0 - 0 correctamente.`);
    setTimeout(() => setFeedbackToast(null), 3500);
    setMatchToReset(null);
  };

  const handleTogglePlayerFinesPaid = (playerId: string, markAsPaid: boolean) => {
    let affectedMatches = 0;
    tournamentMatches.forEach(m => {
      if (!m.events || m.events.length === 0) return;
      let hasChange = false;
      const updatedEvents = m.events.map(ev => {
        if (ev.playerId === playerId && (ev.type === 'card_yellow' || ev.type === 'card_blue' || ev.type === 'card_red')) {
          hasChange = true;
          return {
            ...ev,
            finePaid: markAsPaid,
          };
        }
        return ev;
      });

      if (hasChange) {
        affectedMatches++;
        onUpdateMatch({
          ...m,
          events: updatedEvents,
        });
      }
    });

    setFeedbackToast(
      markAsPaid 
        ? `Pago de multa registrado y sanción económica cancelada para el jugador.` 
        : `Estado de multas del jugador revertido a pendiente.`
    );
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  return (
    <div className="space-y-6">
      
      {/* Feedback notification toast */}
      {feedbackToast && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center justify-between text-xs sm:text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <button 
            onClick={() => setFeedbackToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Judge Top Dashboard Header */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Panel de Control de Árbitros & Jueces</span>
              </span>
              <span className="text-xs text-slate-400 font-semibold">• {tournament.category || 'Categoría Juvenil 8°-11°'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Gestión Integral & Marcador Arbitral
            </h2>
            <p className="text-xs text-slate-400">
              Registra y edita marcadores individuales, sets a 11 puntos, alargues (10-10), tesorería ($5.000) y llaves clasificatorias.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-new-tournament"
              onClick={() => {
                setEditingTournament(null);
                setIsTournamentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold border border-slate-700 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Nuevo Torneo</span>
            </button>

            <button
              id="btn-crown-champion"
              onClick={() => setIsCelebrationOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4" />
              <span>Premiación</span>
            </button>
          </div>
        </div>

        {/* Judge Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 overflow-x-auto no-scrollbar">
          
          <button
            id="tab-judge-live"
            onClick={() => setActiveJudgeTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'live'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Marcador Arbitral en Vivo</span>
          </button>

          <button
            id="tab-judge-unrefereed"
            onClick={() => setActiveJudgeTab('unrefereed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'unrefereed'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/40'
                : 'bg-slate-950 text-amber-400/90 hover:text-amber-300 border border-amber-500/30'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Partidos Sin Arbitrar ({unrefereedMatches.length})</span>
          </button>

          <button
            id="tab-judge-schedule"
            onClick={() => setActiveJudgeTab('schedule')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'schedule'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Programación ({tournamentMatches.length})</span>
          </button>

          <button
            id="tab-judge-playoffs"
            onClick={() => setActiveJudgeTab('playoffs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'playoffs'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Cruzados & Llaves</span>
          </button>

          <button
            id="tab-judge-treasury"
            onClick={() => setActiveJudgeTab('treasury')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'treasury'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Tesorería & Pagos ($5.000)</span>
          </button>

          {isFootball && (
            <>
              <button
                id="tab-judge-valla"
                onClick={() => setActiveJudgeTab('valla')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  activeJudgeTab === 'valla'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>🧤</span>
                <span>Valla Menos Vencida</span>
              </button>

              <button
                id="tab-judge-sanctions"
                onClick={() => setActiveJudgeTab('sanctions')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  activeJudgeTab === 'sanctions'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>⚖️</span>
                <span>Pago y Cancelación de Sanciones</span>
              </button>
            </>
          )}

          <button
            id="tab-judge-teams"
            onClick={() => setActiveJudgeTab('teams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'teams'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{tournament.sport === 'tenis_mesa' ? 'Jugadores' : 'EQUIPOS'} ({tournamentTeams.length})</span>
          </button>

          <button
            id="tab-judge-tournaments"
            onClick={() => setActiveJudgeTab('tournaments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeJudgeTab === 'tournaments'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Mis Torneos ({tournaments.length})</span>
          </button>

        </div>
      </div>

      {/* TAB 1: LIVE DIGITAL SCOREBOARD FOR REFEREE */}
      {activeJudgeTab === 'live' && (
        <div>
          {tournamentMatches.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-slate-600" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No hay partidos programados en este torneo</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Genera el fixture de encuentros para comenzar a arbitrar y registrar puntos en vivo.
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/30 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Programar Partidos Ahora</span>
              </button>
            </div>
          ) : selectedMatch ? (
            <div className="space-y-6">
              
              {/* Match Switcher Dropdown / Quick bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Arbitrando:</span>
                  <select
                    value={selectedMatch.id}
                    onChange={(e) => setActiveRefereeMatchId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-xs font-bold text-emerald-400 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate w-full"
                  >
                    {liveMatches.length > 0 && (
                      <optgroup label="🔥 EN VIVO / EN DISPUTA">
                        {liveMatches.map((m) => {
                          const h = tournamentTeams.find(t => t.id === m.homeTeamId)?.name || 'Local';
                          const a = tournamentTeams.find(t => t.id === m.awayTeamId)?.name || 'Visitante';
                          return (
                            <option key={m.id} value={m.id}>
                              🔥 {m.roundName} {m.group ? `(Gr. ${m.group})` : ''}: {h} ({m.homeScore}) vs {a} ({m.awayScore})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {unrefereedMatches.length > 0 && (
                      <optgroup label="⏳ PARTIDOS SIN ARBITRAR / PENDIENTES">
                        {unrefereedMatches.map((m) => {
                          const h = tournamentTeams.find(t => t.id === m.homeTeamId)?.name || 'Local';
                          const a = tournamentTeams.find(t => t.id === m.awayTeamId)?.name || 'Visitante';
                          return (
                            <option key={m.id} value={m.id}>
                              ⏳ {m.roundName} {m.group ? `(Gr. ${m.group})` : ''}: {h} vs {a} • {m.date} ({m.time})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                    {finishedMatches.length > 0 && (
                      <optgroup label="✅ FINALIZADOS / YA ARBITRADOS">
                        {finishedMatches.map((m) => {
                          const h = tournamentTeams.find(t => t.id === m.homeTeamId)?.name || 'Local';
                          const a = tournamentTeams.find(t => t.id === m.awayTeamId)?.name || 'Visitante';
                          return (
                            <option key={m.id} value={m.id}>
                              ✅ {m.roundName} {m.group ? `(Gr. ${m.group})` : ''}: {h} ({m.homeScore}) vs {a} ({m.awayScore})
                            </option>
                          );
                        })}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveJudgeTab('unrefereed')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/40 transition flex items-center gap-1"
                    title="Ver lista de partidos sin arbitrar"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sin Arbitrar ({unrefereedMatches.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      const matchToStart: Match = {
                        ...selectedMatch,
                        status: selectedMatch.status === 'in_progress' ? 'paused' : 'in_progress',
                        timerRunning: selectedMatch.status !== 'in_progress',
                      };
                      onUpdateMatch(matchToStart);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      selectedMatch.status === 'in_progress'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-md shadow-emerald-600/30'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{selectedMatch.status === 'in_progress' ? 'Pausar Reloj' : 'Iniciar / Reanudar'}</span>
                  </button>
                </div>
              </div>

              {/* Main Live Digital Scoreboard */}
              <LiveScoreboard
                match={selectedMatch}
                teams={tournamentTeams}
                sport={tournament.sport}
                onUpdateMatch={onUpdateMatch}
                onFinishMatch={(id) => {
                  onFinishMatch(id);
                }}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 2: UNREFEREED / PENDING MATCHES FILTER TAB */}
      {activeJudgeTab === 'unrefereed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Partidos Sin Arbitrar / Pendientes de Marcador</h3>
              </div>
              <p className="text-xs text-amber-200/70 mt-0.5">
                Listado optimizado para el Juez: encuentra y arbitra rápidamente los partidos pendientes sin tener que buscar entre los ya finalizados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40">
                {unrefereedMatches.length} pendientes
              </span>
            </div>
          </div>

          {unrefereedMatches.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-3xl mx-auto flex items-center justify-center shadow-lg">
                🎉
              </div>
              <h4 className="text-lg font-bold text-white">¡Todos los partidos han sido arbitrados!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No hay encuentros pendientes en este torneo. Puedes consultar la programación completa o revisar la clasificación y la definición del podio.
              </p>
              <button
                onClick={() => setActiveJudgeTab('playoffs')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition"
              >
                Ver Fase Final & Podio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {unrefereedMatches.map((m) => {
                const home = tournamentTeams.find(t => t.id === m.homeTeamId);
                const away = tournamentTeams.find(t => t.id === m.awayTeamId);

                return (
                  <div
                    key={m.id}
                    className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition flex flex-col justify-between gap-3 shadow-lg relative group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-black text-[10px] uppercase tracking-wider">
                            {m.roundName}
                          </span>
                          {m.group && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px]">
                              Grupo {m.group}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {m.date} • {m.time} hrs
                        </span>
                      </div>

                      {/* Opponents Pairing */}
                      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#3b82f6' }}></span>
                            <span className="text-xs font-bold text-white truncate">{home?.name || 'Local'}</span>
                            {home && <span className="text-[10px] text-slate-400">({home.grade})</span>}
                          </div>
                          <span className="font-scoreboard text-sm font-black text-slate-400">0</span>
                        </div>

                        <div className="border-t border-slate-800/50 my-1"></div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: away?.color || '#ef4444' }}></span>
                            <span className="text-xs font-bold text-white truncate">{away?.name || 'Visitante'}</span>
                            {away && <span className="text-[10px] text-slate-400">({away.grade})</span>}
                          </div>
                          <span className="font-scoreboard text-sm font-black text-slate-400">0</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>📍 {m.venue}</span>
                        <span className="text-amber-400/90 font-semibold text-[10px]">⏳ Marcador Pendiente</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setActiveRefereeMatchId(m.id);
                          setActiveJudgeTab('live');
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
                      >
                        <Activity className="w-4 h-4" />
                        <span>⚡ Pitar este partido ahora</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingMatch(m);
                          setIsMatchEditModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1 transition"
                        title="Editar o fijar marcador manual"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULE & FIXTURES MANAGEMENT */}
      {activeJudgeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Cronograma Oficial de Partidos</h3>
              <p className="text-xs text-slate-400">Programa partidos individuales o filtra por estado para el arbitraje</p>
            </div>

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Partido / Auto Fixture</span>
            </button>
          </div>

          {/* Quick Schedule Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setScheduleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                scheduleFilter === 'all'
                  ? 'bg-slate-200 text-slate-950 font-black'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              📋 Todos ({tournamentMatches.length})
            </button>

            <button
              onClick={() => setScheduleFilter('unrefereed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                scheduleFilter === 'unrefereed'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-amber-400/80 hover:text-amber-300 border border-amber-500/30'
              }`}
            >
              ⏳ Sin Arbitrar / Pendientes ({unrefereedMatches.length})
            </button>

            <button
              onClick={() => setScheduleFilter('live')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                scheduleFilter === 'live'
                  ? 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 text-rose-400/80 hover:text-rose-300 border border-rose-500/30'
              }`}
            >
              🔴 En Vivo ({liveMatches.length})
            </button>

            <button
              onClick={() => setScheduleFilter('finished')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                scheduleFilter === 'finished'
                  ? 'bg-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-600/20'
                  : 'bg-slate-900 text-emerald-400/80 hover:text-emerald-300 border border-emerald-500/30'
              }`}
            >
              ✅ Arbitrados / Finalizados ({finishedMatches.length})
            </button>
          </div>

          {tournamentMatches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No hay partidos creados para este torneo.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tournamentMatches
                .filter((m) => {
                  if (scheduleFilter === 'unrefereed') return m.status === 'scheduled' || (!m.winnerTeamId && m.status !== 'finished' && m.homeScore === 0 && m.awayScore === 0);
                  if (scheduleFilter === 'live') return m.status === 'in_progress';
                  if (scheduleFilter === 'finished') return m.status === 'finished';
                  return true;
                })
                .map((m) => {
                const home = tournamentTeams.find(t => t.id === m.homeTeamId);
                const away = tournamentTeams.find(t => t.id === m.awayTeamId);

                return (
                  <div
                    key={m.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                          {m.roundName}
                        </span>
                        {m.group && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                            Grupo {m.group}
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{m.date} - {m.time} hrs</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{m.venue}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm font-bold text-white">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: home?.color || '#3b82f6' }}></span>
                          <span>{home?.name}</span>
                        </span>
                        <span className="font-mono text-base text-emerald-400 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {m.homeScore} - {m.awayScore}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: away?.color || '#ef4444' }}></span>
                          <span>{away?.name}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setEditingMatch(m);
                          setIsMatchEditModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
                        title="Editar o corregir marcador y sets de este partido"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Editar Marcador</span>
                      </button>

                      <button
                        onClick={() => setMatchToReset(m)}
                        className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800/60 flex items-center gap-1.5 transition"
                        title="Reiniciar este partido a 0-0 (Requiere autorización de Juez)"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                        <span>Reiniciar (0-0)</span>
                      </button>

                      <button
                        onClick={() => {
                          setActiveRefereeMatchId(m.id);
                          setActiveJudgeTab('live');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>Arbitrar en Vivo</span>
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('¿Eliminar este partido del calendario?')) {
                            onDeleteMatch(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Eliminar partido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PLAYOFF BRACKET REVIEW */}
      {activeJudgeTab === 'playoffs' && (
        <PlayoffBracket
          tournament={tournament}
          teams={tournamentTeams}
          matches={tournamentMatches}
          onSelectMatch={(m) => {
            setActiveRefereeMatchId(m.id);
            setActiveJudgeTab('live');
          }}
        />
      )}

      {/* TAB 4: TREASURY & PAYMENT CONTROL */}
      {activeJudgeTab === 'treasury' && (
        <TreasuryManager
          tournament={tournament}
          teams={tournamentTeams}
          onTogglePayment={(teamId) => {
            if (onTogglePayment) {
              onTogglePayment(teamId);
            }
          }}
          canEdit={true}
        />
      )}

      {/* TAB 5: TEAMS & PLAYERS MANAGEMENT */}
      {activeJudgeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Equipos y Nómina de Estudiantes</h3>
              <p className="text-xs text-slate-400">Inscribe cursos, asigna grupos y registra pagos de inscripción ($5.000)</p>
            </div>

            <button
              id="btn-inscribe-team"
              onClick={() => {
                setEditingTeam(null);
                setIsTeamModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Inscribir Jugador / Equipo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tournamentTeams.map((team) => {
              const isPaid = team.paymentStatus === 'paid';

              return (
                <div 
                  key={team.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Team Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.avatarBadge || '🏓'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-base leading-tight">{team.name}</h4>
                            {team.group && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                                Gr. {team.group}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">Curso: {team.grade}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTeam(team);
                            setIsTeamModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Editar jugador/equipo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar al jugador/equipo ${team.name}?`)) {
                              onDeleteTeam(team.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inscription Payment Quick Toggle */}
                    <div className="mb-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className={`w-4 h-4 ${isPaid ? 'text-emerald-400' : 'text-rose-400'}`} />
                        <div>
                          <span className="text-xs font-bold text-white block">Inscripción ($5.000 COP)</span>
                          <span className={`text-[11px] ${isPaid ? 'text-emerald-400 font-semibold' : 'text-rose-400'}`}>
                            {isPaid ? 'Cuota Pagada ✓' : 'Falta Pago de Inscripción'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onTogglePayment?.(team.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          isPaid
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                            : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                        }`}
                      >
                        {isPaid ? 'Pagado ✓' : 'Tachar Pago'}
                      </button>
                    </div>

                    {/* Players list (Hidden for volleyball, only show team info) */}
                    {tournament.sport !== 'voleibol' ? (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Ficha del Jugador
                          </span>
                          <button
                            onClick={() => {
                              setPlayerModalTeam({ id: team.id, name: team.name });
                              setEditingPlayer(null);
                              setIsPlayerModalOpen(true);
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Editar Ficha</span>
                          </button>
                        </div>

                        {team.players.map((player) => (
                          <div 
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{player.name}</span>
                            </div>

                            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                              <span>Puntos: {player.stats.goalsOrPoints}</span>
                              <button
                                onClick={() => {
                                  setPlayerModalTeam({ id: team.id, name: team.name });
                                  setEditingPlayer(player);
                                  setIsPlayerModalOpen(true);
                                }}
                                className="text-slate-400 hover:text-white p-1"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-400 text-center">
                        <span className="text-slate-300 font-semibold block">🏐 Equipo Escolar Inscrito</span>
                        <span className="text-[11px] text-slate-500">En voleibol no se registran jugadores individuales; se compite y puntúa por equipo de grado.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: TOURNAMENTS LIST & CREATION */}
      {activeJudgeTab === 'tournaments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Torneos Registrados en FairPlay</h3>
              <p className="text-xs text-slate-400">Selecciona o administra cualquier torneo deportivo escolar</p>
            </div>

            <button
              onClick={() => {
                setEditingTournament(null);
                setIsTournamentModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Torneo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tournaments.map((t) => {
              const badge = getSportBadge(t.sport);
              const isSelected = t.id === tournament.id;
              const tTeamsCount = teams.filter(tm => tm.tournamentId === t.id).length;
              const tMatchesCount = matches.filter(m => m.tournamentId === t.id).length;

              return (
                <div
                  key={t.id}
                  className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition flex flex-col justify-between ${
                    isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color} flex items-center gap-1`}>
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          ACTIVO
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-lg">{t.name}</h4>
                      <span className="text-xs text-amber-400 font-semibold">{t.category}</span>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span>{tTeamsCount} Jugadores/Equipos</span>
                      <span>•</span>
                      <span>{tMatchesCount} Partidos</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onSelectTournament(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 text-center ${
                        isSelected 
                          ? 'bg-slate-800 text-slate-400 cursor-default' 
                          : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                      }`}
                    >
                      {isSelected ? 'Seleccionado' : 'Administrar'}
                    </button>

                    <button
                      onClick={() => {
                        setEditingTournament(t);
                        setIsTournamentModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Editar torneo"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {tournaments.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el torneo ${t.name} y todos sus datos?`)) {
                            onDeleteTournament(t.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Eliminar torneo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: VALLA MENOS VENCIDA (FOOTBALL) */}
      {activeJudgeTab === 'valla' && isFootball && (
        <div className="space-y-4">
          <VallaMenosVencidaTable vallaList={vallaRanking} />
        </div>
      )}

      {/* TAB: SANCIONES & MULTAS (FOOTBALL) */}
      {activeJudgeTab === 'sanctions' && isFootball && (
        <div className="space-y-4">
          <SanctionsTable 
            sanctions={sanctionsRanking} 
            isJudge={true} 
            onTogglePlayerFinesPaid={handleTogglePlayerFinesPaid}
            onOpenJudgeArbitration={() => {
              // Switch to live match to arbitrate or notify
              if (selectedMatch) {
                setActiveJudgeTab('live');
              }
            }}
          />
        </div>
      )}

      {/* MODALS */}
      <TournamentModal
        isOpen={isTournamentModalOpen}
        onClose={() => setIsTournamentModalOpen(false)}
        onSave={onSaveTournament}
        initialTournament={editingTournament}
      />

      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        tournamentId={tournament.id}
        onSave={onSaveTeam}
        initialTeam={editingTeam}
      />

      {playerModalTeam && (
        <PlayerModal
          isOpen={isPlayerModalOpen}
          onClose={() => {
            setIsPlayerModalOpen(false);
            setPlayerModalTeam(null);
          }}
          teamId={playerModalTeam.id}
          teamName={playerModalTeam.name}
          onSave={onSavePlayer}
          initialPlayer={editingPlayer}
        />
      )}

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        tournamentId={tournament.id}
        teams={tournamentTeams}
        onAddMatch={onAddMatch}
        onAddMultipleMatches={onAddMultipleMatches}
      />

      <TournamentCelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        tournament={tournament}
        teams={tournamentTeams}
        matches={tournamentMatches}
      />

      {/* Match Edit / Score Correction Modal */}
      <MatchEditModal
        isOpen={isMatchEditModalOpen}
        onClose={() => {
          setIsMatchEditModalOpen(false);
          setEditingMatch(null);
        }}
        match={editingMatch}
        teams={tournamentTeams}
        tournament={tournament}
        onSaveMatch={handleSaveEditedMatch}
      />

      {/* PIN-Protected Reset Match Modal */}
      <ResetMatchModal
        isOpen={!!matchToReset}
        onClose={() => setMatchToReset(null)}
        onConfirmReset={handleConfirmResetMatch}
        match={matchToReset}
        homeTeamName={tournamentTeams.find(t => t.id === matchToReset?.homeTeamId)?.name}
        awayTeamName={tournamentTeams.find(t => t.id === matchToReset?.awayTeamId)?.name}
      />

    </div>
  );
}
