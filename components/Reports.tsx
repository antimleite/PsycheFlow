
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, PatientStatus, Patient } from '../types';
import { 
  Users, 
  ChevronRight, 
  X, 
  History, 
  Activity,
  CalendarCheck,
  Search,
  FileDown
} from 'lucide-react';

const Reports: React.FC = () => {
  const { visiblePatients, visibleSessions, activeProfissional } = useApp();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      .filter(s => s.patientId === selectedPatient.id && s.status !== AttendanceStatus.CANCELLED)
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date);
        if (dateComp !== 0) return dateComp;
        return b.time.localeCompare(a.time);
      });
  }, [selectedPatient, visibleSessions]);

  const handleExportIndividualPDF = () => {
    if (!selectedPatient) return;

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Por favor, permita pop-ups para gerar o relatório.');
      return;
    }

    const engagement = patientHistory.length > 0 
      ? ((patientHistory.filter(s => s.status === AttendanceStatus.COMPLETED).length / patientHistory.length) * 100).toFixed(0) 
      : 0;

    const historyRows = patientHistory.map(s => `
      <div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #4f46e5; background: #f8fafc; border-radius: 0 12px 12px 0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="font-weight: 700; font-size: 13px; color: #1e293b;">${formatDateStr(s.date)} às ${s.time}</span>
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #4f46e5;">${s.status}</span>
        </div>
        <div style="font-size: 12px; color: #475569; line-height: 1.5;">${s.notes || 'Sem observações registradas.'}</div>
        <div style="font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; margin-top: 8px;">${s.serviceType || 'Atendimento'}</div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório Clínico - ${selectedPatient.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .title h1 { margin: 0; font-size: 24px; font-weight: 800; color: #1e293b; }
            .title p { margin: 5px 0 0; font-size: 14px; color: #64748b; }
            .meta { text-align: right; }
            .meta p { margin: 0; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
            .meta span { font-size: 13px; color: #1e293b; font-weight: 600; }
            .stats-grid { display: flex; gap: 20px; margin-bottom: 30px; }
            .stat-card { flex: 1; padding: 20px; background: #f1f5f9; border-radius: 16px; text-align: center; }
            .stat-label { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 5px; }
            .stat-value { font-size: 24px; font-weight: 800; color: #4f46e5; }
            .patient-info { margin-bottom: 40px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; }
            .info-item { margin-bottom: 10px; font-size: 13px; }
            .info-label { font-weight: 700; color: #64748b; width: 120px; display: inline-block; }
            .actions { margin-bottom: 30px; text-align: center; }
            .btn-print { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; }
            .signature-block { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 30px; text-align: center; }
            .signature-name { margin: 0; font-size: 15px; font-weight: 800; color: #1e293b; }
            .signature-specialty { margin: 2px 0; font-size: 12px; font-weight: 600; color: #64748b; }
            .signature-reg { margin: 0; font-size: 12px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; }
            @media print { .actions { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="actions"><button class="btn-print" onclick="window.print()">IMPRIMIR RELATÓRIO PDF</button></div>
          <div class="header">
            <div class="title">
              <h1>Relatório de Evolução Clínica</h1>
              <p>Profissional: <strong>${activeProfissional?.nomeCompleto || 'Não informado'}</strong></p>
            </div>
            <div class="meta"><p>Gerado em</p><span>${new Date().toLocaleDateString('pt-BR')}</span></div>
          </div>
          <div class="patient-info">
            <div class="info-item"><span class="info-label">Paciente:</span> ${selectedPatient.name}</div>
            <div class="info-item"><span class="info-label">Contato:</span> ${selectedPatient.phone}</div>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-label">Total de Sessões</div><div class="stat-value">${patientHistory.length}</div></div>
            <div class="stat-card"><div class="stat-label">Engajamento</div><div class="stat-value">${engagement}%</div></div>
          </div>
          <div class="history">${historyRows}</div>
          
          <div class="signature-block">
            <p class="signature-name">${activeProfissional?.nomeCompleto || '—'}</p>
            <p class="signature-specialty">${activeProfissional?.especialidade || 'Psicólogo(a)'}</p>
            <p class="signature-reg">${activeProfissional?.registroProfissional || '—'}</p>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Documento gerado eletronicamente via PsycheFlow Manager
          </div>
        </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

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
                <th className="px-8 py-5">Contato Telefônico</th>
                <th className="px-8 py-5 text-center">Cadastro</th>
                <th className="px-8 py-5 text-right">Evolução</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activePatients.map(patient => (
                <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group" onClick={() => setSelectedPatient(patient)}>
                  <td className="px-8 py-5 font-bold text-gray-900 text-sm">{patient.name}</td>
                  <td className="px-8 py-5 text-sm font-semibold text-gray-700">{patient.phone}</td>
                  <td className="px-8 py-5 text-center text-xs text-gray-500">{formatDateStr(patient.registrationDate)}</td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-gray-300 group-hover:text-indigo-600 transition-colors"><ChevronRight size={20} /></button>
                  </td>
                </tr>
              ))}
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
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Histórico Clínico</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportIndividualPDF}
                  className="px-4 py-2 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <FileDown size={18} /> Exportar Relatório
                </button>
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><X size={24} /></button>
              </div>
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
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2"><History size={16} className="text-indigo-600" /> Evolução Clínica</h4>
                <div className="space-y-6 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-100">
                  {patientHistory.map((session) => (
                    <div key={session.id} className="relative pl-10">
                      <div className="absolute left-[13px] top-4 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white"></div>
                      <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-gray-900">{formatDateStr(session.date)} às {session.time}</p>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{session.status}</span>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{session.notes || 'Nenhuma nota registrada.'}</p>
                      </div>
                    </div>
                  ))}
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
