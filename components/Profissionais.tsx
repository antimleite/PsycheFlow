
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Profissional, ProfissionalStatus, UserRole, PatientStatus } from '../types';
import { Stethoscope, UserPlus, Mail, Phone, Edit2, X, Search, Award, Trash2, Users, CalendarDays, CheckCircle2, MinusCircle, Loader2, Info, AlertCircle } from 'lucide-react';

const Profissionais: React.FC = () => {
  const { profissionais = [], addProfissional, updateProfissional, deleteProfissional, currentUser, allPatients = [] } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProf, setEditingProf] = useState<Profissional | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeCompleto: '',
    registroProfissional: '',
    telefone: '',
    email: '',
    especialidade: '',
    status: ProfissionalStatus.ACTIVE,
    avatar: ''
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSaving) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (editingProf) {
        // Garantimos que estamos passando o id correto do profissional sendo editado
        await updateProfissional({ ...editingProf, ...formData });
      } else {
        await addProfissional(formData as any);
      }
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar profissional:", err);
      setErrorMsg(err.message || "Houve um erro ao salvar os dados do profissional. Verifique os dados e tente novamente.");
    } finally {
      // O timeout aqui é apenas para garantir que a UI tenha tempo de processar antes de liberar o botão
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleDelete = async () => {
    if (!editingProf || isSaving) return;
    if (window.confirm(`Tem certeza que deseja excluir o cadastro do profissional ${editingProf.nomeCompleto}? Todos os vínculos serão perdidos.`)) {
      setIsSaving(true);
      try {
        await deleteProfissional(editingProf.id);
        setShowForm(false);
        resetForm();
      } catch (err: any) {
        console.error("Erro ao excluir:", err);
        alert(err.message || "Não foi possível excluir o profissional.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nomeCompleto: '', registroProfissional: '', telefone: '', email: '', especialidade: '', status: ProfissionalStatus.ACTIVE, avatar: '' });
    setEditingProf(null);
    setErrorMsg(null);
  };

  const handleEdit = (p: Profissional) => {
    if (!isAdmin) return;
    setEditingProf(p);
    setFormData({
      nomeCompleto: p.nomeCompleto || '',
      registroProfissional: p.registroProfissional || '',
      telefone: p.telefone || '',
      email: p.email || '',
      especialidade: p.especialidade || '',
      status: p.status || ProfissionalStatus.ACTIVE,
      avatar: p.avatar || ''
    });
    setShowForm(true);
  };

  const filteredProfs = Array.isArray(profissionais) 
    ? profissionais.filter(p => 
        (p.nomeCompleto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.registroProfissional || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getActivePatientsCount = (profId: string) => {
    if (!Array.isArray(allPatients)) return 0;
    return allPatients.filter(p => p.profissionalId === profId && p.status === PatientStatus.ACTIVE).length;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Corpo Clínico</h2>
          <p className="text-gray-500">Gestão de psicólogos e profissionais credenciados.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={19} /> Novo Profissional
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou registro..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfs.length > 0 ? (
          filteredProfs.map(prof => {
            const activeCount = getActivePatientsCount(prof.id);
            const isActive = prof.status === ProfissionalStatus.ACTIVE;
            
            return (
              <div key={prof.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col group transition-all hover:shadow-xl hover:border-indigo-100 overflow-hidden">
                <div className="p-8 pb-4">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <img 
                        src={prof.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(prof.nomeCompleto || 'User')}&background=random`} 
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-50 shadow-sm group-hover:scale-105 transition-transform" 
                        alt={prof.nomeCompleto} 
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{prof.nomeCompleto}</h4>
                        <p className="text-xs text-indigo-500 font-bold flex items-center gap-1 mt-1"><Award size={12} /> {prof.registroProfissional}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => handleEdit(prof)} 
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6 text-sm text-gray-600">
                    <p className="flex items-center gap-2 font-medium"><Stethoscope size={14} className="text-indigo-400" /> {prof.especialidade || 'Clínico Geral'}</p>
                    <p className="flex items-center gap-2 text-gray-500"><Mail size={14} className="text-gray-300" /> {prof.email}</p>
                    <p className="flex items-center gap-2 text-gray-500"><Phone size={14} className="text-gray-300" /> {prof.telefone}</p>
                  </div>
                </div>

                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 mt-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-tight px-2 py-1 rounded-lg w-fit ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                        {isActive ? <CheckCircle2 size={12} /> : <MinusCircle size={12} />}
                        {prof.status}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pacientes</span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <Users size={14} className="text-indigo-400" />
                        {activeCount} Ativos
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 flex items-center justify-between">
                      <div className="flex flex-col gap-0.5">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cadastro</span>
                         <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                           <CalendarDays size={12} className="text-gray-300" />
                           {formatDate(prof.criadoEm)}
                         </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 text-center flex flex-col items-center gap-3">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
               <Info size={32} />
             </div>
             <div>
                <p className="text-gray-500 font-bold italic">Nenhum profissional encontrado.</p>
                <p className="text-gray-400 text-sm">Verifique os filtros de busca ou cadastre um novo profissional.</p>
             </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingProf ? 'Editar Profissional' : 'Novo Profissional'}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowForm(false)} disabled={isSaving} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 disabled:opacity-50"><X size={24} /></button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={18} />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nome Completo</label>
                  <input type="text" required disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.nomeCompleto} onChange={e => setFormData({...formData, nomeCompleto: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Registro (CRP/CRM)</label>
                  <input type="text" required disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.registroProfissional} onChange={e => setFormData({...formData, registroProfissional: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Especialidade</label>
                  <input type="text" disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.especialidade} onChange={e => setFormData({...formData, especialidade: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">E-mail</label>
                  <input type="email" required disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Telefone</label>
                  <input type="tel" required disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                  <select disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold disabled:bg-gray-50 disabled:text-gray-400" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProfissionalStatus})}>
                    {Object.values(ProfissionalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">URL da Foto (Opcional)</label>
                  <input type="url" disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none disabled:bg-gray-50 disabled:text-gray-400" value={formData.avatar} onChange={e => setFormData({...formData, avatar: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                <button type="button" onClick={() => setShowForm(false)} disabled={isSaving} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center gap-2 disabled:bg-indigo-400"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingProf ? (isSaving ? 'Salvando...' : 'Salvar Alterações') : (isSaving ? 'Cadastrando...' : 'Cadastrar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profissionais;
