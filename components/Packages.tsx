
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PackageStatus, AttendanceStatus } from '../types';
import { Package, Search, Calendar, CheckCircle2, AlertTriangle, Clock, History, User, CheckCircle, Zap } from 'lucide-react';

const Packages: React.FC = () => {
  const { visiblePackages, visiblePatients, visibleSessions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getPackageStats = (packageId: string, totalSessions: number) => {
    const seshs = visibleSessions.filter(s => s.packageId === packageId);
    // Consideramos como "consumido" ou "reservado" sessões Realizadas, Faltas sem Aviso e Agendadas (futuras)
    const usedCount = seshs.filter(s => 
      [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE, AttendanceStatus.SCHEDULED].includes(s.status)
    ).length;
    
    const consumed = seshs.filter(s => [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE].includes(s.status));
    const scheduled = seshs.filter(s => s.status === AttendanceStatus.SCHEDULED);

    return {
      usedCount,
      remainingCount: Math.max(0, totalSessions - usedCount),
      progress: (usedCount / totalSessions) * 100,
      dates: consumed.map(s => formatDateStr(s.date)).join(', '),
      scheduledCount: scheduled.length
    };
  };

  const activePackages = useMemo(() => {
    return visiblePackages.filter(pkg => {
      const patient = visiblePatients.find(p => p.id === pkg.patientId);
      const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const stats = getPackageStats(pkg.id, pkg.totalSessions);
      return stats.remainingCount > 0 && matchesSearch;
    });
  }, [visiblePackages, visiblePatients, searchTerm, visibleSessions]);

  const finishedPackages = useMemo(() => {
    return visiblePackages.filter(pkg => {
      const patient = visiblePatients.find(p => p.id === pkg.patientId);
      const matchesSearch = patient?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const stats = getPackageStats(pkg.id, pkg.totalSessions);
      return stats.remainingCount <= 0 && matchesSearch;
    }).sort((a, b) => (b.expiryDate || '').localeCompare(a.expiryDate || ''));
  }, [visiblePackages, visiblePatients, searchTerm, visibleSessions]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Créditos</h2>
          <p className="text-gray-500">Saldo unificado de atendimentos avulsos e pacotes vigentes.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por paciente..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Clock size={14} /> Saldos Ativos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePackages.length > 0 ? (
            activePackages.map((pkg) => {
              const patient = visiblePatients.find(p => p.id === pkg.patientId);
              const stats = getPackageStats(pkg.id, pkg.totalSessions);
              const isSingle = pkg.totalSessions === 1;

              return (
                <div key={pkg.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 hover:shadow-lg transition-all group">
                  <div className="p-8 space-y-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${isSingle ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight">{patient?.name}</h4>
                          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-wider">{isSingle ? 'Crédito Avulso' : 'Pacote 04 Sessões'}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isSingle ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {isSingle ? 'Unitário' : 'Vigente'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span className="text-gray-400">Uso (Incl. Agendadas)</span>
                        <span className="text-indigo-600">{stats.usedCount} / {pkg.totalSessions}</span>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ease-out ${isSingle ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${stats.progress}%` }}></div>
                      </div>
                      {stats.scheduledCount > 0 && (
                        <p className="text-[9px] font-bold text-amber-500 flex items-center gap-1"><AlertTriangle size={10}/> {stats.scheduledCount} agendada(s) reservando saldo</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Saldo Livre</p>
                        <p className={`text-2xl font-black ${isSingle ? 'text-amber-600' : 'text-indigo-600'}`}>{stats.remainingCount}</p>
                      </div>
                      <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 text-center flex flex-col justify-center">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Vencimento</p>
                        <p className="text-xs font-bold text-gray-700">{formatDateStr(pkg.expiryDate || '')}</p>
                      </div>
                    </div>

                    {stats.dates && (
                      <div className="pt-4 border-t border-gray-50">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Histórico de Uso:</p>
                        <p className="text-[10px] text-gray-500 italic truncate">{stats.dates}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-sm">Nenhum crédito ativo no momento.</p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <CheckCircle size={14} /> Créditos Consumidos
        </h3>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Paciente</th>
                <th className="px-8 py-5">Tipo</th>
                <th className="px-8 py-5 text-center">Uso Total</th>
                <th className="px-8 py-5 text-right">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {finishedPackages.length > 0 ? finishedPackages.map((pkg) => {
                const patient = visiblePatients.find(p => p.id === pkg.patientId);
                const isSingle = pkg.totalSessions === 1;
                return (
                  <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                          {patient?.name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{patient?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-gray-500">{isSingle ? 'Avulso' : 'Pacote'}</span>
                    </td>
                    <td className="px-8 py-5 text-center text-xs font-bold text-gray-400">
                      {pkg.totalSessions} / {pkg.totalSessions}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        CONSUMIDO
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-gray-400 italic text-sm">
                    Nenhum crédito finalizado encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Packages;
