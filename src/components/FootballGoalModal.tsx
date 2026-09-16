import React, { useState } from 'react';
import { X, Trophy, Plus, Shield, User } from 'lucide-react';
import { Player, Team } from '../types';

interface FootballGoalModalProps {
  isOpen: boolean;
  team: Team;
  currentMatchMinute: string;
  isHome: boolean;
  onClose: () => void;
  onConfirmGoal: (data: {
    playerId?: string;
    playerName: string;
    playerNumber?: number;
    minute: string;
    isOwnGoal?: boolean;
    extraNote?: string;
  }) => void;
}

export function FootballGoalModal({
  isOpen,
  team,
  currentMatchMinute,
  isHome,
  onClose,
  onConfirmGoal,
}: FootballGoalModalProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('general');
  const [minute, setMinute] = useState<string>(currentMatchMinute || "01'");
  const [isOwnGoal, setIsOwnGoal] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwnGoal) {
      onConfirmGoal({
        playerName: `Autogol (${team.name})`,
        minute: minute.endsWith("'") ? minute : `${minute}'`,
        isOwnGoal: true,
        extraNote: note || 'Gol en propia puerta',
      });
      onClose();
      return;
    }

    if (selectedPlayerId === 'general') {
      onConfirmGoal({
        playerName: team.name,
        minute: minute.endsWith("'") ? minute : `${minute}'`,
        extraNote: note || `Gol anotado por ${team.name}`,
      });
      onClose();
      return;
    }

    const player = team.players.find(p => p.id === selectedPlayerId);
    if (player) {
      onConfirmGoal({
        playerId: player.id,
        playerName: player.name,
        playerNumber: player.number,
        minute: minute.endsWith("'") ? minute : `${minute}'`,
        extraNote: note,
      });
    }
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg"
              style={{ backgroundColor: team.color || '#10b981' }}
            >
              {team.avatarBadge || '⚽'}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Registrar Anotación • {isHome ? 'Equipo Local' : 'Equipo Visitante'}
              </span>
              <h3 className="text-xl font-extrabold text-white">{team.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Own Goal Toggle */}
          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="text-xs">
              <span className="font-bold text-white block">¿Es Autogol / Gol en contra?</span>
              <span className="text-slate-400 text-[11px]">Suma al marcador sin asignar a la tabla de goleadores</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOwnGoal(!isOwnGoal)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isOwnGoal 
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isOwnGoal ? 'Autogol Activado' : 'No'}
            </button>
          </div>

          {!isOwnGoal && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Seleccionar Jugador Goleador
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId('general')}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                    selectedPlayerId === 'general'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>⚽</span>
                    <span>Gol de Equipo (Sin jugador específico)</span>
                  </span>
                  {selectedPlayerId === 'general' && <span className="text-emerald-400 font-black">✓</span>}
                </button>

                {team.players.map(p => {
                  const isSelected = selectedPlayerId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlayerId(p.id)}
                      className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-bold text-center leading-6 text-[11px] shrink-0">
                          {p.number ?? '—'}
                        </span>
                        <div className="truncate">
                          <span className="text-white block truncate">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {p.positionOrRole || (p.isCaptain ? 'Capitán' : 'Jugador')}
                          </span>
                        </div>
                      </div>
                      {isSelected && <span className="text-emerald-400 font-black">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Minute & Extra Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Minuto
              </label>
              <input
                type="text"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="Ej: 07'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Nota Opcional
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ej: De tiro libre / jugada"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Volver / Cerrar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Confirmar y Sumar Gol</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
