import React, { useState } from 'react';
import { Trophy, X, Check, Activity } from 'lucide-react';
import { SportType, Tournament } from '../types';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tournament: Tournament) => void;
  initialTournament?: Tournament | null;
}

export function TournamentModal({
  isOpen,
  onClose,
  onSave,
  initialTournament,
}: TournamentModalProps) {
  const [name, setName] = useState(initialTournament?.name || '');
  const [sport, setSport] = useState<SportType>(initialTournament?.sport || 'futsal');
  const [category, setCategory] = useState(initialTournament?.category || 'Intercursos Secundaria');
  const [description, setDescription] = useState(initialTournament?.description || '');
  const [venue, setVenue] = useState(initialTournament?.venue || 'Coliseo Deportivo Central');
  const [matchDuration, setMatchDuration] = useState(initialTournament?.rules.matchDurationMinutes || 30);
  const [pointsForWin, setPointsForWin] = useState(initialTournament?.rules.pointsForWin || 3);
  const [pointsForDraw, setPointsForDraw] = useState(initialTournament?.rules.pointsForDraw || 1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTournament: Tournament = {
      id: initialTournament?.id || `tourn-${Date.now()}`,
      name: name.trim(),
      sport,
      category: category.trim(),
      description: description.trim(),
      venue: venue.trim(),
      status: initialTournament?.status || 'active',
      createdAt: initialTournament?.createdAt || new Date().toISOString().split('T')[0],
      rules: {
        pointsForWin: Number(pointsForWin),
        pointsForDraw: Number(pointsForDraw),
        pointsForLoss: 0,
        matchDurationMinutes: Number(matchDuration),
        maxSets: (sport === 'voleibol' || sport === 'tenis_mesa') ? 3 : undefined,
        pointsPerSet: sport === 'voleibol' ? 25 : sport === 'tenis_mesa' ? 11 : undefined,
      },
    };

    onSave(newTournament);
    onClose();
  };

  const handleSportChange = (newSport: SportType) => {
    setSport(newSport);
    if (newSport === 'voleibol') {
      setMatchDuration(45);
      setPointsForWin(3);
      setPointsForDraw(0);
    } else if (newSport === 'tenis_mesa' || newSport === 'tenis') {
      setMatchDuration(20);
      setPointsForWin(3);
      setPointsForDraw(0);
    } else {
      setMatchDuration(30);
      setPointsForWin(3);
      setPointsForDraw(1);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden border-slate-700">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialTournament ? 'Editar Torneo' : 'Crear Nuevo Torneo Escolar'}
              </h3>
              <p className="text-xs text-slate-400">Configura la disciplina, categoría y reglamento de puntos</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Sport Selector Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Disciplina Deportiva
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'futsal', label: 'Fútbol Sala', icon: '⚽' },
                { id: 'futbol', label: 'Fútbol Campo', icon: '⚽' },
                { id: 'voleibol', label: 'Voleibol', icon: '🏐' },
                { id: 'tenis_mesa', label: 'Tenis de Mesa', icon: '🏓' },
                { id: 'tenis', label: 'Tenis', icon: '🎾' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleSportChange(s.id as SportType)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                    sport === s.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tournament Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nombre del Torneo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Torneo Intercursos 10° - Fútbol de Salón"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-slate-600"
            />
          </div>

          {/* Category & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Categoría / Grados
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej. 10° Grado, Secundaria, Femenino"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Lugar / Cancha Habitual
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Ej. Coliseo Deportivo Principal"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Rules & Timing */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Reglas y Puntuación</span>
            </h4>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Duración (min)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={matchDuration}
                  onChange={(e) => setMatchDuration(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-white font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pts x Ganar</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={pointsForWin}
                  onChange={(e) => setPointsForWin(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-white font-mono text-center"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pts x Empate</label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={pointsForDraw}
                  onChange={(e) => setPointsForDraw(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-2 text-white font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descripción o Instrucciones Escolares (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Información adicional del torneo..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            ></textarea>
          </div>

          {/* Footer Buttons */}
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
              <span>{initialTournament ? 'Guardar Cambios' : 'Crear Torneo'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
