
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserStatus, User } from '../types';
import { UserPlus, Mail, Edit2, X, Lock, Eye, EyeOff, CheckSquare, Square, Trash2 } from 'lucide-react';

const Users: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, profissionais } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    password: '',
    phone: '', 
    role: UserRole.STANDARD, 
    status: UserStatus.ACTIVE,
    professionalAccess: [] as string[]
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (editingUser) updateUser({ ...editingUser, ...formData });
    else addUser(formData as any);
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!editingUser) return;
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o acesso de ${editingUser.name}?`)) {
      await deleteUser(editingUser.id);
      setShowForm(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', phone: '', role: UserRole.STANDARD, status: UserStatus.ACTIVE, professionalAccess: [] });
    setEditingUser(null);
    setShowPassword(false);
  };

  const handleEdit = (u: User) => {
    setEditingUser(u);
    setFormData({ 
      name: u.name, email: u.email, password: '', phone: u.phone || '', role: u.role, status: u.status,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Equipe</h2>
          <p className="text-gray-500">Controle de acessos e segurança da conta.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-md">
            <UserPlus size={19} /> Novo Usuário
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex flex-col group transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} className="w-16 h-16 rounded-2xl object-cover" alt={user.name} />
                <div>
                  <h4 className="font-bold text-gray-900 leading-tight">{user.name}</h4>
                  <span className="text-[10px] font-black uppercase text-indigo-500">{user.role}</span>
                </div>
              </div>
              {isAdmin && (
                <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-indigo-600 rounded-xl transition-all"><Edit2 size={18} /></button>
              )}
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={14} /> {user.email}</div>
              <div className="mt-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Vínculos ({user.professionalAccess?.length || 0})</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.professionalAccess?.map(pid => {
                    const p = profissionais.find(pr => pr.id === pid);
                    return p ? <span key={pid} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-100">{p.nomeCompleto}</span> : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-[32px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <div className="flex items-center gap-2">
                {editingUser && isAdmin && (
                  <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors" title="Excluir usuário">
                    <Trash2 size={20} />
                  </button>
                )}
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nome Completo</label>
                <input type="text" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Capa de Acesso</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}>
                    {Object.values(UserStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Vincular Profissionais (Acesso restrito por nome)</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  {sortedProfs.map(prof => (
                    <button key={prof.id} type="button" onClick={() => toggleAccess(prof.id)} className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${formData.professionalAccess.includes(prof.id) ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm' : 'bg-transparent border-gray-200 text-gray-500'}`}>
                      {formData.professionalAccess.includes(prof.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      <span className="text-xs font-bold">{prof.nomeCompleto}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                  {editingUser ? 'Salvar' : 'Criar Conta'}
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
