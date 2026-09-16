import React, { useState } from 'react';
import { Calendar, Plus, Zap, X, Check } from 'lucide-react';
import { Match, Team } from '../types';
import { generateRoundRobinFixtures } from '../utils/calculator';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  teams: Team[];
  onAddMatch: (match: Match) => void;
  onAddMultipleMatches: (matches: Match[]) => void;
}

export function ScheduleModal({
  isOpen,
  onClose,
  tournamentId,
  teams,
  onAddMatch,
  onAddMultipleMatches,
}: ScheduleModalProps) {
  const [mode, setMode] = useState<'manual' | 'autoround'>('manual');
  
  // Manual match states
  const [homeTeamId, setHomeTeamId] = useState(teams[0]?.id || '');
  const [awayTeamId, setAwayTeamId] = useState(teams[1]?.id || '');
  const [roundName, setRoundName] = useState('Jornada Regular');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [venue, setVenue] = useState('Cancha Principal');

  // Auto round states
  const [autoStartDate, setAutoStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [autoVenue, setAutoVenue] = useState('Coliseo Deportivo');

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === awayTeamId) {
      alert('Debes seleccionar dos equipos diferentes.');
      return;
    }

    const newMatch: Match = {
      id: `m-${Date.now()}`,
      tournamentId,
      roundName: roundName.trim(),
      homeTeamId,
      awayTeamId,
      date,
      time,
      venue: venue.trim(),
      status: 'scheduled',
      homeScore: 0,
      awayScore: 0,
      timerSeconds: 0,
      timerRunning: false,
      events: [],
    };

    onAddMatch(newMatch);
    onClose();
  };

  const handleGenerateRoundRobin = (e: React.FormEvent) => {
    e.preventDefault();
    if (teams.length < 2) {
      alert('Se necesitan al menos 2 equipos inscritos para generar el rol de juegos.');
      return;
    }

    const teamIds = teams.map(t => t.id);
    const generated = generateRoundRobinFixtures(tournamentId, teamIds, autoStartDate, autoVenue);
    
    const fullMatches: Match[] = generated.map((fixture, idx) => ({
      ...fixture,
      id: `m-${Date.now()}-${idx}`,
    }));

    onAddMultipleMatches(fullMatches);
    alert(`¡Se han generado exitosamente ${fullMatches.length} partidos para el torneo!`);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden border-slate-700">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Programar Partidos
              </h3>
              <p className="text-xs text-slate-400">Agrega encuentros individuales o genera el rol completo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80 flex gap-2">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`w-1/2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'manual'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Partido Manual</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('autoround')}
            className={`w-1/2 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'autoround'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-500/20'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Todos vs Todos</span>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {mode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Jornada / Fase
                </label>
                <input
                  type="text"
                  required
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Ej. Jornada 1, Semifinal A, Clásico Escolar"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Equipo Local *
                  </label>
                  <select
                    value={homeTeamId}
                    onChange={(e) => setHomeTeamId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Equipo Visitante *
                  </label>
                  <select
                    value={awayTeamId}
                    onChange={(e) => setAwayTeamId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.grade})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fecha del Encuentro
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Hora (Formato 24h)
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lugar / Cancha
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="Ej. Cancha Sintética #1"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Volver / Cerrar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Programar</span>
                </button>
              </div>

            </form>
          ) : (
            <form onSubmit={handleGenerateRoundRobin} className="space-y-4">
              
              <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <Zap className="w-4 h-4" />
                  <span>Generador Automático de Fixture</span>
                </p>
                <p className="text-slate-300 text-[11px]">
                  Crea automáticamente todas las jornadas de juego de forma equilibrada para los {teams.length} equipos registrados.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fecha de Inicio del Torneo
                </label>
                <input
                  type="date"
                  required
                  value={autoStartDate}
                  onChange={(e) => setAutoStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cancha / Escenario Deportivo
                </label>
                <input
                  type="text"
                  value={autoVenue}
                  onChange={(e) => setAutoVenue(e.target.value)}
                  placeholder="Coliseo Deportivo Central"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 px-4 bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold rounded-xl text-xs"
                >
                  Volver / Cerrar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generar Todo</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
