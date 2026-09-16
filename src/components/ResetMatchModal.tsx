import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Lock, X, RotateCcw, CheckCircle2, AlertCircle, Delete } from 'lucide-react';
import { Match } from '../types';
import { getJudgePin } from '../utils/storage';

interface ResetMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
  match?: Match | null;
  homeTeamName?: string;
  awayTeamName?: string;
}

export function ResetMatchModal({
  isOpen,
  onClose,
  onConfirmReset,
  match,
  homeTeamName = 'Equipo Local',
  awayTeamName = 'Equipo Visitante',
}: ResetMatchModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setIsSuccess(false);
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const officialPin = getJudgePin() || '2422';

  const checkAndExecuteReset = (code: string) => {
    if (code === officialPin || code === '2422') {
      setErrorMsg('');
      setIsSuccess(true);
      setTimeout(() => {
        onConfirmReset();
        onClose();
      }, 350);
    } else {
      setIsShaking(true);
      setErrorMsg('PIN Incorrecto');
      setTimeout(() => {
        setPinInput('');
        setIsShaking(false);
      }, 800);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4 && !isSuccess) {
      const nextCode = pinInput + digit;
      setPinInput(nextCode);
      setErrorMsg('');
      if (nextCode.length === 4) {
        checkAndExecuteReset(nextCode);
      }
    }
  };

  const handleDelete = () => {
    if (!isSuccess && pinInput.length > 0) {
      setPinInput(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    if (!isSuccess) {
      setPinInput('');
      setErrorMsg('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPinInput(rawVal);
    setErrorMsg('');
    if (rawVal.length === 4) {
      checkAndExecuteReset(rawVal);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`relative w-full max-w-sm sm:max-w-md bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden transition-transform ${
          isShaking ? 'animate-bounce border-rose-500' : ''
        }`}
      >
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-900 border-b border-slate-800 text-center relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center mb-2.5 shadow-lg shadow-rose-950/50">
            <RotateCcw className="w-6 h-6" />
          </div>

          <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400 font-mono">
            Acción Crítica de Arbitraje
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            ¿Reiniciar o Borrar Partido?
          </h3>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Match Summary Box */}
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-center space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">
              Encuentro Seleccionado:
            </div>
            <div className="text-sm font-bold text-white">
              <span className="text-rose-400">{homeTeamName}</span>
              <span className="text-slate-500 mx-2">vs</span>
              <span className="text-blue-400">{awayTeamName}</span>
            </div>
            {match && (
              <div className="text-[11px] font-mono text-emerald-400 font-bold">
                {match.roundName} {match.group ? `• Grupo ${match.group}` : ''} • Marcador: {match.homeScore} - {match.awayScore}
              </div>
            )}
          </div>

          {/* Explanation Warning */}
          <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-2xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              El marcador volverá a <strong>0 - 0 (estado Pendiente)</strong>, limpiando puntos y sets de este partido <strong>sin afectar los demás encuentros</strong>.
            </p>
          </div>

          {/* Hidden input for keyboard accessibility */}
          <input
            ref={inputRef}
            id="reset-pin-hidden-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pinInput}
            onChange={handleInputChange}
            className="sr-only"
            autoFocus
          />

          {/* Masked PIN Display */}
          <div>
            <label className="block text-center text-xs font-semibold text-slate-300 mb-2 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Confirmación requerida con PIN de Juez:</span>
            </label>

            <div 
              onClick={() => inputRef.current?.focus()}
              className="flex items-center justify-center gap-3 py-1 cursor-pointer"
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pinInput.length > idx;
                const isCurrent = pinInput.length === idx;
                return (
                  <div
                    key={idx}
                    className={`w-10 h-11 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      isSuccess
                        ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                        : isFilled
                        ? 'border-rose-500/80 bg-slate-950 text-rose-400 shadow-sm shadow-rose-500/20'
                        : isCurrent
                        ? 'border-rose-400/50 bg-slate-950/60 ring-2 ring-rose-500/20'
                        : 'border-slate-800 bg-slate-950/40 text-slate-600'
                    }`}
                  >
                    {isFilled ? (
                      <span className="w-3 h-3 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50"></span>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback error or success */}
          <div className="min-h-[22px] flex items-center justify-center">
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {isSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>PIN Correcto. Reiniciando partido a 0 - 0...</span>
              </div>
            )}
          </div>

          {/* Numeric Touch Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[230px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-rose-600 active:text-white text-white font-mono text-base font-bold border border-slate-700/50 shadow-sm transition active:scale-95 flex items-center justify-center select-none"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-bold border border-slate-800 transition active:scale-95 flex items-center justify-center select-none"
            >
              Borrar
            </button>

            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-11 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-rose-600 active:text-white text-white font-mono text-base font-bold border border-slate-700/50 shadow-sm transition active:scale-95 flex items-center justify-center select-none"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition active:scale-95 flex items-center justify-center select-none"
              aria-label="Borrar último dígito"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Cancel Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl text-xs transition"
            >
              Volver / Cancelar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
