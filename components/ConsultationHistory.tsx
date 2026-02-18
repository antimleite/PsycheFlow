
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Patient } from '../types';
import { History, Search, ChevronRight, Calendar, User, FileText, ArrowLeft, Clock } from 'lucide-react';

const ConsultationHistory: React.FC = () => {
  const { visiblePatients, visibleSessions } = useApp();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Lista de pacientes com atendimentos realizados
  const patientsWithHistory = useMemo(() => {
    return visiblePatients.filter(p => {
      const hasSessions = visibleSessions.some(s => s.patientId === p.id && s.status === AttendanceStatus.COMPLETED);
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return hasSessions && matchesSearch;
    });
  }, [visiblePatients, visibleSessions, searchTerm]);

  // Histórico do paciente selecionado
  const patientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return visibleSessions
      .filter(s => s.patientId === selectedPatient.id && s.status === AttendanceStatus.COMPLETED)
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return b.time.localeCompare(a.time);
      });
  }, [selectedPatient, visibleSessions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Histórico de Atendimentos</h2>
        <p className="text-gray-500">Consulte a linha do tempo de sessões realizadas por paciente.</p>
      </header>

      {!selectedPatient ? (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50/50">
             <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
               <User size={20} className="text-indigo-600" />
               Selecione um Paciente
             </h3>
             <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar paciente..." 
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {patientsWithHistory.length > 0 ? (
               patientsWithHistory.map(patient => (
                 <button 
                   key={patient.id}
                   onClick={() => setSelectedPatient(patient)}
                   className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all group text-left"
                 >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                       <h4 className="font-bold text-gray-900 group-hover:text-indigo-700">{patient.name}</h4>
                       <p className="text-xs text-gray-400 font-medium">Ver histórico completo</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-400" />
                 </button>
               ))
             ) : (
               <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center gap-2">
                 <History size={48} className="opacity-20" />
                 <p>Nenhum histórico de atendimento encontrado.</p>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
           <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/50">
             <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-white rounded-full transition-colors text-gray-500 hover:text-indigo-600 shadow-sm border border-transparent hover:border-gray-200">
               <ArrowLeft size={20} />
             </button>
             <div>
               <h3 className="font-bold text-xl text-gray-900">{selectedPatient.name}</h3>
               <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Linha do Tempo de Atendimentos</p>
             </div>
           </div>

           <div className="p-8 relative">
              {/* Linha vertical da timeline */}
              <div className="absolute left-12 top-8 bottom-8 w-0.5 bg-gray-100"></div>

              <div className="space-y-8">
                 {patientHistory.map((session, index) => (
                   <div key={session.id} className="relative pl-12 group">
                      {/* Bolinha da timeline */}
                      <div className="absolute left-[13px] top-6 w-3 h-3 rounded-full bg-white border-2 border-indigo-500 z-10 group-hover:scale-125 transition-transform"></div>
                      
                      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-lg transition-all group-hover:border-indigo-100">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                            <div className="flex items-center gap-3">
                               <div className="px-3 py-1 bg-indigo-50 rounded-lg text-indigo-700 font-bold text-xs flex items-center gap-2">
                                  <Calendar size={14} />
                                  {new Date(session.date).toLocaleDateString('pt-BR')}
                               </div>
                               <div className="px-3 py-1 bg-gray-50 rounded-lg text-gray-600 font-bold text-xs flex items-center gap-2">
                                  <Clock size={14} />
                                  {session.time} ({session.duration || 50} min)
                               </div>
                            </div>
                            {session.modality && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50/50 px-2 py-1 rounded-md">
                                {session.modality}
                              </span>
                            )}
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-yellow-50/30 p-4 rounded-2xl border border-yellow-100/50">
                               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <FileText size={12} /> Anotações da Sessão
                               </h5>
                               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                 {session.notes || <span className="text-gray-400 italic">Sem anotações.</span>}
                               </p>
                            </div>
                            
                            <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                               <h5 className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <History size={12} /> Evolução Prontuário
                               </h5>
                               <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                 {session.medicalRecord || <span className="text-gray-400 italic">Sem registro de evolução.</span>}
                               </p>
                            </div>
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {patientHistory.length === 0 && (
                   <div className="text-center py-12 text-gray-400 italic">
                     Nenhum atendimento realizado para este paciente.
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ConsultationHistory;
