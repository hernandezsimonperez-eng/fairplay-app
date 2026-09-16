import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Sparkles, X, Shield, Star } from 'lucide-react';
import { Match, SportType, Team, Tournament } from '../types';
import { calculateScorers, calculateStandings } from '../utils/calculator';

interface TournamentCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  teams: Team[];
  matches: Match[];
}

export function TournamentCelebrationModal({
  isOpen,
  onClose,
  tournament,
  teams,
  matches,
}: TournamentCelebrationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti cannons
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const interval: NodeJS.Timeout = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const standings = calculateStandings(tournament, teams, matches);
  const scorers = calculateScorers(tournament, teams, matches);

  const champion = standings[0];
  const runnerUp = standings[1];
  const thirdPlace = standings[2];
  const topScorer = scorers[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-center overflow-hidden">
        
        {/* Glow ambient */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>¡Ceremonia de Premiación Escolar!</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
          {tournament.name}
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Cuadro de honor oficial del campeonato deportivo
        </p>

        {/* Champion Golden Trophy Centerpiece */}
        <div className="bg-gradient-to-b from-amber-950/60 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl mb-6 relative overflow-hidden">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-black text-3xl mx-auto flex items-center justify-center border-4 border-amber-300 mb-3 shadow-2xl">
            <Trophy className="w-10 h-10 text-slate-950" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block mb-1">
            CAMPEÓN DEL TORNEO
          </span>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            {champion?.teamName || 'Equipo Campeón'}
          </h3>
          <p className="text-xs text-amber-300/90 font-semibold mt-0.5">
            {champion?.grade} • {champion?.pts || 0} Puntos Totales • {champion?.pg || 0} Victorias
          </p>
        </div>

        {/* Podium Sub-Awards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          
          {/* Subcampeón */}
          {runnerUp && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-sm shrink-0 border border-slate-700">
                🥈 2°
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Subcampeón</span>
                <span className="text-xs font-bold text-white block truncate">{runnerUp.teamName}</span>
                <span className="text-[11px] text-slate-400">{runnerUp.grade}</span>
              </div>
            </div>
          )}

          {/* Goleador / Bota de Oro */}
          {topScorer && (
            <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-500/40">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Máximo Anotador</span>
                <span className="text-xs font-bold text-white block truncate">{topScorer.playerName}</span>
                <span className="text-[11px] text-slate-400">{topScorer.scoreCount} Goles/Puntos ({topScorer.grade})</span>
              </div>
            </div>
          )}

        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition text-sm"
        >
          Aceptar y Continuar
        </button>

      </div>
    </div>
  );
}
