
import React from 'react';
import { useApp } from '../context/AppContext';
import { Profissional, UserRole, ProfissionalStatus } from '../types';
import { ChevronRight, UserCircle, AlertCircle, RefreshCcw } from 'lucide-react';

const ProfissionalSelector: React.FC = () => {
  const { profissionais, setActiveProfissional, currentUser, logout } = useApp();

  // Filtramos os profissionais baseados no acesso do usuário E se estão ativos
  const professionalAccess = currentUser?.professionalAccess || [];
  const availableProfissionais = (currentUser?.role === UserRole.ADMIN 
    ? profissionais 
    : profissionais.filter(p => professionalAccess.includes(p.id))
  ).filter(p => p.status === ProfissionalStatus.ACTIVE);

  const handleSelect = (profissional: Profissional) => {
    setActiveProfissional(profissional);
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-2xl w-full text-center mb-12">
        <div className="inline-block p-4 bg-white rounded-2xl shadow-md mb-4">
            <UserCircle size={40} className="text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Selecione o Profissional</h1>
        <p className="text-lg text-gray-500 mt-3">Escolha o contexto no qual você deseja trabalhar.</p>
      </div>

      <div className="max-w-2xl w-full space-y-4">
        {availableProfissionais.length > 0 ? (
          availableProfissionais.map((profissional, index) => (
            <button
              key={profissional.id}
              onClick={() => handleSelect(profissional)}
              className="w-full bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-6 text-left hover:border-indigo-500 hover:ring-4 hover:ring-indigo-100 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <img 
                src={profissional.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profissional.nomeCompleto)}&background=random`} 
                alt={profissional.nomeCompleto}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{profissional.nomeCompleto}</h3>
                <p className="text-sm text-gray-500">{profissional.especialidade || 'Clínico Geral'}</p>
                <p className="text-xs text-indigo-500 font-medium mt-1">{profissional.registroProfissional}</p>
              </div>
              <ChevronRight size={24} className="text-gray-300" />
            </button>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[32px] border border-dashed border-gray-200 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Acesso Restrito ou Sem Profissionais Ativos</h3>
            <p className="text-gray-500 max-w-xs mx-auto text-sm">
              Você ainda não possui acesso a nenhum profissional ativo. 
              Certifique-se de que o administrador vinculou seu perfil aos profissionais e que os mesmos estão com status "Ativo".
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
            >
              <RefreshCcw size={14} /> Atualizar Página
            </button>
          </div>
        )}
      </div>

      <div className="mt-16 text-center">
        <button
          onClick={logout}
          className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
};

export default ProfissionalSelector;
