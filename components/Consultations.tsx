
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, Session } from '../types';
import { 
  Calendar, Clock, Video, Users, CheckCircle, ArrowRight, X, Loader2, Save, 
  FileText, Stethoscope, CheckCircle2, Smile, Frown, Meh, Activity, 
  TrendingUp, TrendingDown, Minus, AlertTriangle, AlertOctagon, BrainCircuit, HeartPulse 
} from 'lucide-react';

// Constantes para os novos campos
const EMOTIONS = [
  { id: 'Estável', icon: Smile, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'Ansioso', icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'Triste', icon: Frown, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'Irritado', icon: AlertOctagon, color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'Apático', icon: Meh, color: 'text-gray-500', bg: 'bg-gray-50' },
  { id: 'Melhorando', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'Em crise', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
];

const CLINICAL_OBSERVATIONS = {
  appearance: ['Adequada', 'Cansado', 'Agitado', 'Descuidado'],
  speech: ['Coerente', 'Lenta', 'Acelerada', 'Tangencial'],
  affect: ['Compatível', 'Incompatível', 'Embotado', 'Exaltado'],
  insight: ['Presente', 'Parcial', 'Ausente'],
  adherence: ['Boa', 'Média', 'Baixa']
};

const INTERVENTIONS = [
  'Psicoeducação', 'Reestruturação Cognitiva', 'Técnica de Respiração', 
  'Exposição Gradual', 'Escuta Ativa', 'Questionamento Socrático', 
  'Treino de Habilidades', 'Validação Emocional'
];

const RISKS = {
  suicide: ['Não', 'Passiva', 'Ativa'],
  selfHarm: ['Não', 'Sim'],
  others: ['Não', 'Sim']
};

const EVOLUTION = [
  { id: 'Melhorando', icon: TrendingUp, color: 'emerald' },
  { id: 'Estável', icon: Minus, color: 'blue' },
  { id: 'Oscilando', icon: Activity, color: 'amber' },
  { id: 'Piorando', icon: TrendingDown, color: 'rose' },
];

const Consultations: React.FC = () => {
  const { visibleSessions, visiblePatients, updateSession } = useApp();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form State - Etapa 1
  const [duration, setDuration] = useState<number>(50);
  const [modality, setModality] = useState<'Presencial' | 'Online'>('Presencial');

  // Form State - Etapa 2 (Estruturado)
  const [assessment, setAssessment] = useState({
    emotions: [] as string[],
    scales: { mood: 5, anxiety: 5, energy: 5 },
    observations: { appearance: '', speech: '', affect: '', insight: '', adherence: '' },
    objective: { theme: '', type: 'Continuação' },
    interventions: [] as string[],
    homework: '',
    risks: { suicide: 'Não', selfHarm: 'Não', others: 'Não' },
    evolution: '',
    summary: '', // Resumo clínico curto
    notes: '' // Anotações livres
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySessions = useMemo(() => {
    return visibleSessions.filter(s => 
      s.date === todayStr && 
      s.status !== AttendanceStatus.CANCELLED
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [visibleSessions, todayStr]);

  const handleCardClick = (session: Session) => {
    // Reset form
    setDuration(session.duration || 50);
    setModality(session.modality || 'Presencial');
    
    if (session.structuredAssessment) {
      try {
        const parsed = JSON.parse(session.structuredAssessment);
        setAssessment(parsed);
      } catch (e) {
        // Fallback se não tiver JSON estruturado mas tiver notas antigas
        setAssessment({
          emotions: [],
          scales: { mood: 5, anxiety: 5, energy: 5 },
          observations: { appearance: '', speech: '', affect: '', insight: '', adherence: '' },
          objective: { theme: '', type: 'Continuação' },
          interventions: [],
          homework: '',
          risks: { suicide: 'Não', selfHarm: 'Não', others: 'Não' },
          evolution: '',
          summary: session.medicalRecord || '',
          notes: session.notes || ''
        });
      }
    } else {
      // Novo atendimento ou legado
      setAssessment({
        emotions: [],
        scales: { mood: 5, anxiety: 5, energy: 5 },
        observations: { appearance: '', speech: '', affect: '', insight: '', adherence: '' },
        objective: { theme: '', type: 'Continuação' },
        interventions: [],
        homework: '',
        risks: { suicide: 'Não', selfHarm: 'Não', others: 'Não' },
        evolution: '',
        summary: session.medicalRecord || '',
        notes: session.notes || ''
      });
    }

    setSelectedSession(session);
    setStep(1);
  };

  const toggleEmotion = (emotionId: string) => {
    setAssessment(prev => {
      if (prev.emotions.includes(emotionId)) {
        return { ...prev, emotions: prev.emotions.filter(e => e !== emotionId) };
      }
      if (prev.emotions.length >= 3) return prev;
      return { ...prev, emotions: [...prev.emotions, emotionId] };
    });
  };

  const toggleIntervention = (item: string) => {
    setAssessment(prev => {
      if (prev.interventions.includes(item)) {
        return { ...prev, interventions: prev.interventions.filter(i => i !== item) };
      }
      return { ...prev, interventions: [...prev.interventions, item] };
    });
  };

  const handleNextStep = () => {
    setStep(2);
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setIsSaving(true);
    try {
      // Gerar um resumo automático para o campo medicalRecord (compatibilidade com histórico legado)
      const autoSummary = `
[Avaliação Estruturada]
Humor: ${assessment.emotions.join(', ')} (Nível: ${assessment.scales.mood}/10)
Evolução: ${assessment.evolution || 'Não informada'}
Risco Suicida: ${assessment.risks.suicide} | Autoagressão: ${assessment.risks.selfHarm}
Tema: ${assessment.objective.theme}
Intervenções: ${assessment.interventions.join(', ')}
      `.trim() + '\n\n' + assessment.summary;

      await updateSession({
        ...selectedSession,
        duration,
        modality,
        notes: assessment.notes,
        medicalRecord: autoSummary,
        structuredAssessment: JSON.stringify(assessment),
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
          <div className={`bg-white rounded-[32px] shadow-2xl w-full flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 ${step === 2 ? 'max-w-4xl' : 'max-w-2xl'}`}>
            
            {/* Header Modal */}
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-200">
                   {getPatientName(selectedSession.patientId).charAt(0)}
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-gray-900">{getPatientName(selectedSession.patientId)}</h3>
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                     {step === 1 ? 'Confirmação de Dados' : 'Registro Clínico Estruturado'}
                   </p>
                 </div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
            </div>

            {/* Content Modal */}
            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#FAFAFA]">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Data</label>
                      <p className="font-bold text-gray-900 flex items-center gap-2"><Calendar size={16} className="text-indigo-500" /> {new Date(selectedSession.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
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
                <div className="space-y-8">
                  {/* 1. Objetivo da Sessão & Observações Clínicas (Reordenado para ser o primeiro bloco) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Objetivo da Sessão (Primeiro na grid) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={16} /> Objetivo da Sessão</h4>
                      <div className="space-y-4 flex-1">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Sessão</label>
                          <select 
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={assessment.objective.type}
                            onChange={(e) => setAssessment(prev => ({...prev, objective: {...prev.objective, type: e.target.value}}))}
                          >
                            <option>Continuação da anterior</option>
                            <option>Demanda Emergente</option>
                            <option>Reavaliação</option>
                            <option>Encerramento</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tema Principal</label>
                          <input 
                            type="text" 
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Ex: Conflito familiar, Ansiedade social..."
                            value={assessment.objective.theme}
                            onChange={(e) => setAssessment(prev => ({...prev, objective: {...prev.objective, theme: e.target.value}}))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observações Clínicas (Segundo na grid) */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><BrainCircuit size={16} /> Observações Clínicas</h4>
                      <div className="space-y-3">
                        {Object.entries(CLINICAL_OBSERVATIONS).map(([key, options]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase w-24 capitalize">{key === 'affect' ? 'Afeto' : key === 'speech' ? 'Fala' : key === 'insight' ? 'Insight' : key === 'adherence' ? 'Adesão' : 'Aparência'}</span>
                            <div className="flex flex-wrap gap-2 flex-1">
                              {options.map(opt => (
                                <button
                                  key={opt}
                                  onClick={() => setAssessment(prev => ({...prev, observations: {...prev.observations, [key]: opt}}))}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                    assessment.observations[key as keyof typeof assessment.observations] === opt
                                      ? 'bg-indigo-600 text-white border-indigo-600'
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Emoção Atual e Escalas */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <Smile size={16} /> Estado Emocional (Checklist Visual)
                        </h4>
                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                          Selecione até 3 opções
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                      {EMOTIONS.map(emotion => (
                        <button
                          key={emotion.id}
                          onClick={() => toggleEmotion(emotion.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                            assessment.emotions.includes(emotion.id)
                              ? `${emotion.bg} border-${emotion.color.split('-')[1]}-200 ring-2 ring-${emotion.color.split('-')[1]}-200`
                              : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          <emotion.icon className={`mb-2 ${assessment.emotions.includes(emotion.id) ? emotion.color : 'text-gray-400'}`} size={24} />
                          <span className={`text-[10px] font-bold uppercase ${assessment.emotions.includes(emotion.id) ? 'text-gray-800' : 'text-gray-400'}`}>{emotion.id}</span>
                        </button>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                      {['Humor Geral', 'Ansiedade', 'Energia'].map((label, idx) => {
                        const key = label === 'Humor Geral' ? 'mood' : label === 'Ansiedade' ? 'anxiety' : 'energy';
                        const val = assessment.scales[key as keyof typeof assessment.scales];
                        return (
                          <div key={label}>
                            <div className="flex justify-between mb-2">
                              <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 rounded-lg">{val}/10</span>
                            </div>
                            <input 
                              type="range" min="0" max="10" 
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              value={val}
                              onChange={(e) => setAssessment(prev => ({...prev, scales: {...prev.scales, [key]: parseInt(e.target.value)}}))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Intervenções & Evolução */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Stethoscope size={16} /> Intervenções Realizadas</h4>
                      <div className="flex flex-wrap gap-2">
                        {INTERVENTIONS.map(item => (
                          <button
                            key={item}
                            onClick={() => toggleIntervention(item)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                              assessment.interventions.includes(item)
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={16} /> Evolução Percebida</h4>
                      <div className="grid grid-cols-2 gap-3 h-full max-h-[120px]">
                        {EVOLUTION.map(ev => (
                          <button
                            key={ev.id}
                            onClick={() => setAssessment(prev => ({...prev, evolution: ev.id}))}
                            className={`flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-all border ${
                              assessment.evolution === ev.id
                                ? `bg-${ev.color}-50 text-${ev.color}-700 border-${ev.color}-200 shadow-sm`
                                : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                            }`}
                          >
                            <ev.icon size={16} /> {ev.id}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4. Avaliação de Risco (Essencial) */}
                  <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100 shadow-sm">
                    <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2"><HeartPulse size={16} /> Avaliação de Risco</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(RISKS).map(([key, options]) => (
                        <div key={key} className="bg-white p-4 rounded-2xl border border-rose-100">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">
                            {key === 'suicide' ? 'Ideação Suicida' : key === 'selfHarm' ? 'Autoagressão' : 'Risco a Terceiros'}
                          </span>
                          <div className="flex gap-2">
                            {options.map(opt => (
                              <button
                                key={opt}
                                onClick={() => setAssessment(prev => ({...prev, risks: {...prev.risks, [key]: opt}}))}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                  assessment.risks[key as keyof typeof assessment.risks] === opt
                                    ? (opt === 'Não' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-500 text-white border-rose-600')
                                    : 'bg-gray-50 text-gray-500 border-gray-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 5. Textos Livres */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">
                        <FileText size={16} /> Encaminhamentos / Tarefas
                      </label>
                      <textarea 
                        className="w-full flex-1 min-h-[100px] p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl focus:ring-2 focus:ring-indigo-200 outline-none text-gray-700 text-sm leading-relaxed resize-none"
                        placeholder="Tarefas de casa, encaminhamentos médicos..."
                        value={assessment.homework}
                        onChange={e => setAssessment(prev => ({...prev, homework: e.target.value}))}
                      />
                    </div>
                    
                    <div className="flex flex-col">
                      <label className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                        <Stethoscope size={16} /> Resumo Clínico Curto (Prontuário)
                      </label>
                      <textarea 
                        className="w-full flex-1 min-h-[100px] p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl focus:ring-2 focus:ring-emerald-200 outline-none text-gray-700 text-sm leading-relaxed resize-none"
                        placeholder="Síntese técnica da sessão..."
                        value={assessment.summary}
                        onChange={e => setAssessment(prev => ({...prev, summary: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      <FileText size={16} /> Anotações Livres (Privado)
                    </label>
                    <textarea 
                      className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-200 outline-none text-gray-700 text-sm leading-relaxed resize-none"
                      placeholder="Detalhes adicionais, insights pessoais do terapeuta..."
                      value={assessment.notes}
                      onChange={e => setAssessment(prev => ({...prev, notes: e.target.value}))}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-gray-50 bg-gray-50/50 flex justify-between items-center shrink-0">
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
