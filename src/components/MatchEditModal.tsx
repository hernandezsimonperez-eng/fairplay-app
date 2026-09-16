import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Match, Team, Tournament } from '../types';

interface MatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  teams: Team[];
  tournament: Tournament;
  onSaveMatch: (updatedMatch: Match) => void;
}

export function MatchEditModal({
  isOpen,
  onClose,
  match,
  teams,
  tournament,
  onSaveMatch,
}: MatchEditModalProps) {
  if (!isOpen || !match) return null;

  const homeTeam = teams.find(t => t.id === match.homeTeamId);
  const awayTeam = teams.find(t => t.id === match.awayTeamId);
  const isTableTennis = tournament.sport === 'tenis_mesa' || tournament.sport === 'tenis';

  // Form states
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'finished'>(match.status);
  const [homeScore, setHomeScore] = useState<number>(match.homeScore || 0);
  const [awayScore, setAwayScore] = useState<number>(match.awayScore || 0);
  const [date, setDate] = useState<string>(match.date || '');
  const [time, setTime] = useState<string>(match.time || '');
  const [venue, setVenue] = useState<string>(match.venue || '');

  // Sets state for Table Tennis
  const [set1Home, setSet1Home] = useState<number>(match.sets?.[0]?.homeScore ?? 0);
  const [set1Away, setSet1Away] = useState<number>(match.sets?.[0]?.awayScore ?? 0);

  const [set2Home, setSet2Home] = useState<number>(match.sets?.[1]?.homeScore ?? 0);
  const [set2Away, setSet2Away] = useState<number>(match.sets?.[1]?.awayScore ?? 0);

  const [set3Home, setSet3Home] = useState<number>(match.sets?.[2]?.homeScore ?? 0);
  const [set3Away, setSet3Away] = useState<number>(match.sets?.[2]?.awayScore ?? 0);

  // Auto calculate set winners and sets won if table tennis
  useEffect(() => {
    if (isTableTennis) {
      let homeSets = 0;
      let awaySets = 0;

      if (set1Home > 0 || set1Away > 0) {
        if (set1Home > set1Away) homeSets++;
        else if (set1Away > set1Home) awaySets++;
      }

      if (set2Home > 0 || set2Away > 0) {
        if (set2Home > set2Away) homeSets++;
        else if (set2Away > set2Home) awaySets++;
      }

      // 3rd set is only counted if not 2-0
      if (homeSets < 2 && awaySets < 2 && (set3Home > 0 || set3Away > 0)) {
        if (set3Home > set3Away) homeSets++;
        else if (set3Away > set3Home) awaySets++;
      }

      setHomeScore(homeSets);
      setAwayScore(awaySets);

      if (homeSets === 2 || awaySets === 2) {
        setStatus('finished');
      }
    }
  }, [set1Home, set1Away, set2Home, set2Away, set3Home, set3Away, isTableTennis]);

  const handleResetToPending = () => {
    setStatus('scheduled');
    setHomeScore(0);
    setAwayScore(0);
    setSet1Home(0);
    setSet1Away(0);
    setSet2Home(0);
    setSet2Away(0);
    setSet3Home(0);
    setSet3Away(0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let sets: { setNumber: number; homeScore: number; awayScore: number; winnerTeamId?: string }[] = [];
    let winnerId: string | undefined = undefined;

    if (isTableTennis) {
      if (set1Home > 0 || set1Away > 0) {
        sets.push({
          setNumber: 1,
          homeScore: Number(set1Home),
          awayScore: Number(set1Away),
          winnerTeamId: set1Home > set1Away ? match.homeTeamId : match.awayTeamId,
        });
      }
      if (set2Home > 0 || set2Away > 0) {
        sets.push({
          setNumber: 2,
          homeScore: Number(set2Home),
          awayScore: Number(set2Away),
          winnerTeamId: set2Home > set2Away ? match.homeTeamId : match.awayTeamId,
        });
      }
      // Only include set 3 if 1-1
      const s1Winner = set1Home > set1Away ? 'home' : set1Away > set1Home ? 'away' : null;
      const s2Winner = set2Home > set2Away ? 'home' : set2Away > set2Home ? 'away' : null;
      const isTieBreakNeeded = s1Winner && s2Winner && s1Winner !== s2Winner;

      if (isTieBreakNeeded && (set3Home > 0 || set3Away > 0)) {
        sets.push({
          setNumber: 3,
          homeScore: Number(set3Home),
          awayScore: Number(set3Away),
          winnerTeamId: set3Home > set3Away ? match.homeTeamId : match.awayTeamId,
        });
      }

      if (homeScore > awayScore) {
        winnerId = match.homeTeamId;
      } else if (awayScore > homeScore) {
        winnerId = match.awayTeamId;
      }
    } else {
      if (homeScore > awayScore) winnerId = match.homeTeamId;
      else if (awayScore > homeScore) winnerId = match.awayTeamId;
    }

    const updated: Match = {
      ...match,
      date,
      time,
      venue,
      status,
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      currentSet: sets.length > 0 ? sets.length : 1,
      sets,
      winnerTeamId: status === 'finished' ? winnerId : undefined,
    };

    onSaveMatch(updated);
    onClose();
  };

  const isSet3Blocked = (set1Home > set1Away && set2Home > set2Away) || (set1Away > set1Home && set2Away > set2Home);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              {match.roundName} {match.group ? `• Grupo ${match.group}` : ''}
            </span>
            <h3 className="text-lg font-bold text-white">Editar / Corregir Marcador</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Match Header VS */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: homeTeam?.color || '#10b981' }}></span>
              <span className="text-sm font-bold text-white truncate">{homeTeam?.name || 'Local'}</span>
            </div>

            <div className="font-scoreboard text-2xl font-black text-emerald-400 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 shrink-0">
              {homeScore} - {awayScore}
            </div>

            <div className="flex items-center gap-2 justify-end min-w-0 text-right">
              <span className="text-sm font-bold text-white truncate">{awayTeam?.name || 'Visitante'}</span>
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: awayTeam?.color || '#3b82f6' }}></span>
            </div>
          </div>

          {/* Status selector */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Estado del Partido</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'scheduled', label: 'Pendiente / Programado' },
                { id: 'in_progress', label: 'En Vivo' },
                { id: 'finished', label: 'Finalizado' },
              ].map(st => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStatus(st.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border text-center ${
                    status === st.id
                      ? 'bg-emerald-600 border-emerald-500 text-slate-950 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sets Entry for Table Tennis */}
          {isTableTennis ? (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Desglose de Sets (Al mejor de 3)
                </label>
                <span className="text-[11px] text-slate-400">Gana a 11 pts (+2 ventaja)</span>
              </div>

              {/* Set 1 */}
              <div className="grid grid-cols-5 items-center gap-2 text-xs">
                <span className="col-span-1 font-bold text-slate-300">Set 1</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={set1Home}
                  onChange={e => setSet1Home(parseInt(e.target.value) || 0)}
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-mono font-bold"
                  placeholder={homeTeam?.name || 'Local'}
                />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={set1Away}
                  onChange={e => setSet1Away(parseInt(e.target.value) || 0)}
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-mono font-bold"
                  placeholder={awayTeam?.name || 'Visitante'}
                />
              </div>

              {/* Set 2 */}
              <div className="grid grid-cols-5 items-center gap-2 text-xs">
                <span className="col-span-1 font-bold text-slate-300">Set 2</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={set2Home}
                  onChange={e => setSet2Home(parseInt(e.target.value) || 0)}
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-mono font-bold"
                />
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={set2Away}
                  onChange={e => setSet2Away(parseInt(e.target.value) || 0)}
                  className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-center text-white font-mono font-bold"
                />
              </div>

              {/* Set 3 */}
              <div className="grid grid-cols-5 items-center gap-2 text-xs">
                <div className="col-span-1 flex flex-col">
                  <span className="font-bold text-slate-300">Set 3</span>
                  {isSet3Blocked && (
                    <span className="text-[9px] text-amber-400 font-medium">Bloqueado (2-0)</span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  max="99"
                  disabled={isSet3Blocked}
                  value={isSet3Blocked ? 0 : set3Home}
                  onChange={e => setSet3Home(parseInt(e.target.value) || 0)}
                  className={`col-span-2 border rounded-xl px-3 py-2 text-center font-mono font-bold ${
                    isSet3Blocked
                      ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
                <input
                  type="number"
                  min="0"
                  max="99"
                  disabled={isSet3Blocked}
                  value={isSet3Blocked ? 0 : set3Away}
                  onChange={e => setSet3Away(parseInt(e.target.value) || 0)}
                  className={`col-span-2 border rounded-xl px-3 py-2 text-center font-mono font-bold ${
                    isSet3Blocked
                      ? 'bg-slate-950 border-slate-900 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              {isSet3Blocked && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Corte automático aplicado: Ganador 2-0 en los primeros 2 sets. El 3er set no se juega.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{homeTeam?.name}</label>
                <input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={e => setHomeScore(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">{awayTeam?.name}</label>
                <input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={e => setAwayScore(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-center text-lg"
                />
              </div>
            </div>
          )}

          {/* Details (Date, Time, Venue) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Fecha</label>
              <input
                type="text"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Hora / Turno</label>
              <input
                type="text"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Mesa / Cancha</label>
              <input
                type="text"
                value={venue}
                onChange={e => setVenue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToPending}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Marcador (0 - 0)</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold transition"
              >
                Volver / Cerrar
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition shadow flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Recalcular</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
