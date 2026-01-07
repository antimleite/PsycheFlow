
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientRegistration from './components/PatientRegistration';
import Scheduling from './components/Scheduling';
import Payments from './components/Payments';
import Reports from './components/Reports';
import Packages from './components/Packages';
import Users from './components/Users';
import Profissionais from './components/Profissionais';
import ProfissionalSelector from './components/ProfissionalSelector';
import { AppProvider, useApp } from './context/AppContext';
import { 
  ShieldCheck, 
  Mail, 
  ArrowRight, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  UserCircle,
  LogIn,
  UserPlus,
  CheckCircle2,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';

const LogoSymbol = () => (
  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    <circle cx="50" cy="50" r="50" fill="white"/>
    <path d="M15 45 C15 15, 50 20, 50 45 C50 20, 85 15, 85 45 C85 70, 65 85, 50 85 C35 85, 15 70, 15 45 Z" fill="#A4A8D3" />
    <path d="M30 85 C30 95, 40 100, 50 100 C60 100, 70 95, 70 85 L30 85 Z" fill="#A4A8D3" opacity="0.8" />
    <rect x="46" y="28" width="8" height="58" rx="4" fill="#4B4E91" />
    <path d="M22 42 C22 68, 35 76, 50 76 C65 76, 78 68, 78 42" stroke="#4B4E91" strokeWidth="8" strokeLinecap="round" fill="none" />
    <path d="M47 25 Q47 10 38 15" stroke="#4B4E91" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path d="M53 25 Q53 10 62 15" stroke="#4B4E91" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, login, register, activeProfissional, loading } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);
    
    try {
      let result;
      if (mode === 'register') {
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        if (formData.name.length < 3) {
          throw new Error('Por favor, insira seu nome completo.');
        }
        result = await register(formData.name, formData.email, formData.password);
        if (result.success) {
          setRegistrationSuccess(true);
        }
      } else {
        result = await login(formData.email, formData.password);
      }

      if (result && !result.success) {
        setAuthError(result.message || 'Erro na autenticação. Verifique os dados e tente novamente.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro inesperado na conexão com o servidor.');
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600 space-y-4">
        <LogoSymbol />
        <Loader2 size={24} className="animate-spin" />
        <p className="font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Sincronizando Fluxo...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#f0f2f5] flex items-center justify-center p-4 font-inter relative overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="max-w-6xl w-full grid md:grid-cols-2 bg-white rounded-[48px] shadow-2xl shadow-indigo-100 overflow-hidden relative z-10 border border-white">
          <div className="hidden md:flex flex-col justify-between p-16 bg-indigo-600 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 opacity-95"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-16">
                <LogoSymbol />
                <span className="text-3xl font-black tracking-tighter">PsycheFlow</span>
              </div>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                  <span className="text-indigo-200"><Sparkles size={14} /></span>
                  Plataforma de Gestão Psicológica
                </div>
                <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
                  Mais fluidez para sua clínica.
                </h1>
                <p className="text-indigo-100 text-lg font-medium max-w-sm leading-relaxed opacity-90">
                  Mais presença para seus atendimentos e controle total sobre seu consultório em um só lugar.
                </p>
              </div>
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[10px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-medium text-indigo-100">
                  Junte-se a centenas de psicólogos <br/> que já evoluíram sua gestão.
                </p>
              </div>
              {/* Seção removida conforme solicitado na imagem */}
            </div>
          </div>

          <div className="p-8 md:p-20 flex flex-col justify-center bg-white">
            <div className="max-w-sm w-full mx-auto space-y-10">
              <div className="text-center md:text-left space-y-2">
                <h2 className="text-4xl font-black text-gray-900 tracking-tight">
                  {mode === 'login' ? 'Boas-vindas' : 'Crie seu acesso'}
                </h2>
                <p className="text-gray-400 font-medium">
                  {mode === 'login' 
                    ? 'Acesse sua conta para gerenciar seu fluxo.' 
                    : 'Comece sua jornada de gestão inteligente hoje.'}
                </p>
              </div>

              {registrationSuccess ? (
                <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 text-center space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 size={32} className="text-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Cadastro Realizado!</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Seu cadastro foi realizado com sucesso! O administrador do sistema vai analisar e ativar o cadastro, aguarde.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setMode('login'); setRegistrationSuccess(false); }}
                    className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-1.5 rounded-2xl flex border border-gray-100">
                    <button 
                      onClick={() => { setMode('login'); setAuthError(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LogIn size={16} /> Entrar
                    </button>
                    <button 
                      onClick={() => { setMode('register'); setAuthError(null); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <UserPlus size={16} /> Cadastrar
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {mode === 'register' && (
                      <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-all">
                            <UserCircle size={18} />
                          </div>
                          <input 
                            type="text" 
                            required 
                            placeholder="Nome e sobrenome" 
                            className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mail de Trabalho</label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-all">
                          <Mail size={18} />
                        </div>
                        <input 
                          type="email" 
                          required 
                          placeholder="email@exemplo.com" 
                          className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Senha de Acesso</label>
                        {mode === 'login' && (
                          <button type="button" className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors">Recuperar</button>
                        )}
                      </div>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-focus-within:bg-indigo-100 group-focus-within:text-indigo-600 transition-all">
                          <Lock size={18} />
                        </div>
                        <input 
                          type="password" 
                          required 
                          placeholder="••••••••" 
                          className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium tracking-widest" 
                          value={formData.password} 
                          onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                      </div>
                    </div>

                    {authError && (
                      <div className="flex items-center gap-3 text-rose-600 text-[11px] font-bold animate-in fade-in slide-in-from-top-1 bg-rose-50 p-4 rounded-2xl border border-rose-100">
                        <AlertCircle size={16} className="shrink-0" />
                        <span className="leading-tight">{authError}</span>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={isAuthLoading} 
                      className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 group disabled:bg-indigo-400 disabled:scale-100"
                    >
                      {isAuthLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          {mode === 'login' ? 'Acessar Sistema' : 'Criar minha conta'}
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              <div className="pt-6 flex flex-col items-center gap-6">
                <div className="flex items-center gap-2 text-indigo-400/60 font-black text-[9px] uppercase tracking-widest">
                  <Zap size={14} className="fill-current" />
                  Powered by PsycheFlow Cloud
                </div>
                <p className="text-[10px] text-gray-300 font-medium text-center leading-relaxed">
                  Ao utilizar a plataforma, você concorda com nossos <br/> 
                  <span className="text-gray-400 underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-indigo-500 transition-colors">Termos de Uso</span> e <span className="text-gray-400 underline decoration-gray-200 underline-offset-4 cursor-pointer hover:text-indigo-500 transition-colors">Política de Dados</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeProfissional) {
    return <ProfissionalSelector />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'patients': return <PatientRegistration />;
      case 'scheduling': return <Scheduling />;
      case 'payments': return <Payments />;
      case 'packages': return <Packages />;
      case 'reports': return <Reports />;
      case 'users': return <Users />;
      case 'profissionais': return <Profissionais />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
