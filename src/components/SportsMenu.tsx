import React from 'react';
import { Tournament } from '../types';

interface SportsMenuProps {
  tournaments: Tournament[];
  activeTournamentId: string;
  onSelectTournament: (id: string) => void;
}

export function SportsMenu({
  tournaments,
  activeTournamentId,
  onSelectTournament,
}: SportsMenuProps) {
  // Group tournaments by main discipline
  const pingpongTournaments = tournaments.filter(t => t.sport === 'tenis_mesa');
  const volleyballTournaments = tournaments.filter(t => t.sport === 'voleibol');
  const footballTournaments = tournaments.filter(t => t.sport === 'futbol' || t.sport === 'futsal');

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];
  const activeSport = activeTournament?.sport;

  return (
    <div className="w-full space-y-3 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>🏆</span>
          <span>Disciplinas Escolares San Felipe Neri</span>
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">
          Selecciona un torneo para ver marcadores y tablas
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* 1. 🏓 TENIS DE MESA */}
        <div
          className={`rounded-2xl p-4 border transition-all ${
            activeSport === 'tenis_mesa'
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Tenis de Mesa">🏓</span>
              <div>
                <h3 className="text-sm font-bold text-white">Tenis de Mesa</h3>
                <span className="text-[10px] text-slate-400 font-medium">Ping-Pong Individual</span>
              </div>
            </div>
            {activeSport === 'tenis_mesa' && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {pingpongTournaments.map(t => {
              const isSelected = t.id === activeTournamentId;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTournament(t.id)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all text-left truncate max-w-full ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Juvenil (8°-11° y Profes)
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 🏐 VOLEIBOL */}
        <div
          className={`rounded-2xl p-4 border transition-all ${
            activeSport === 'voleibol'
              ? 'bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border-blue-500/50 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Voleibol">🏐</span>
              <div>
                <h3 className="text-sm font-bold text-white">Voleibol</h3>
                <span className="text-[10px] text-slate-400 font-medium">30 Pts Directos • Cambio a 15 Pts</span>
              </div>
            </div>
            {activeSport === 'voleibol' && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {volleyballTournaments.map(t => {
              const isSelected = t.id === activeTournamentId;
              const isPrejuv = t.id.includes('prejuvenil');
              const label = isPrejuv ? 'Pre-Juvenil (6°-8°)' : 'Juvenil Mixto (9°-11°)';
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTournament(t.id)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-sm'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. ⚽ FÚTBOL / FÚTBOL DE SALÓN */}
        <div
          className={`rounded-2xl p-4 border transition-all ${
            activeSport === 'futbol' || activeSport === 'futsal'
              ? 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border-amber-500/50 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/30'
              : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="Fútbol">⚽</span>
              <div>
                <h3 className="text-sm font-bold text-white">Fútbol & Futsal</h3>
                <span className="text-[10px] text-slate-400 font-medium">2x12 Min • Microfútbol & Cancha</span>
              </div>
            </div>
            {(activeSport === 'futbol' || activeSport === 'futsal') && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full">
                Activo
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {footballTournaments.map(t => {
              const isSelected = t.id === activeTournamentId;
              let shortLabel = t.category;
              if (t.id === 'tourn-futbol-mini') shortLabel = 'Mini Mixto (Trans-1°)';
              else if (t.id === 'tourn-futbol-junior-masc') shortLabel = 'Junior Masc (2°-5°)';
              else if (t.id === 'tourn-futbol-junior-fem') shortLabel = 'Junior Fem (2°-5°)';
              else if (t.id === 'tourn-futsal-prejuvenil') shortLabel = 'Pre-Juvenil Masc (6°-8°)';
              else if (t.id === 'tourn-futsal-juvenil-fem') shortLabel = 'Juvenil Fem (9°-11°)';
              else if (t.id === 'tourn-futsal-juvenil-masc') shortLabel = 'Juvenil Masc (9°-11°)';

              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTournament(t.id)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border transition-all text-left truncate ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm'
                      : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={t.name}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
