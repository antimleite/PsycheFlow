
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, Plus, Filter, MoreHorizontal, CalendarDays, Check, X, RotateCcw, Ban, AlertCircle, FileText, Wallet, CheckCircle2, UserX, Search, Hash, Package, Info, AlertOctagon, ArrowUpDown, ChevronDown } from 'lucide-react';
import { AttendanceStatus, Session, ServiceType, PackageStatus, PaymentStatus } from '../types';

type SortField = 'datetime' | 'status' | 'type';
type SortOrder = 'asc' | 'desc';

const Scheduling: React.FC = () => {
  const { visiblePatients, visibleSessions, visiblePackages, addSession, updateSession, rescheduleSession, preSelectedPatientId, setPreSelectedPatientId, getAvailableCredits } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Ordenação
  const [sortBy, setSortBy] = useState<SortField>('datetime');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Estado para o modal de confirmação de cancelamento
  const [sessionToCancel, setSessionToCancel] = useState<Session | null>(null);
  
  const [filterPatientId, setFilterPatientId] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const [patientId, setPatientId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>(ServiceType.SINGLE);
  const [slots, setSlots] = useState([{ date: today, time: '09:00' }]);
  const [notes, setNotes] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Monitora a seleção de paciente para bloquear o tipo de serviço se houver apenas um tipo de crédito
  useEffect(() => {
    if (patientId && !editingSession) {
      const availSingle = getAvailableCredits(patientId, ServiceType.SINGLE);
      const availPkg = getAvailableCredits(patientId, ServiceType.PACKAGE);

      if (availPkg > 0 && availSingle === 0) {
        handleServiceTypeChange(ServiceType.PACKAGE);
      } else if (availSingle > 0 && availPkg === 0) {
        handleServiceTypeChange(ServiceType.SINGLE);
      }
    }
  }, [patientId, getAvailableCredits, editingSession]);

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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleServiceTypeChange = (type: ServiceType) => {
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

    const hasEmptySlots = slots.some(s => !s.date || !s.time);
    if (hasEmptySlots) {
      setErrorMessage("Por favor, preencha todas as datas e horários solicitados.");
      return;
    }

    if (editingSession) {
      await rescheduleSession(editingSession.id, { date: slots[0].date, time: slots[0].time, notes });
      setShowModal(false);
      resetForm();
      return;
    }

    const availableCredits = getAvailableCredits(patientId, serviceType);
    
    if (availableCredits < slots.length) {
      setErrorMessage(`Paciente sem saldo suficiente para agendar estas ${slots.length} sessões. Registre o pagamento antes.`);
      return;
    }

    const activePkg = visiblePackages.find(pkg => pkg.patientId === patientId && pkg.status === PackageStatus.ACTIVE);

    const sessionPromises = slots.map((slot, index) => {
      const sessionData: Omit<Session, 'id' | 'profissionalId'> = {
        patientId,
        date: slot.date,
        time: slot.time,
        duration: 50,
        status: AttendanceStatus.SCHEDULED,
        notes: notes || (serviceType === ServiceType.PACKAGE ? `Sessão ${index + 1} do pacote` : 'Atendimento Avulso'),
        serviceType,
        packageId: serviceType === ServiceType.PACKAGE ? activePkg?.id : undefined,
      };
      return addSession(sessionData);
    });
    
    await Promise.all(sessionPromises);
    setShowModal(false);
    resetForm();
  };

  const handleRescheduleAction = (session: Session) => {
    setEditingSession(session);
    setPatientId(session.patientId);
    setServiceType(session.serviceType || ServiceType.SINGLE);
    setSlots([{ date: session.date, time: session.time }]);
    setNotes(session.notes);
    setShowModal(true);
  };

  const handleStatusUpdate = (session: Session, newStatus: AttendanceStatus) => {
    if (newStatus === AttendanceStatus.CANCELLED) {
      setSessionToCancel(session);
      setMenuOpenSessionId(null);
      return;
    }
    updateSession({ ...session, status: newStatus });
    setMenuOpenSessionId(null);
  };

  const confirmCancellation = () => {
    if (sessionToCancel) {
      updateSession({ ...sessionToCancel, status: AttendanceStatus.CANCELLED });
      setSessionToCancel(null);
    }
  };

  const resetForm = () => {
    setPatientId('');
    setServiceType(ServiceType.SINGLE);
    setSlots([{ date: today, time: '09:00' }]);
    setNotes('');
    setEditingSession(null);
    setErrorMessage(null);
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredSessions = useMemo(() => {
    let list = visibleSessions
      .filter(s => (!filterPatientId || s.patientId === filterPatientId) && (!filterDate || s.date === filterDate));

    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'datetime') {
        const fullA = `${a.date}T${a.time}`;
        const fullB = `${b.date}T${b.time}`;
        comparison = fullA.localeCompare(fullB);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortBy === 'type') {
        const typeA = a.packageId ? 'pacote' : 'avulso';
        const typeB = b.packageId ? 'pacote' : 'avulso';
        comparison = typeA.localeCompare(typeB);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return list;
  }, [visibleSessions, filterPatientId, filterDate, sortBy, sortOrder]);

  const isServiceTypeLocked = useMemo(() => {
    if (!patientId || editingSession) return false;
    const availSingle = getAvailableCredits(patientId, ServiceType.SINGLE);
    const availPkg = getAvailableCredits(patientId, ServiceType.PACKAGE);
    return (availPkg > 0 && availSingle === 0) || (availSingle > 0 && availPkg === 0);
  }, [patientId, getAvailableCredits, editingSession]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão da Agenda</h2>
          <p className="text-gray-500">Agendamentos confirmados reservam o saldo imediatamente na base de dados.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all active:scale-95">
          <Plus size={19} /> Novo Agendamento
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-visible">
        <div className="p-6 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[200px]">
              <select className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterPatientId} onChange={e => setFilterPatientId(e.target.value)}>
                  <option value="">Todos os Pacientes</option>
                  {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="w-48">
              <input type="date" className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
            </div>
            {(filterPatientId || filterDate) && (
              <button onClick={() => { setFilterPatientId(''); setFilterDate(''); }} className="text-xs font-bold text-indigo-600 hover:text-indigo-800">Limpar Filtros</button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter px-2">Ordenar por:</span>
             <button 
                onClick={() => toggleSort('datetime')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${sortBy === 'datetime' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               {sortOrder === 'asc' ? <ArrowUpDown size={12} className="rotate-180" /> : <ArrowUpDown size={12} />} Data/Hora
             </button>
             <button 
                onClick={() => toggleSort('status')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${sortBy === 'status' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
             </button>
             <button 
                onClick={() => toggleSort('type')} 
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${sortBy === 'type' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
             >
               Tipo {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
             </button>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Paciente</th>
              <th className="px-6 py-4 text-center">Tipo / Referência</th>
              <th className="px-6 py-4">Data / Hora</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSessions.map(session => (
              <tr key={session.id} className={`hover:bg-gray-50/50 transition-colors group ${[AttendanceStatus.RESCHEDULED, AttendanceStatus.CANCELLED].includes(session.status) ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-900">{visiblePatients.find(p => p.id === session.patientId)?.name}</span>
                    {session.notes && <span className="text-[10px] text-gray-400 truncate max-w-[180px] italic">{session.notes}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {session.packageId ? (
                    <div className="flex flex-col items-center">
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-600 text-[9px] font-black border border-purple-100">
                        <Package size={10} /> Pacote
                      </span>
                      <span className="text-[8px] text-gray-300 font-bold mt-0.5">ID: {session.packageId.slice(0, 8)}</span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9px] font-black border border-blue-100">Avulso</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs font-medium text-gray-600 flex flex-col">
                    <span className="font-bold">{formatDateDisplay(session.date)}</span>
                    <span className="text-[10px] text-gray-400">{session.time}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    session.status === AttendanceStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    session.status === AttendanceStatus.RESCHEDULED ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    session.status === AttendanceStatus.ABSENT_WITHOUT_NOTICE ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    session.status === AttendanceStatus.CANCELLED ? 'bg-gray-100 text-gray-400 border-gray-200' :
                    'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>{session.status}</span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  {(session.status !== AttendanceStatus.RESCHEDULED && session.status !== AttendanceStatus.CANCELLED) && (
                    <div className="flex justify-end">
                      <button onClick={(e) => { e.stopPropagation(); setMenuOpenSessionId(menuOpenSessionId === session.id ? null : session.id); }} className={`p-2 rounded-lg transition-all ${menuOpenSessionId === session.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
                        <MoreHorizontal size={18} />
                      </button>
                      {menuOpenSessionId === session.id && (
                        <div ref={menuRef} className="absolute right-6 top-12 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl z-50 overflow-hidden p-1 animate-in zoom-in-95 duration-150 origin-top-right">
                          <button onClick={() => handleStatusUpdate(session, AttendanceStatus.COMPLETED)} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors text-left"><CheckCircle2 size={16} /> Realizada</button>
                          <button onClick={() => handleStatusUpdate(session, AttendanceStatus.ABSENT_WITHOUT_NOTICE)} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"><UserX size={16} /> Falta s/ Aviso</button>
                          <div className="h-px bg-gray-50 my-1 mx-2"></div>
                          <button onClick={() => handleRescheduleAction(session)} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors text-left"><RotateCcw size={16} /> Reagendar (Libera Crédito)</button>
                          <button onClick={() => handleStatusUpdate(session, AttendanceStatus.CANCELLED)} className="w-full flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors text-left"><X size={16} /> Cancelar (Libera Crédito)</button>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sessionToCancel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-300 border border-rose-100">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirmar Cancelamento?</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Tem certeza que quer cancelar aquele agendamento, pois isso resultará em exclusão dos créditos de agendamento e uma possível devolução de valores pagos.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmCancellation} 
                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold hover:bg-rose-700 shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
              >
                Sim, Cancelar
              </button>
              <button 
                onClick={() => setSessionToCancel(null)} 
                className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all border border-gray-100"
              >
                Não, manter agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
             <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-center">
               <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900"><CalendarIcon className="text-indigo-600" />{editingSession ? 'Reagendar' : 'Novo Agendamento'}</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-8 pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Paciente</label>
                      <select required disabled={!!editingSession} className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-100 outline-none font-medium bg-white" value={patientId} onChange={e => setPatientId(e.target.value)}>
                         <option value="">Selecione o paciente...</option>
                         {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                   </div>
                   
                   {patientId && !editingSession && (
                     <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between animate-in fade-in duration-300">
                        <div className="flex items-center gap-3"><Wallet size={18} className="text-indigo-600" /><span className="text-xs font-bold text-gray-600 uppercase tracking-tight">Saldo Atualizado na Base:</span></div>
                        <div className="flex gap-4">
                          <span className="text-xs font-bold">Avulso: <span className={getAvailableCredits(patientId, ServiceType.SINGLE) > 0 ? "text-emerald-600" : "text-rose-500"}>{getAvailableCredits(patientId, ServiceType.SINGLE)}</span></span>
                          <span className="text-xs font-bold">Pacote: <span className={getAvailableCredits(patientId, ServiceType.PACKAGE) > 0 ? "text-emerald-600" : "text-rose-500"}>{getAvailableCredits(patientId, ServiceType.PACKAGE)}</span></span>
                        </div>
                     </div>
                   )}

                   {!editingSession && (
                     <div>
                       <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Tipo de Atendimento</label>
                       <div className="grid grid-cols-2 gap-3">
                          {Object.values(ServiceType).map((type) => (
                            <button 
                              key={type} 
                              type="button" 
                              disabled={isServiceTypeLocked && serviceType !== type}
                              onClick={() => handleServiceTypeChange(type)} 
                              className={`px-4 py-3 rounded-2xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${serviceType === type ? 'border-indigo-600 bg-indigo-50 text-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 text-gray-400 hover:border-gray-300'} ${isServiceTypeLocked && serviceType !== type ? 'opacity-30 grayscale cursor-not-allowed' : ''}`}
                            >
                              {type}
                              <span className="text-[10px] font-black opacity-60">({type === ServiceType.PACKAGE ? '4 sessões' : '1 sessão'})</span>
                            </button>
                          ))}
                       </div>
                       {isServiceTypeLocked && (
                         <p className="mt-2 text-[10px] text-indigo-500 font-bold flex items-center gap-1"><Info size={12}/> Tipo fixado baseado no crédito disponível na base de dados.</p>
                       )}
                     </div>
                   )}

                   <div className="space-y-4">
                     <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                       {serviceType === ServiceType.PACKAGE ? 'Datas do Pacote (4 Horários)' : 'Data e Horário'}
                     </label>
                     <div className={`grid gap-4 ${serviceType === ServiceType.PACKAGE ? 'grid-cols-2' : 'grid-cols-1'}`}>
                       {slots.map((slot, index) => (
                         <div key={index} className="grid grid-cols-2 gap-3 p-4 bg-white rounded-2xl border border-gray-200 relative group hover:border-indigo-200 transition-colors">
                            {serviceType === ServiceType.PACKAGE && <span className="col-span-2 text-[9px] font-black text-indigo-400 uppercase tracking-tighter">Sessão {index + 1}</span>}
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Data</label>
                              <input type="date" required className="w-full px-2 py-2 rounded-xl border border-gray-100 text-sm font-medium outline-none focus:border-indigo-400" value={slot.date} onChange={e => updateSlot(index, 'date', e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Hora</label>
                              <input type="time" required className="w-full px-2 py-2 rounded-xl border border-gray-100 text-sm font-medium outline-none focus:border-indigo-400" value={slot.time} onChange={e => updateSlot(index, 'time', e.target.value)} />
                            </div>
                         </div>
                       ))}
                     </div>
                   </div>

                   {errorMessage && (<div className="flex items-center gap-2 text-rose-600 text-[11px] font-bold bg-rose-50 p-4 rounded-xl border border-rose-100 animate-in shake duration-300"><AlertCircle size={14} />{errorMessage}</div>)}
                   
                   <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                      <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                      <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all">
                        {editingSession ? 'Confirmar Reagendamento' : 'Confirmar Agendamento'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;
