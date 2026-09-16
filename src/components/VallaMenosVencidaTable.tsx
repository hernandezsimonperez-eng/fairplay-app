import React from 'react';
import { Shield, Trophy, Award, CheckCircle2 } from 'lucide-react';
import { VallaItem } from '../types';

interface VallaMenosVencidaTableProps {
  vallaList: VallaItem[];
}

export function VallaMenosVencidaTable({ vallaList }: VallaMenosVencidaTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
            🧤
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Valla Menos Vencida</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Guante de Oro
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Premio al arquero y equipo con menor cantidad de goles recibidos y mayor efectividad defensiva.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      {vallaList.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-sm">
          No hay datos suficientes de partidos para calcular la valla menos vencida.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3 w-12 text-center">Pos</th>
                <th className="py-3 px-3">Equipo & Categoría</th>
                <th className="py-3 px-3">Arquero Titular</th>
                <th className="py-3 px-3 text-center">PJ</th>
                <th className="py-3 px-3 text-center text-emerald-400 font-bold">Goles Recibidos</th>
                <th className="py-3 px-3 text-center">Promedio</th>
                <th className="py-3 px-3 text-center text-amber-300 font-bold">Arcos en Cero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {vallaList.map((item, idx) => {
                const isLeader = idx === 0;
                return (
                  <tr
                    key={item.teamId}
                    className={`hover:bg-slate-850/50 transition-colors ${
                      isLeader ? 'bg-amber-500/5 font-semibold' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center font-bold">
                      {idx === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-md">
                          🥇 1
                        </span>
                      ) : idx === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300 text-slate-950 font-black text-xs shadow-md">
                          🥈 2
                        </span>
                      ) : idx === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700 text-white font-black text-xs shadow-md">
                          🥉 3
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">{idx + 1}</span>
                      )}
                    </td>

                    {/* Team */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow"
                          style={{ backgroundColor: item.color || '#10b981' }}
                        >
                          {item.avatarBadge || '⚽'}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{item.teamName}</span>
                          <span className="text-[11px] text-slate-400">{item.grade}</span>
                        </div>
                      </div>
                    </td>

                    {/* Goalkeeper */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-200">
                        <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-medium">{item.goalkeeperName}</span>
                      </div>
                    </td>

                    {/* PJ */}
                    <td className="py-3.5 px-3 text-center text-slate-300 font-mono text-xs">
                      {item.matchesPlayed}
                    </td>

                    {/* Goals Against */}
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono ${
                        isLeader 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                          : 'text-slate-200 bg-slate-800'
                      }`}>
                        {item.goalsAgainst}
                      </span>
                    </td>

                    {/* Average */}
                    <td className="py-3.5 px-3 text-center font-mono text-xs text-slate-400">
                      {item.averageAgainst.toFixed(2)}
                    </td>

                    {/* Clean Sheets */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <span>🛡️</span>
                        <span>{item.cleanSheets}</span>
                      </span>
                    </td>
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
