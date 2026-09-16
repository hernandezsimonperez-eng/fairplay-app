import React, { useState } from 'react';
import { X, DollarSign, Shield, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Match, Team } from '../types';
import { getJudgePin } from '../utils/storage';

interface FootballArbitrationModalProps {
  isOpen: boolean;
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onClose: () => void;
  onUpdateArbitration: (data: {
    arbitrationPaidHome: boolean;
    arbitrationPaidAway: boolean;
    arbitrationFee: number;
    events: Match['events'];
  }) => void;
}

export function FootballArbitrationModal({
  isOpen,
  match,
  homeTeam,
  awayTeam,
  onClose,
  onUpdateArbitration,
}: FootballArbitrationModalProps) {
  const [pinEntered, setPinEntered] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  const [paidHome, setPaidHome] = useState<boolean>(match.arbitrationPaidHome ?? false);
  const [paidAway, setPaidAway] = useState<boolean>(match.arbitrationPaidAway ?? false);
  const feeAmount = match.arbitrationFee ?? 5000;
  
  // Card events in this match
  const [events, setEvents] = useState<Match['events']>(match.events || []);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = getJudgePin();
    if (pinEntered === correctPin || pinEntered === '2422') {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const toggleEventFinePaid = (eventId: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        return {
          ...ev,
          finePaid: !ev.finePaid,
        };
      }
      return ev;
    }));
  };

  const handleSave = () => {
    onUpdateArbitration({
      arbitrationPaidHome: paidHome,
      arbitrationPaidAway: paidAway,
      arbitrationFee: feeAmount,
      events,
    });
    onClose();
  };

  const cardEvents = events.filter(e => e.type === 'card_yellow' || e.type === 'card_blue' || e.type === 'card_red');

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Planilla de Tesorería Arbitral
              </span>
              <h3 className="text-xl font-extrabold text-white">Arbitraje & Multas</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isUnlocked ? (
          <form onSubmit={handleVerifyPin} className="space-y-4 py-3">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Acceso Protegido por PIN</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Ingresa el PIN de autorización del Juez/Árbitro para gestionar los cobros de arbitraje y multas disciplinarias.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="password"
                maxLength={6}
                value={pinEntered}
                onChange={(e) => {
                  setPinEntered(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN del Juez (ej: 2422)"
                className="w-full text-center tracking-widest text-lg font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-400 text-center flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>PIN Incorrecto. Intenta nuevamente.</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750"
              >
                Volver / Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-500/20"
              >
                Desbloquear Control
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            
            {/* Arbitration Fee Checklist */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Cobro de Arbitraje ($5.000 COP por equipo)
                </label>
                <span className="text-xs font-bold text-emerald-400">
                  Total Partido: $10.000 COP
                </span>
              </div>

              {/* Home Team Arbitration */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{homeTeam.avatarBadge || '⚽'}</span>
                  <div>
                    <h5 className="text-xs font-bold text-white">{homeTeam.name} (Local)</h5>
                    <span className="text-[11px] text-slate-400 font-medium">Cuota: $5.000 COP</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaidHome(!paidHome)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                    paidHome 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{paidHome ? 'Pagado ✓' : 'Pendiente'}</span>
                </button>
              </div>

              {/* Away Team Arbitration */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{awayTeam.avatarBadge || '⚽'}</span>
                  <div>
                    <h5 className="text-xs font-bold text-white">{awayTeam.name} (Visitante)</h5>
                    <span className="text-[11px] text-slate-400 font-medium">Cuota: $5.000 COP</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPaidAway(!paidAway)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                    paidAway 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{paidAway ? 'Pagado ✓' : 'Pendiente'}</span>
                </button>
              </div>
            </div>

            {/* Sanctions & Fines Section */}
            <div className="space-y-2.5 border-t border-slate-800 pt-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Multas de Tarjetas en este Partido ({cardEvents.length})
              </label>

              {cardEvents.length === 0 ? (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                  Sin tarjetas registradas en este encuentro (Juego Limpio).
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {cardEvents.map(ev => {
                    const isYellow = ev.type === 'card_yellow';
                    const isBlue = ev.type === 'card_blue';
                    const isPaid = ev.finePaid ?? false;
                    const fineValue = ev.fineAmount || (isYellow ? 2000 : isBlue ? 3000 : 5000);

                    return (
                      <div
                        key={ev.id}
                        className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{isYellow ? '🟨' : isBlue ? '🟦' : '🟥'}</span>
                          <div className="truncate">
                            <span className="text-white font-bold block truncate">
                              {ev.playerName} (N° {ev.playerNumber ?? '—'})
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Min {ev.minuteOrTime} • Multa ${fineValue.toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleEventFinePaid(ev.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                          }`}
                        >
                          {isPaid ? 'Multa Pagada ✓' : 'Cobrar Multa'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-600/30"
              >
                Guardar Estados de Cobro
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
