import { X, Clock, MapPin, Calendar, Activity, AlertTriangle, Trophy } from 'lucide-react';
import { Match, SportType, Team } from '../types';
import { formatTime } from '../utils/calculator';

interface MatchDetailModalProps {
  match: Match | null;
  teams: Team[];
  sport: SportType;
  onClose: () => void;
}

export function MatchDetailModal({ match, teams, sport, onClose }: MatchDetailModalProps) {
  if (!match) return null;

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);

  const getStatusBadge = () => {
    switch (match.status) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            EN VIVO • {formatTime(match.timerSeconds)}
          </span>
        );
      case 'finished':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            FINALIZADO
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
            PAUSADO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/50">
            PROGRAMADO
          </span>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {match.roundName}
              </span>
              <span className="text-slate-600">•</span>
              {getStatusBadge()}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Scoreboard Display */}
          <div className="grid grid-cols-3 items-center text-center py-3 bg-slate-950/70 border border-slate-800/80 rounded-xl px-2">
            
            {/* Home Team */}
            <div className="flex flex-col items-center px-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white mb-1 shadow-md"
                style={{ backgroundColor: homeTeam?.color || '#3b82f6' }}
              >
                {homeTeam?.avatarBadge || '⚽'}
              </div>
              <h4 className="font-bold text-slate-100 text-sm sm:text-base line-clamp-1">
                {homeTeam?.name || 'Local'}
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">{homeTeam?.grade}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              <div className="font-scoreboard text-4xl sm:text-5xl font-bold tracking-tight text-white flex items-center gap-3">
                <span className={match.homeScore > match.awayScore ? 'text-emerald-400' : 'text-white'}>
                  {match.homeScore}
                </span>
                <span className="text-slate-600 text-3xl font-light">-</span>
                <span className={match.awayScore > match.homeScore ? 'text-emerald-400' : 'text-white'}>
                  {match.awayScore}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold mt-1">
                Marcador {match.status === 'finished' ? 'Final' : 'Actual'}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center px-2">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white mb-1 shadow-md"
                style={{ backgroundColor: awayTeam?.color || '#ef4444' }}
              >
                {awayTeam?.avatarBadge || '🔥'}
              </div>
              <h4 className="font-bold text-slate-100 text-sm sm:text-base line-clamp-1">
                {awayTeam?.name || 'Visitante'}
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">{awayTeam?.grade}</span>
            </div>

          </div>

          {/* Match Meta info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mt-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{match.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{match.time} hrs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{match.venue}</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Sets Breakdown (if volleyball or table tennis) */}
          {match.sets && match.sets.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Desglose de Sets</span>
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {match.sets.map((set) => (
                  <div key={set.setNumber} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Set {set.setNumber}</span>
                    <div className="font-mono text-base font-bold text-white mt-0.5">
                      <span className={set.homeScore > set.awayScore ? 'text-emerald-400' : ''}>{set.homeScore}</span>
                      <span className="text-slate-600 mx-1">-</span>
                      <span className={set.awayScore > set.homeScore ? 'text-emerald-400' : ''}>{set.awayScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline of Events (Goles, Tarjetas, Puntos) */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Incidencias & Línea de Tiempo del Encuentro</span>
            </h5>

            {match.events.length === 0 ? (
              <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-xs">
                No hay incidencias ni goles registrados para este encuentro aún.
              </div>
            ) : (
              <div className="space-y-2.5">
                {match.events.map((ev) => {
                  const isHome = ev.teamId === match.homeTeamId;
                  return (
                    <div 
                      key={ev.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isHome 
                          ? 'bg-blue-950/20 border-blue-900/30' 
                          : 'bg-emerald-950/20 border-emerald-900/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs font-bold">
                          {ev.minuteOrTime || '1T'}
                        </span>
                        
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                            {ev.type === 'goal' && <span>⚽ ¡GOL!</span>}
                            {ev.type === 'point' && <span>⚡ Punto anotado</span>}
                            {ev.type === 'card_yellow' && <span className="text-amber-400">🟨 Tarjeta Amarilla</span>}
                            {ev.type === 'card_red' && <span className="text-rose-400">🟥 Tarjeta Roja</span>}
                            
                            <span className="text-slate-200">
                              {ev.playerName || 'Jugador no asignado'}
                            </span>
                            {ev.playerNumber !== undefined && (
                              <span className="text-slate-400 font-mono">#{ev.playerNumber}</span>
                            )}
                          </div>
                          
                          <span className="text-[11px] text-slate-400">
                            {isHome ? homeTeam?.name : awayTeam?.name}
                          </span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400">
                        {ev.extraNote}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Judge Notes */}
          {match.judgeNotes && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <h6 className="text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Observaciones del Árbitro / Juez</span>
              </h6>
              <p className="text-xs text-slate-300 italic">{match.judgeNotes}</p>
            </div>
          )}

          {/* Lineups preview (Volleyball only shows teams, no individual players) */}
          {sport !== 'voleibol' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home Lineup */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <h6 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeTeam?.color || '#3b82f6' }}></span>
                  <span>Nómina: {homeTeam?.name}</span>
                </h6>
                <div className="space-y-1.5">
                  {homeTeam?.players.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <span className="text-slate-300">
                        {p.number && <strong className="text-emerald-400 mr-1.5 font-mono">#{p.number}</strong>}
                        {p.name} {p.isCaptain && <span className="text-[10px] text-amber-400 font-bold">(C)</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.positionOrRole}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Away Lineup */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <h6 className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayTeam?.color || '#ef4444' }}></span>
                  <span>Nómina: {awayTeam?.name}</span>
                </h6>
                <div className="space-y-1.5">
                  {awayTeam?.players.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                      <span className="text-slate-300">
                        {p.number && <strong className="text-emerald-400 mr-1.5 font-mono">#{p.number}</strong>}
                        {p.name} {p.isCaptain && <span className="text-[10px] text-amber-400 font-bold">(C)</span>}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.positionOrRole}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-300">
                🏐 Encuentro oficial de Voleibol por equipos ({homeTeam?.grade} vs {awayTeam?.grade})
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Set directo a 30 puntos • Cambio de cancha obligatorio al punto 15.
              </p>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition"
          >
            Volver / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
