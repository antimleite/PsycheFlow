import React, { useEffect, useState } from 'react';
import { Patient } from '../types';
import { useApp } from '../context/AppContext';
import { getClinicalInsight } from '../services/gemini';
import { X, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';

interface GeminiInsightModalProps {
  patient: Patient;
  onClose: () => void;
}

const GeminiInsightModal: React.FC<GeminiInsightModalProps> = ({ patient, onClose }) => {
  // Fix: The context provides 'visibleSessions', not 'sessions'. Aliasing for minimal code change.
  const { visibleSessions: sessions } = useApp();
  const [insight, setInsight] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      setLoading(true);
      const res = await getClinicalInsight(patient, sessions);
      setInsight(res);
      setLoading(false);
    };
    fetchInsight();
  }, [patient, sessions]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Assistente Clínico IA</h3>
              <p className="text-xs text-indigo-100">Análise profunda para {patient.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
              <p className="text-gray-500 font-medium animate-pulse text-sm">Sintetizando dados clínicos...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Sparkles size={60} />
                </div>
                <div className="prose prose-indigo max-w-none">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                    {insight}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contexto do Psicólogo</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Status Atual</span>
                    <span className="font-bold text-indigo-600">{patient.status}</span>
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 text-[10px] uppercase font-bold">Sessões Registradas</span>
                    <span className="font-bold text-indigo-600">{sessions.filter(s => s.patientId === patient.id).length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && (
            <button 
              onClick={onClose}
              className="w-full mt-8 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all shadow-md"
            >
              Compreendi e Fechar
            </button>
          )}
        </div>
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center italic leading-tight">
            Insights gerados por IA são apenas orientativos. Use seu julgamento profissional clínico para diagnósticos e decisões.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeminiInsightModal;