
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserStatus, User } from '../types';
import { UserPlus, Mail, Edit2, X, Lock, Eye, EyeOff, CheckSquare, Square, Trash2, ShieldCheck, Users as UsersIcon, GraduationCap, Microscope, Loader2, AlertCircle } from 'lucide-react';

const Users: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, profissionais } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '',
    phone: '', 
    role: UserRole.TESTE, 
    status: UserStatus.ACTIVE,
    professionalAccess: [] as string[]
  });

  const isAdmin = useMemo(() => {
    if (!currentUser?.role) return false;
    const role = String(currentUser.role).toUpperCase();
    return role === 'ADMIN' || 
           role === 'ADMINISTRADOR' || 
           role === 'ADMINISTRADOR(A)' || 
           role === UserRole.ADMIN.toUpperCase();
  }, [currentUser]);

  // Agrupamento de usuários por tipo
  const groupedUsers = useMemo(() => {
    const groups: Record<string, User[]> = {};
    users.forEach(user => {
      const role = String(user.role);
      if (!groups[role]) groups[role] = [];
      groups[role].push(user);
    });
    return groups;
  }, [users]);

  // Ordem sugerida para exibição das categorias
  const roleDisplayOrder = [
    UserRole.ADMIN,
    UserRole.PSICOLOGO,
    UserRole.SECRETARIO,
    UserRole.TESTE
  ];

  // Adiciona roles que não estão no enum mas existem no banco (ex: legados ou customizados)
  const allRoles = useMemo(() => {
    const existingRoles = Object.keys(groupedUsers);
    const sortedRoles = roleDisplayOrder.filter(r => existingRoles.includes(r as string));
    const otherRoles = existingRoles.filter(r => !roleDisplayOrder.includes(r as any));
    return [...sortedRoles, ...otherRoles];
  }, [groupedUsers]);

  const getRoleIcon = (role: string) => {
    const r = String(role).toUpperCase();
    if (r.includes('ADMIN')) return <ShieldCheck size={16} className="text-indigo-500" />;
    if (r.includes('PSICOLOGO') || r.includes('PSICÓLOGO')) return <GraduationCap size={16} className="text-emerald-500" />;
    if (r.includes('SECRET')) return <UsersIcon size={16} className="text-amber-500" />;
    return <Microscope size={16} className="text-gray-400" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || isSaving) return;
    
    setIsSaving(true);
    setErrorMsg(null);
    
    try {
      if (editingUser) await updateUser({ ...editingUser, ...formData });
      else await addUser(formData as any);
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar usuário:", err);
      setErrorMsg(err.message || "Erro ao salvar os dados do usuário.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!editingUser || isSaving) return;
    
    // Verificação de segurança: não permitir que o usuário logado exclua a si mesmo
    if (editingUser.id === currentUser?.id) {
      alert("Por motivos de segurança, você não pode excluir sua própria conta administrativa através desta interface.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir permanentemente o acesso de ${editingUser.name}?\n\nEsta ação não poderá ser desfeita.`)) {
      setIsSaving(true);
      setErrorMsg(null);
      try {
        await deleteUser(editingUser.id);
        setShowForm(false);
        resetForm();
      } catch (err: any) {
        console.error("Erro ao excluir usuário:", err);
        setErrorMsg(err.message || "Não foi possível excluir o usuário no momento.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', role: UserRole.TESTE, status: UserStatus.ACTIVE, professionalAccess: [] });
    setEditingUser(null);
    setShowPassword(false);
    setErrorMsg(null);
    setIsSaving(false);
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setFormData({ 
      name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role as UserRole, status: u.status,
      professionalAccess: u.professionalAccess || []
    });
    setShowForm(true);
  };

  const toggleAccess = (id: string) => {
    setFormData(prev => ({
      ...prev,
      professionalAccess: prev.professionalAccess.includes(id)
        ? prev.professionalAccess.filter(aid => aid !== id)
        : [...prev.professionalAccess, id]
    }));
  };

  const sortedProfs = [...profissionais].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h2>
          <p className="text-gray-500">Controle de acessos, permissões e segurança da plataforma.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-md active:scale-95 transition-all">
            <UserPlus size={19} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="space-y-12">
        {allRoles.length > 0 ? allRoles.map(role => (
          <section key={role} className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                {getRoleIcon(role)}
              </div>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                {role} <span className="ml-2 text-indigo-500 opacity-50">• {groupedUsers[role].length} membros</span>
              </h3>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-100 to-transparent ml-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedUsers[role].map(user => (
                <div key={user.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col group transition-all hover:shadow-xl hover:border-indigo-100">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" 
                          alt={user.name} 
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.status === UserStatus.ACTIVE ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">{user.name}</h4>
                        <span className="text-[9px] font-black uppercase text-indigo-500 tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">ID: {user.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleEdit(user)} className="p-2 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                        <Mail size={14} />
                      </div>
                      {user.email}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vínculos Profissionais</p>
                        <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">{user.professionalAccess?.length || 0}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 h-12 overflow-y-auto custom-scrollbar">
                        {user.professionalAccess && user.professionalAccess.length > 0 ? (
                          user.professionalAccess.map(pid => {
                            const p = profissionais.find(pr => pr.id === pid);
                            return p ? (
                              <span key={pid} className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[9px] font-bold border border-gray-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                {p.nomeCompleto}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-[9px] text-gray-300 italic">Nenhum vínculo ativo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )) : (
          <div className="py-24 text-center space-y-4 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
            <UsersIcon size={48} className="mx-auto text-gray-200" />
            <p className="text-gray-500 font-bold">Nenhum usuário cadastrado.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <div className="flex items-center gap-2">
                {editingUser && isAdmin && (
                  <button 
                    type="button"
                    onClick={handleDelete} 
                    disabled={isSaving}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-50" 
                    title="Excluir usuário"
                  >
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowForm(false)} 
                  disabled={isSaving}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={18} />
                <span className="flex-1">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Nome Completo</label>
                <input type="text" required disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Capa de Acesso</label>
                  <select disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status da Conta</label>
                  <select disabled={isSaving} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}>
                    {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vincular Profissionais</label>
                  <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Acesso restrito por nome</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar">
                  {sortedProfs.map(prof => (
                    <button key={prof.id} type="button" disabled={isSaving} onClick={() => toggleAccess(prof.id)} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${formData.professionalAccess.includes(prof.id) ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm ring-2 ring-indigo-50' : 'bg-transparent border-gray-200 text-gray-400 hover:bg-white hover:border-gray-300 disabled:opacity-50'}`}>
                      {formData.professionalAccess.includes(prof.id) ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                      <span className="text-xs font-bold">{prof.nomeCompleto}</span>
                    </button>
                  ))}
                  {sortedProfs.length === 0 && (
                    <p className="text-[10px] text-gray-400 italic text-center py-4">Nenhum profissional cadastrado para vincular.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 mt-4">
                <button type="button" onClick={() => setShowForm(false)} disabled={isSaving} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:bg-indigo-300 flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {editingUser ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
