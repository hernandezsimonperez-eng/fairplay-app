import React, { useState } from 'react';
import { X, AlertTriangle, Shield, CheckCircle2, DollarSign } from 'lucide-react';
import { Team } from '../types';

interface FootballCardModalProps {
  isOpen: boolean;
  homeTeam: Team;
  awayTeam: Team;
  currentMatchMinute: string;
  onClose: () => void;
  onConfirmCard: (data: {
    teamId: string;
    playerId: string;
    playerName: string;
    playerNumber?: number;
    cardType: 'card_yellow' | 'card_blue' | 'card_red';
    minute: string;
    reason: string;
    fineAmount: number;
  }) => void;
}

export function FootballCardModal({
  isOpen,
  homeTeam,
  awayTeam,
  currentMatchMinute,
  onClose,
  onConfirmCard,
}: FootballCardModalProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam.id);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [cardType, setCardType] = useState<'card_yellow' | 'card_blue' | 'card_red'>('card_yellow');
  const [minute, setMinute] = useState<string>(currentMatchMinute || "05'");
  const [reason, setReason] = useState<string>('');

  if (!isOpen) return null;

  const currentTeam = selectedTeamId === homeTeam.id ? homeTeam : awayTeam;

  const getFineAmount = () => {
    switch (cardType) {
      case 'card_yellow': return 2000;
      case 'card_blue': return 3000;
      case 'card_red': return 5000;
    }
  };

  const getCardDetails = () => {
    switch (cardType) {
      case 'card_yellow':
        return {
          title: 'Tarjeta Amarilla',
          color: 'from-amber-500 to-yellow-600',
          textColor: 'text-amber-400',
          fine: '$2.000 COP',
          description: 'Amonestación disciplinaria con multa asignada de $2.000 COP.',
        };
      case 'card_blue':
        return {
          title: 'Tarjeta Azul (Futsal / Microfútbol)',
          color: 'from-blue-600 to-indigo-700',
          textColor: 'text-blue-400',
          fine: '$3.000 COP',
          description: 'Sustitución obligatoria del jugador sancionado. El jugador debe abandonar el terreno de juego y es reemplazado obligatoriamente por un compañero.',
        };
      case 'card_red':
        return {
          title: 'Tarjeta Roja',
          color: 'from-rose-600 to-red-700',
          textColor: 'text-rose-400',
          fine: '$5.000 COP',
          description: 'Expulsión directa del partido y suspensión obligatoria para el siguiente encuentro ($5.000 COP de multa).',
        };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      alert('Por favor selecciona un jugador para aplicar la sanción');
      return;
    }

    const player = currentTeam.players.find(p => p.id === selectedPlayerId);
    if (!player) return;

    onConfirmCard({
      teamId: currentTeam.id,
      playerId: player.id,
      playerName: player.name,
      playerNumber: player.number,
      cardType,
      minute: minute.endsWith("'") ? minute : `${minute}'`,
      reason: reason || (cardType === 'card_yellow' ? 'Conducta antideportiva' : cardType === 'card_blue' ? 'Falta grave / sustitución' : 'Falta descalificadora'),
      fineAmount: getFineAmount(),
    });

    onClose();
  };

  const details = getCardDetails();

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold bg-gradient-to-br ${details.color} text-white shadow-lg`}>
              {cardType === 'card_yellow' ? '🟨' : cardType === 'card_blue' ? '🟦' : '🟥'}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Control Arbitral • Sanción Disciplinaria
              </span>
              <h3 className="text-xl font-extrabold text-white">{details.title}</h3>
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
          
          {/* Card Type Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Tipo de Tarjeta & Multa
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCardType('card_yellow')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  cardType === 'card_yellow'
                    ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-amber-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <span className="text-2xl">🟨</span>
                <span className="text-xs font-bold">Amarilla</span>
                <span className="text-[11px] font-black text-amber-400">$2.000 COP</span>
              </button>

              <button
                type="button"
                onClick={() => setCardType('card_blue')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  cardType === 'card_blue'
                    ? 'bg-blue-500/20 border-blue-500 ring-2 ring-blue-500/40 text-blue-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <span className="text-2xl">🟦</span>
                <span className="text-xs font-bold">Azul (Futsal)</span>
                <span className="text-[11px] font-black text-blue-400">$3.000 COP</span>
              </button>

              <button
                type="button"
                onClick={() => setCardType('card_red')}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                  cardType === 'card_red'
                    ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 text-rose-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-850'
                }`}
              >
                <span className="text-2xl">🟥</span>
                <span className="text-xs font-bold">Roja</span>
                <span className="text-[11px] font-black text-rose-400">$5.000 COP</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
              💡 {details.description}
            </p>
          </div>

          {/* Team Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Equipo Sancionado
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamId(homeTeam.id);
                  setSelectedPlayerId('');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  selectedTeamId === homeTeam.id
                    ? 'bg-slate-800 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>{homeTeam.avatarBadge || '⚽'}</span>
                <span className="truncate">{homeTeam.name} (Local)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedTeamId(awayTeam.id);
                  setSelectedPlayerId('');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  selectedTeamId === awayTeam.id
                    ? 'bg-slate-800 border-blue-500 text-blue-300 ring-1 ring-blue-500/50'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span>{awayTeam.avatarBadge || '⚽'}</span>
                <span className="truncate">{awayTeam.name} (Visitante)</span>
              </button>
            </div>
          </div>

          {/* Player Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
              Seleccionar Jugador a Amonestar
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {currentTeam.players.map(p => {
                const isSelected = selectedPlayerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 text-white font-bold ring-1 ring-amber-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-200 font-bold text-center leading-6 text-[11px] shrink-0">
                        {p.number ?? '—'}
                      </span>
                      <span className="truncate">{p.name} ({p.positionOrRole || 'Jugador'})</span>
                    </div>
                    {isSelected && <span className="text-amber-400 font-black">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minute & Reason */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Minuto
              </label>
              <input
                type="text"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="Ej: 11'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                Motivo / Observación
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Falta reiterada, reclamo..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-amber-500/30 flex items-center gap-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Aplicar Sanción</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
