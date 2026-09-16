import React, { useState } from 'react';
import { Shield, X, Check } from 'lucide-react';
import { Team } from '../types';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  onSave: (team: Team) => void;
  initialTeam?: Team | null;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#f59e0b', // Amber/Yellow
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

const PRESET_EMOJIS = ['⚽', '🔥', '⚡', '🦅', '🦁', '⭐', '🏐', '🏓', '🚀', '🏆', '💎', '🐺'];

export function TeamModal({
  isOpen,
  onClose,
  tournamentId,
  onSave,
  initialTeam,
}: TeamModalProps) {
  const [name, setName] = useState(initialTeam?.name || '');
  const [grade, setGrade] = useState(initialTeam?.grade || '');
  const [captainName, setCaptainName] = useState(initialTeam?.captainName || '');
  const [group, setGroup] = useState<'A' | 'B' | 'C' | 'D'>(initialTeam?.group || 'A');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>(initialTeam?.paymentStatus || 'pending');
  const [paymentAmount, setPaymentAmount] = useState<number>(initialTeam?.paymentAmount || 5000);
  const [color, setColor] = useState(initialTeam?.color || PRESET_COLORS[0]);
  const [avatarBadge, setAvatarBadge] = useState(initialTeam?.avatarBadge || PRESET_EMOJIS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const teamToSave: Team = {
      id: initialTeam?.id || `team-${Date.now()}`,
      tournamentId,
      name: name.trim(),
      grade: grade.trim() || 'Curso General',
      captainName: captainName.trim() || 'Por definir',
      group,
      paymentStatus,
      paymentAmount: Number(paymentAmount) || 5000,
      paymentDate: paymentStatus === 'paid' ? (initialTeam?.paymentDate || new Date().toLocaleDateString()) : undefined,
      color,
      avatarBadge,
      players: initialTeam?.players || [],
    };

    onSave(teamToSave);
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
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              {avatarBadge}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialTeam ? 'Editar Equipo' : 'Inscribir Nuevo Equipo'}
              </h3>
              <p className="text-xs text-slate-400">Registra el nombre, curso/sección y capitán</p>
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
              Nombre del Equipo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Los Halcones Dorados, 10°A Furia"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Curso / Sección *
              </label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Ej. 10° A, 11° B"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Capitán del Equipo
              </label>
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                placeholder="Nombre del estudiante"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Group and Inscription Payment */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grupo Asignado
              </label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="A">Grupo A</option>
                <option value="B">Grupo B</option>
                <option value="C">Grupo C</option>
                <option value="D">Grupo D</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Estado de Pago ($5.000)
              </label>
              <button
                type="button"
                onClick={() => setPaymentStatus(prev => prev === 'paid' ? 'pending' : 'paid')}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                }`}
              >
                {paymentStatus === 'paid' ? 'PAGADO ✓' : 'FALTA PAGO'}
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition transform ${
                    color === c ? 'scale-110 ring-2 ring-white shadow-lg' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Badge Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Insignia o Escudo
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatarBadge(emoji)}
                  className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition border ${
                    avatarBadge === emoji 
                      ? 'bg-slate-800 border-emerald-400 scale-105' 
                      : 'bg-slate-950 border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              <span>Guardar Equipo</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
