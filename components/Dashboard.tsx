
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Wallet,
  ArrowRight,
  Zap,
  BarChart3,
  TrendingUp,
  // Fixed: Added CheckCircle2 to imports
  CheckCircle2
} from 'lucide-react';
import { AttendanceStatus, ServiceType, PackageStatus } from '../types';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

type CalendarView = 'Dia' | 'Semana' | 'Mês';

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { visiblePatients, visibleSessions, visiblePackages } = useApp();
  const [view, setView] = useState<CalendarView>('Mês');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Cálculo de Atendimentos Mensais
  const monthlyStats = useMemo(() => {
    const stats: Record<string, number> = {};
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    visibleSessions.forEach(s => {
      if (s.status === AttendanceStatus.CANCELLED) return;
      const key = s.date.substring(0, 7); // Pega YYYY-MM
      stats[key] = (stats[key] || 0) + 1;
    });
    
    // Ordena chaves por data decrescente
    const sortedKeys = Object.keys(stats).sort((a, b) => b.localeCompare(a));
    
    return {
      currentCount: stats[currentMonthKey] || 0,
      history: sortedKeys.slice(0, 3).map(key => ({
        key,
        label: new Date(key + '-02T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        count: stats[key],
        isCurrent: key === currentMonthKey
      }))
    };
  }, [visibleSessions]);

  const intelligentAlerts = useMemo(() => {
    const alerts = [];
    
    // Alerta de Saldo Crítico
    const lowPackages = visiblePackages.filter(p => 
      p.status === PackageStatus.ACTIVE && 
      p.totalSessions > 1 && 
      p.remainingSessions <= 1
    );
    
    if (lowPackages.length > 0) {
      const names = lowPackages
        .map(pkg => visiblePatients.find(p => p.id === pkg.patientId)?.name)
        .filter(Boolean)
        .slice(0, 3);
      
      const namesList = names.join(', ');
      const suffix = lowPackages.length > 3 ? ` e outros ${lowPackages.length - 3}` : '';
      
      alerts.push({ 
        type: 'warning', 
        msg: `Saldos Críticos detectados.`, 
        details: names.length > 0 ? `Pacientes: ${namesList}${suffix}` : 'Sessões de pacote chegando ao fim.',
        icon: AlertTriangle,
        count: lowPackages.length,
        action: () => setActiveTab('packages'),
        actionLabel: 'Ver Pacientes'
      });
    }

    // Alerta de Atendimentos Pendentes
    const upcomingSesh = visibleSessions.filter(s => 
      s.status === AttendanceStatus.SCHEDULED || s.status === AttendanceStatus.CONFIRMED
    );
    if (upcomingSesh.length > 0) {
        const pNames = upcomingSesh
          .map(s => visiblePatients.find(p => p.id === s.patientId)?.name)
          .filter(Boolean)
          .slice(0, 3);
        
        const namesList = pNames.join(', ');
        const suffix = upcomingSesh.length > 3 ? ` +${upcomingSesh.length - 3}` : '';

        alerts.push({ 
          type: 'info', 
          msg: `Atendimentos agendados pendentes.`, 
          details: pNames.length > 0 ? `Próximos: ${namesList}${suffix}` : 'Mantenha sua agenda atualizada.',
          icon: CalendarIcon,
          count: upcomingSesh.length,
          action: () => setActiveTab('scheduling'),
          actionLabel: 'Ir para Agenda'
        });
    }
    
    return alerts;
  }, [visibleSessions, visiblePackages, visiblePatients, setActiveTab]);

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (view === 'Mês') newDate.setMonth(newDate.getMonth() + amount);
    else if (view === 'Semana') newDate.setDate(newDate.getDate() + (amount * 7));
    else newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  const getSessionsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dStr = `${year}-${month}-${day}`;
    return visibleSessions
      .filter(s => s.date === dStr && s.status !== AttendanceStatus.CANCELLED)
      .sort((a, b) => a.time.slice(0, 5).localeCompare(b.time.slice(0, 5)));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Painel Operacional</h2>
        <p className="text-gray-500 font-medium">Monitoramento consolidado da agenda e alertas de crédito.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Alertas Inteligentes */}
        <div className="space-y-4 flex flex-col justify-center">
          {intelligentAlerts.length > 0 ? intelligentAlerts.map((alert: any, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-[32px] flex items-center justify-between gap-6 border transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                alert.type === 'warning' 
                ? 'bg-amber-50 border-amber-100 shadow-sm shadow-amber-100/50' 
                : 'bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100/50'
              }`}
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className={`relative flex items-center justify-center w-14 h-14 rounded-2xl font-black text-xl shrink-0 ${
                  alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {alert.count}
                  <div className={`absolute -top-1 -right-1 p-1 rounded-lg border-2 border-white shadow-sm ${
                    alert.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}>
                    <alert.icon size={12} className="text-white" />
                  </div>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    alert.type === 'warning' ? 'text-amber-800' : 'text-indigo-800'
                  }`}>{alert.msg}</p>
                  <p className={`text-[11px] font-bold leading-relaxed truncate ${
                    alert.type === 'warning' ? 'text-amber-600/80' : 'text-indigo-600/80'
                  }`}>
                    {alert.details}
                  </p>
                </div>
              </div>
              <button 
                onClick={alert.action}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all active:scale-95 shrink-0 shadow-sm ${
                  alert.type === 'warning'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {alert.actionLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          )) : (
            <div className="p-10 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
              {/* Fixed: CheckCircle2 was missing from imports */}
              <CheckCircle2 size={32} className="text-emerald-500 mb-3" />
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Tudo em ordem!</p>
              <p className="text-xs text-gray-400 font-medium">Sem pendências críticas no momento.</p>
            </div>
          )}
        </div>

        {/* Widget de Estatísticas Mensais */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm p-8 flex flex-col justify-between hover:shadow-lg transition-all border-l-[12px] border-l-indigo-600/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <BarChart3 size={120} className="text-indigo-600" />
          </div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Análise de Volume</p>
              <h4 className="text-2xl font-black text-gray-900 tracking-tight">Total de Atendimentos</h4>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
              <TrendingUp size={24} />
            </div>
          </div>

          <div className="flex items-end justify-between gap-8 mt-4 relative z-10">
            <div className="flex flex-col">
              <span className="text-6xl font-black text-indigo-600 leading-none tracking-tighter drop-shadow-sm">
                {monthlyStats.currentCount}
              </span>
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit mt-3 border border-emerald-100">
                Mês Corrente
              </span>
            </div>
            
            <div className="flex-1 flex justify-end gap-5 h-full items-end pb-2">
              {monthlyStats.history.reverse().map((h, i) => (
                <div key={h.key} className="flex flex-col items-center gap-2 group">
                  <div 
                    className={`w-10 rounded-t-2xl transition-all group-hover:opacity-80 relative flex items-end justify-center ${h.isCurrent ? 'bg-indigo-600 shadow-xl shadow-indigo-100' : 'bg-indigo-100'}`} 
                    style={{ height: `${Math.max(25, (h.count / (monthlyStats.currentCount || 1)) * 60)}px` }}
                  >
                     <span className="absolute -top-6 text-[11px] font-black text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity">{h.count}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-tighter ${h.isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>{h.label}</span>
                  <span className="text-[10px] font-black text-gray-900">{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-6 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <CalendarIcon size={20} className="text-indigo-600" />
              Agenda Interativa
            </h3>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['Dia', 'Semana', 'Mês'].map(v => (
                <button key={v} onClick={() => setView(v as CalendarView)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${view === v ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400'}`}>{v}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold min-w-[160px] text-center capitalize text-gray-700">
              {view === 'Mês' ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 
               view === 'Semana' ? `${weekDays[0].getDate()}/${weekDays[0].getMonth()+1} - ${weekDays[6].getDate()}/${weekDays[6].getMonth()+1}` : 
               currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="flex-1 p-6 bg-[#F8FAFC] overflow-auto">
          {view === 'Mês' && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="bg-gray-50 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
              ))}
              {calendarDays.map((day, idx) => (
                <div key={idx} className={`bg-white min-h-[120px] p-2 relative transition-colors ${day ? 'hover:bg-indigo-50/40' : 'bg-gray-50/50'}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-black ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg shadow-indigo-100' : 'text-gray-400'}`}>{day.getDate()}</span>
                      <div className="mt-2 space-y-1">
                        {getSessionsForDate(day).map(s => (
                          <div key={s.id} className={`px-2 py-1 rounded-lg text-[10px] font-bold truncate border shadow-sm ${s.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : s.status === AttendanceStatus.CONFIRMED ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                            {s.time} - {visiblePatients.find(p => p.id === s.patientId)?.name}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {view === 'Semana' && (
            <div className="grid grid-cols-7 gap-4 h-full">
              {weekDays.map(day => (
                <div key={day.toISOString()} className="flex flex-col space-y-4">
                  <div className="text-center pb-4 border-b border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    <p className={`text-xl font-black ${day.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-900'}`}>{day.getDate()}</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    {getSessionsForDate(day).map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <p className={`text-[11px] font-black mb-1.5 ${s.status === AttendanceStatus.CONFIRMED ? 'text-orange-600' : 'text-indigo-600'}`}>{s.time}</p>
                        <p className="text-xs font-bold text-gray-900 line-clamp-2">{visiblePatients.find(p => p.id === s.patientId)?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'Dia' && (
            <div className="max-w-2xl mx-auto bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                <div>
                  <h4 className="font-black text-2xl tracking-tight">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long' })}</h4>
                  <p className="text-indigo-100 font-bold opacity-80">{currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                   <CalendarIcon size={32} />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {getSessionsForDate(currentDate).length > 0 ? getSessionsForDate(currentDate).map(s => (
                  <div key={s.id} className="p-8 flex items-center gap-8 hover:bg-gray-50/80 transition-all group">
                    <div className="text-center min-w-[60px]">
                      <p className={`text-2xl font-black ${s.status === AttendanceStatus.CONFIRMED ? 'text-orange-600' : 'text-indigo-600'}`}>{s.time}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.duration}m</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{visiblePatients.find(p => p.id === s.patientId)?.name}</p>
                      <p className="text-xs text-gray-500 font-bold flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                        {s.serviceType}
                      </p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${s.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : s.status === AttendanceStatus.CONFIRMED ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{s.status}</span>
                  </div>
                )) : (
                  <div className="p-24 text-center text-gray-400 italic flex flex-col items-center gap-4">
                     <Clock size={48} className="opacity-10" />
                     <span className="font-bold text-lg">Nenhum atendimento para esta data.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
