import { useState } from 'react';
import { 
  Calendar, 
  Trophy, 
  Flame, 
  Users, 
  Clock, 
  ChevronRight, 
  Award, 
  BarChart3, 
  Search,
  Sparkles,
  Shield,
  DollarSign,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { Match, Team, Tournament } from '../types';
import { 
  calculateGroupStandings, 
  calculateScorers, 
  calculateStandings, 
  calculateVallaMenosVencida,
  calculateSanctionsTable,
  formatTime, 
  getSportBadge 
} from '../utils/calculator';
import { MatchDetailModal } from './MatchDetailModal';
import { PlayoffBracket } from './PlayoffBracket';
import { TreasuryManager } from './TreasuryManager';
import { VallaMenosVencidaTable } from './VallaMenosVencidaTable';
import { SanctionsTable } from './SanctionsTable';

interface SpectatorViewProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  onOpenLiveScoreboardForJudge?: (matchId: string) => void;
  onTogglePayment?: (teamId: string) => void;
}

export function SpectatorView({
  tournament,
  teams,
  matches,
  onOpenLiveScoreboardForJudge,
  onTogglePayment,
}: SpectatorViewProps) {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'playoffs' | 'treasury' | 'scorers' | 'teams' | 'valla' | 'sanctions'>('fixtures');
  const [matchFilter, setMatchFilter] = useState<'all' | 'live' | 'upcoming' | 'finished'>('all');
  const [roundFilter, setRoundFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');
  const [standingsViewMode, setStandingsViewMode] = useState<'groups' | 'general'>('groups');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [scorerSearch, setScorerSearch] = useState('');

  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);
  const tournamentMatches = matches.filter(m => m.tournamentId === tournament.id);

  const isTableTennis = tournament.sport === 'tenis_mesa';
  const isVolleyball = tournament.sport === 'voleibol';
  const isFootball = tournament.sport === 'futbol' || tournament.sport === 'futsal';
  const isRacketOrVolley = tournament.sport === 'voleibol' || tournament.sport === 'tenis_mesa' || tournament.sport === 'tenis';

  // Compute live standings, group standings, scorers, valla and sanctions
  const generalStandings = calculateStandings(tournament, tournamentTeams, tournamentMatches);
  const groupStandings = calculateGroupStandings(tournament, tournamentTeams, tournamentMatches);
  const scorers = calculateScorers(tournament, tournamentTeams, tournamentMatches);
  const vallaRanking = isFootball ? calculateVallaMenosVencida(tournament, tournamentTeams, tournamentMatches) : [];
  const sanctionsRanking = isFootball ? calculateSanctionsTable(tournament, tournamentTeams, tournamentMatches) : [];
  const sportBadge = getSportBadge(tournament.sport);

  // Available unique rounds for filtering
  const availableRounds = Array.from(new Set(tournamentMatches.map(m => m.roundName)));

  // Filter matches
  const filteredMatches = tournamentMatches.filter(m => {
    if (matchFilter === 'live' && !(m.status === 'in_progress' || m.status === 'paused')) return false;
    if (matchFilter === 'upcoming' && m.status !== 'scheduled') return false;
    if (matchFilter === 'finished' && m.status !== 'finished') return false;
    if (roundFilter !== 'all' && m.roundName !== roundFilter) return false;
    if (groupFilter !== 'all' && m.group !== groupFilter) return false;
    return true;
  });

  const liveMatchesCount = tournamentMatches.filter(m => m.status === 'in_progress').length;
  const finishedMatchesCount = tournamentMatches.filter(m => m.status === 'finished').length;

  // Filter scorers by search
  const filteredScorers = scorers.filter(s => 
    s.playerName.toLowerCase().includes(scorerSearch.toLowerCase()) ||
    s.teamName.toLowerCase().includes(scorerSearch.toLowerCase()) ||
    s.grade.toLowerCase().includes(scorerSearch.toLowerCase())
  );

  // Chart data for attack vs defense
  const chartData = generalStandings.map(s => ({
    name: s.teamName.length > 12 ? s.teamName.substring(0, 10) + '..' : s.teamName,
    'Puntos a Favor (PF)': s.gf,
    'Puntos en Contra (PC)': s.gc,
    'Puntos Tabla (PTS)': s.pts,
  }));

  return (
    <div className="space-y-6">
      
      {/* Active Tournament Hero Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${sportBadge.color} flex items-center gap-1`}>
                <span>{sportBadge.icon}</span>
                <span>{sportBadge.label}</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {tournament.category || 'Categoría Juvenil 8°-11° y Profes'}
              </span>
              {liveMatchesCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  <span>{liveMatchesCount} Partido(s) EN VIVO</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {tournament.name}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              {tournament.description || 'Fase de 4 grupos (A, B, C, D) al mejor de 3 sets a 11 puntos con alargue deuce (10-10) y rotación de saque cada 2 puntos. Clasifican 1° y 2° a Cuartos de Final (Cruzados).'}
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="flex items-center gap-3 self-start md:self-center flex-wrap">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">{isTableTennis ? 'Jugadores' : 'EQUIPOS'}</span>
              <span className="text-base font-bold text-emerald-400">{tournamentTeams.length}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Partidos</span>
              <span className="text-base font-bold text-blue-400">{finishedMatchesCount}/{tournamentMatches.length}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Cuota Inscripción</span>
              <span className="text-base font-bold text-amber-400">$5.000</span>
            </div>
          </div>
        </div>

        {/* View Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            id="tab-fixtures"
            onClick={() => setActiveTab('fixtures')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'fixtures'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Cronograma & Marcadores</span>
            {liveMatchesCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-500 text-white text-[10px] rounded-full font-bold">
                {liveMatchesCount}
              </span>
            )}
          </button>

          <button
            id="tab-standings"
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'standings'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabla de Posiciones por Grupos</span>
          </button>

          <button
            id="tab-playoffs"
            onClick={() => setActiveTab('playoffs')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'playoffs'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Cruzados & Llaves Finales</span>
          </button>

          <button
            id="tab-treasury"
            onClick={() => setActiveTab('treasury')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'treasury'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Inscripciones & Pagos ($5.000)</span>
          </button>

          {!isVolleyball && (
            <button
              id="tab-scorers"
              onClick={() => setActiveTab('scorers')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activeTab === 'scorers'
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>{isRacketOrVolley ? 'Máximos Anotadores' : 'Goleadores'}</span>
            </button>
          )}

          {isFootball && (
            <>
              <button
                id="tab-valla"
                onClick={() => setActiveTab('valla')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  activeTab === 'valla'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>🧤</span>
                <span>Valla Menos Vencida</span>
              </button>

              <button
                id="tab-sanctions"
                onClick={() => setActiveTab('sanctions')}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                  activeTab === 'sanctions'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>⚖️</span>
                <span>Tarjetas & Sanciones</span>
              </button>
            </>
          )}

          <button
            id="tab-teams"
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'teams'
                ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isTableTennis ? 'Jugadores' : 'EQUIPOS'} ({tournamentTeams.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CRONOGRAMA & MARCADORES */}
      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          
          {/* Subfilter Chips Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            
            {/* Status main toggles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setMatchFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  matchFilter === 'all'
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                📋 Todos ({tournamentMatches.length})
              </button>

              <button
                onClick={() => setMatchFilter('upcoming')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  matchFilter === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-blue-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>⏳ POR JUGAR ({tournamentMatches.filter(m => m.status === 'scheduled').length})</span>
              </button>

              <button
                onClick={() => setMatchFilter('finished')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  matchFilter === 'finished'
                    ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>✅ YA JUGADOS ({finishedMatchesCount})</span>
              </button>

              {liveMatchesCount > 0 && (
                <button
                  onClick={() => setMatchFilter('live')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    matchFilter === 'live'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                      : 'bg-slate-950 text-red-400 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 animate-bounce" />
                  <span>🔴 EN VIVO ({liveMatchesCount})</span>
                </button>
              )}
            </div>

            {/* Round & Group Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Round dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Ronda:</span>
                <select
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">Todas las Rondas</option>
                  {availableRounds.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Group dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500">Grupo:</span>
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value as any)}
                  className="bg-transparent text-xs text-emerald-400 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos los Grupos (A, B, C, D)</option>
                  <option value="A">Grupo A</option>
                  <option value="B">Grupo B</option>
                  <option value="C">Grupo C</option>
                  <option value="D">Grupo D</option>
                </select>
              </div>
            </div>

          </div>

          {/* Matches Grid */}
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-semibold">No se encontraron encuentros con el filtro seleccionado.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((match) => {
                const homeTeam = tournamentTeams.find(t => t.id === match.homeTeamId);
                const awayTeam = tournamentTeams.find(t => t.id === match.awayTeamId);
                const isLive = match.status === 'in_progress';
                const isFinished = match.status === 'finished';

                return (
                  <div
                    key={match.id}
                    onClick={() => setSelectedMatch(match)}
                    className={`relative bg-slate-900/95 hover:bg-slate-850 border rounded-3xl p-4 sm:p-5 transition cursor-pointer shadow-lg hover:border-slate-700 group ${
                      isLive 
                        ? 'border-red-500/50 ring-1 ring-red-500/30' 
                        : isFinished
                        ? 'border-emerald-500/20'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold uppercase tracking-wider text-emerald-400 text-[11px] font-mono">
                          {match.roundName}
                        </span>
                        {match.group && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-bold text-[10px] border border-slate-700">
                            Grupo {match.group}
                          </span>
                        )}
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{match.venue}</span>
                      </div>

                      {/* Status Tag */}
                      {isLive && (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          <span>EN VIVO • Set {match.currentSet || 1} ({formatTime(match.timerSeconds)})</span>
                        </span>
                      )}

                      {isFinished && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <span>✓ FINALIZADO</span>
                        </span>
                      )}

                      {match.status === 'scheduled' && (
                        <span className="flex items-center gap-1 text-[11px] text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/40">
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>POR JUGAR • {match.time}</span>
                        </span>
                      )}
                    </div>

                    {/* Teams Scoreboard Row */}
                    <div className="grid grid-cols-7 items-center gap-2 py-2">
                      
                      {/* Home */}
                      <div className="col-span-3 flex items-center gap-2.5">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow"
                          style={{ backgroundColor: homeTeam?.color || '#10b981' }}
                        >
                          {homeTeam?.avatarBadge || '🏓'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition">
                            {homeTeam?.name || 'Local'}
                          </h4>
                          <span className="text-[10px] text-slate-400">{homeTeam?.grade}</span>
                        </div>
                      </div>

                      {/* Score or VS */}
                      <div className="col-span-1 text-center">
                        {isFinished || isLive ? (
                          <div className="font-scoreboard text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1.5">
                            <span className={match.homeScore > match.awayScore ? 'text-emerald-400 font-black' : 'text-slate-200'}>
                              {match.homeScore}
                            </span>
                            <span className="text-slate-600 text-xl font-light">-</span>
                            <span className={match.awayScore > match.homeScore ? 'text-blue-400 font-black' : 'text-slate-200'}>
                              {match.awayScore}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-950 rounded-xl text-slate-400 text-xs font-bold border border-slate-800">
                            VS
                          </span>
                        )}
                      </div>

                      {/* Away */}
                      <div className="col-span-3 flex items-center justify-end gap-2.5 text-right">
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-emerald-400 transition">
                            {awayTeam?.name || 'Visitante'}
                          </h4>
                          <span className="text-[10px] text-slate-400">{awayTeam?.grade}</span>
                        </div>
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow"
                          style={{ backgroundColor: awayTeam?.color || '#3b82f6' }}
                        >
                          {awayTeam?.avatarBadge || '🏓'}
                        </div>
                      </div>

                    </div>

                    {/* Sets details badge if racket sport */}
                    {isTableTennis && match.sets && match.sets.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Sets:</span>
                          {match.sets.map((s, idx) => (
                            <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 border border-slate-800">
                              S{s.setNumber}: {s.homeScore}-{s.awayScore}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1 text-emerald-400 font-semibold group-hover:translate-x-0.5 transition">
                          <span>Ver Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: TABLA DE POSICIONES POR GRUPOS */}
      {activeTab === 'standings' && (
        <div className="space-y-6">
          
          {/* Visual Legend for Classification status */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStandingsViewMode('groups')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    standingsViewMode === 'groups'
                      ? 'bg-emerald-600 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Vista por Grupos (A, B, C, D)</span>
                </button>

                <button
                  onClick={() => setStandingsViewMode('general')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    standingsViewMode === 'general'
                      ? 'bg-emerald-600 text-slate-950 shadow'
                      : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>Tabla General</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Reglamento: 3 pts por Victoria • 0 pts por Derrota
              </div>
            </div>

            {/* Visual Color-Code Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Código Matemático:
              </span>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400"></span>
                <span>🟢 VERDE: Clasificación Matemática ASEGURADA</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                <span>🟠 NARANJA: En Disputa (Depende de resultados)</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>⚪ BLANCO / GRIS: Matemáticamente ELIMINADO</span>
              </div>
            </div>
          </div>

          {/* GROUPS VIEW */}
          {standingsViewMode === 'groups' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['A', 'B', 'C', 'D'] as const).map(grp => {
                const groupTeams = groupStandings[grp] || [];

                return (
                  <div key={grp} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-black text-sm">
                          {grp}
                        </span>
                        <div>
                          <h4 className="font-bold text-white text-base leading-tight">GRUPO {grp}</h4>
                          <span className="text-[11px] text-slate-400">Categoría Pre-Juvenil & Profes</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/60">
                        Top 2 Clasifica a Cuartos
                      </span>
                    </div>

                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-2">Jugador</th>
                            <th className="py-2.5 px-1.5 text-center" title="Partidos Jugados">PJ</th>
                            <th className="py-2.5 px-1.5 text-center text-emerald-400" title="Partidos Ganados">PG</th>
                            <th className="py-2.5 px-1.5 text-center text-rose-400" title="Partidos Perdidos">PP</th>
                            <th className="py-2.5 px-1.5 text-center" title="Sets Ganados">SF</th>
                            <th className="py-2.5 px-1.5 text-center" title="Sets Perdidos">SC</th>
                            <th className="py-2.5 px-1.5 text-center" title="Diferencia de Sets">DS</th>
                            <th className="py-2.5 px-1.5 text-center" title="Puntos a Favor">PF</th>
                            <th className="py-2.5 px-1.5 text-center" title="Puntos en Contra">PC</th>
                            <th className="py-2.5 px-2 text-center font-black text-emerald-400">PTS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {groupTeams.map((team) => {
                            const isGuaranteed = team.qualificationStatus === 'guaranteed';
                            const isEliminated = team.qualificationStatus === 'eliminated';
                            const isInContention = team.qualificationStatus === 'in_contention' || (!isGuaranteed && !isEliminated);

                            return (
                              <tr 
                                key={team.teamId}
                                className={`transition ${
                                  isGuaranteed 
                                    ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500 hover:bg-emerald-950/50' 
                                    : isInContention
                                    ? 'bg-amber-950/20 border-l-4 border-l-amber-500 hover:bg-amber-950/30'
                                    : 'bg-slate-900/30 border-l-4 border-l-slate-700 opacity-65 hover:opacity-90 hover:bg-slate-850'
                                }`}
                              >
                                <td className="py-2.5 px-2 text-center font-bold">
                                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black ${
                                    isGuaranteed 
                                      ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                                      : isInContention
                                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {team.position}
                                  </span>
                                </td>

                                <td className="py-2.5 px-2">
                                  <div className="flex items-center gap-1.5 min-w-[110px]">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: team.color }}></span>
                                    <span className={`font-bold truncate ${isGuaranteed ? 'text-white' : isInContention ? 'text-slate-200' : 'text-slate-400'}`}>
                                      {team.teamName}
                                    </span>
                                    <span className="text-[10px] text-slate-500 shrink-0">({team.grade})</span>
                                    {isGuaranteed && (
                                      <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        Q
                                      </span>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 px-1.5 text-center text-slate-300">{team.pj}</td>
                                <td className="py-2.5 px-1.5 text-center font-bold text-emerald-400">{team.pg}</td>
                                <td className="py-2.5 px-1.5 text-center text-rose-400">{team.pp}</td>
                                <td className="py-2.5 px-1.5 text-center text-slate-300">{team.setsWon || 0}</td>
                                <td className="py-2.5 px-1.5 text-center text-slate-400">{team.setsLost || 0}</td>
                                <td className="py-2.5 px-1.5 text-center font-semibold text-slate-200">
                                  {(team.setDiff ?? 0) > 0 ? `+${team.setDiff}` : team.setDiff}
                                </td>
                                <td className="py-2.5 px-1.5 text-center text-slate-400">{team.gf}</td>
                                <td className="py-2.5 px-1.5 text-center text-slate-500">{team.gc}</td>
                                
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`font-scoreboard text-sm font-bold px-2 py-0.5 rounded border ${
                                    isGuaranteed
                                      ? 'text-emerald-300 bg-emerald-950 border-emerald-700/60 shadow-sm'
                                      : isInContention
                                      ? 'text-amber-300 bg-amber-950 border-amber-700/60 shadow-sm'
                                      : 'text-slate-400 bg-slate-950 border-slate-800'
                                  }`}>
                                    {team.pts}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom mini legend */}
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Top 2 cruzan a Cuartos</span>
                      <span className="font-mono text-emerald-400">Victorias: 3 pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* GENERAL STANDINGS TABLE */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[650px] text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/50">
                      <th className="py-3 px-3 text-center w-12">#</th>
                      <th className="py-3 px-3">Jugador / Curso</th>
                      <th className="py-3 px-2 text-center">Gr.</th>
                      <th className="py-3 px-2 text-center" title="Partidos Jugados">PJ</th>
                      <th className="py-3 px-2 text-center text-emerald-400" title="Partidos Ganados">PG</th>
                      <th className="py-3 px-2 text-center text-rose-400" title="Partidos Perdidos">PP</th>
                      <th className="py-3 px-2 text-center" title="Sets Ganados">SF</th>
                      <th className="py-3 px-2 text-center" title="Sets Perdidos">SC</th>
                      <th className="py-3 px-2 text-center" title="Diferencia de Sets">DS</th>
                      <th className="py-3 px-2 text-center" title="Puntos a Favor">PF</th>
                      <th className="py-3 px-2 text-center" title="Puntos en Contra">PC</th>
                      <th className="py-3 px-2 text-center font-semibold" title="Diferencia Puntos">DP</th>
                      <th className="py-3 px-3 text-center font-black text-emerald-400" title="Puntos Totales">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {generalStandings.map((team, idx) => (
                      <tr key={team.teamId} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }}></span>
                            <span className="font-bold text-white">{team.teamName}</span>
                            <span className="text-xs text-slate-400">({team.grade})</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-amber-400">{team.group || '-'}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.pj}</td>
                        <td className="py-3 px-2 text-center font-bold text-emerald-400">{team.pg}</td>
                        <td className="py-3 px-2 text-center text-rose-400">{team.pp}</td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.setsWon || 0}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{team.setsLost || 0}</td>
                        <td className="py-3 px-2 text-center font-semibold text-slate-200">
                          {(team.setDiff ?? 0) > 0 ? `+${team.setDiff}` : team.setDiff}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-300">{team.gf}</td>
                        <td className="py-3 px-2 text-center text-slate-400">{team.gc}</td>
                        <td className="py-3 px-2 text-center font-bold">
                          <span className={team.dg > 0 ? 'text-emerald-400' : team.dg < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {team.dg > 0 ? `+${team.dg}` : team.dg}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-scoreboard text-base font-bold text-emerald-400">
                          {team.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recharts Analytics Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Comparativa de Rendimiento (Puntos a Favor vs Puntos en Contra)</span>
            </h4>
            <p className="text-xs text-slate-400 mb-6">
              Balance individual de puntos por set y puntos acumulados en la tabla.
            </p>

            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Puntos a Favor (PF)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Puntos en Contra (PC)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Puntos Tabla (PTS)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: CUARTOS DE FINAL / LLAVES / PLAYOFFS */}
      {activeTab === 'playoffs' && (
        <PlayoffBracket
          tournament={tournament}
          teams={tournamentTeams}
          matches={tournamentMatches}
          onSelectMatch={(m) => setSelectedMatch(m)}
        />
      )}

      {/* TAB 4: TESORERIA & PAGOS DE INSCRIPCION */}
      {activeTab === 'treasury' && (
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

      {/* TAB 5: GOLEADORES & ANOTADORES */}
      {activeTab === 'scorers' && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          {scorers.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              
              {/* 2nd Place */}
              <div className="order-2 sm:order-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl p-5 text-center flex flex-col justify-between shadow-lg">
                <div>
                  <div className="w-12 h-12 rounded-full bg-slate-700 text-slate-200 font-black text-base mx-auto flex items-center justify-center border-2 border-slate-400 mb-2 shadow">
                    🥈 2°
                  </div>
                  <h4 className="font-bold text-white text-base">{scorers[1].playerName}</h4>
                  <p className="text-xs text-slate-400">{scorers[1].teamName} • {scorers[1].grade}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="font-scoreboard text-4xl font-bold text-slate-200">
                    {scorers[1].scoreCount}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {isRacketOrVolley ? 'Puntos Anotados' : 'Goles'}
                  </span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 text-center flex flex-col justify-between shadow-2xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  <span>Líder Anotador</span>
                </div>

                <div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black text-xl mx-auto flex items-center justify-center border-4 border-amber-300 mb-2 shadow-xl">
                    🏆 1°
                  </div>
                  <h4 className="font-bold text-white text-lg">{scorers[0].playerName}</h4>
                  <p className="text-xs text-amber-300/80 font-medium">{scorers[0].teamName} • {scorers[0].grade}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/30">
                  <div className="font-scoreboard text-5xl font-black text-amber-400">
                    {scorers[0].scoreCount}
                  </div>
                  <span className="text-[11px] uppercase font-bold text-amber-300">
                    {isRacketOrVolley ? 'Puntos Totales' : 'Goles Registrados'}
                  </span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/60 rounded-3xl p-5 text-center flex flex-col justify-between shadow-lg">
                <div>
                  <div className="w-12 h-12 rounded-full bg-amber-900/60 text-amber-300 font-black text-base mx-auto flex items-center justify-center border-2 border-amber-700 mb-2 shadow">
                    🥉 3°
                  </div>
                  <h4 className="font-bold text-white text-base">{scorers[2].playerName}</h4>
                  <p className="text-xs text-slate-400">{scorers[2].teamName} • {scorers[2].grade}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="font-scoreboard text-4xl font-bold text-amber-500">
                    {scorers[2].scoreCount}
                  </div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {isRacketOrVolley ? 'Puntos Anotados' : 'Goles'}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Full Scorers Leaderboard Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>Tabla Individual de {isRacketOrVolley ? 'Anotadores' : 'Goleadores'}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Registro de estudiantes y puntos en los partidos oficiales.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={scorerSearch}
                  onChange={(e) => setScorerSearch(e.target.value)}
                  placeholder="Buscar estudiante..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredScorers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay anotaciones registradas que coincidan con la búsqueda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/40">
                      <th className="py-3 px-3 text-center w-12">Pos</th>
                      <th className="py-3 px-3">Estudiante / Jugador</th>
                      <th className="py-3 px-3">Equipo & Grado</th>
                      <th className="py-3 px-3 text-center" title="Partidos Jugados">PJ</th>
                      <th className="py-3 px-4 text-center font-bold text-emerald-400">
                        {isRacketOrVolley ? 'Puntos' : 'Total Goles'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                    {filteredScorers.map((scorer, idx) => (
                      <tr key={scorer.playerId} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-center font-bold">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                            idx === 0 
                              ? 'bg-amber-500 text-slate-950 font-black' 
                              : idx === 1 
                              ? 'bg-slate-400 text-slate-950 font-bold' 
                              : idx === 2 
                              ? 'bg-amber-700 text-white font-bold' 
                              : 'text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            {scorer.playerNumber && (
                              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                                #{scorer.playerNumber}
                              </span>
                            )}
                            <span>{scorer.playerName}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scorer.teamColor }}></span>
                            <span className="text-slate-300 font-medium">{scorer.teamName}</span>
                            <span className="text-[11px] text-slate-500">({scorer.grade})</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center text-slate-400">
                          {scorer.matchesPlayed}
                        </td>

                        <td className="py-3 px-4 text-center font-scoreboard text-2xl font-bold text-emerald-400">
                          {scorer.scoreCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: EQUIPOS (O PLANTELES EN FÚTBOL / JUGADORES EN TENIS DE MESA) */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tournamentTeams.map((team) => {
            const teamStanding = generalStandings.find(s => s.teamId === team.id);
            return (
              <div 
                key={team.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-md"
                      style={{ backgroundColor: team.color }}
                    >
                      {team.avatarBadge || (isVolleyball ? '🏐' : isTableTennis ? '🏓' : '⚽')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{team.name}</h4>
                      <span className="text-xs text-slate-400 font-medium">
                        Curso: {team.grade} {team.group ? `• Grupo ${team.group}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Inscripción</span>
                    <span className={`text-xs font-bold ${
                      team.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {team.paymentStatus === 'paid' ? 'Pagado ✓' : 'Falta Pago ($5.000)'}
                    </span>
                  </div>
                </div>

                {isVolleyball ? (
                  /* Volleyball: Only show team-level data, no individual player list */
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Partidos</span>
                        <span className="font-scoreboard text-lg font-bold text-white mt-0.5 block">
                          {teamStanding?.pj || 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 block">Ganados</span>
                        <span className="font-scoreboard text-lg font-bold text-emerald-400 mt-0.5 block">
                          {teamStanding?.pg || 0}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                        <span className="text-[10px] uppercase font-bold text-amber-400 block">Puntos</span>
                        <span className="font-scoreboard text-lg font-bold text-amber-300 mt-0.5 block">
                          {teamStanding?.pts || 0}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>Puntos a favor (PF): <strong className="text-slate-200">{teamStanding?.gf || 0}</strong></span>
                      <span>Puntos en contra (PC): <strong className="text-slate-200">{teamStanding?.gc || 0}</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic text-center">
                      🏐 Disciplina de Voleibol: Equipo colegial conjunto (sin fichas individuales).
                    </p>
                  </div>
                ) : (
                  /* Standard roster list for Football and Table Tennis */
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ficha del Jugador</span>
                    </h5>

                    <div className="space-y-1.5">
                      {team.players.map(player => (
                        <div 
                          key={player.id} 
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {player.number !== undefined && (
                              <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-1.5 py-0.5 rounded text-[11px] border border-slate-800">
                                #{player.number}
                              </span>
                            )}
                            <span className="font-medium text-slate-200">
                              {player.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                            <span>{player.positionOrRole || 'Jugador Individual'}</span>
                            {player.stats.goalsOrPoints > 0 && (
                              <span className="font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded">
                                {player.stats.goalsOrPoints} pts
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: VALLA MENOS VENCIDA (FOOTBALL) */}
      {activeTab === 'valla' && isFootball && (
        <div className="space-y-4">
          <VallaMenosVencidaTable vallaList={vallaRanking} />
        </div>
      )}

      {/* TAB: SANCIONES FAIRPLAY (FOOTBALL) */}
      {activeTab === 'sanctions' && isFootball && (
        <div className="space-y-4">
          <SanctionsTable sanctions={sanctionsRanking} isJudge={false} />
        </div>
      )}

      {/* Match Detail Modal */}
      <MatchDetailModal
        match={selectedMatch}
        teams={tournamentTeams}
        sport={tournament.sport}
        onClose={() => setSelectedMatch(null)}
      />

    </div>
  );
}
