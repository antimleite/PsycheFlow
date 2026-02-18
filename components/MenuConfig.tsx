
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShieldCheck, GraduationCap, Users, Microscope, LayoutDashboard, Calendar, CreditCard, Package, BarChart3, CircleDollarSign, Stethoscope, Shield, Check, X, ToggleLeft, ToggleRight, Info, Lock } from 'lucide-react';

const MODULES = [
  { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
  { id: 'patients', label: 'Pacientes', icon: Users },
  { id: 'scheduling', label: 'Agendamentos', icon: Calendar },
  { id: 'payments', label: 'Pagamentos', icon: CreditCard },
  { id: 'packages', label: 'Pacotes', icon: Package },
  { id: 'reports', label: 'Rel. de atendimentos', icon: BarChart3 },
  { id: 'financialReport', label: 'Rel. Financeiro', icon: CircleDollarSign },
  { id: 'profissionais', label: 'Profissionais', icon: Stethoscope },
  { id: 'users', label: 'Usuários', icon: Shield },
];

const MenuConfig: React.FC = () => {
  const { menuConfig, updateMenuPermissions, currentUser } = useApp();

  const getRoleIcon = (role: string) => {
    const r = String(role).toUpperCase();
    if (r.includes('ADMIN')) return <ShieldCheck size={20} className="text-indigo-500" />;
    if (r.includes('PSICOLOGO') || r.includes('PSICÓLOGO')) return <GraduationCap size={20} className="text-emerald-500" />;
    if (r.includes('SECRET')) return <Users size={20} className="text-amber-500" />;
    return <Microscope size={20} className="text-gray-400" />;
  };

  const togglePermission = (role: string, moduleId: string) => {
    // Admin deve ter sempre acesso a tudo. Bloqueia a edição.
    if (role === UserRole.ADMIN) return;

    const currentPermissions = menuConfig[role] || [];
    const hasPermission = currentPermissions.includes(moduleId);
    
    let newPermissions;
    if (hasPermission) {
      newPermissions = currentPermissions.filter(id => id !== moduleId);
    } else {
      newPermissions = [...currentPermissions, moduleId];
    }
    
    updateMenuPermissions(role, newPermissions);
  };

  // Garante que o usuário atual tenha acesso ao admin com verificação robusta de string
  const isAdmin = useMemo(() => {
    if (!currentUser?.role) return false;
    const role = String(currentUser.role).toUpperCase();
    return role === 'ADMIN' || 
           role === 'ADMINISTRADOR' || 
           role === 'ADMINISTRADOR(A)' || 
           role === UserRole.ADMIN.toUpperCase();
  }, [currentUser]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
        <ShieldCheck size={48} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
        <p className="text-gray-500">Apenas administradores podem gerenciar as configurações de menu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações de Menu</h2>
        <p className="text-gray-500">Defina quais módulos cada perfil de usuário pode visualizar e acessar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(UserRole).map((role) => {
           // Para administradores, visualmente mostramos tudo habilitado.
           const isRoleAdmin = role === UserRole.ADMIN;
           const permissions = isRoleAdmin ? MODULES.map(m => m.id) : (menuConfig[role] || []);
           
           return (
            <div key={role} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    {getRoleIcon(role)}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">{role}</h3>
                </div>
                <div className="px-3 py-1 bg-white rounded-lg border border-gray-100 text-xs font-bold text-gray-500">
                  {permissions.length} módulos ativos
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {MODULES.map((module) => {
                    const isEnabled = permissions.includes(module.id);
                    
                    return (
                      <div 
                        key={module.id} 
                        onClick={() => togglePermission(role, module.id)}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                          isEnabled 
                            ? 'bg-indigo-50 border-indigo-100' 
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                        } ${isRoleAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            <module.icon size={16} />
                          </div>
                          <span className={`text-sm font-bold ${isEnabled ? 'text-indigo-900' : 'text-gray-500'}`}>
                            {module.label}
                          </span>
                        </div>
                        
                        <div className={`text-2xl transition-colors ${isEnabled ? 'text-indigo-600' : 'text-gray-300'}`}>
                           {isRoleAdmin ? (
                             <Lock size={18} className="text-gray-400" />
                           ) : (
                             isEnabled ? <ToggleRight /> : <ToggleLeft />
                           )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isRoleAdmin && (
                     <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-amber-700 text-xs font-medium border border-amber-100">
                        <Info size={14} className="shrink-0" />
                        Administradores têm acesso total irrestrito.
                     </div>
                  )}
                </div>
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );
};

export default MenuConfig;
