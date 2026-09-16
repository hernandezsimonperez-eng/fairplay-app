import { useState } from 'react';
import { DollarSign, CheckCircle2, AlertCircle, Search, Filter, Check, X, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { Team, Tournament } from '../types';
import { calculateTreasury } from '../utils/calculator';

interface TreasuryManagerProps {
  tournament: Tournament;
  teams: Team[];
  onTogglePayment: (teamId: string) => void;
  canEdit?: boolean;
}

export function TreasuryManager({
  tournament,
  teams,
  onTogglePayment,
  canEdit = true,
}: TreasuryManagerProps) {
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [search, setSearch] = useState('');

  const tournamentTeams = teams.filter(t => t.tournamentId === tournament.id);
  const treasury = calculateTreasury(tournament, teams);

  const availableGroups = tournament.groups && tournament.groups.length > 0
    ? tournament.groups
    : (Array.from(new Set(tournamentTeams.map(t => t.group).filter(Boolean))) as string[]);

  const filteredTeams = tournamentTeams.filter(team => {
    if (filterGroup !== 'all' && team.group !== filterGroup) return false;
    if (statusFilter === 'pending' && team.paymentStatus === 'paid') return false;
    if (statusFilter === 'paid' && team.paymentStatus !== 'paid') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = team.name.toLowerCase().includes(q);
      const matchGrade = (team.grade || '').toLowerCase().includes(q);
      return matchName || matchGrade;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Treasury Metrics Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Control de Tesorería & Inscripciones</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Cuota oficial: <strong>${treasury.fee.toLocaleString()} COP</strong> por {tournament.sport === 'tenis_mesa' ? 'jugador' : 'equipo/participante'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Estado de Pago de Inscripciones
            </h3>
            <p className="text-xs text-slate-400">
              Registra y gestiona los pagos de las inscripciones para {tournament.name} ({tournament.category}).
            </p>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total Collected */}
            <div className="bg-slate-950/80 border border-emerald-500/30 p-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Recaudado</span>
              <span className="font-scoreboard text-lg sm:text-xl font-bold text-emerald-400">
                ${treasury.totalCollected.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {treasury.paidCount} de {treasury.totalPlayersOrTeams} pagados
              </span>
            </div>

            {/* Total Pending */}
            <div className="bg-slate-950/80 border border-rose-500/30 p-3 rounded-2xl">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Por Cobrar</span>
              <span className="font-scoreboard text-lg sm:text-xl font-bold text-rose-400">
                ${treasury.totalPending.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {treasury.pendingCount} pendientes
              </span>
            </div>

            {/* Percentage */}
            <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Meta Cumplida</span>
              <span className="font-scoreboard text-lg sm:text-xl font-bold text-white">
                {treasury.collectionPercentage}%
              </span>
              <span className="text-[10px] text-slate-400 block">
                Total: ${treasury.totalExpected.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
            <span className="text-slate-400">Progreso de Recaudación de Fondos</span>
            <span className="text-emerald-400 font-bold">{treasury.collectionPercentage}% Recaudado</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, treasury.collectionPercentage)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filter and Management Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Status Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({tournamentTeams.length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'pending'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-950 text-rose-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Pendientes ({treasury.pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                statusFilter === 'paid'
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-emerald-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pagados ({treasury.paidCount})</span>
            </button>
          </div>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2">Grupo:</span>
            {['all', ...availableGroups].map(grp => (
              <button
                key={grp}
                onClick={() => setFilterGroup(grp)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterGroup === grp
                    ? 'bg-emerald-600 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {grp === 'all' ? 'Todos' : `Gr. ${grp}`}
              </button>
            ))}
          </div>

        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre de jugador o grado (ej. Rosas, 11A, Profe)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Players/Teams Payment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Nómina de Jugadores y Control de Inscripción</span>
          </h4>
          <span className="text-xs text-slate-400">
            Mostrando {filteredTeams.length} registros
          </span>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            No se encontraron jugadores con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTeams.map((team) => {
              const isPaid = team.paymentStatus === 'paid';

              return (
                <div
                  key={team.id}
                  className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isPaid 
                      ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60' 
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold text-white shadow shrink-0"
                      style={{ backgroundColor: team.color || '#3b82f6' }}
                    >
                      {team.avatarBadge || '🏓'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className={`font-bold text-sm truncate ${isPaid ? 'text-white' : 'text-slate-200'}`}>
                          {team.name}
                        </h5>
                        {team.group && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-slate-800 text-slate-300 border border-slate-700">
                            Gr. {team.group}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>Curso: <strong>{team.grade}</strong></span>
                        <span>•</span>
                        <span className={isPaid ? 'line-through text-slate-500' : 'text-rose-400 font-semibold'}>
                          ${(team.paymentAmount || treasury.fee).toLocaleString()} COP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Payment Action / Tachar Pago */}
                  <div className="shrink-0 flex items-center gap-2">
                    {canEdit ? (
                      <button
                        onClick={() => onTogglePayment(team.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                          isPaid
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-emerald-600/30'
                            : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                        }`}
                        title={isPaid ? 'Marcar como pendiente' : 'Tachar y marcar como pagado'}
                      >
                        {isPaid ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>PAGADO ✓</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Tachar Pago ($5.000)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        isPaid ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {isPaid ? 'Pagado ✓' : 'Falta Pago'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
