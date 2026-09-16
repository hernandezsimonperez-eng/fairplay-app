import { Match, Team, Tournament } from '../types';
import { Trophy, ChevronRight, Sparkles, Shield, Clock } from 'lucide-react';
import { calculateGroupStandings } from '../utils/calculator';

interface PlayoffBracketProps {
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
  onSelectMatch?: (match: Match) => void;
}

export function PlayoffBracket({
  tournament,
  teams,
  matches,
  onSelectMatch,
}: PlayoffBracketProps) {
  const groupStandings = calculateGroupStandings(tournament, teams, matches);

  // Filter playoff matches
  const cruzadosMatches = matches.filter(m => 
    m.tournamentId === tournament.id && 
    (m.roundName.toLowerCase().includes('llave') || m.roundName.toLowerCase().includes('cruzado'))
  );

  const semiMatches = matches.filter(m => 
    m.tournamentId === tournament.id && 
    m.roundName.toLowerCase().includes('semifinal')
  );

  const thirdPlaceMatch = matches.find(m => 
    m.tournamentId === tournament.id && 
    (m.id === 'm-tt-3rd-place' || m.roundName.toLowerCase().includes('3er') || m.roundName.toLowerCase().includes('tercer'))
  );

  const finalMatch = matches.find(m => 
    m.tournamentId === tournament.id && 
    (m.roundName.toLowerCase().includes('gran final') || m.roundName.toLowerCase().includes('final')) &&
    !m.roundName.toLowerCase().includes('semifinal') &&
    !m.roundName.toLowerCase().includes('cuartos') &&
    !m.roundName.toLowerCase().includes('3er') &&
    !m.roundName.toLowerCase().includes('tercer')
  );

  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Fase de Eliminación Directa</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">Cruzados → Semis → Final</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Llaves Clasificatorias & Cuadro de Honor
            </h3>
            <p className="text-xs text-slate-400">
              Clasifican el <strong>1° y 2° lugar de cada grupo</strong> (A, B, C, D) para disputar los cruces oficiales.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Formato de Llave</span>
              <span className="text-xs font-bold text-white">2 de 3 Sets • 11 Puntos</span>
            </div>
          </div>
        </div>

        {/* Group Qualified Snapshot Pills */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {(tournament.groups && tournament.groups.length > 0 ? tournament.groups : ['A', 'B', 'C', 'D']).map(grp => {
            const standings = groupStandings[grp] || [];
            const hasPlayed = standings.some(s => s.pj > 0);
            const top1 = hasPlayed ? standings[0] : null;
            const top2 = hasPlayed ? standings[1] : null;

            return (
              <div key={grp} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">
                  Clasificados Grupo {grp}
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span className="truncate">1° {top1 ? top1.teamName : `Por definir (Gr. ${grp})`}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">{top1 ? `${top1.pts} pts` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="truncate">2° {top2 ? top2.teamName : `Por definir (Gr. ${grp})`}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{top2 ? `${top2.pts} pts` : '-'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Bracket Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Cruzados */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Cruzados</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              Miércoles 2 Sept
            </span>
          </div>

          <div className="space-y-3">
            {cruzadosMatches.length > 0 ? (
              cruzadosMatches.map((m, idx) => {
                const pairingSubtitles: Record<string, string> = {
                  'm-tt-cruz-1': '1º Grupo A vs 2º Grupo C',
                  'm-tt-cruz-2': '1º Grupo B vs 2º Grupo D',
                  'm-tt-cruz-3': '1º Grupo C vs 2º Grupo A',
                  'm-tt-cruz-4': '1º Grupo D vs 2º Grupo B',
                };
                const subtitle = pairingSubtitles[m.id] || (idx === 0 ? '1º Gr. A vs 2º Gr. C' : idx === 1 ? '1º Gr. B vs 2º Gr. D' : idx === 2 ? '1º Gr. C vs 2º Gr. A' : '1º Gr. D vs 2º Gr. B');

                const grpHome = (idx === 0 ? 'A' : idx === 1 ? 'B' : idx === 2 ? 'C' : 'D') as 'A' | 'B' | 'C' | 'D';
                const grpAway = (idx === 0 ? 'C' : idx === 1 ? 'D' : idx === 2 ? 'A' : 'B') as 'A' | 'B' | 'C' | 'D';

                const homeGroupPlayed = (groupStandings[grpHome] || []).some(s => s.pj > 0);
                const awayGroupPlayed = (groupStandings[grpAway] || []).some(s => s.pj > 0);

                const home = homeGroupPlayed ? getTeam(m.homeTeamId) : null;
                const away = awayGroupPlayed ? getTeam(m.awayTeamId) : null;

                const isFinished = m.status === 'finished';
                const isLive = m.status === 'in_progress';
                const homeWon = isFinished && m.homeScore > m.awayScore;
                const awayWon = isFinished && m.awayScore > m.homeScore;

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(m)}
                    className={`bg-slate-900 border rounded-2xl p-3.5 transition shadow-lg cursor-pointer hover:border-slate-700 ${
                      isLive 
                        ? 'border-red-500/50 ring-1 ring-red-500/30 bg-red-950/10' 
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-amber-400">{m.roundName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{subtitle}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{m.time}</span>
                      </span>
                    </div>

                    {/* Team Home */}
                    <div className={`flex items-center justify-between p-2 rounded-xl mb-1.5 transition ${
                      homeWon ? 'bg-emerald-950/50 border border-emerald-800/40 text-white font-bold' : 'bg-slate-950/60 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#10b981' }}></span>
                        <span className="truncate text-xs">{home ? home.name : `1° Grupo ${grpHome} (Por clasificar)`}</span>
                        {home && <span className="text-[10px] text-slate-500">({home.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-base font-black text-emerald-400 pl-2">
                        {isFinished || isLive ? m.homeScore : '-'}
                      </span>
                    </div>

                    {/* Team Away */}
                    <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                      awayWon ? 'bg-emerald-950/50 border border-emerald-800/40 text-white font-bold' : 'bg-slate-950/60 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: away?.color || '#3b82f6' }}></span>
                        <span className="truncate text-xs">{away ? away.name : `2° Grupo ${grpAway} (Por clasificar)`}</span>
                        {away && <span className="text-[10px] text-slate-500">({away.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-base font-black text-blue-400 pl-2">
                        {isFinished || isLive ? m.awayScore : '-'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{m.venue}</span>
                      {isLive ? (
                        <span className="text-red-400 font-bold animate-pulse">● EN VIVO</span>
                      ) : isFinished ? (
                        <span className="text-emerald-400 font-bold">Finalizado</span>
                      ) : (
                        <span className="text-slate-500">Por Jugar</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Partidos de cuartos por definir.</p>
            )}
          </div>
        </div>

        {/* Column 2: Semifinales */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-sm font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>Semifinales</span>
            </h4>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              Viernes 4 Sept
            </span>
          </div>

          <div className="space-y-3">
            {semiMatches.length > 0 ? (
              semiMatches.map((m, idx) => {
                const isFinished = m.status === 'finished';
                const isLive = m.status === 'in_progress';
                const homeWon = isFinished && m.homeScore > m.awayScore;
                const awayWon = isFinished && m.awayScore > m.homeScore;

                const cruzHomeId = idx === 0 ? 'm-tt-cruz-1' : 'm-tt-cruz-2';
                const cruzAwayId = idx === 0 ? 'm-tt-cruz-3' : 'm-tt-cruz-4';
                const cruzHomeMatch = matches.find(match => match.id === cruzHomeId);
                const cruzAwayMatch = matches.find(match => match.id === cruzAwayId);

                const homeTeamReal = cruzHomeMatch && cruzHomeMatch.status === 'finished' ? getTeam(m.homeTeamId) : null;
                const awayTeamReal = cruzAwayMatch && cruzAwayMatch.status === 'finished' ? getTeam(m.awayTeamId) : null;

                const semiSubtitles: Record<string, string> = {
                  'm-tt-semi-1': 'Ganador Llave 1 vs Ganador Llave 3',
                  'm-tt-semi-2': 'Ganador Llave 2 vs Ganador Llave 4',
                };
                const subtitle = semiSubtitles[m.id] || (idx === 0 ? 'Ganador Llave 1 vs Llave 3' : 'Ganador Llave 2 vs Llave 4');

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(m)}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg cursor-pointer hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-400">{m.roundName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{subtitle}</span>
                      </div>
                      <span className="flex items-center gap-1 text-[10px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{m.time}</span>
                      </span>
                    </div>

                    {/* Team Home */}
                    <div className={`flex items-center justify-between p-2 rounded-xl mb-1.5 transition ${
                      homeWon ? 'bg-emerald-950/50 border border-emerald-800/40 text-white font-bold' : 'bg-slate-950/60 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: homeTeamReal?.color || '#10b981' }}></span>
                        <span className="truncate text-xs">{homeTeamReal ? homeTeamReal.name : `Ganador Llave ${idx === 0 ? '1' : '2'} (Por definir)`}</span>
                        {homeTeamReal && <span className="text-[10px] text-slate-500">({homeTeamReal.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-base font-black text-emerald-400 pl-2">
                        {isFinished || isLive ? m.homeScore : '-'}
                      </span>
                    </div>

                    {/* Team Away */}
                    <div className={`flex items-center justify-between p-2 rounded-xl transition ${
                      awayWon ? 'bg-emerald-950/50 border border-emerald-800/40 text-white font-bold' : 'bg-slate-950/60 text-slate-300'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: awayTeamReal?.color || '#3b82f6' }}></span>
                        <span className="truncate text-xs">{awayTeamReal ? awayTeamReal.name : `Ganador Llave ${idx === 0 ? '3' : '4'} (Por definir)`}</span>
                        {awayTeamReal && <span className="text-[10px] text-slate-500">({awayTeamReal.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-base font-black text-blue-400 pl-2">
                        {isFinished || isLive ? m.awayScore : '-'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{m.venue}</span>
                      <span className="text-slate-500">{isFinished ? 'Finalizado' : 'Programado'}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">Semifinales por disputarse.</p>
            )}
          </div>
        </div>

        {/* Column 3: Definición del Podio (3er Puesto & Gran Final) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/30">
            <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Definición de Podio & Honor</span>
            </h4>
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
              Viernes 4 Sept
            </span>
          </div>

          <div className="space-y-4">
            
            {/* 1. GRAN FINAL (1° & 2° Puesto) */}
            {finalMatch ? (
              (() => {
                const semi1Match = matches.find(match => match.id === 'm-tt-semi-1');
                const semi2Match = matches.find(match => match.id === 'm-tt-semi-2');
                const isSemi1Done = semi1Match && semi1Match.status === 'finished';
                const isSemi2Done = semi2Match && semi2Match.status === 'finished';

                const home = isSemi1Done ? getTeam(finalMatch.homeTeamId) : null;
                const away = isSemi2Done ? getTeam(finalMatch.awayTeamId) : null;
                const isFinished = finalMatch.status === 'finished';
                const isLive = finalMatch.status === 'in_progress';
                const homeWon = isFinished && finalMatch.homeScore > finalMatch.awayScore;
                const awayWon = isFinished && finalMatch.awayScore > finalMatch.homeScore;

                return (
                  <div
                    onClick={() => onSelectMatch?.(finalMatch)}
                    className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 shadow-2xl cursor-pointer hover:border-amber-400 transition relative group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                          🥇
                        </span>
                        <div>
                          <h5 className="font-black text-white text-sm sm:text-base leading-tight">GRAN FINAL</h5>
                          <span className="text-[10px] text-amber-300 font-semibold block">Ganador Semi 1 vs Ganador Semi 2</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/90 border border-amber-500/40 px-2.5 py-1 rounded-xl text-right">
                        Viernes 4 Sept<br/><span className="text-white">2do Descanso</span>
                      </span>
                    </div>

                    {/* Finalist 1 */}
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl mb-1.5 transition ${
                      homeWon ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950/80 text-white font-bold'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#10b981' }}></span>
                        <span className="truncate text-xs sm:text-sm">{home ? home.name : 'Ganador Semifinal 1 (Por definir)'}</span>
                        {home && <span className={`text-[10px] ${homeWon ? 'text-slate-900' : 'text-slate-400'}`}>({home.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-xl font-black pl-2">
                        {isFinished || isLive ? finalMatch.homeScore : '-'}
                      </span>
                    </div>

                    {/* Finalist 2 */}
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl transition ${
                      awayWon ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950/80 text-white font-bold'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: away?.color || '#3b82f6' }}></span>
                        <span className="truncate text-xs sm:text-sm">{away ? away.name : 'Ganador Semifinal 2 (Por definir)'}</span>
                        {away && <span className={`text-[10px] ${awayWon ? 'text-slate-900' : 'text-slate-400'}`}>({away.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-xl font-black pl-2">
                        {isFinished || isLive ? finalMatch.awayScore : '-'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">{finalMatch.venue}</span>
                      <span className="text-amber-400 font-bold text-[11px]">
                        {isFinished ? '🏆 ¡Campeón Coronado!' : isLive ? '🔴 EN JUEGO' : '2do Descanso (Final)'}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : null}

            {/* 2. PARTIDO POR EL 3ER PUESTO (Medalla de Bronce) */}
            {thirdPlaceMatch ? (
              (() => {
                const semi1Match = matches.find(match => match.id === 'm-tt-semi-1');
                const semi2Match = matches.find(match => match.id === 'm-tt-semi-2');
                const isSemi1Done = semi1Match && semi1Match.status === 'finished';
                const isSemi2Done = semi2Match && semi2Match.status === 'finished';

                const home = isSemi1Done ? getTeam(thirdPlaceMatch.homeTeamId) : null;
                const away = isSemi2Done ? getTeam(thirdPlaceMatch.awayTeamId) : null;
                const isFinished = thirdPlaceMatch.status === 'finished';
                const isLive = thirdPlaceMatch.status === 'in_progress';
                const homeWon = isFinished && thirdPlaceMatch.homeScore > thirdPlaceMatch.awayScore;
                const awayWon = isFinished && thirdPlaceMatch.awayScore > thirdPlaceMatch.homeScore;

                return (
                  <div
                    onClick={() => onSelectMatch?.(thirdPlaceMatch)}
                    className="bg-gradient-to-b from-orange-950/30 via-slate-900 to-slate-950 border border-orange-500/50 rounded-3xl p-4 shadow-xl cursor-pointer hover:border-orange-400 transition relative"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                          🥉
                        </span>
                        <div>
                          <h5 className="font-black text-white text-sm leading-tight">3ER PUESTO</h5>
                          <span className="text-[10px] text-orange-300 font-semibold block">Perdedor Semi 1 vs Perdedor Semi 2</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-orange-300 bg-orange-950/90 border border-orange-500/40 px-2.5 py-1 rounded-xl text-right">
                        Viernes 4 Sept<br/><span className="text-white">1er Descanso</span>
                      </span>
                    </div>

                    {/* Contender 1 */}
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl mb-1.5 transition ${
                      homeWon ? 'bg-orange-600 text-white font-black' : 'bg-slate-950/80 text-slate-200 font-semibold'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: home?.color || '#f97316' }}></span>
                        <span className="truncate text-xs">{home ? home.name : 'Perdedor Semifinal 1 (Por definir)'}</span>
                        {home && <span className="text-[10px] text-slate-400">({home.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-lg font-black pl-2 text-orange-400">
                        {isFinished || isLive ? thirdPlaceMatch.homeScore : '-'}
                      </span>
                    </div>

                    {/* Contender 2 */}
                    <div className={`flex items-center justify-between p-2.5 rounded-2xl transition ${
                      awayWon ? 'bg-orange-600 text-white font-black' : 'bg-slate-950/80 text-slate-200 font-semibold'
                    }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: away?.color || '#3b82f6' }}></span>
                        <span className="truncate text-xs">{away ? away.name : 'Perdedor Semifinal 2 (Por definir)'}</span>
                        {away && <span className="text-[10px] text-slate-400">({away.grade})</span>}
                      </div>
                      <span className="font-scoreboard text-lg font-black pl-2 text-orange-400">
                        {isFinished || isLive ? thirdPlaceMatch.awayScore : '-'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">{thirdPlaceMatch.venue}</span>
                      <span className="text-orange-400 font-bold text-[11px]">
                        {isFinished ? '🥉 3er Puesto Definido' : isLive ? '🔴 EN JUEGO' : '1er Descanso (Bronce)'}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : null}

          </div>
        </div>

      </div>
    </div>
  );
}
