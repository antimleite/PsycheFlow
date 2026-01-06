
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, PaymentStatus, PatientStatus, Patient } from '../types';
import { 
  CheckCircle2, 
  Users, 
  ChevronRight, 
  X, 
  FileText, 
  History, 
  Download, 
  User,
  Activity,
  CalendarCheck,
  ClipboardList,
  Search
} from 'lucide-react';

const Reports: React.FC = () => {
  const { visiblePatients, visibleSessions } = useApp();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper para formatar data string ISO (YYYY-MM-DD) para exibição PT-BR sem fuso horário
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const activePatients = useMemo(() => {
    return visiblePatients
      .filter(p => p.status === PatientStatus.ACTIVE)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [visiblePatients, searchTerm]);

  const patientHistory = useMemo(() => {
    if (!selectedPatient) return [];
    return visibleSessions
      .filter(s => s.patientId === selectedPatient.id)
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return b.time.localeCompare(a.time);
      });
  }, [selectedPatient, visibleSessions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Auditoria e Prontuários</h2>
        <p className="text-gray-500">Listagem de pacientes ativos e evolução histórica de atendimentos.</p>
      </header>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-indigo-600" />
            Pacientes Ativos
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Pesquisar paciente..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Nome</th>
                <th className="px-8 py-5">E-mail / Telefone</th>
                <th className="px-8 py-5 text-center">Cadastro</th>
                <th className="px-8 py-5 text-right">Evolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activePatients.map(patient => (
                <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedPatient(patient)}>
                  <td className="px-8 py-5 font-bold text-gray-900 text-sm">{patient.name}</td>
                  <td className="px-8 py-5 text-xs text-gray-500">{patient.email} <br/> {patient.phone}</td>
                  <td className="px-8 py-5 text-center text-xs text-gray-500">{formatDateStr(patient.registrationDate)}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-gray-300 group-hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                  </td>
                </tr>
              ))}
              {activePatients.length === 0 && (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 italic">Nenhum paciente ativo encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex justify-end animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl h-screen shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
            <header className="p-8 border-b border-gray-50 sticky top-0 bg-white/95 backdrop-blur-md z-10 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl">{selectedPatient.name.charAt(0)}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedPatient.name}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Histórico de Atendimentos</p>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
            </header>
            
            <div className="p-8 space-y-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Total de Sessões</span>
                  <div className="flex items-center gap-3 text-indigo-600">
                    <CalendarCheck size={20} />
                    <span className="text-2xl font-black">{patientHistory.length}</span>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Engajamento</span>
                  <div className="flex items-center gap-3 text-emerald-600">
                    <Activity size={20} />
                    <span className="text-2xl font-black">{patientHistory.length > 0 ? ((patientHistory.filter(s => s.status === AttendanceStatus.COMPLETED).length / patientHistory.length) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              </div>

              <section className="space-y-6">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <History size={16} className="text-indigo-600" />
                  Evolução Clínica
                </h4>
                <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                  {patientHistory.map((session) => (
                    <div key={session.id} className="relative pl-10">
                      <div className="absolute left-[13px] top-4 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-gray-900">{formatDateStr(session.date)} às {session.time}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{session.status}</span>
                        </div>
                        {session.notes ? (
                          <p className="text-xs text-gray-600 leading-relaxed font-medium">{session.notes}</p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Nenhuma nota clínica registrada.</p>
                        )}
                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-tight">{session.serviceType}</p>
                      </div>
                    </div>
                  ))}
                  {patientHistory.length === 0 && (
                    <div className="py-20 text-center text-gray-400 italic">Sem registros de atendimentos.</div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
