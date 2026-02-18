
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Patient } from '../types';
import { 
  History, Search, ChevronRight, Calendar, User, FileText, ArrowLeft, Clock, 
  Activity, Smile, BrainCircuit, Stethoscope, HeartPulse, TrendingUp 
} from 'lucide-react';

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
                 {patientHistory.map((session, index) => {
                   const structured = session.structuredAssessment ? JSON.parse(session.structuredAssessment) : null;

                   return (
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

                           {structured ? (
                              <div className="space-y-6 mt-6 border-t border-gray-100 pt-6">
                                {/* Bloco 1: Objetivo e Emoções */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Activity size={14} className="text-indigo-500" /> Objetivo
                                            </h5>
                                            <p className="text-sm font-bold text-gray-900">{structured.objective?.theme || 'Não informado'}</p>
                                            <p className="text-xs text-gray-500">{structured.objective?.type}</p>
                                        </div>
                                        
                                        <div>
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <Smile size={14} className="text-indigo-500" /> Estado Emocional
                                            </h5>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {structured.emotions?.map((e: string) => (
                                                    <span key={e} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100">{e}</span>
                                                ))}
                                            </div>
                                            <div className="space-y-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {[
                                                    { label: 'Humor', val: structured.scales?.mood },
                                                    { label: 'Ansiedade', val: structured.scales?.anxiety },
                                                    { label: 'Energia', val: structured.scales?.energy }
                                                ].map(s => (
                                                    <div key={s.label} className="flex items-center gap-2 text-[10px]">
                                                        <span className="font-bold text-gray-500 w-14">{s.label}</span>
                                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(s.val / 10) * 100}%` }}></div>
                                                        </div>
                                                        <span className="font-bold text-gray-900 w-4 text-right">{s.val}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                         <div>
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <BrainCircuit size={14} className="text-indigo-500" /> Observações Clínicas
                                            </h5>
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.entries(structured.observations || {}).map(([k, v]) => (
                                                    v && (
                                                        <div key={k} className="bg-white border border-gray-100 px-3 py-2 rounded-xl">
                                                            <span className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">
                                                                {k === 'affect' ? 'Afeto' : k === 'speech' ? 'Fala' : k === 'insight' ? 'Insight' : k === 'adherence' ? 'Adesão' : 'Aparência'}
                                                            </span>
                                                            <span className="text-xs font-bold text-gray-700">{String(v)}</span>
                                                        </div>
                                                    )
                                                ))}
                                            </div>
                                         </div>
                                    </div>
                                </div>

                                {/* Bloco 2: Intervenções, Riscos e Evolução */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Stethoscope size={14} className="text-purple-500" /> Intervenções
                                        </h5>
                                        <div className="flex flex-wrap gap-2">
                                            {structured.interventions?.map((i: string) => (
                                                <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-100">{i}</span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                         <div className="flex-1">
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <TrendingUp size={14} className="text-emerald-500" /> Evolução
                                            </h5>
                                            {structured.evolution && (
                                                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-100 inline-block">
                                                    {structured.evolution}
                                                </span>
                                            )}
                                         </div>
                                         <div className="flex-1">
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <HeartPulse size={14} className="text-rose-500" /> Riscos
                                            </h5>
                                            <div className="flex flex-col gap-1">
                                                {structured.risks?.suicide !== 'Não' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">Suicídio: {structured.risks?.suicide}</span>}
                                                {structured.risks?.selfHarm !== 'Não' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">Autoagressão: {structured.risks?.selfHarm}</span>}
                                                {structured.risks?.others !== 'Não' && <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">Terceiros: {structured.risks?.others}</span>}
                                                {structured.risks?.suicide === 'Não' && structured.risks?.selfHarm === 'Não' && structured.risks?.others === 'Não' && (
                                                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 w-fit">Nenhum identificado</span>
                                                )}
                                            </div>
                                         </div>
                                    </div>
                                </div>

                                {/* Bloco 3: Textos */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                                    <div>
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FileText size={14} /> Anotações da Sessão
                                        </h5>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-yellow-50/30 p-4 rounded-2xl border border-yellow-100/50">
                                            {structured.notes || <span className="text-gray-400 italic">Sem anotações.</span>}
                                        </p>
                                    </div>
                                    <div>
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <History size={14} /> Resumo / Prontuário
                                        </h5>
                                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/50">
                                            {structured.summary || <span className="text-gray-400 italic">Sem resumo.</span>}
                                        </p>
                                    </div>
                                    {structured.homework && (
                                         <div className="col-span-full">
                                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <FileText size={14} className="text-blue-500" /> Encaminhamentos / Tarefas
                                            </h5>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-blue-50/30 p-4 rounded-2xl border border-blue-100/50">
                                                {structured.homework}
                                            </p>
                                         </div>
                                    )}
                                </div>
                              </div>
                           ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                 {/* Fallback para sessões legadas sem estrutura */}
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
                           )}
                        </div>
                     </div>
                   );
                 })}
                 
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
