
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
  Zap
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

  const intelligentAlerts = useMemo(() => {
    const alerts = [];
    
    // Alerta de Saldo Crítico (Apenas Pacotes reais > 1 sessão com 0 ou 1 sessão restante)
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

    // Alerta de Atendimentos Pendentes (Melhorado com nomes de pacientes)
    // Inclui agendamentos agendados E confirmados
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
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Painel Operacional</h2>
        <p className="text-gray-500">Monitoramento consolidado da agenda e alertas de crédito.</p>
      </header>

      {intelligentAlerts.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {intelligentAlerts.map((alert: any, idx) => (
            <div 
              key={idx} 
              className={`p-6 rounded-[32px] flex items-center justify-between gap-6 border transition-all hover:shadow-xl hover:-translate-y-0.5 ${
                alert.type === 'warning' 
                ? 'bg-amber-50 border-amber-100 shadow-sm shadow-amber-100/50' 
                : 'bg-indigo-50 border-indigo-100 shadow-sm shadow-indigo-100/50'
              }`}
            >
              <div className="flex items-center gap-6 flex-1 min-w-0">
                {/* Contador de Volume */}
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl font-black text-2xl shrink-0 ${
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
                  <p className={`text-xs font-black uppercase tracking-widest ${
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
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all active:scale-95 shrink-0 shadow-lg ${
                  alert.type === 'warning'
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200/50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200/50'
                }`}
              >
                {alert.actionLabel}
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

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
            <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
            <span className="text-sm font-bold min-w-[140px] text-center capitalize">
              {view === 'Mês' ? currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 
               view === 'Semana' ? `${weekDays[0].getDate()}/${weekDays[0].getMonth()+1} - ${weekDays[6].getDate()}/${weekDays[6].getMonth()+1}` : 
               currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
            </span>
            <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="flex-1 p-6 bg-[#F8FAFC] overflow-auto">
          {view === 'Mês' && (
            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden shadow-inner">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="bg-gray-50 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
              ))}
              {calendarDays.map((day, idx) => (
                <div key={idx} className={`bg-white min-h-[100px] p-2 relative transition-colors ${day ? 'hover:bg-indigo-50/30' : 'bg-gray-50/50'}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-bold ${day.toDateString() === new Date().toDateString() ? 'bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-gray-400'}`}>{day.getDate()}</span>
                      <div className="mt-2 space-y-1">
                        {getSessionsForDate(day).map(s => (
                          <div key={s.id} className={`px-2 py-0.5 rounded text-[9px] font-bold truncate ${s.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : s.status === AttendanceStatus.CONFIRMED ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
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
                <div key={day.toISOString()} className="flex flex-col space-y-3">
                  <div className="text-center pb-3 border-b border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                    <p className={`text-lg font-black ${day.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-gray-900'}`}>{day.getDate()}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {getSessionsForDate(day).map(s => (
                      <div key={s.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <p className={`text-[10px] font-black mb-1 ${s.status === AttendanceStatus.CONFIRMED ? 'text-orange-500' : 'text-indigo-500'}`}>{s.time}</p>
                        <p className="text-xs font-bold text-gray-900 truncate">{visiblePatients.find(p => p.id === s.patientId)?.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'Dia' && (
            <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
              <div className="p-6 bg-indigo-600 text-white">
                <h4 className="font-bold text-lg">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
              </div>
              <div className="divide-y divide-gray-50">
                {getSessionsForDate(currentDate).length > 0 ? getSessionsForDate(currentDate).map(s => (
                  <div key={s.id} className="p-6 flex items-center gap-6 hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <p className={`text-lg font-black ${s.status === AttendanceStatus.CONFIRMED ? 'text-orange-600' : 'text-indigo-600'}`}>{s.time}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase">{s.duration}m</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{visiblePatients.find(p => p.id === s.patientId)?.name}</p>
                      <p className="text-xs text-gray-500">{s.serviceType}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : s.status === AttendanceStatus.CONFIRMED ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>{s.status}</span>
                  </div>
                )) : (
                  <div className="p-20 text-center text-gray-400 italic">Nenhum atendimento para esta data.</div>
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
