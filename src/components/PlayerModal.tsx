import React, { useState } from 'react';
import { UserPlus, X, Check } from 'lucide-react';
import { Player } from '../types';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  onSave: (player: Player) => void;
  initialPlayer?: Player | null;
}

export function PlayerModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  onSave,
  initialPlayer,
}: PlayerModalProps) {
  const [name, setName] = useState(initialPlayer?.name || '');
  const [number, setNumber] = useState<number | ''>(initialPlayer?.number ?? '');
  const [positionOrRole, setPositionOrRole] = useState(initialPlayer?.positionOrRole || 'Delantero / Jugador');
  const [isCaptain, setIsCaptain] = useState(initialPlayer?.isCaptain || false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const playerToSave: Player = {
      id: initialPlayer?.id || `p-${Date.now()}`,
      teamId,
      name: name.trim(),
      number: number !== '' ? Number(number) : undefined,
      positionOrRole: positionOrRole.trim(),
      isCaptain,
      stats: initialPlayer?.stats || {
        goalsOrPoints: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0,
      },
    };

    onSave(playerToSave);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden border-slate-700">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialPlayer ? 'Editar Jugador' : 'Inscribir Jugador'}
              </h3>
              <p className="text-xs text-slate-400">Equipo: {teamName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre y Apellido del Estudiante *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Mateo Restrepo"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Número de Camiseta
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={number}
                onChange={(e) => setNumber(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-sm font-mono text-center text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Posición / Rol
              </label>
              <input
                type="text"
                value={positionOrRole}
                onChange={(e) => setPositionOrRole(e.target.value)}
                placeholder="Delantero, Portero..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white block">Capitán del Equipo</span>
              <span className="text-[11px] text-slate-400">Distintivo especial en alineaciones</span>
            </div>
            <input
              type="checkbox"
              checked={isCaptain}
              onChange={(e) => setIsCaptain(e.target.checked)}
              className="w-5 h-5 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500 cursor-pointer"
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
              <span>Guardar</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
