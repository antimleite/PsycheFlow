
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PackageStatus, AttendanceStatus } from '../types';
import { Package, Search, Clock, CheckCircle, AlertTriangle, Zap, CalendarDays } from 'lucide-react';

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
    
    // Créditos ocupados (reserva de saldo): Realizadas, Faltas s/ Aviso e Agendadas
    const usedCount = seshs.filter(s => 
      [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE, AttendanceStatus.SCHEDULED].includes(s.status)
    ).length;

    // Sessões de fato finalizadas (passado)
    const finalizedCount = seshs.filter(s => 
      [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE].includes(s.status)
    ).length;

    // Sessões agendadas no futuro
    const scheduledCount = seshs.filter(s => s.status === AttendanceStatus.SCHEDULED).length;
    
    const progress = (finalizedCount / totalSessions) * 100;

    return {
      usedCount,
      finalizedCount,
      scheduledCount,
      remainingCount: Math.max(0, totalSessions - usedCount),
      progress: progress,
      isFullyFinished: finalizedCount === totalSessions && scheduledCount === 0
    };
  };

  const activePackages = useMemo(() => {
    return visiblePackages.filter(pkg => {
      // Exibir apenas Pacote de Sessões (total > 1)
      if (pkg.totalSessions <= 1) return false;
      
      const patient = visiblePatients.find(p => p.id === pkg.patientId);
      const matchesSearch = patient ? patient.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const stats = getPackageStats(pkg.id, pkg.totalSessions);
      
      // Um pacote é ATIVO se não estiver totalmente finalizado
      return !stats.isFullyFinished && matchesSearch;
    });
  }, [visiblePackages, visiblePatients, searchTerm, visibleSessions]);

  const finishedPackages = useMemo(() => {
    return visiblePackages.filter(pkg => {
      if (pkg.totalSessions <= 1) return false;

      const patient = visiblePatients.find(p => p.id === pkg.patientId);
      const matchesSearch = patient ? patient.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      const stats = getPackageStats(pkg.id, pkg.totalSessions);
      
      return stats.isFullyFinished && matchesSearch;
    }).sort((a, b) => (b.expiryDate || '').localeCompare(a.expiryDate || ''));
  }, [visiblePackages, visiblePatients, searchTerm, visibleSessions]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Créditos</h2>
          <p className="text-gray-500 text-sm">Monitore a utilização dos pacotes contratados via banco de dados.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por paciente..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all placeholder:text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* SEÇÃO DE SALDOS ATIVOS (CARDS) */}
      <section className="space-y-6">
        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
          <Clock size={14} className="animate-pulse" /> Saldos Ativos (Pacotes em Uso)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePackages.length > 0 ? (
            activePackages.map((pkg) => {
              const patient = visiblePatients.find(p => p.id === pkg.patientId);
              const stats = getPackageStats(pkg.id, pkg.totalSessions);

              return (
                <div key={pkg.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:border-indigo-200 hover:shadow-xl transition-all group animate-in slide-in-from-bottom-4 duration-500">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner bg-indigo-50 text-indigo-600">
                          {patient?.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{patient?.name || 'Paciente'}</h4>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pacote Ativo</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
                        {pkg.totalSessions} SESSÕES
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Utilização Realizada</p>
                          <p className="text-xs font-bold text-gray-700">Progresso: <span className="text-indigo-600">{stats.progress.toFixed(0)}%</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-900">{stats.finalizedCount} / {pkg.totalSessions}</p>
                        </div>
                      </div>
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out shadow-sm bg-gradient-to-r from-emerald-400 to-indigo-600" 
                          style={{ width: `${stats.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50/80 p-5 rounded-[24px] border border-gray-100 text-center group-hover:bg-white transition-colors">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Agendadas</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-2xl font-black text-gray-400">{stats.scheduledCount}</span>
                          <span className="text-xs text-gray-300 font-bold mt-1">SESSÕES</span>
                        </div>
                      </div>
                      <div className="bg-indigo-50/30 p-5 rounded-[24px] border border-indigo-100/50 text-center group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all">
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1.5 group-hover:text-indigo-100">Saldo Livre</p>
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="text-2xl font-black text-indigo-600 group-hover:text-white">{stats.remainingCount}</span>
                          <span className="text-xs text-indigo-300 font-bold mt-1 group-hover:text-indigo-200">CRÉDITOS</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-center gap-1.5 text-gray-400">
                          <CalendarDays size={14} />
                          <span className="text-[10px] font-bold text-gray-400">Vencimento: {formatDateStr(pkg.expiryDate || '')}</span>
                       </div>
                       {stats.scheduledCount > 0 && (
                         <div className="flex items-center gap-1 text-amber-500 animate-pulse">
                           <AlertTriangle size={12} />
                           <span className="text-[9px] font-black uppercase">{stats.scheduledCount} Reservada(s)</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-700">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <Package size={36} className="opacity-10" />
              </div>
              <p className="font-black text-gray-900 text-base tracking-tight uppercase">Nenhum pacote ativo</p>
              <p className="text-xs mt-2 text-gray-400 font-medium">Os pacotes ativos aparecem aqui enquanto houver sessões pendentes ou saldo.</p>
            </div>
          )}
        </div>
      </section>

      {/* SEÇÃO DE PACOTES FINALIZADOS (TABELA) */}
      <section className="space-y-6 pt-4">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
          <CheckCircle size={14} /> Histórico de Pacotes Totalmente Consumidos
        </h3>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
              <tr>
                <th className="px-10 py-6">Paciente</th>
                <th className="px-10 py-6">Configuração</th>
                <th className="px-10 py-6 text-center">Utilização</th>
                <th className="px-10 py-6 text-right">Status Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {finishedPackages.length > 0 ? finishedPackages.map((pkg) => {
                const patient = visiblePatients.find(p => p.id === pkg.patientId);
                return (
                  <tr key={pkg.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-[11px] group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {patient?.name.charAt(0) || '?'}
                        </div>
                        <span className="font-bold text-gray-900 text-sm tracking-tight">{patient?.name || 'Paciente Desconhecido'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600">
                        Pacote de {pkg.totalSessions} sessões
                      </span>
                    </td>
                    <td className="px-10 py-6 text-center text-xs font-black text-gray-400">
                      {pkg.totalSessions} de {pkg.totalSessions} sessões finalizadas
                    </td>
                    <td className="px-10 py-6 text-right">
                      <span className="bg-gray-100 text-gray-400 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200/50">
                        ENCERRADO
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-10 py-20 text-center text-gray-300 italic text-sm">
                    Nenhum pacote finalizado no banco de dados.
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
