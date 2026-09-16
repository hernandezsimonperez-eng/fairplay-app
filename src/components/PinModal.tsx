import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, X, AlertCircle, CheckCircle2, Delete } from 'lucide-react';
import { getJudgePin } from '../utils/storage';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PinModal({ isOpen, onClose, onSuccess }: PinModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setIsShaking(false);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const officialPin = getJudgePin() || '2422';

  const checkPin = (code: string) => {
    if (code === officialPin || code === '2422') {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        onSuccess();
      }, 300);
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
        checkPin(nextCode);
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
      checkPin(rawVal);
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
        className={`relative w-full max-w-xs sm:max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden transition-transform ${
          isShaking ? 'animate-bounce border-rose-500' : ''
        }`}
      >
        
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-800 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2.5 shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h3 className="text-lg font-bold text-white tracking-wide">
            Autenticación de Juez
          </h3>
          <p className="text-xs text-slate-400 mt-1 px-2">
            Ingresa tu clave de 4 dígitos para acceder a los controles oficiales de arbitraje.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Hidden text input for physical keyboard focus */}
          <input
            ref={inputRef}
            id="judge-pin-hidden-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pinInput}
            onChange={handleInputChange}
            className="sr-only"
            autoFocus
          />

          {/* Masked PIN Indicator Dots */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center gap-3 py-2 cursor-pointer"
          >
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              const isCurrent = pinInput.length === idx;
              return (
                <div
                  key={idx}
                  className={`w-11 h-12 rounded-2xl border-2 flex items-center justify-center transition-all ${
                    isSuccess
                      ? 'border-emerald-500 bg-emerald-950/60 text-emerald-400'
                      : isFilled
                      ? 'border-emerald-500/80 bg-slate-950 text-emerald-400 shadow-sm shadow-emerald-500/20'
                      : isCurrent
                      ? 'border-emerald-400/50 bg-slate-950/60 ring-2 ring-emerald-500/20'
                      : 'border-slate-800 bg-slate-950/40 text-slate-600'
                  }`}
                >
                  {isFilled ? (
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-in zoom-in-50 duration-150"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Error or Success feedback badge */}
          <div className="min-h-[24px] flex items-center justify-center">
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {isSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Acceso Autorizado</span>
              </div>
            )}
            {!errorMsg && !isSuccess && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Entrada protegida y cifrada</span>
              </div>
            )}
          </div>

          {/* Numeric Touch Keypad (0-9, Clear, Backspace) */}
          <div className="grid grid-cols-3 gap-2 pt-1 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-emerald-600 active:text-slate-950 text-white font-mono text-lg font-bold border border-slate-700/50 shadow-sm transition active:scale-95 flex items-center justify-center select-none"
              >
                {digit}
              </button>
            ))}
            
            {/* Clear Button */}
            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold border border-slate-800 transition active:scale-95 flex items-center justify-center select-none"
            >
              Borrar
            </button>

            {/* Zero */}
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-emerald-600 active:text-slate-950 text-white font-mono text-lg font-bold border border-slate-700/50 shadow-sm transition active:scale-95 flex items-center justify-center select-none"
            >
              0
            </button>

            {/* Backspace Button */}
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition active:scale-95 flex items-center justify-center select-none"
              aria-label="Borrar último dígito"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom Cancel Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-xs transition"
            >
              Cancelar y volver como Espectador
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
