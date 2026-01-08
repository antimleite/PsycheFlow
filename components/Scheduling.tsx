
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, Plus, MoreHorizontal, CheckCircle2, X, RotateCcw, AlertCircle, Wallet, UserX, ArrowUpDown, Edit2, AlertOctagon, Package, Info, Zap, Trash2 } from 'lucide-react';
import { AttendanceStatus, Session, ServiceType, PackageStatus } from '../types';

type SortField = 'datetime' | 'status' | 'type';
type SortOrder = 'asc' | 'desc';

const Scheduling: React.FC = () => {
  const { visiblePatients, visibleSessions, visiblePackages, addSession, updateSession, rescheduleSession, preSelectedPatientId, setPreSelectedPatientId, getAvailableCredits } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [sortBy, setSortBy] = useState<SortField>('datetime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [patientId, setPatientId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.SINGLE);
  const [slots, setSlots] = useState([{ date: today, time: '09:00' }]);
  const [notes, setNotes] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preSelectedPatientId) {
      setPatientId(preSelectedPatientId);
      setShowModal(true);
      setPreSelectedPatientId(null);
    }
  }, [preSelectedPatientId, setPreSelectedPatientId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenSessionId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cálculos de crédito em tempo real para o modal
  const avulsoCredits = useMemo(() => {
    if (!patientId) return 0;
    const patientPkgs = visiblePackages.filter(p => p.patientId === patientId && p.status === PackageStatus.ACTIVE && p.totalSessions === 1);
    const totalGranted = patientPkgs.reduce((acc, curr) => acc + curr.totalSessions, 0);
    const consumedStatuses = [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE, AttendanceStatus.SCHEDULED];
    const totalConsumed = visibleSessions.filter(s => 
      s.patientId === patientId && 
      consumedStatuses.includes(s.status) && 
      patientPkgs.some(pkg => pkg.id === s.packageId)
    ).length;
    return Math.max(0, totalGranted - totalConsumed);
  }, [patientId, visiblePackages, visibleSessions]);

  const pacoteCredits = useMemo(() => {
    if (!patientId) return 0;
    const patientPkgs = visiblePackages.filter(p => p.patientId === patientId && p.status === PackageStatus.ACTIVE && p.totalSessions === 4);
    const totalGranted = patientPkgs.reduce((acc, curr) => acc + curr.totalSessions, 0);
    const consumedStatuses = [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE, AttendanceStatus.SCHEDULED];
    const totalConsumed = visibleSessions.filter(s => 
      s.patientId === patientId && 
      consumedStatuses.includes(s.status) && 
      patientPkgs.some(pkg => pkg.id === s.packageId)
    ).length;
    return Math.max(0, totalGranted - totalConsumed);
  }, [patientId, visiblePackages, visibleSessions]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleServiceTypeChange = (type: ServiceType) => {
    if (isEditMode) return;
    setServiceType(type);
    if (type === ServiceType.PACKAGE) {
      const firstSlot = slots[0] || { date: today, time: '09:00' };
      const newSlots = Array.from({ length: 4 }, (_, i) => {
        const d = new Date(firstSlot.date + 'T00:00:00');
        d.setDate(d.getDate() + (i * 7));
        return { date: d.toISOString().split('T')[0], time: firstSlot.time };
      });
      setSlots(newSlots);
    } else {
      setSlots([slots[0] || { date: today, time: '09:00' }]);
    }
  };

  const updateSlot = (index: number, field: 'date' | 'time', value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setErrorMessage(null);

    if (slots.some(s => !s.date || !s.time)) {
      setErrorMessage("Por favor, preencha todas as datas e horários.");
      return;
    }

    if (isEditMode && editingSession) {
      await updateSession({ 
        ...editingSession, 
        date: slots[0].date, 
        time: slots[0].time, 
        notes 
      });
      setShowModal(false);
      resetForm();
      return;
    }

    if (editingSession) {
      await rescheduleSession(editingSession.id, { date: slots[0].date, time: slots[0].time, notes });
      setShowModal(false);
      resetForm();
      return;
    }

    // Validação de saldo baseada no tipo selecionado
    const currentSaldo = serviceType === ServiceType.SINGLE ? avulsoCredits : pacoteCredits;
    if (currentSaldo < slots.length) {
      setErrorMessage(`Saldo insuficiente para o tipo selecionado (${serviceType}). Disponível: ${currentSaldo}`);
      return;
    }

    // Busca o pacote correto para associar (o primeiro que tiver saldo)
    const relevantPkgs = visiblePackages.filter(pkg => 
      pkg.patientId === patientId && 
      pkg.status === PackageStatus.ACTIVE && 
      (serviceType === ServiceType.PACKAGE ? pkg.totalSessions === 4 : pkg.totalSessions === 1)
    );
    
    let packageIdToUse: string | undefined;
    for (const pkg of relevantPkgs) {
      const consumedCount = visibleSessions.filter(s => s.packageId === pkg.id && [AttendanceStatus.COMPLETED, AttendanceStatus.ABSENT_WITHOUT_NOTICE, AttendanceStatus.SCHEDULED].includes(s.status)).length;
      if (consumedCount < pkg.totalSessions) {
        packageIdToUse = pkg.id;
        break;
      }
    }

    const sessionPromises = slots.map((slot, index) => {
      return addSession({
        patientId,
        date: slot.date,
        time: slot.time,
        duration: 50,
        status: AttendanceStatus.SCHEDULED,
        notes: notes || (serviceType === ServiceType.PACKAGE ? `Sessão ${index + 1} do pacote` : 'Atendimento Avulso'),
        serviceType,
        packageId: packageIdToUse,
      });
    });
    
    await Promise.all(sessionPromises);
    setShowModal(false);
    resetForm();
  };

  const handleEditDirectly = (session: Session) => {
    setEditingSession(session);
    setPatientId(session.patientId);
    setServiceType(session.serviceType || ServiceType.SINGLE);
    setSlots([{ date: session.date, time: session.time }]);
    setNotes(session.notes);
    setIsEditMode(true);
    setShowModal(true);
    setMenuOpenSessionId(null);
  };

  const handleRescheduleAction = (session: Session) => {
    setEditingSession(session);
    setPatientId(session.patientId);
    setServiceType(session.serviceType || ServiceType.SINGLE);
    setSlots([{ date: session.date, time: session.time }]);
    setNotes(session.notes);
    setIsEditMode(false);
    setShowModal(true);
    setMenuOpenSessionId(null);
  };

  const handleStatusUpdate = (session: Session, newStatus: AttendanceStatus) => {
    if (newStatus === AttendanceStatus.CANCELLED) {
      setSessionToCancel(session);
    } else {
      updateSession({ ...session, status: newStatus });
    }
    setMenuOpenSessionId(null);
  };

  const confirmCancellation = async () => {
    if (!sessionToCancel) return;
    // Ao atualizar para CANCELLED, as funções de cálculo de saldo (getAvailableCredits) 
    // deixarão de contar esta sessão como consumida, liberando o crédito.
    await updateSession({ ...sessionToCancel, status: AttendanceStatus.CANCELLED });
    setSessionToCancel(null);
  };

  const resetForm = () => {
    setPatientId('');
    setServiceType(ServiceType.SINGLE);
    setSlots([{ date: today, time: '09:00' }]);
    setNotes('');
    setEditingSession(null);
    setIsEditMode(false);
    setErrorMessage(null);
  };

  const filteredSessions = useMemo(() => {
    let list = visibleSessions.filter(s => (!filterPatientId || s.patientId === filterPatientId) && (!filterDate || s.date === filterDate));
    list.sort((a, b) => {
      let comp = 0;
      if (sortBy === 'datetime') comp = `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
      else if (sortBy === 'status') comp = a.status.localeCompare(b.status);
      return sortOrder === 'asc' ? comp : -comp;
    });
    return list;
  }, [visibleSessions, filterPatientId, filterDate, sortBy, sortOrder]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão da Agenda</h2>
          <p className="text-gray-500">Controle seus atendimentos e horários de forma centralizada.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all active:scale-95">
          <Plus size={19} /> Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-visible">
        <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4">
             <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterPatientId} onChange={e => setFilterPatientId(e.target.value)}>
                <option value="">Todos os Pacientes</option>
                {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
             </select>
             <input type="date" className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Ordenar:</span>
            <button onClick={() => { setSortBy('datetime'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sortBy === 'datetime' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border'}`}>Data/Hora</button>
          </div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Paciente</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-center">Data / Hora</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSessions.map(session => (
              <tr key={session.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-900">{visiblePatients.find(p => p.id === session.patientId)?.name}</span>
                    <span className="text-[10px] text-gray-400 truncate max-w-[150px]">{session.notes}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${session.packageId ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {session.packageId ? 'Pacote' : 'Avulso'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="text-xs font-bold text-gray-700">{formatDateDisplay(session.date)}</div>
                  <div className="text-[10px] text-gray-400">{session.time}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    session.status === AttendanceStatus.RESCHEDULED ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    session.status === AttendanceStatus.CANCELLED ? 'bg-gray-100 text-gray-400 border-gray-200' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{session.status}</span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button onClick={() => setMenuOpenSessionId(menuOpenSessionId === session.id ? null : session.id)} className="p-2 text-gray-400 hover:text-indigo-600"><MoreHorizontal size={18} /></button>
                  {menuOpenSessionId === session.id && (
                    <div ref={menuRef} className="absolute right-6 top-12 w-48 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 p-1 flex flex-col animate-in zoom-in-95 duration-150">
                      <button onClick={() => handleStatusUpdate(session, AttendanceStatus.COMPLETED)} className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><CheckCircle2 size={16} /> Realizada</button>
                      <button onClick={() => handleStatusUpdate(session, AttendanceStatus.ABSENT_WITHOUT_NOTICE)} className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"><UserX size={16} /> Falta s/ Aviso</button>
                      <div className="h-px bg-gray-50 my-1"></div>
                      <button onClick={() => handleEditDirectly(session)} className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"><Edit2 size={16} /> Editar Horário</button>
                      <button onClick={() => handleRescheduleAction(session)} className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><RotateCcw size={16} /> Reagendar</button>
                      <button onClick={() => handleStatusUpdate(session, AttendanceStatus.CANCELLED)} className="flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"><X size={16} /> Cancelar</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Clock className="text-indigo-600" />{isEditMode ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
               <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100 p-1"><X size={20} /></button>
             </div>
             <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Paciente</label>
                   <select required disabled={isEditMode || !!editingSession} className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 outline-none font-medium bg-white disabled:bg-gray-50" value={patientId} onChange={e => setPatientId(e.target.value)}>
                      <option value="">Selecione o paciente...</option>
                      {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                </div>

                {patientId && !isEditMode && !editingSession && (
                  <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50 flex items-center justify-around animate-in fade-in duration-300">
                    <div className="text-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Créditos Avulsos</span>
                      <span className={`text-lg font-black ${avulsoCredits > 0 ? 'text-indigo-700' : 'text-indigo-300'}`}>{avulsoCredits}</span>
                    </div>
                    <div className="w-px h-8 bg-indigo-100"></div>
                    <div className="text-center">
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Sessões de Pacote</span>
                      <span className={`text-lg font-black ${pacoteCredits > 0 ? 'text-indigo-700' : 'text-indigo-300'}`}>{pacoteCredits}</span>
                    </div>
                  </div>
                )}

                {!isEditMode && !editingSession && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo de Agendamento</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        key={ServiceType.SINGLE} 
                        type="button" 
                        onClick={() => handleServiceTypeChange(ServiceType.SINGLE)} 
                        className={`relative px-4 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${serviceType === ServiceType.SINGLE ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-gray-200 text-gray-400 hover:border-indigo-200'}`}
                      >
                        <Zap size={14} className={serviceType === ServiceType.SINGLE ? 'text-white' : 'text-indigo-200'} />
                        Avulso
                        {avulsoCredits > 0 && <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm ${serviceType === ServiceType.SINGLE ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>{avulsoCredits}</span>}
                      </button>

                      <button 
                        key={ServiceType.PACKAGE} 
                        type="button" 
                        onClick={() => handleServiceTypeChange(ServiceType.PACKAGE)} 
                        className={`relative px-4 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 ${serviceType === ServiceType.PACKAGE ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-gray-200 text-gray-400 hover:border-indigo-200'}`}
                      >
                        <Package size={14} className={serviceType === ServiceType.PACKAGE ? 'text-white' : 'text-indigo-200'} />
                        Pacote
                        {pacoteCredits > 0 && <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm ${serviceType === ServiceType.PACKAGE ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'}`}>{pacoteCredits}</span>}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Data e Horário</label>
                  <div className="max-h-[200px] overflow-y-auto space-y-3 pr-1">
                    {slots.map((slot, index) => (
                      <div key={index} className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100/50">
                         <input type="date" required className="w-full px-3 py-2 rounded-xl border border-transparent focus:bg-white focus:border-indigo-200 outline-none text-sm font-bold" value={slot.date} onChange={e => updateSlot(index, 'date', e.target.value)} />
                         <input type="time" required className="w-full px-3 py-2 rounded-xl border border-transparent focus:bg-white focus:border-indigo-200 outline-none text-sm font-bold" value={slot.time} onChange={e => updateSlot(index, 'time', e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {errorMessage && <p className="text-xs font-bold text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center gap-2 animate-in shake duration-300"><AlertCircle size={14} /> {errorMessage}</p>}
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                   <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                   <button type="submit" className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                     {isEditMode ? 'Salvar Alterações' : (editingSession ? 'Reagendar' : 'Agendar Sessão')}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {sessionToCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Cancelamento</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Tem certeza que deseja cancelar este agendamento? Esta ação <strong>liberará o crédito</strong> para o paciente e pode implicar em devolução de valores pagos.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmCancellation}
                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Trash2 size={18} /> Sim, cancelar
              </button>
              <button 
                onClick={() => setSessionToCancel(null)}
                className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all"
              >
                Manter Agendamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;
