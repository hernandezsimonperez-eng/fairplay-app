import React, { useState, ChangeEvent } from 'react';
import { 
  Trophy, 
  ShieldCheck, 
  Eye, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  X, 
  Radio
} from 'lucide-react';
import { Tournament, ViewMode } from '../types';
import { getSportBadge } from '../utils/calculator';
import { exportDataAsJson, importDataFromJson, resetAllData } from '../utils/storage';

interface NavbarProps {
  tournaments: Tournament[];
  activeTournamentId: string;
  onSelectTournament: (id: string) => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  isJudgeAuth: boolean;
  onRequestJudgeAccess: () => void;
  onExitJudgeMode: () => void;
  onLockJudgeSession?: () => void;
  onDataChange: () => void;
  hasLiveMatch?: boolean;
}

export function Navbar({
  tournaments,
  activeTournamentId,
  onSelectTournament,
  viewMode,
  isJudgeAuth,
  onRequestJudgeAccess,
  onExitJudgeMode,
  onLockJudgeSession,
  onDataChange,
  hasLiveMatch = false,
}: NavbarProps) {
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const activeTournament = tournaments.find(t => t.id === activeTournamentId) || tournaments[0];
  const sportBadge = activeTournament ? getSportBadge(activeTournament.sport) : null;

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleExport = () => {
    const jsonStr = exportDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fairplay_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Copia de seguridad descargada exitosamente');
    setShowSettingsMenu(false);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataFromJson(content);
      if (res.success) {
        onDataChange();
        showNotification('Datos importados correctamente');
      } else {
        alert(res.error || 'Error al importar archivo');
      }
      setShowSettingsMenu(false);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas restaurar todos los torneos, equipos y marcadores a los datos de ejemplo iniciales?')) {
      resetAllData();
      onDataChange();
      showNotification('Datos restablecidos a los valores predeterminados');
      setShowSettingsMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Trophy className="w-5 h-5 text-white" />
              {hasLiveMatch && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-scoreboard text-2xl sm:text-3xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
                  FAIRPLAY
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-widest bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded">
                  PWA Escolar
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 -mt-1 font-medium">
                Gestión de Torneos & Marcador Digital
              </p>
            </div>
          </div>

          {/* Tournament Selector Dropdown */}
          <div className="flex-1 max-w-xs sm:max-w-sm mx-1 sm:mx-4">
            <div className="relative">
              <select
                id="tournament-selector"
                value={activeTournamentId}
                onChange={(e) => onSelectTournament(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold bg-slate-900/90 text-slate-100 border border-slate-700 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer truncate"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                    {t.name} ({t.category})
                  </option>
                ))}
              </select>
              {sportBadge && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs">
                  {sportBadge.icon}
                </div>
              )}
            </div>
          </div>

          {/* Role Switcher (Espectador / Juez) & Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* View Mode Toggle Pill */}
            <div className="bg-slate-900/90 p-1 rounded-xl border border-slate-800 flex items-center shadow-inner gap-1">
              <button
                id="btn-mode-spectator"
                type="button"
                onClick={() => {
                  if (viewMode === 'judge') onExitJudgeMode();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'spectator'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Espectador</span>
              </button>

              <button
                id="btn-mode-judge"
                type="button"
                onClick={() => {
                  if (viewMode === 'spectator') onRequestJudgeAccess();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'judge'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/50'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">Modo Juez</span>
                <span className="sm:hidden">Juez</span>
              </button>

              {isJudgeAuth && onLockJudgeSession && (
                <button
                  id="btn-lock-judge-session"
                  type="button"
                  onClick={onLockJudgeSession}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Bloquear sesión de Juez (volver a pedir PIN)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick settings/backup button */}
            <div className="relative">
              <button
                id="btn-nav-menu"
                type="button"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
                title="Opciones y Respaldo de Datos"
              >
                <Radio className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Dropdown Menu */}
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-lg border border-slate-800 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    Gestión de Datos Local
                  </div>
                  
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Respaldo JSON</span>
                  </button>

                  <label className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 cursor-pointer">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Importar Respaldo JSON</span>
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={handleReset}
                    className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-950/40 flex items-center gap-2.5"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Restaurar Datos Demo</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div className="bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <Check className="w-3.5 h-3.5" />
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="ml-2 hover:opacity-75">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </header>
  );
}
