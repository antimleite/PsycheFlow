import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PatientStatus, Patient, AgeGroup } from '../types';
import { Edit2, X, AlertCircle, UserPlus, Search, Loader2, Baby, User as UserIcon, FilterX, Info, FileDown } from 'lucide-react';

const PatientRegistration: React.FC = () => {
  const { visiblePatients, addPatient, updatePatient, activeProfissional } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  
  // Estados de Filtro - Status Ativo por padrão
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>(PatientStatus.ACTIVE);
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('Todos');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    dateOfBirth: '',
    notes: '',
    status: PatientStatus.ACTIVE,
    registrationDate: new Date().toISOString().split('T')[0],
    ageGroup: undefined as AgeGroup | undefined,
    guardianName: ''
  });

  const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    
    if (v.length > 10) {
      return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 5) {
      return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
      return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else if (v.length > 0) {
      return v.replace(/^(\d*)/, "($1");
    }
    return v;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (editingPatient) {
        await updatePatient({ ...editingPatient, ...formData });
      } else {
        await addPatient(formData);
      }
      closeForm();
    } catch (err: any) {
      console.error("Erro ao salvar paciente:", err);
      const errorMessage = err.message || "Falha ao salvar o cadastro. Verifique a conexão ou preencha os campos obrigatórios.";
      setErrorMsg(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const closeForm = () => {
    setEditingPatient(null);
    setShowForm(false);
    setErrorMsg(null);
    setFormData({
      name: '', email: '', phone: '', cpf: '', dateOfBirth: '', notes: '', status: PatientStatus.ACTIVE,
      registrationDate: new Date().toISOString().split('T')[0],
      ageGroup: undefined,
      guardianName: ''
    });
  };

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      cpf: patient.cpf || '',
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      notes: patient.notes,
      status: patient.status,
      registrationDate: patient.registrationDate ? new Date(patient.registrationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      ageGroup: patient.ageGroup,
      guardianName: patient.guardianName || ''
    });
    setShowForm(true);
  };
  
  const filteredPatients = useMemo(() => {
    return visiblePatients.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
      const matchesAgeGroup = filterAgeGroup === 'Todos' || 
                             (filterAgeGroup === 'Não especificado' && !p.ageGroup) ||
                             p.ageGroup === filterAgeGroup;
      return matchesSearch && matchesStatus && matchesAgeGroup;
    });
  }, [visiblePatients, searchTerm, filterStatus, filterAgeGroup]);

  const activePatientsToExport = useMemo(() => {
    return visiblePatients.filter(p => p.status === PatientStatus.ACTIVE)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visiblePatients]);

  const handleExportPDF = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert('Por favor, permita pop-ups para gerar o relatório.');
      return;
    }

    const rows = activePatientsToExport.map(p => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px; font-size: 13px; font-weight: 600; color: #1e293b;">${p.name}</td>
        <td style="padding: 12px; font-size: 13px; color: #64748b;">${p.cpf || '—'}</td>
        <td style="padding: 12px; font-size: 13px; color: #64748b;">${p.phone}</td>
        <td style="padding: 12px; font-size: 13px; color: #64748b;">${new Date(p.registrationDate).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relatório de Pacientes Ativos</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
            .title h1 { margin: 0; font-size: 24px; font-weight: 700; }
            .title p { margin: 5px 0 0; font-size: 14px; color: #64748b; }
            .meta { text-align: right; }
            .meta p { margin: 0; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
            .meta span { font-size: 14px; color: #1e293b; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f8fafc; padding: 12px; font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
            .actions { margin-bottom: 30px; display: flex; justify-content: center; }
            .btn-print { background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .btn-print:hover { background: #4338ca; }
            @media print {
              .actions { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <button class="btn-print" onclick="window.print()">
              BAIXAR RELATÓRIO EM PDF
            </button>
          </div>
          <div class="header">
            <div class="title">
              <h1>Relatório de Pacientes Ativos</h1>
              <p>Profissional: <strong>${activeProfissional?.nomeCompleto || 'Não especificado'}</strong></p>
            </div>
            <div class="meta">
              <p>Gerado em</p>
              <span>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Nome do Paciente</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Data de Cadastro</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; border-top: 1px solid #f1f5f9; pt-20">
            PsycheFlow Manager - Gestão Clínica Inteligente
          </div>
        </body>
      </html>
    `;

    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== PatientStatus.ACTIVE || filterAgeGroup !== 'Todos';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus(PatientStatus.ACTIVE);
    setFilterAgeGroup('Todos');
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center print-hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Diretório de Pacientes</h2>
          <p className="text-gray-500">Gestão administrativa e clínica de pacientes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="px-5 py-2.5 rounded-xl font-bold text-indigo-600 border-2 border-indigo-100 flex items-center gap-2 hover:bg-indigo-50 transition-all active:scale-95"
          >
            <FileDown size={19} /> Exportar Ativos
          </button>
          <button 
            onClick={() => { setEditingPatient(null); setShowForm(true); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={19} /> Novo Paciente
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print-hidden">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingPatient ? 'Editar Paciente' : 'Novo Paciente'}</h3>
              <button onClick={closeForm} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"><X size={24} /></button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={18} />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <input type="text" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Perfil (Opcional)</label>
                <select 
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-bold" 
                  value={formData.ageGroup || ''} 
                  onChange={e => setFormData({...formData, ageGroup: e.target.value ? (e.target.value as AgeGroup) : undefined})}
                >
                  <option value="">Não especificado</option>
                  {Object.values(AgeGroup).map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Responsável (Opcional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} placeholder="Nome do pai/mãe/tutor" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">E-mail</label>
                <input type="email" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Telefone</label>
                <input 
                  type="tel" 
                  required 
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" 
                  value={formData.phone} 
                  onChange={handlePhoneChange} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">CPF (Opcional)</label>
                <input type="text" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Data de Nascimento</label>
                <input type="date" className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-medium" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PatientStatus})}>
                  {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Observações Clínicas</label>
                <textarea className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all h-24 resize-none text-sm font-medium" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                <button type="button" onClick={closeForm} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 disabled:bg-indigo-300"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingPatient ? 'Salvar Alterações' : 'Cadastrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden print-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Nome ou e-mail..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>

          <div className="flex items-center gap-3">
            <select 
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Todos">Status (Todos)</option>
              {Object.values(PatientStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
            >
              <option value="Todos">Perfil (Todos)</option>
              <option value="Não especificado">Não especificado</option>
              {Object.values(AgeGroup).map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-all"
            >
              <FilterX size={14} /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4 font-semibold">Paciente</th>
                <th className="px-8 py-4 font-semibold text-center">Perfil</th>
                <th className="px-8 py-4 font-semibold">Contato</th>
                <th className="px-8 py-4 font-semibold text-center">Nascimento</th>
                <th className="px-8 py-4 font-semibold">Status</th>
                <th className="px-8 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">{patient.name[0]}</div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{patient.name}</span>
                        {patient.guardianName && <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-tight">Resp: {patient.guardianName}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    {patient.ageGroup ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {patient.ageGroup === AgeGroup.CHILD ? <Baby size={10} /> : <UserIcon size={10} />}
                        {patient.ageGroup}
                      </span>
                    ) : <span className="text-gray-300 text-[10px]">—</span>}
                  </td>
                  <td className="px-8 py-5 text-sm font-semibold text-gray-700">{patient.phone}</td>
                  <td className="px-8 py-5 text-sm text-gray-500 text-center">
                    {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${
                      patient.status === PatientStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>{patient.status}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(patient)} 
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-gray-400 italic flex flex-col items-center gap-2">
                    <Info size={24} className="opacity-20" />
                    <span>Nenhum paciente encontrado com estes critérios.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistration;