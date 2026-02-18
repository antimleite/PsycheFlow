
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Session } from '../types';
import { Calendar, Clock, Video, Users, CheckCircle, ArrowRight, X, Loader2, Save, FileText, Stethoscope, CheckCircle2 } from 'lucide-react';

const Consultations: React.FC = () => {
  const { visibleSessions, visiblePatients, updateSession } = useApp();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State
  const [duration, setDuration] = useState<number>(50);
  const [modality, setModality] = useState<'Presencial' | 'Online'>('Presencial');
  const [notes, setNotes] = useState('');
  const [medicalRecord, setMedicalRecord] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySessions = useMemo(() => {
    return visibleSessions.filter(s => 
      s.date === todayStr && 
      s.status !== AttendanceStatus.CANCELLED
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [visibleSessions, todayStr]);

  const handleCardClick = (session: Session) => {
    if (session.status === AttendanceStatus.COMPLETED) {
      setDuration(session.duration || 50);
      setModality(session.modality || 'Presencial');
      setNotes(session.notes || '');
      setMedicalRecord(session.medicalRecord || '');
    } else {
      setDuration(50);
      setModality('Presencial');
      setNotes('');
      setMedicalRecord('');
    }
    setSelectedSession(session);
    setStep(1);
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setIsSaving(true);
    try {
      await updateSession({
        ...selectedSession,
        duration,
        modality,
        notes,
        medicalRecord,
        status: AttendanceStatus.COMPLETED
      });
      setSelectedSession(null);
      setStep(1);
      setShowSuccess(true);
    } catch (error) {
      console.error("Erro ao salvar atendimento:", error);
      alert("Erro ao finalizar atendimento.");
    } finally {
      setIsSaving(false);
    }
  };

  const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150];

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}min`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  const getPatientName = (id: string) => visiblePatients.find(p => p.id === id)?.name || 'Paciente';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Registro de Atendimentos</h2>
        <p className="text-gray-500">Realize e registre as sessões do dia corrente.</p>
      </header>

      {/* Cards de Sessões de Hoje */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {todaySessions.length > 0 ? (
          todaySessions.map(session => (
            <button 
              key={session.id}
              onClick={() => handleCardClick(session)}
              className={`text-left p-6 rounded-[24px] border transition-all group relative overflow-hidden ${
                session.status === AttendanceStatus.COMPLETED 
                ? 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-200' 
                : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                     session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {getPatientName(session.patientId).charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{getPatientName(session.patientId)}</h4>
                    <p className="text-xs font-bold text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {session.time}
                    </p>
                  </div>
                </div>
                {session.status === AttendanceStatus.COMPLETED && (
                  <CheckCircle size={20} className="text-emerald-500" />
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {session.status}
                </span>
                {session.modality && (
                  <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600">
                    {session.modality}
                  </span>
                )}
              </div>
            </button>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[32px] border border-dashed border-gray-200">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-bold">Nenhum agendamento para hoje.</p>
          </div>
        )}
      </div>

      {/* Modal de Sucesso */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 text-center shadow-2xl animate-in zoom-in-95 max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sessão Registrada!</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              O atendimento foi finalizado e salvo no histórico do paciente com sucesso.
            </p>
            <button 
              onClick={() => setShowSuccess(false)}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Atendimento */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                   {getPatientName(selectedSession.patientId).charAt(0)}
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">{getPatientName(selectedSession.patientId)}</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                     Registro de Atendimento • {step === 1 ? 'Dados da Sessão' : 'Evolução Clínica'}
                   </p>
                 </div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
            </div>

            {/* Content Modal */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data</label>
                      <p className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> {new Date(selectedSession.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Horário</label>
                      <p className="font-bold text-gray-900 flex items-center gap-2"><Clock size={16} className="text-indigo-500" /> {selectedSession.time}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Duração da Sessão</label>
                      <div className="grid grid-cols-5 gap-2">
                        {DURATION_OPTIONS.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setDuration(opt)}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              duration === opt 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            {formatDuration(opt)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Modalidade</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setModality('Presencial')}
                          className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                            modality === 'Presencial'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Users size={20} />
                          <span className="font-bold">Presencial</span>
                        </button>
                        <button
                          onClick={() => setModality('Online')}
                          className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                            modality === 'Online'
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <Video size={20} />
                          <span className="font-bold">Online</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 h-full flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
                      <FileText size={16} /> Anotações da Sessão
                    </label>
                    <textarea 
                      className="w-full flex-1 p-4 bg-yellow-50/50 border border-yellow-100 rounded-2xl focus:ring-2 focus:ring-yellow-200 outline-none text-gray-700 text-sm leading-relaxed resize-none mb-4"
                      placeholder="Registre aqui observações gerais sobre a sessão..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                      <Stethoscope size={16} /> Evolução do Prontuário
                    </label>
                    <textarea 
                      className="w-full flex-1 p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-200 outline-none text-gray-700 text-sm leading-relaxed resize-none"
                      placeholder="Registre a evolução clínica técnica para o prontuário..."
                      value={medicalRecord}
                      onChange={e => setMedicalRecord(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center">
              {step === 2 ? (
                <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors">Voltar</button>
              ) : (
                <div></div>
              )}
              
              {step === 1 ? (
                <button 
                  onClick={handleNextStep}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                >
                  Continuar <ArrowRight size={18} />
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar e Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultations;
