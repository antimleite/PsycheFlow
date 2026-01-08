
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PaymentStatus, PaymentMethod, ServiceType, Payment, SessionPackage, PackageStatus } from '../types';
import { CreditCard, Filter, Search, X, Edit2, Info, CheckCircle, Calendar, AlignLeft, AlertCircle, Loader2 } from 'lucide-react';

const Payments: React.FC = () => {
  const { visiblePayments, visiblePatients, addPayment, updatePayment, addPackage, setActiveTab, setPreSelectedPatientId } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastSavedPatientId, setLastSavedPatientId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filtros
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterService, setFilterService] = useState<string>('Todos');
  const [filterPatient, setFilterPatient] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    patientId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: PaymentMethod.PIX,
    status: PaymentStatus.PAID,
    serviceType: ServiceType.SINGLE,
    notes: ''
  });

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) return;
    setIsSaving(true);
    setErrorMsg(null);
    const amountValue = formData.amount === '' ? 0 : parseFloat(formData.amount);
    const targetPatientId = formData.patientId;

    try {
      if (editingPayment) {
        await updatePayment({ ...editingPayment, patientId: targetPatientId, amount: amountValue, date: formData.date, status: formData.status, method: formData.method, serviceType: formData.serviceType });
      } else {
        const newPayment = await addPayment({ patientId: targetPatientId, amount: amountValue, date: formData.date, status: formData.status, method: formData.method, serviceType: formData.serviceType });
        
        // Regra solicitada: Atendimento Avulso gera 1 crédito, Pacote gera 4 créditos
        if (newPayment && formData.status === PaymentStatus.PAID) {
          const sessionsToGrant = formData.serviceType === ServiceType.PACKAGE ? 4 : 1;
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + 3);
          
          await addPackage({ 
            patientId: targetPatientId, 
            totalSessions: sessionsToGrant, 
            usedSessions: 0, 
            remainingSessions: sessionsToGrant, 
            expiryDate: expiry.toISOString().split('T')[0], 
            status: PackageStatus.ACTIVE, 
            paymentId: newPayment.id 
          });
        }
      }
      setShowForm(false);
      resetFormData();
      if (!editingPayment) { setLastSavedPatientId(targetPatientId); setShowSuccessDialog(true); }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao salvar.");
    } finally { setIsSaving(false); }
  };

  const resetFormData = () => {
    setFormData({ patientId: '', amount: '', date: new Date().toISOString().split('T')[0], method: PaymentMethod.PIX, status: PaymentStatus.PAID, serviceType: ServiceType.SINGLE, notes: '' });
    setEditingPayment(null);
    setErrorMsg(null);
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({ patientId: payment.patientId, amount: payment.amount.toString(), date: payment.date, method: payment.method || PaymentMethod.PIX, status: payment.status, serviceType: payment.serviceType || ServiceType.SINGLE, notes: '' });
    setShowForm(true);
  };

  const filteredPayments = useMemo(() => {
    return visiblePayments.filter(payment => {
      const patient = visiblePatients.find(p => p.id === payment.patientId);
      const matchesSearch = (patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || payment.status === filterStatus;
      const matchesService = filterService === 'Todos' || payment.serviceType === filterService;
      const matchesPatient = filterPatient === 'Todos' || payment.patientId === filterPatient;
      return matchesSearch && matchesStatus && matchesService && matchesPatient;
    });
  }, [visiblePayments, visiblePatients, searchTerm, filterStatus, filterService, filterPatient]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão Financeira</h2>
          <p className="text-gray-500">Controle recebimentos, pacotes e pendências.</p>
        </div>
        <button onClick={() => { resetFormData(); setShowForm(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95">
          <CreditCard size={19} /> Registrar Pagamento
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Pesquisar..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterPatient} onChange={(e) => setFilterPatient(e.target.value)}>
            <option value="Todos">Paciente (Todos)</option>
            {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
            <option value="Todos">Serviço (Todos)</option>
            {Object.values(ServiceType).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="Todos">Status (Todos)</option>
            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-4 font-semibold">Paciente</th>
              <th className="px-8 py-4 font-semibold">Serviço</th>
              <th className="px-8 py-4 font-semibold">Valor</th>
              <th className="px-8 py-4 font-semibold">Status</th>
              <th className="px-8 py-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 text-sm">{visiblePatients.find(p => p.id === payment.patientId)?.name}</span>
                    <span className="text-[10px] text-gray-400">{new Date(payment.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs font-medium text-gray-600">{payment.serviceType}</td>
                <td className="px-8 py-5 font-black text-gray-900">R$ {payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td className="px-8 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${payment.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{payment.status}</span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => handleEdit(payment)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{editingPayment ? 'Editar Pagamento' : 'Novo Pagamento'}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            {errorMsg && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2"><AlertCircle size={14} />{errorMsg}</div>}
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Paciente</label>
                <select required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-medium appearance-none bg-white" value={formData.patientId} onChange={e => setFormData({...formData, patientId: e.target.value})}>
                  <option value="">Selecione o paciente...</option>
                  {visiblePatients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Serviço</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold appearance-none bg-white" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as ServiceType})}>
                    {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold appearance-none bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as PaymentStatus})}>
                    {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Forma</label>
                  <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-50 outline-none font-bold appearance-none bg-white" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value as PaymentMethod})}>
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-50 mt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2">
                  {isSaving && <Loader2 size={16} className="animate-spin" />} Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={48} /></div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Concluído</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">Pagamento registrado. Deseja agendar a sessão para este paciente agora?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { setPreSelectedPatientId(lastSavedPatientId); setActiveTab('scheduling'); setShowSuccessDialog(false); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"><Calendar size={18} /> Ir para Agendamento</button>
              <button onClick={() => setShowSuccessDialog(false)} className="w-full py-4 rounded-2xl font-bold text-gray-400 hover:bg-gray-50 transition-all">Agora não</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
