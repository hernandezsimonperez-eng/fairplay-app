import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle2, DollarSign, Search, Filter } from 'lucide-react';
import { SanctionItem } from '../types';

interface SanctionsTableProps {
  sanctions: SanctionItem[];
  isJudge?: boolean;
  onOpenJudgeArbitration?: () => void;
  onTogglePlayerFinesPaid?: (playerId: string, markAsPaid: boolean) => void;
}

export function SanctionsTable({ 
  sanctions, 
  isJudge = false, 
  onOpenJudgeArbitration,
  onTogglePlayerFinesPaid 
}: SanctionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'suspendido' | 'multa_pendiente' | 'habilitado'>('all');

  const filtered = sanctions.filter(item => {
    const matchesSearch = 
      item.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'suspendido' && item.status !== 'suspendido') return false;
    if (statusFilter === 'multa_pendiente' && item.status !== 'multa_pendiente') return false;
    if (statusFilter === 'habilitado' && item.status !== 'habilitado') return false;

    return true;
  });

  const totalFines = sanctions.reduce((acc, s) => acc + s.totalFines, 0);
  const pendingFines = sanctions.reduce((acc, s) => acc + (s.pendingFines ?? (s.finesPaid ? 0 : s.totalFines)), 0);
  const paidFines = sanctions.reduce((acc, s) => acc + (s.paidFines ?? (s.finesPaid ? s.totalFines : 0)), 0);
  const totalYellows = sanctions.reduce((acc, s) => acc + s.yellowCards, 0);
  const totalBlues = sanctions.reduce((acc, s) => acc + s.blueCards, 0);
  const totalReds = sanctions.reduce((acc, s) => acc + s.redCards, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-rose-500/20">
            ⚖️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Comité Disciplinario & Sanciones</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                FairPlay
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Control oficial de tarjetas, suspensiones y liquidación de multas arbitrales.
            </p>
          </div>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarjetas</span>
            <div className="flex items-center gap-1.5 text-xs font-black">
              <span className="text-amber-400">🟨 {totalYellows}</span>
              <span className="text-blue-400">🟦 {totalBlues}</span>
              <span className="text-rose-400">🟥 {totalReds}</span>
            </div>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Multas Totales</span>
            <span className="text-xs font-black text-amber-400">
              ${totalFines.toLocaleString('es-CO')}
            </span>
          </div>

          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Por Cobrar</span>
            <span className={`text-xs font-black ${pendingFines > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ${pendingFines.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      </div>

      {/* Rules reference bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-lg">🟨</span>
          <div>
            <span className="font-bold text-amber-400">Tarjeta Amarilla ($2.000 COP)</span>
            <p className="text-[10px] text-slate-400 leading-tight">2 amarillas en torneo = 1 fecha suspensión</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🟦</span>
          <div>
            <span className="font-bold text-blue-400">Tarjeta Azul ($3.000 COP)</span>
            <p className="text-[10px] text-slate-400 leading-tight">Sustitución obligatoria (2 min fuera de cancha)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">🟥</span>
          <div>
            <span className="font-bold text-rose-400">Tarjeta Roja ($5.000 COP)</span>
            <p className="text-[10px] text-slate-400 leading-tight">Expulsión directa + 1 fecha obligatoria</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar jugador o equipo..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({sanctions.length})
          </button>
          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'suspended'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Suspendidos
          </button>
          <button
            onClick={() => setStatusFilter('pending_fine')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'pending_fine'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            Multa Pendiente
          </button>
          <button
            onClick={() => setStatusFilter('eligible')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === 'eligible'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Habilitados
          </button>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No hay registros disciplinarios que coincidan con la búsqueda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Jugador</th>
                <th className="py-3 px-3">Equipo & Grado</th>
                <th className="py-3 px-3 text-center">🟨 Amarillas</th>
                <th className="py-3 px-3 text-center">🟦 Azules</th>
                <th className="py-3 px-3 text-center">🟥 Rojas</th>
                <th className="py-3 px-3 text-right">Multa Acumulada</th>
                <th className="py-3 px-3 text-right">Pendiente</th>
                <th className="py-3 px-3 text-center">Estado Oficial</th>
                {isJudge && onTogglePlayerFinesPaid && (
                  <th className="py-3 px-3 text-center">Pago & Cancelación</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filtered.map((s) => {
                const isSuspended = s.status === 'suspendido';
                const hasPendingFine = s.status === 'multa_pendiente';
                const pendingFineAmt = s.pendingFines ?? (s.finesPaid ? 0 : s.totalFines);

                return (
                  <tr key={s.playerId} className="hover:bg-slate-850/50 transition-colors">
                    
                    {/* Player */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-center leading-6 text-[11px]">
                          {s.playerNumber ?? '—'}
                        </span>
                        <span className="font-bold text-white block">{s.playerName}</span>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="py-3.5 px-3 text-xs text-slate-300">
                      <span className="font-semibold text-slate-200 block">{s.teamName}</span>
                      <span className="text-[11px] text-slate-500">{s.grade}</span>
                    </td>

                    {/* Yellow */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-amber-400">
                      {s.yellowCards > 0 ? `${s.yellowCards}` : '—'}
                    </td>

                    {/* Blue */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-blue-400">
                      {s.blueCards > 0 ? `${s.blueCards}` : '—'}
                    </td>

                    {/* Red */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs font-bold text-rose-400">
                      {s.redCards > 0 ? `${s.redCards}` : '—'}
                    </td>

                    {/* Total Fines */}
                    <td className="py-3.5 px-3 text-right font-mono text-xs text-slate-300">
                      ${s.totalFines.toLocaleString('es-CO')} COP
                    </td>

                    {/* Pending Fines */}
                    <td className="py-3.5 px-3 text-right font-mono text-xs font-bold">
                      {pendingFineAmt > 0 ? (
                        <span className="text-rose-400">
                          ${pendingFineAmt.toLocaleString('es-CO')} COP
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">Al día ✓</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3 text-center">
                      {isSuspended ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-rose-500/20 text-rose-400 border border-rose-500/40 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          <span>SUSPENDIDO</span>
                        </span>
                      ) : hasPendingFine ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                          <span>MULTA PENDIENTE</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>HABILITADO</span>
                        </span>
                      )}
                    </td>

                    {/* Judge Actions */}
                    {isJudge && onTogglePlayerFinesPaid && (
                      <td className="py-3.5 px-3 text-center">
                        {pendingFineAmt > 0 ? (
                          <button
                            type="button"
                            onClick={() => onTogglePlayerFinesPaid(s.playerId, true)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1 mx-auto"
                            title="Registrar pago y cancelar multa de este jugador"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Marcar Pagada</span>
                          </button>
                        ) : s.totalFines > 0 ? (
                          <button
                            type="button"
                            onClick={() => onTogglePlayerFinesPaid(s.playerId, false)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-semibold transition mx-auto block"
                            title="Revertir multa a estado pendiente"
                          >
                            <span>Revertir</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">— Al día —</span>
                        )}
                      </td>
                    )}

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
