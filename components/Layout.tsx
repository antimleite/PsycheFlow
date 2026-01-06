
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Package,
  ShieldCheck,
  Replace,
  Stethoscope
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const LogoSymbolSmall = () => (
  <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 45 C15 15, 50 20, 50 45 C50 20, 85 15, 85 45 C85 70, 65 85, 50 85 C35 85, 15 70, 15 45 Z" fill="#A4A8D3" />
    <path d="M30 85 C30 95, 40 100, 50 100 C60 100, 70 95, 70 85 L30 85 Z" fill="#A4A8D3" opacity="0.8" />
    <rect x="46" y="28" width="8" height="58" rx="4" fill="#4B4E91" />
    <path d="M22 42 C22 68, 35 76, 50 76 C65 76, 78 68, 78 42" stroke="#4B4E91" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M47 25 Q47 10 38 15" stroke="#4B4E91" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M53 25 Q53 10 62 15" stroke="#4B4E91" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { currentUser, logout, activeProfissional, setActiveProfissional } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'scheduling', label: 'Agendamentos', icon: Calendar },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'packages', label: 'Pacotes', icon: Package },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
  ];

  if (currentUser?.role === UserRole.ADMIN) {
    menuItems.push({ id: 'profissionais', label: 'Profissionais', icon: Stethoscope });
    menuItems.push({ id: 'users', label: 'Usuários', icon: ShieldCheck });
  }

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-inter">
      <aside className="sidebar w-64 bg-white border-r border-gray-100 flex flex-col hidden md:flex print-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <LogoSymbolSmall />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              PsycheFlow
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-50">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-rose-500 rounded-2xl transition-all font-bold group"
          >
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-sm uppercase tracking-widest text-[10px]">Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      <main className="main-content flex-1 flex flex-col overflow-hidden">
        <header className="top-nav h-20 bg-white border-b border-gray-50 flex items-center justify-between px-8 sticky top-0 z-10 print-hidden">
          <div className="flex items-center gap-4">
            <img 
              // Fixed: renamed nome_completo to nomeCompleto
              src={activeProfissional?.avatar || `https://ui-avatars.com/api/?name=${activeProfissional?.nomeCompleto}&background=random`}
              // Fixed: renamed nome_completo to nomeCompleto
              alt={activeProfissional?.nomeCompleto}
              className="w-10 h-10 rounded-full border-2 border-indigo-100"
            />
            <div>
              {/* Fixed: renamed nome_completo to nomeCompleto */}
              <p className="text-sm font-bold text-gray-900">{activeProfissional?.nomeCompleto}</p>
              <p className="text-xs text-indigo-500 font-medium">{activeProfissional?.especialidade}</p>
            </div>
            <button 
              onClick={() => setActiveProfissional(null)}
              className="ml-4 flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
            >
              <Replace size={14} />
              Trocar Profissional
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l border-gray-100 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{currentUser?.name}</p>
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest">{currentUser?.role}</p>
              </div>
              <div className="relative">
                <img 
                  src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`} 
                  alt="Perfil" 
                  className="w-10 h-10 rounded-2xl border-2 border-white shadow-md"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#FBFCFE]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
